import path from 'node:path'
import minimist from 'minimist'
import { defineConfig } from 'vitepress'
import { demoContainer, codeImport, includeSyntax } from './utils/md-dialect'
import { navbar, sidebar } from './theme-config'

const argv = minimist(process.argv.slice(2))

const libArg = (argv.lib || process.env.UE_LIB) as 'antd-vue' | 'element' | undefined
const port = argv.port || argv.p
const outDir = argv.outDir || argv.o

/**
 * 双库同源：同一份 md 源渲染两个站点，靠构建参数决定当前库。
 * 判断优先级故意与旧的 VuePress 版保持一致（端口 8081 → antd-vue，元素站显式指定），
 * 这样 `pnpm docs:dev`（8081）与 `build:element` 的行为都不变。
 */
const lib: 'antd-vue' | 'element' =
  libArg ||
  (port === 8081 || port === '8081'
    ? 'antd-vue'
    : port === 8082 || port === '8082'
      ? 'element'
      : String(outDir || '').includes('element')
        ? 'element'
        : 'antd-vue')

const root = path.resolve(__dirname, '..')
// demo 实际放在 theme/demo（VitePress 要求自定义组件在 theme 下，全局注册也在那里做），
// 而 md 里的写法仍是 VuePress 时代的 `@demo/<页面名>/...`，这里负责把 @demo 映射过去。
const demoRoot = path.resolve(__dirname, 'theme/demo')
const componentsRoot = path.resolve(__dirname, `../../packages/${lib}/src/components/`)

/**
 * `@[code]` 指向不存在的文件时收集起来，构建结束时明确报出来。
 *
 * 这类错误以前只是静默地把「未找到文件」写进页面，构建照样成功——迁移时 demo 目录
 * 从 .vitepress/demo 挪到 .vitepress/theme/demo，就因为没报错而漏改了路径。
 * 缺文件属于 md 写错或路径配置漂移，直接让构建失败，避免又悄悄上线。
 */
const unresolvedCodeRefs: string[] = []

export default defineConfig({
  base: `/ui-extend/${lib}/`,
  title: 'ui-extend',
  description: '基于 ant-design-vue / element-plus 的业务组件扩展库',
  outDir: path.resolve(__dirname, `dist/${lib}`),
  cacheDir: path.resolve(__dirname, `.cache/${lib}`),
  cleanUrls: true,
  // md 里大量使用 `./xxx.md` 相对链接与 `@demo` 引用，缺目标不应当中断构建
  ignoreDeadLinks: true,
  markdown: {
    // 插入顺序有意义：容器要在 fence 之前接管 `::: demo`，@[code] 在 block 之后改写 token
    config: (md) => {
      demoContainer(md)
      codeImport(md, demoRoot, lib, (filePath, ref) => {
        unresolvedCodeRefs.push(`${ref}  →  ${path.relative(root, filePath)}`)
      })
      includeSyntax(md, componentsRoot)
    }
  },
  buildEnd(siteConfig) {
    // `@[code]` 缺文件直接失败：这类问题以前只会把「未找到文件」写进页面，
    // 构建照样成功，导致路径配错了也发现不了（迁移时就踩过一次）
    if (unresolvedCodeRefs.length) {
      const uniq = [...new Set(unresolvedCodeRefs)]
      throw new Error(
        `有 ${uniq.length} 处 @[code] 指向的文件不存在（当前库 ${lib}，demo 根目录 ${path.relative(root, demoRoot)}）：\n` +
          uniq.map((r) => `  · ${r}`).join('\n') +
          `\n检查 md 里的 @demo/... 路径，或 config.ts 的 demoRoot 配置。`
      )
    }
    void siteConfig
  },
  themeConfig: {
    nav: navbar(lib),
    sidebar: sidebar(lib),
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    darkModeSwitchLabel: '主题',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    lastUpdatedText: '最后更新',
    notFound: { title: '页面不存在', quote: '链接可能已失效' }
  },
  vite: {
    // md 与主题里用到的当前库判断（VitePress 无 VuePress 的 define 选项，走 Vite 层）
    define: {
      __CURRENT_LIB__: JSON.stringify(lib)
    },
    resolve: {
      alias: {
        '@docs': root
      }
    }
  }
})
