<template>
  <a-form :model="formData" ref="form" :label-col="{ style: { width: '80px' } }" :wrapper-col="{ span: 12 }" >
    <p>{{ formData }}</p>
    <ue-form-fields :items="items" v-model="formData">
    </ue-form-fields>
    <a-form-item>
      <ue-form-btns :form="form" is-validate></ue-form-btns>
    </a-form-item>
  </a-form>
</template>

<script>
import { defineComponent, ref } from 'vue'
import {
  ObjectArrayField,
  createFFIRulesProps,
  createFormFieldItem,
  createInputFormItem,
} from '@wxhccc/ue-antd-vue'

export default defineComponent({
  setup() {
    const form = ref()
    const formData = ref({
      name: '',
      configs: []
    })
    const columns = ref([
      { name: 'name', label: '商品', colFr: 2 },
      { name: 'price', label: '金额', isNumber: true },
      { name: 'desc', label: '备注' }
    ])
    const items = [
      createInputFormItem(createFFIRulesProps('活动名称'), 'name'),
      createFormFieldItem(ObjectArrayField, '活动配置', 'configs', { columns, prevNames: ['configs'] })
    ]
    return { form, formData, items }
  }
})
</script>