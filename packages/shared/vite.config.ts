import { resolve } from 'path'
import { defineConfig, mergeConfig } from 'vite'
import baseConfig, { globals } from '../../scripts/vite.base.config'

const srcRoot = resolve(__dirname, 'src')
const distRoot = resolve(__dirname, 'dist')
const libName = 'UiExtendShared'

export default defineConfig(() => {
  return mergeConfig(baseConfig(), {
    build: {
      emptyOutDir: true,
      lib: {
        entry: resolve(srcRoot, 'index.ts'),
        name: libName
      },
      rollupOptions: {
        output: [
          {
            format: 'es',
            dir: distRoot,
            entryFileNames: 'index.js',
            exports: 'named'
          },
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
})
