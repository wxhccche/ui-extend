<template>
  <div>
    <a-switch v-model:checked="hasBorder" checked-children="显示边框" un-checked-children="隐藏边框"></a-switch>
    <br /><br />
    <ue-object-array-field v-model="formData" :bordered="hasBorder" :columns="columns"></ue-object-array-field>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  setup() {
    const hasBorder = ref(false)

    const columns = ref([
      { name: 'label', label: 'Label' },
      { name: 'value', label: 'Value' }
    ])

    const formData = ref([])

    return { hasBorder, columns, formData }
  }
})
</script>