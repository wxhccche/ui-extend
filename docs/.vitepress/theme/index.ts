import type { Theme } from 'vitepress'
import { defineAsyncComponent } from 'vue'
import DefaultTheme from 'vitepress/theme'
import ElementPlus, { ID_INJECTION_KEY } from 'element-plus'
import Antd from 'ant-design-vue'
import * as ElementPlusIcons from '@element-plus/icons-vue'
import UiExtendElement from '@wxhccc/ue-element'
import UiExtendAntdVue from '@wxhccc/ue-antd-vue'
import UiLibLink from './components/ui-lib-link'
import LibsContent from './components/libs-content'
import ClientOnly from './components/client-only'
import CompDemo from './components/comp-demo.vue'
import { CodeGroup, CodeGroupItem } from './components/code-group'

import 'element-plus/dist/index.css'
import 'ant-design-vue/dist/antd.css'
import './styles/index.scss'

/**
 * demo 组件按约定名全局注册：相对 `demo/` 的路径去扩展名、`/` 换成 `-`
 * （`object-array-field/antd-vue/base.vue` → `object-array-field-antd-vue-base`）。
 *
 * 原 VuePress 版用 @vuepress/plugin-register-components 做这件事；VitePress 没有对应插件，
 * 改用 Vite 的 glob。两处关键取舍：
 * 1. 用**懒加载**（不加 eager）而不是 eager：eager 会把 130 多个 demo 全部内联进产物；
 * 2. glob 的路径段写成三元表达式，让 Vite 在**构建期**就只匹配当前库的目录，
 *    另一个库的 demo 不会进入产物（VuePress 版是靠 componentsPatterns 排除的）。
 */
const otherLib = __CURRENT_LIB__ === 'antd-vue' ? 'element' : 'antd-vue'
const demoModules: Record<string, () => Promise<{ default: any }>> =
  __CURRENT_LIB__ === 'antd-vue'
    ? import.meta.glob(['./demo/**/*.vue', '!./demo/**/element/**'])
    : import.meta.glob(['./demo/**/*.vue', '!./demo/**/antd-vue/**'])

const registerDemos = (app: any) => {
  for (const [file, loader] of Object.entries(demoModules)) {
    const rel = file.replace(/^\.\/demo\//, '').replace(/\.vue$/, '')
    // 双保险：glob 已是编译期过滤，这里再挡一次路径写法差异
    if (rel.split('/').includes(otherLib)) continue
    app.component(rel.replace(/\//g, '-'), defineAsyncComponent(loader))
  }
}

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 两个 UI 库都要注入：md 源是共用的，另一个库的 demo 也在这个站点的页面里被引用
    app.use(ElementPlus)
    app.use(Antd)
    app.use(UiExtendAntdVue)
    app.use(UiExtendElement)
    for (const [name, comp] of Object.entries(ElementPlusIcons)) {
      app.component(name, comp as any)
    }
    // Element Plus 在 SSR 下需要显式提供 id provider，否则每个用到 useId 的组件
    // （el-tooltip / el-icon 等）都会报 IdInjection 并可能导致 hydration 不一致
    app.provide(ID_INJECTION_KEY, { prefix: 1000, current: 0 } as any)
    app.component('UiLibLink', UiLibLink)
    app.component('LibsContent', LibsContent)
    app.component('ClientOnly', ClientOnly)
    app.component('CompDemo', CompDemo)
    // VuePress 默认主题的 CodeGroup 在 VitePress 里没有，自实现（md 源不改）
    app.component('CodeGroup', CodeGroup)
    app.component('CodeGroupItem', CodeGroupItem)
    // VuePress 通过 client.ts 的 globalProperties 注入了这两个常量，md 里用 `{{ UI_LIB }}`
    // 与 `{{ CUR_LIB_NAME }}` 插值。VitePress 没有对应机制，在这里补齐，否则会渲染成空。
    app.config.globalProperties.UI_LIB = __CURRENT_LIB__ === 'antd-vue' ? 'ant-design-vue' : 'element-plus'
    app.config.globalProperties.CUR_LIB_NAME = `@wxhccc/ue-${__CURRENT_LIB__}`
    registerDemos(app)
  }
} satisfies Theme
