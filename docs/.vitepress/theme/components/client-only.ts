import { defineComponent, ref, onMounted } from 'vue'

/**
 * 只在客户端渲染插槽内容。
 *
 * VuePress 提供 ClientOnly，VitePress 1.6 没有对应组件（vitepress 与 vitepress/client
 * 都不导出），所以自己实现等价物：挂载前不渲染，避免 SSR 阶段访问 window / DOM。
 */
export default defineComponent({
  name: 'ClientOnly',
  setup(_props, { slots }) {
    const mounted = ref(false)
    onMounted(() => {
      mounted.value = true
    })
    return () => (mounted.value ? slots.default?.() : null)
  }
})
