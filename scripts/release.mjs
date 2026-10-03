#!/usr/bin/env node
/**
 * 发布助手（pnpm workspace 单仓多包）。
 *
 * 解决四件事：
 *
 * 1. **版本号只给「真有改动」的包涨。**
 *    没改动的包保持原版本号即可——`pnpm -r publish` 遇到 registry 上已有的版本会自动跳过
 *    （实测输出 "There are no new packages that should be published"，退出码 0）。
 *    脚本用 git 找出每个包「上次发布时所在的那个提交」，据此判断之后有没有改动。
 *
 * 2. **两个 UI 库可以独立发布互不影响。**
 *    用 `--pkg` 指定本次只处理哪些包：涨版本、校验、发布都只作用于这些包，
 *    `pnpm` 侧用 `--filter` 精确指定，绝不会顺带把另一个库发出去。
 *
 * 3. **防止依赖指向 registry 上不存在的版本。**
 *    `pnpm publish` 会把 `"@wxhccc/ue-shared": "workspace:^"` 改写成 `^<本地版本号>`。
 *    所以单独发 ue-element 时，如果 ue-shared 本地版本涨了却没发布，发出去的使用方会直接
 *    装不上。守卫只看「本次真正要发布的集合」，因此这种半成品状态会被拦住。
 *
 * 4. **脏工作区不许发布**（`--dry-run` 例外，可用于预演）。
 *
 * 用法：
 *   node scripts/release.mjs                        只分析并打印计划（只读）
 *   node scripts/release.mjs --bump                 给「有改动但版本号还是已发布版本」的包涨 minor
 *   node scripts/release.mjs --publish              校验依赖关系后发布（已发布的版本由 pnpm 跳过）
 *   node scripts/release.mjs --publish --dry-run    发布预演
 *   node scripts/release.mjs --publish --pkg @wxhccc/ue-element    只发布指定包
 *
 * 涨版本规则（`--bump`）：抬第二位，prerelease 计数器归零。
 *   1.2.3 -> 1.3.0    1.0.0-beta.6 -> 1.1.0-beta.0
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const has = (name) => args.includes(name)
const MODE = has('--bump') ? 'bump' : has('--publish') ? 'publish' : 'plan'
const DRY_RUN = has('--dry-run')

/** `--pkg <name>` / `--pkg=<name>`，可重复 */
const PKG_FILTERS = (() => {
  const out = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pkg') out.push(args[++i])
    else if (args[i].startsWith('--pkg=')) out.push(args[i].slice('--pkg='.length))
  }
  return out.filter(Boolean)
})()

const sh = (cmd, inherit = false) =>
  execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: inherit ? 'inherit' : 'pipe' })

const rel = (p) => relative(ROOT, p).split('\\').join('/')
const fail = (message) => {
  console.log(`\n  ✗ ${message}\n`)
  process.exit(1)
}

/* ------------------------------------------------------------------ 版本比较 */

function parseVersion(v) {
  const m = String(v).match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/)
  if (!m) return null
  return { nums: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ? m[4].split('.') : null }
}

/** semver 排序（prerelease 小于同号正式版），返回 a - b */
function compareVersions(a, b) {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  if (!pa || !pb) return String(a).localeCompare(String(b))
  for (let i = 0; i < 3; i++) if (pa.nums[i] !== pb.nums[i]) return pa.nums[i] - pb.nums[i]
  if (pa.pre && !pb.pre) return -1
  if (!pa.pre && pb.pre) return 1
  if (!pa.pre && !pb.pre) return 0
  for (let i = 0; i < Math.max(pa.pre.length, pb.pre.length); i++) {
    const x = pa.pre[i]
    const y = pb.pre[i]
    if (x === undefined) return -1
    if (y === undefined) return 1
    const nx = /^\d+$/.test(x)
    const ny = /^\d+$/.test(y)
    if (nx && ny) {
      if (Number(x) !== Number(y)) return Number(x) - Number(y)
      continue
    }
    if (nx) return -1
    if (ny) return 1
    if (x !== y) return x < y ? -1 : 1
  }
  return 0
}

const maxVersion = (list) => list.reduce((acc, v) => (!acc || compareVersions(v, acc) > 0 ? v : acc), null)

/** 抬第二位；prerelease 计数器归零（1.0.0-beta.6 -> 1.1.0-beta.0） */
function nextMinor(version) {
  const p = parseVersion(version)
  if (!p) return null
  const base = `${p.nums[0]}.${p.nums[1] + 1}.0`
  return p.pre ? `${base}-${p.pre[0]}.0` : base
}

