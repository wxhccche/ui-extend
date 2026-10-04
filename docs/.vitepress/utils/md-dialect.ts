import fs from 'node:fs'
import path from 'node:path'
import container from 'markdown-it-container'
// 用 VitePress 导出的 MarkdownRenderer，而不是 @types/markdown-it 的 MarkdownIt：
// 后者的版本（12）与 VitePress 内部使用的 markdown-it 14 类型不兼容，会导致
// markdown.config 里传入实例时报一堆 TokenMeta/Delimiter 不匹配的错误。
import type { MarkdownRenderer } from 'vitepress'

/** `::: demo <名> [no-limit-lib] [描述]` 的容器名 */
const DEMO_TYPE = 'demo'

/**
 * 把 `@[code](@demo/<页面名>/$LIB_DIR/<demo名>.vue [行号])` 解析成真实文件路径。
 *
 * 这是 VuePress 的 markdown.importCode 提供的语法，VitePress 没有，所以在方言层自己实现。
 * `@demo` → docs/.vitepress/demo，`$LIB_DIR` → 当前库名。
 */
const resolveDemoPath = (raw: string, demoRoot: string, lib: string) => {
  // 支持 `path:lineStart-lineEnd` 形式的行号选择（原 API 兼容）
  const [rawPath, lineRange] = raw.trim().split(/\s+/)
  const filePath = rawPath
    .replace(/^@demo/, demoRoot)
    .replace(/\$LIB_DIR/g, lib)
  return { filePath, lineRange }
}

const sliceByLineRange = (content: string, lineRange?: string) => {
  if (!lineRange) return content
  const m = lineRange.match(/^:(\d+)(?:-(\d+))?$/)
  if (!m) return content
  const start = Number(m[1])
  const end = m[2] ? Number(m[2]) : undefined
  return content.split('\n').slice(start - 1, end).join('\n')
}

/**
 * `::: demo ...` 容器 —— 渲染成 `<CompDemo>`，容器里的代码块作为默认插槽内容
 * （由 DemoBlock 折叠展示），紧跟的 `@[code]` 则另起一个高亮代码块。
 */
export const demoContainer = (md: MarkdownRenderer) => {
  md.use(container, DEMO_TYPE, {
    validate: (params: string) => !!params.trim().match(/^demo\s*(.*)$/),
    render(tokens: any[], idx: number) {
      const info = tokens[idx].info.trim()
      const m = info.match(/^demo\s*(.*)$/)
      const [compName, nll, desc] = m && m.length > 1 ? m[1].split(' ') : []
      const noLimitLib = nll === 'no-limit-lib'
      const description = noLimitLib ? desc : nll
      if (tokens[idx].nesting === 1) {
        return `<CompDemo name="${compName}"${noLimitLib ? ' no-limit-lib' : ''}>${
          description ? `<template #description>${md.renderInline(description)}</template>` : ''
        }\n`
      }
      return '</CompDemo>\n'
    }
  })
}

/**
 * 把 `@[code](...)` 单独成段的行替换成一个围栏代码块（交给 VitePress 的 shiki 高亮），
 * 并把内容预读进 token，这样即使文件在 srcDir 之外也能正常渲染。
 *
 * `onMissing` 用于上报解析不到的文件：调用方（config.ts）会在构建结束时据此中断构建，
 * 避免「未找到文件」这种占位内容被静默发布出去。
 */
export const codeImport = (
  md: MarkdownRenderer,
  demoRoot: string,
  lib: string,
  onMissing?: (filePath: string, ref: string) => void
) => {
  md.core.ruler.after('block', 'ue_code_import', (state) => {
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      const open = tokens[i]
      if (open.type !== 'paragraph_open') continue
      const inline = tokens[i + 1]
      const close = tokens[i + 2]
      if (!inline || inline.type !== 'inline') continue
      if (close && close.type !== 'paragraph_close') continue

      const m = inline.content.trim().match(/^@\[code\]\((.+?)\)$/)
      if (!m) continue

      const { filePath, lineRange } = resolveDemoPath(m[1], demoRoot, lib)
      let code = ''
      try {
        code = sliceByLineRange(fs.readFileSync(filePath, 'utf8'), lineRange)
      } catch {
        onMissing?.(filePath, m[1])
        code = `/* 未找到文件: ${path.relative(process.cwd(), filePath)} */`
      }

      const fence = new state.Token('fence', 'code', 0)
      fence.info = 'vue'
      fence.content = code.replace(/\n?$/, '\n')
      fence.map = open.map
      // 用 fence 顶掉 open/inline/close 三个 token
      tokens.splice(i, 3, fence)
    }
    return true
  })
}

/**
 * `!!!include(<组件目录>/index.zh-CN.md)!!!` —— 嵌入包源码里的 API 文档。
 *
 * 与原来的 markdown-it-include 语法保持一致，md 源不用改。缺文件时留空（原行为也是
 * throwError:false，只是不报错）。
 */
export const includeSyntax = (md: MarkdownRenderer, componentsRoot: string) => {
  const render = md.render.bind(md)
  const expand = (content: string, depth = 0): string =>
    content.replace(/^\s*!!!include\((.+?)\)!!!\s*$/gm, (_all, rel: string) => {
      if (depth > 3) return ''
      try {
        const file = path.resolve(componentsRoot, rel.trim())
        return expand(fs.readFileSync(file, 'utf8'), depth + 1)
      } catch {
        return ''
      }
    })

  // 在 block 解析前把 include 展开成普通 md 文本，后续交给正常流程（含其中的表格等语法）
  md.core.ruler.before('block', 'ue_include', (state) => {
    state.src = expand(state.src)
    return true
  })
  void render
}
