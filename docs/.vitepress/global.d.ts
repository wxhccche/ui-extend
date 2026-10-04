// markdown-it-container 未提供类型声明（@types 也没有），单库只用到 use 与 render
declare module 'markdown-it-container' {
  import type { MarkdownRenderer } from 'vitepress'
  const container: (md: MarkdownRenderer, name: string, options: Record<string, any>) => void
  export default container
}

/** 当前构建的 UI 库，由 .vitepress/config.ts 经 vite.define 注入 */
declare const __CURRENT_LIB__: 'antd-vue' | 'element'

/**
 * Vite 的 glob 导入（主题里用来批量注册 demo 组件）。
 * 签名对齐 Vite 的真实 API：pattern 可以是字符串或字符串数组（数组支持 `!` 负向模式）。
 */
interface ImportMeta {
  glob: {
    (pattern: string | string[], options?: Record<string, any>): Record<string, any>
    <T>(pattern: string | string[], options?: Record<string, any>): Record<string, () => Promise<T>>
  }
}
