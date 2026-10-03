import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { resolve } from 'path'
import { Plugin, UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * 由使用方提供、绝不打包进产物的外部依赖。
 *
 * 这里同时用正则覆盖子路径导入（如 `ant-design-vue/es/table`、
 * `element-plus/es/utils`），否则 UI 库会被整包卷进产物，d.ts 也会被连带撑大。
 */
export const external: (string | RegExp)[] = [
  'vue',
  'store2',
  'dayjs',
  'lodash',
  'lodash-es',
  'cropperjs',
  /^cropperjs\//,
  'element-plus',
  /^element-plus\//,
  '@element-plus/icons-vue',
  'ant-design-vue',
  /^ant-design-vue\//,
  '@ant-design/icons-vue',
  'vue-types',
  'copy-to-clipboard',
  '@wxhccc/es-util',
  '@wxhccc/ue-shared'
]

/** UMD 构建下的全局变量映射 */
export const globals: Record<string, string> = {
  vue: 'Vue',
  'ant-design-vue': 'antd',
  '@ant-design/icons-vue': 'AntDesignIconsVue',
  'element-plus': 'ElementPlus',
  '@element-plus/icons-vue': 'ElementPlusIconsVue',
  '@wxhccc/es-util': 'EsUtil',
  'lodash-es': '_',
  lodash: '_',
  dayjs: 'dayjs',
  cropperjs: 'Cropper',
  store2: 'store',
  'copy-to-clipboard': 'copy',
  '@wxhccc/ue-shared': 'UiExtendShared'
}

/**
 * 把源码里的 `../package.json` 换成虚拟模块，只注入 version 字面量。
 *
 * 原因：`package.json` 位于 `src` 之外，若让它作为独立模块参与打包，产物里会出现
 * `dist/packages/<pkg>/package.js` 这种位于发布目录里、路径毫无意义的多余文件。
 */
export function virtualPackageVersion(pkgRoot: string): Plugin {
  const virtualId = '\0virtual:ue-package-version'
  const pkgJsonPath = resolve(pkgRoot, 'package.json')
  const { version } = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as { version: string }

  return {
    name: 'ue:virtual-package-version',
    enforce: 'pre',
    resolveId(id, importer) {
      if (!/^\.{1,2}\//.test(id) || !id.endsWith('package.json')) return null
      if (!importer) return null
      const resolved = resolve(importer, '..', id)
      return resolved === pkgJsonPath ? virtualId : null
    },
    load(id) {
      if (id === virtualId) return `export const version = ${JSON.stringify(version)}`
      return null
    }
  }
}

/**
 * 收集「按组件拆分」的独立入口：`<srcRoot>/components/<name>/index.{ts,js}`。
 *
 * 每个组件作为一个 Rollup 入口，产出一个自包含的 chunk；被多个组件共用的代码
 * （ui-comps、utils 等）会自动抽成共享 chunk，既不重复也不散落。
 *
 * 这里刻意不用 `preserveModules`：那会把 Vue 编译器的每个中间模块都吐成一个文件
 * （每个组件额外带一个 0.04 KB 的 `index.vue_vue_type_style_*_lang.js`），
 * 消费者永远不会直接 import 这些碎片，纯属噪音。
 */
export function componentEntries(srcRoot: string): Record<string, string> {
  const dir = resolve(srcRoot, 'components')
  const entries: Record<string, string> = {}

  for (const name of readdirSync(dir)) {
    if (!statSync(resolve(dir, name)).isDirectory()) continue
    for (const file of ['index.ts', 'index.js']) {
      const entry = resolve(dir, name, file)
      if (existsSync(entry)) {
        entries[`components/${name}/index`] = entry
        break
      }
    }
  }

  return entries
}

/**
 * 让主入口 `src/index.ts` 把各组件入口当作外部依赖。
 *
 * 为什么需要：组件同时被「自己的入口」和「主入口的 export *」引用时，Rollup 只能把
 * 组件代码提升成一个共享 chunk，于是 `dist/components/<name>/index.js` 退化成一个
 * 0.2 KB 的转发壳，而真正代码散落在一堆 `_chunks/index.vue_vue_type_style_*` 里。
 * 把主入口对组件的引用标记为 external 后，组件只被自己的入口引用，
 * 代码就会留在自己的文件里，产物数量和文件名都干净。
 *
 * 只在「按组件拆分的 ESM 那一趟」使用；UMD 那一趟必须保留完整依赖图，才能打成单文件。
 */
export function externalizeOwnEntries(): Plugin {
  const fromMainEntry = /[\\/]src[\\/]index\.ts$/

  return {
    name: 'ue:externalize-own-entries',
    enforce: 'pre',
    resolveId(id, importer) {
      if (!importer || !fromMainEntry.test(importer)) return null

      // `id` 可能是别名原文（`@/components/x`），也可能已被上游插件解析成绝对路径，
      // 两种形态都要认，否则这一层会静默失效。
      const norm = id.split('\\').join('/')
      const component =
        norm.match(/^@\/components\/([^/]+)$/)?.[1] ??
        norm.match(/\/src\/components\/([^/]+?)(?:\/index(?:\.ts)?)?$/)?.[1]

      if (component) return { id: `./components/${component}/index.js`, external: true }
      if (norm === '@/optionals' || /\/src\/optionals(?:\/index(?:\.ts)?)?$/.test(norm)) {
        return { id: './optionals/index.js', external: true }
      }
      return null
    }
  }
}

/**
 * 三个包共用的构建基线。
 *
 * 说明：d.ts 不再由本配置生成——类型声明统一用 `vue-tsc -p tsconfig.build.json`
 * 产出（见各包 package.json 的 build 脚本）。这样做有两个原因：
 *   1. `vite-plugin-dts` 的 `rollupTypes` 走 @microsoft/api-extractor，其内置
 *      TypeScript 版本低于本项目（6.x），会在 rollup 阶段直接 Internal Error；
 *   2. 逐文件产出才能做到“按组件拆分”的 d.ts，而不是把所有类型揉成一个巨型文件。
 */
export default function baseConfig(): UserConfig {
  return {
    plugins: [vue()],
    build: {
      // 库模式下把所有样式抽成单个 style.css，供 `import 'xxx/dist/style.css'` 使用
      cssCodeSplit: false,
      // sass 1.99 会为 Vite 3 使用的 legacy API 刷屏告警，这里显式静音
      css: {
        preprocessorOptions: {
          scss: { silenceDeprecations: ['legacy-js-api'] } as Record<string, unknown>
        }
      },
      rollupOptions: { external }
    }
  }
}