/* ------------------------------------------------------------------ 工作区包 */

function workspaceDirs() {
  const yaml = readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf8')
  const patterns = []
  let inPackages = false
  for (const line of yaml.split(/\r?\n/)) {
    if (/^packages:/.test(line)) {
      inPackages = true
      continue
    }
    if (/^\S/.test(line)) {
      inPackages = false
      continue
    }
    if (!inPackages) continue
    const m = line.match(/^\s*-\s*['"]?(.+?)['"]?\s*$/)
    if (m) patterns.push(m[1])
  }

  const dirs = new Set()
  for (const pattern of patterns) {
    if (pattern.endsWith('/*')) {
      const base = join(ROOT, pattern.slice(0, -2))
      if (!existsSync(base)) continue
      for (const name of readdirSync(base)) {
        if (existsSync(join(base, name, 'package.json'))) dirs.add(join(base, name))
      }
    } else if (existsSync(join(ROOT, pattern, 'package.json'))) {
      dirs.add(join(ROOT, pattern))
    }
  }
  return [...dirs]
}

function publishedVersions(name) {
  try {
    const parsed = JSON.parse(sh(`pnpm view ${name} versions --json`))
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return [] // 还没发布过
  }
}

/** 找出「package.json 里版本号等于该已发布版本」的最新一个提交 */
function releaseCommit(pkgDir, releasedVersion) {
  const pkgJson = `${rel(pkgDir)}/package.json`
  let commits = []
  try {
    commits = sh(`git log --format=%H -- "${pkgJson}"`).split('\n').filter(Boolean)
  } catch {
    return null
  }
  for (const commit of commits) {
    try {
      const { version } = JSON.parse(sh(`git show ${commit}:"${pkgJson}"`))
      if (version === releasedVersion) return commit
    } catch {
      /* 该提交里文件不存在等情况，跳过 */
    }
  }
  return null
}

function changedSince(commit, pkgDir) {
  const dir = rel(pkgDir)
  const tracked = sh(`git diff --name-only ${commit} -- "${dir}"`).trim()
  const untracked = sh(`git ls-files --others --exclude-standard -- "${dir}"`).trim()
  return Boolean(tracked || untracked)
}

/* ------------------------------------------------------------------ 收集现状 */

const packages = []
for (const dir of workspaceDirs()) {
  const json = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  if (json.private === true) continue
  const published = publishedVersions(json.name)
  const released = maxVersion(published)
  const commit = released ? releaseCommit(dir, released) : null
  packages.push({
    dir,
    path: join(dir, 'package.json'),
    name: json.name,
    version: json.version,
    dependencies: json.dependencies ?? {},
    published,
    released,
    changed: released === null ? true : commit === null ? null : changedSince(commit, dir)
  })
}

let selected = packages
if (PKG_FILTERS.length) {
  const missing = PKG_FILTERS.filter((name) => !packages.some((p) => p.name === name))
  if (missing.length) fail(`工作区里找不到这些包：${missing.join(', ')}`)
  selected = packages.filter((p) => PKG_FILTERS.includes(p.name))
}

/* ------------------------------------------------------------------ 计划输出 */

const pad = (s, n) => String(s) + ' '.repeat(Math.max(0, n - String(s).length))
console.log(`\n工作区发布计划（模式：${MODE}${DRY_RUN ? ' + dry-run' : ''}）`)
if (PKG_FILTERS.length) console.log(`只处理：${selected.map((p) => p.name).join(', ')}`)
console.log('')
console.log(`  ${pad('包', 24)}${pad('本地版本', 16)}${pad('已发布最高版本', 18)}${pad('有改动', 10)}${pad('本次', 8)}动作`)
for (const p of packages) {
  const inScope = selected.includes(p)
  const changed = p.changed === true ? '是' : p.changed === false ? '否' : '未知'
  const action = p.published.includes(p.version) ? '跳过（版本已发布）' : '发布'
  console.log(
    `  ${pad(p.name, 24)}${pad(p.version, 16)}${pad(p.released ?? '-', 18)}${pad(changed, 10)}` +
      `${pad(inScope ? '✓' : '—', 8)}${inScope ? action : '不在本次范围'}`
  )
}
console.log('')

const scopedUnknown = selected.filter((p) => p.changed === null)
if (scopedUnknown.length) {
  console.log(`  ⚠ 无法判定改动的包（历史里找不到已发布版本对应的提交，不做任何假设）：`)
  for (const p of scopedUnknown) console.log(`    ${p.name}（已发布版本 ${p.released}）`)
  console.log('')
}
const scopedUnchanged = selected.filter((p) => p.changed === false)
if (scopedUnchanged.length) {
  console.log(`  · 没有改动的包保持原版本号，pnpm 发布时会自动跳过：${scopedUnchanged.map((p) => p.name).join(', ')}`)
  console.log('')
}

/* ------------------------------------------------------------------ --bump */

if (MODE === 'bump') {
  const targets = selected.filter((p) => p.changed === true && p.version === p.released)
  const bumpedWithoutChange = selected.filter((p) => p.changed === false && p.version !== p.released)

  if (bumpedWithoutChange.length) {
    console.log(`  ⚠ 以下包涨了版本号但检测不到改动，请确认是否真要发布：`)
    for (const p of bumpedWithoutChange) console.log(`    ${p.name}: ${p.released} -> ${p.version}`)
    console.log('')
  }

  if (!targets.length) {
    console.log('  没有需要涨版本的包（有改动的包都已经涨过版本号了）。\n')
    process.exit(0)
  }

  for (const p of targets) {
    const next = nextMinor(p.version)
    if (!next) {
      console.log(`  ⚠ ${p.name} 的版本号 ${p.version} 不是标准 semver，跳过`)
      continue
    }
    const raw = readFileSync(p.path, 'utf8')
    // 只替换第一处 version 字段，保留原有格式
    writeFileSync(p.path, raw.replace(/("version"\s*:\s*")[^"]+(")/, `$1${next}$2`))
    console.log(`  ${p.name}: ${p.version} -> ${next}`)
  }
  console.log(`\n  已写入 package.json。请先提交，再执行发布。\n`)
  process.exit(0)
}

/* ------------------------------------------------------------------ 发布前校验 */

if (MODE === 'publish') {
  // 本次真正会上传的集合：在范围内、且该版本 registry 上还没有
  const publishSet = selected.filter((p) => !p.published.includes(p.version))

  // 守卫只看 publishSet —— 单独发一个包时，依赖包没跟着发就会被拦住
  const problems = []
  for (const p of publishSet) {
    for (const [dep, range] of Object.entries(p.dependencies)) {
      if (!String(range).startsWith('workspace:')) continue
      const target = packages.find((x) => x.name === dep)
      if (!target) {
        problems.push(`${p.name} 依赖 ${dep}，但它不在当前工作区里`)
        continue
      }
      const beingPublished = publishSet.some((x) => x.name === dep)
      const alreadyOnRegistry = target.published.includes(target.version)
      if (!beingPublished && !alreadyOnRegistry) {
        problems.push(
          `${p.name} 依赖 ${dep}@${range}，发布时会被改写成 ^${target.version}；但 ` +
            `${dep}@${target.version} 既不在本次发布范围里、也不在 registry 上 —— 使用方会装不上。\n` +
            `      先单独发布它：pnpm release:${dep === '@wxhccc/ue-shared' ? 'shared' : '<包名>'}，或把两个包一起发：pnpm release`
        )
      }
    }
  }

  if (problems.length) {
    console.log('  ✗ 发布前校验未通过：\n')
    for (const problem of problems) console.log(`    - ${problem}`)
    console.log('')
    process.exit(1)
  }
  console.log('  ✓ 依赖校验通过\n')

  if (!publishSet.length) {
    console.log('  本次范围内没有需要发布的包（版本号都已在 registry 上）。\n')
    process.exit(0)
  }

  if (!DRY_RUN) {
    const dirty = sh('git status --porcelain').trim()
    if (dirty) {
      const lines = dirty.split('\n')
      console.log('  ✗ git 工作区不干净，请先提交再发布（或用 --dry-run 预演）：\n')
      for (const line of lines.slice(0, 10)) console.log(`    ${line}`)
      if (lines.length > 10) console.log(`    … 另有 ${lines.length - 10} 项`)
      console.log('')
      process.exit(1)
    }
  }

  // 只发布本次范围内的包：pnpm 侧用 --filter 精确指定，绝不顺带发另一个库
  const scope = selected.length === packages.length ? '' : `${selected.map((p) => `--filter ${p.name}`).join(' ')} `
  const cmd = `pnpm -r ${scope}publish --access public --no-git-checks${DRY_RUN ? ' --dry-run' : ''}`
  console.log(`  执行：${cmd}\n`)
  sh(cmd, true)
  console.log('')
}
