# ui-extend

基于其他 UI 库的二次封装组件库，pnpm workspace 单仓多包。

| 包 | 说明 | 文档 |
| --- | --- | --- |
| `@wxhccc/ue-antd-vue` | 基于 [ant-design-vue](https://www.antdv.com/) | <https://wxhccche.github.io/ui-extend/antd-vue> |
| `@wxhccc/ue-element` | 基于 [element-plus](https://element-plus.org/) | <https://wxhccche.github.io/ui-extend/element> |
| `@wxhccc/ue-shared` | 公共类型与工具（被上面两个包依赖） | -- |

> 维护 / 开发本仓库（构建体系、发布流程、文档站写法与已知问题）请看 [AGENTS.md](./AGENTS.md)。

## 安装

```bash
pnpm add @wxhccc/ue-antd-vue
# 或
pnpm add @wxhccc/ue-element
```

## 使用

```ts
import UiExtend from '@wxhccc/ue-antd-vue'
import '@wxhccc/ue-antd-vue/style.css'

app.use(UiExtend)
```

也可以只引入单个组件，产物是逐模块拆分的，未用到的组件不会进入你的构建：

```ts
import Cropper from '@wxhccc/ue-antd-vue/components/cropper'
```

## CDN

unpkg / jsdelivr 会按 `package.json` 的 `main` 字段取到 UMD 产物：

```html
<script src="https://unpkg.com/@wxhccc/ue-antd-vue/dist/index.umd.js"></script>
```

建议在链接上锁定版本，避免组件库升级带来的兼容性影响。

## 本地开发

```bash
pnpm install
pnpm build          # 按 shared -> element -> antd-vue 的顺序构建
pnpm dev:antd-vue   # antd-vue 组件开发环境（element 用 dev:element）
pnpm docs:dev       # 文档站点
pnpm typecheck      # 全仓库类型检查
pnpm verify         # 构建 + 产物可用性冒烟检查
```

包管理器为 pnpm（见根 `package.json` 的 `packageManager`）。各包的依赖都写在自己
的 `package.json` 里，不依赖提升到根目录的“幽灵依赖”，因此新增依赖时必须装到对应包里：

```bash
pnpm --filter @wxhccc/ue-antd-vue add dayjs
```

## 发布

三个包之间用 pnpm workspace 协议引用（`"@wxhccc/ue-shared": "workspace:^"`），
`pnpm publish` 会自动把它改写成真实版本号。所以**使用方安装 `@wxhccc/ue-antd-vue`
时会一并自动安装 `@wxhccc/ue-shared`**，不需要手动装第二个包。

两个 UI 库可以**独立发布、互不影响**：

```bash
pnpm release:element     # 只构建 / 校验 / 发布 ue-element（含它依赖的 ue-shared）
pnpm release:antd-vue    # 只构建 / 校验 / 发布 ue-antd-vue
pnpm release:shared      # 只发布 ue-shared
pnpm release             # 全量：构建 + 校验 + 按拓扑序发布所有有改动的包
```

辅助命令：

```bash
pnpm release:plan        # 只分析：各包「本地版本 / registry 版本 / 是否有改动 / 本次是否发布」
pnpm release:bump        # 只给「有改动但版本号还没涨」的包涨 minor，然后你自己提交
pnpm release:dry         # 全量预演：构建 + 类型校验 + 依赖校验 + 打包，不上传
```

单包发布预演（直接调脚本）：

```bash
node scripts/release.mjs --publish --pkg @wxhccc/ue-element --dry-run
```

`scripts/release.mjs` 的关键行为：

- **独立发布互不影响。** `--pkg` 选中的包就是唯一的处理范围，pnpm 侧用 `--filter` 精确指定，
  不会顺带把另一个库发出去；单包发布也只构建该包（+ `ue-shared`），一个库有问题不会卡住另一个。
- **没改动的包不涨版本号。** 脚本用 git 找出每个包「上次发布时所在的那个提交」，对比之后
  有没有改动，`--bump` 只处理真有改动的包。没改动的包保持原版本号即可——`pnpm -r publish`
  遇到 registry 上已有的版本会自动跳过（输出 `There are no new packages that should be published`）。
- **发布前校验依赖关系。** `workspace:^` 会被改写成 `^<本地版本号>`，脚本只拿「本次真正要发的
  集合」去校验：单独发 `ue-element` 时，如果 `ue-shared` 本地涨了版本却没发布，会被直接拦住，
  并提示先执行 `pnpm release:shared`。`release` 还会拒绝在脏工作区上发布。

`--bump` 的规则是**抬第二位**、prerelease 计数器归零：`1.2.3` → `1.3.0`，
`1.0.0-beta.6` → `1.1.0-beta.0`。

### 认证：为什么总会要一次浏览器授权

`npm login` 写入 `~/.npmrc` 的是**短期会话 token（约两小时过期）**，而且**它不授权写操作**：
`pnpm publish` 会要求再做一次交互式授权——npm 打印 `https://www.npmjs.com/auth/cli/…`
并**阻塞等待**你在浏览器完成。**这个授权不会写回 `~/.npmrc`**，所以下一次写操作还会再要一次。
"登录后不久就失效、发布时又要点浏览器"是这套机制的必然结果，不是配置错了。

三种应对，按投入从低到高：

1. **就这样用（本仓库当前的选择）**——发布不频繁，`npm login` 之后在一个会话里把要发的包
   一次发完；每个包首次写操作时在浏览器点一下授权即可。
2. **长期 Granular Access Token**——配一次，之后本地发布完全非交互。
   注意 npm 现在对 **Bypass 2FA** 选项会提示"不推荐，建议改用 Trusted Publishing"；
   本账号 2FA 是**关闭**状态，这条提示未必适用，值得试一次（不成也不损失什么）。
   步骤：<https://www.npmjs.com/settings/whxccc/tokens> → Generate New Token →
   **Granular Access Token** → **Permissions** 选 `Read and write` →
   **Packages and scopes** 勾上 `@wxhccc`（漏了会以 404 报"无权限"）→ **Expiration** 选长一些。
   然后写进 `~/.npmrc` 替换原有的 `_authToken` 行：

   ```
   //registry.npmjs.org/:_authToken=npm_你的token
   ```

   若不想把明文 token 落在文件里，可让 `.npmrc` 引用环境变量：
   `//registry.npmjs.org/:_authToken=${NPM_TOKEN}`，再自行设置 `NPM_TOKEN`。
3. **Trusted Publishing（OIDC）+ GitHub Actions**——零密钥、无交互、不会过期，
   适合发布频繁或希望由 CI 自动发布的场景。本仓库**暂不采用**（发布频率低，配置成本不划算）。
   真要上时注意三点，否则会踩坑：

   - 需要在**每个包**的 npm 设置里分别绑定 GitHub 仓库与 workflow 文件名（本仓库有 3 个包）；
   - workflow 需 `permissions: id-token: write`，且 **npm ≥ 11.5.1**（用 Node 24，
     或 `npm install -g npm@latest`）；
   - 据报告要**用 `npm publish` 而不是 `pnpm publish`**：pnpm 走自己的发布路径，
     在 OIDC 下会以 E404 失败。

   官方文档：<https://docs.npmjs.com/trusted-publishers/>

### 发布后审核（Validating）

npm 现在会对新发布的版本做一次发布后审核。审核结束前：

- npmjs.com 上该版本显示 **Validating**；
- registry 的读接口**查不到**该版本，`npm i` 也装不到；
- **不要重发**，会报 `cannot publish over the previously published versions`。

`pnpm publish` 退出码为 0 即代表"发布已被接受"；`scripts/release.mjs` 的回查只作提示、
不会因此判失败。等审核结束后版本会自动对外可见。

几点必须注意：

- 发布前要有**干净的 git 工作区**，先提交再发布（`release:dry` 例外，可在脏工作区预演）。
- registry 上已存在的版本**无法覆盖**，所以有改动的包必须先涨版本号。
- `pnpm -r publish` 会把 prerelease 也打上 `latest` 标签（`ue-element` 已改为正式版号，
  不受影响）。若以后要把某个 prerelease 发到 `beta` / `next` 通道而不动 `latest`：

  ```bash
  pnpm build
  pnpm -C packages/element publish --access public --tag beta
  ```

- `ue-shared` 是对外独立的包，它的 `dependencies` 必须写全
  （`@wxhccc/es-util`、`dayjs`、`lodash-es`、`store2`）。漏写不会在安装时报错，
  而是让使用方在运行时 `Cannot find module`——之前发布的 `1.0.1` 就踩过这个坑。

## 构建说明

- **JS**：`vite build` 以「主入口 + 每个组件 + optionals」为多入口打包，每个入口产出
  独立 chunk（`dist/components/<name>/index.js`），组件入口是自包含的；被多个组件
  共用的代码才抽到 `dist/_chunks/`。样式统一抽到 `dist/style.css`。
- **UMD**：单独跑一趟 `vite build -c vite.umd.config.ts` 产出 `dist/index.umd.js`。
  Rollup 不允许 UMD 与代码分割共存，所以多入口的主构建和单文件 UMD 必须分成两趟。
- **类型声明**：由 `vue-tsc -p tsconfig.build.json` 逐文件产出（`src/index.ts` ->
  `dist/index.d.ts`），不使用 `vite-plugin-dts` 的 `rollupTypes`——它依赖
  @microsoft/api-extractor 内置的旧版 TypeScript，在本项目的 TS 6 下会直接报
  Internal Error；而且逐文件产出才能让 d.ts 也按组件拆分。
- **别名改写**：源码里的 `@/xxx` 会被 TypeScript 原样写进 d.ts，使用方无法解析，
  因此构建后用 `scripts/fix-dts-paths.mjs` 统一改写成相对路径。
- 完整的依赖声明与构建配置见 `packages/*/package.json`、`packages/*/vite.config.ts`
  和 `scripts/vite.base.config.ts`。

## License

MIT
