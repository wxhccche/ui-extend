import { resolve } from 'path'
import { defineConfig, mergeConfig, UserConfig } from 'vite'
import baseConfig, { globals, virtualPackageVersion } from '../../scripts/vite.base.config'

const srcRoot = resolve(__dirname, 'src')
const distRoot = resolve(__dirname, 'dist')
const libName = 'UiExtendAntdVue'

const commonResolve: UserConfig['resolve'] = {
  alias: {
    '@wxhccc/ue-antd-vue': srcRoot,
    '@': srcRoot
  }
}

/**
 * 单独一趟 UMD 构建（给 CDN / <script> 场景）。
 *
 * 必须独立成一次构建：Rollup 不允许 UMD 与代码分割共存，而主配置为了
 * 「按组件拆分」是多入口的，所以 UMD 只能回到单入口单独打。
 * `emptyOutDir: false` 保证不冲掉上一趟已经产出的按组件文件。
 */
export default defineConfig(() =>
  mergeConfig(baseConfig(), {
    plugins: [virtualPackageVersion(__dirname)],
    resolve: commonResolve,
    build: {
      emptyOutDir: false,
      lib: {
        entry: resolve(srcRoot, 'index.ts'),
        name: libName
      },
      rollupOptions: {
        output: [
          {
            format: 'umd',
            dir: distRoot,
            entryFileNames: 'index.umd.js',
            name: libName,
            exports: 'named',
            globals
          }
        ]
      }
    }
  })
)
