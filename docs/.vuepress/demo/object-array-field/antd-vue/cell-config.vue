<template>
  <div>
    <ue-object-array-field v-model="formData" bordered :columns="columns"></ue-object-array-field>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  setup() {

    const columns = ref([
      { name: 'name', label: '商品', colFr: 2 },
      { name: 'price', label: '金额', isNumber: true },
      { name: 'desc', label: '备注' }
    ])

    const formData = ref([])

    return { columns, formData }
  }
})
</script>