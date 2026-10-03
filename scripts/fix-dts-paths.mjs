#!/usr/bin/env node
/**
 * 把产出 d.ts 里的路径别名改写成相对路径。
 *
 * 为什么需要这一步：TypeScript 会原样保留源码里写的模块说明符，所以 `src` 中的
 * `import { useVModel } from '@/utils/hooks'` 会原封不动出现在 `dist` 的 d.ts 里。
 * 但 `@` 这个别名只有本仓库的 tsconfig 认识，使用方的编辑器和打包器都不认——
 * 结果是类型能生成、却没法被外部消费。这里按“dist 结构镜像 src 结构”的约定，
 * 把 `@/x/y` 改写成从当前 d.ts 出发的相对路径。
 *
 * 用法：node ../../scripts/fix-dts-paths.mjs <dist目录> [别名...]
 *   例：node ../../scripts/fix-dts-paths.mjs dist "@" "@wxhccc/ue-antd-vue"
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'

const [, , distArg = 'dist', ...aliasArgs] = process.argv
const distRoot = resolve(distArg)
// 默认只处理 `@`；多包场景可显式追加自身包名别名
const aliases = [...new Set(['@', ...aliasArgs])]

if (!existsSync(distRoot)) {
  console.error(`[fix-dts-paths] ${distArg} 不存在，请先运行 vue-tsc 生成声明文件`)
  process.exit(1)
}

const toPosix = (p) => p.split(sep).join('/')

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) yield* walk(full)
    else yield full
  }
}

/** 判断相对路径能否解析到实际的 .d.ts（含目录 index 与 .vue.d.ts 两种约定） */
function resolvesInDist(targetAbs) {
  return (
    existsSync(`${targetAbs}.d.ts`) ||
    existsSync(join(targetAbs, 'index.d.ts')) ||
    existsSync(`${targetAbs}.vue.d.ts`) ||
    existsSync(targetAbs)
  )
}

let rewrittenFiles = 0
let rewrittenSpecifiers = 0
const unresolved = []

for (const file of walk(distRoot)) {
  if (!file.endsWith('.d.ts')) continue

  const original = readFileSync(file, 'utf8')
  const fromDir = dirname(file)

  // 同时覆盖 `from 'x'`、`import('x')`、`import 'x'`、`require('x')` 四种写法
  const next = original.replace(
    /(\bfrom\s*|\bimport\s*\(|\bimport\s+|\brequire\s*\()(['"])([^'"]+)\2/g,
    (match, prefix, quote, specifier) => {
      const alias = aliases.find((a) => specifier === a || specifier.startsWith(`${a}/`))
      if (!alias) return match

      const rest = specifier.slice(alias.length).replace(/^\/+/, '')
      const targetAbs = join(distRoot, rest)
      let target = toPosix(relative(fromDir, targetAbs))
      if (!target.startsWith('.')) target = `./${target}`

      if (!resolvesInDist(targetAbs)) unresolved.push(`${toPosix(relative(distRoot, file))} -> ${specifier}`)
      rewrittenSpecifiers += 1
      return `${prefix}${quote}${target}${quote}`
    }
  )

  if (next !== original) {
    writeFileSync(file, next)
    rewrittenFiles += 1
  }
}

const relDist = toPosix(relative(process.cwd(), distRoot)) || '.'
console.log(`[fix-dts-paths] ${relDist}: 改写 ${rewrittenSpecifiers} 处别名于 ${rewrittenFiles} 个文件`)

if (unresolved.length) {
  console.warn(`[fix-dts-paths] 警告：以下 ${unresolved.length} 处别名在 dist 中找不到对应声明：`)
  for (const item of unresolved.slice(0, 20)) console.warn(`  ${item}`)
}
