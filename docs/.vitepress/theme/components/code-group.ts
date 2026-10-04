import { defineComponent, ref, computed, h, type VNode } from 'vue'

/**
 * VuePress 默认主题的 CodeGroup / CodeGroupItem 在 VitePress 里没有，这里实现等价物。
 * md 源里保持 VuePress 写法，不改动：
 *
 *   <CodeGroup>
 *     <CodeGroupItem title="PNPM" active> ...代码块... </CodeGroupItem>
 *     <CodeGroupItem title="NPM"> ...代码块... </CodeGroupItem>
 *   </CodeGroup>
 *
 * CodeGroupItem 自身不渲染内容，只作为「带标题的插槽容器」被 CodeGroup 收集；
 * CodeGroup 从子 vnode 读 props 渲染标签页，再取选中项的内容渲染成面板。
 */

/** CodeGroupItem 只承载 title/active 与内容，渲染交给 CodeGroup */
export const CodeGroupItem = defineComponent({
  name: 'CodeGroupItem',
  props: {
    title: { type: String, default: '' },
    active: { type: Boolean, default: false }
  },
  setup(_props, { slots }) {
    // 兜底：万一被单独使用，也能渲染出来
    return () => h('div', { class: 'ue-code-group__item' }, slots.default?.())
  }
})

const getDefaultSlot = (vnode: VNode): (() => any) | undefined => {
  const children: any = vnode.children
  if (!children) return undefined
  if (typeof children === 'function') return children
  if (typeof children.default === 'function') return children.default
  return undefined
}

/** 拍平插槽 vnode，取出所有 CodeGroupItem（可能在 fragment / 数组里） */
const collectItems = (nodes: any, out: VNode[] = []): VNode[] => {
  if (!nodes) return out
  if (Array.isArray(nodes)) {
    nodes.forEach((n) => collectItems(n, out))
    return out
  }
  if (typeof nodes !== 'object') return out
  if (nodes.type === CodeGroupItem) {
    out.push(nodes)
    return out
  }
  // fragment / template 包裹：继续往里找
  if (nodes.type === Symbol.for('v-fgt') || nodes.type === Symbol.for('v-ndc') || nodes.children) {
    const slot = getDefaultSlot(nodes)
    if (slot) collectItems(slot(), out)
  }
  return out
}

export const CodeGroup = defineComponent({
  name: 'CodeGroup',
  setup(_props, { slots }) {
    const current = ref(0)
    const items = computed(() => collectItems(slots.default?.()))

    // 有 active 标记时默认选中它，否则选第一个
    const initialised = ref(false)
    const currentIndex = computed(() => {
      if (!initialised.value) {
        const i = items.value.findIndex((v) => (v.props as any)?.active)
        current.value = i >= 0 ? i : 0
        initialised.value = true
      }
      return current.value
    })

    return () => {
      const list = items.value
      const idx = currentIndex.value
      const active = list[idx]
      const panel = active ? getDefaultSlot(active)?.() : null
      return h('div', { class: 'ue-code-group' }, [
        h(
          'div',
          { class: 'ue-code-group__tabs' },
          list.map((v, i) =>
            h(
              'button',
              {
                type: 'button',
                class: ['ue-code-group__tab', { active: i === idx }],
                onClick: () => (current.value = i)
              },
              (v.props as any)?.title ?? ''
            )
          )
        ),
        h('div', { class: 'ue-code-group__panel' }, panel)
      ])
    }
  }
})
