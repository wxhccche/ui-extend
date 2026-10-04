<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { kebabCase } from 'lodash-es'
import DemoBlock from './demo-block.vue'

const props = withDefaults(
  defineProps<{
    name: string
    noLimitLib?: boolean
  }>(),
  { name: 'Base' }
)

// VuePress 用 usePageData().path（如 /component/cropper.html），
// VitePress 的 useData().page 给的是相对路径（component/cropper.md），这里换算成同样的页面名。
const { page } = useData()

const componentName = computed(() => {
  const rel = page.value?.relativePath || ''
  if (!rel.includes('component/')) return ''
  return rel.split('/').pop()?.replace(/\.md$/, '') || ''
})

const demoCompName = computed(() => {
  const libName = props.noLimitLib ? '' : `-${__CURRENT_LIB__}`
  return `${componentName.value}${libName}-${kebabCase(props.name)}`
})
</script>
<script lang="ts">
export default { name: 'CompDemo' }
</script>

<template>
  <demo-block :class="['component-demo-block', `${componentName}-demo`]">
    <template v-if="demoCompName" #source>
      <!--
        只把 demo 实例挡在 SSR 之外：这些是用户组件（依赖 element-plus / ant-design-vue），
        服务端渲染会触发 Element Plus 的 IdInjection 等问题。代码块与描述仍静态输出，
        对 SEO 与无 JS 环境更友好。
      -->
      <ClientOnly>
        <component :is="demoCompName"></component>
      </ClientOnly>
    </template>
    <template #default>
      <slot name="description"></slot>
    </template>
    <template #highlight>
      <slot></slot>
    </template>
  </demo-block>
</template>

<style lang="scss">
.component-demo-block {
  margin: 20px 0 40px;
}
</style>
