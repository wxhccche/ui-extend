import { resolve } from 'path'
import { defineConfig, mergeConfig, UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import baseConfig, { componentEntries, externalizeOwnEntries, virtualPackageVersion } from '../../scripts/vite.base.config'

const srcRoot = resolve(__dirname, 'src')
const distRoot = resolve(__dirname, 'dist')
const libName = 'UiExtendAntdVue'

const commonResolve: UserConfig['resolve'] = {
  alias: {
    '@wxhccc/ue-antd-vue': srcRoot,
    '@': srcRoot
  }
}

export default defineConfig(({ command }) => {
  if (command === 'serve') {
    return {
      plugins: [vue()],
      resolve: commonResolve
    }
  }

  return mergeConfig(baseConfig(), {
    plugins: [virtualPackageVersion(__dirname), externalizeOwnEntries()],
    resolve: commonResolve,
    build: {
      emptyOutDir: true,
      lib: {
        // 按组件拆分的多入口：主入口 + 每个组件 + optionals。
        // 每个入口产出自己的 chunk，共用的 ui-comps / utils 自动抽成共享 chunk。
        entry: {
          index: resolve(srcRoot, 'index.ts'),
          ...componentEntries(srcRoot),
          'optionals/index': resolve(srcRoot, 'optionals/index.ts')
        },
        name: libName,
        // UMD 与代码分割互斥，单独由 vite.umd.config.ts 出一份
        formats: ['es']
      },
      rollupOptions: {
        // Vite 的 lib 模式默认把 preserveEntrySignatures 设为 false，会把每个入口
        // 拆成「0.2 KB 的转发壳 + 一堆名字毫无意义的共享 chunk」。设为 strict 后
        // 每个组件入口自包含，只有真正被多个组件共用的代码（ui-comps / utils）才抽 chunk。
        preserveEntrySignatures: 'strict',
        output: {
          dir: distRoot,
          entryFileNames: '[name].js',
          chunkFileNames: '_chunks/[name]-[hash].js',
          exports: 'named'
        }
      }
    }
  })
})
