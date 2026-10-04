import { h, defineComponent, computed } from 'vue'

/**
 * 指向当前 UI 库官方文档的链接。
 *
 * 原 VuePress 版从 `window.location.href` 里正则反推当前库，因此必须包在 ClientOnly 里
 * （SSR 下没有 window）。VitePress 这一版改为用构建期注入的 `__CURRENT_LIB__`：
 * 既不需要 ClientOnly，SSR 也能输出真实链接（否则静态 HTML 里这些链接全是空注释）。
 */
export default defineComponent({
  name: 'UiLibLink',
  props: {
    component: { type: String, required: true },
    lib: String
  },
  setup(props) {
    const linkInfo = computed(() => {
      const libName = props.lib || __CURRENT_LIB__
      const suffix = props.lib ? `(${libName === 'antd-vue' ? 'ant-design-vue' : 'element-plus'})` : ''
      switch (libName) {
        case 'antd-vue':
          return {
            href: `https://www.antdv.com/components/${props.component}-cn`,
            text: `${props.component}${suffix}`
          }
        case 'element':
          return {
            href: `https://element-plus.org/zh-CN/component/${props.component!.toLowerCase()}.html`,
            text: `${props.component}${suffix}`
          }
        default:
          return { href: '', text: props.component || '' }
      }
    })

    return () => h('a', { href: linkInfo.value.href, target: '_blank', rel: 'noreferrer' }, linkInfo.value.text)
  }
})
