<template>
  <div>
    <p>
      关联模式：
      <a-radio-group v-model:value="checkMode" @change="resetValues">
        <a-radio value="two-way">two-way(双向)</a-radio>
        <a-radio value="one-way">one-way(单向)</a-radio>
        <a-radio value="none">none(不关联）</a-radio>
      </a-radio-group>
    </p>
    <ue-tree-field
      v-model="nodeIds"
      v-model:detail-value="detailValue"
      :data="data"
      :check-mode="checkMode"
      :field-names="fieldNames"
      :key="checkMode"
    >
    </ue-tree-field>
    modelValue: {{  nodeIds  }}
    <br />
    detailValue: {{  detailValue  }}
  </div>
</template>

<script>
import { defineComponent, reactive, toRefs } from 'vue'

export default defineComponent({
  setup() {
    const state = reactive({
      checkMode: 'one-way',
      nodeIds: [],
      detailValue: {},
      fieldNames: { title: 'name' },
      data: [
        {
          name: '一级 1',
          id: 1,
          children: [
            {
              name: '二级 1-1',
              id: 11,
              children: [
                {
                  id: 111,
                  name: '三级 1-1-1'
                }
              ]
            }
          ]
        },
        {
          name: '一级 2',
          id: 2,
          children: [
            {
              id: 21,
              name: '二级 2-1',
              children: [
                {
                  id: 211,
                  name: '三级 2-1-1'
                }
              ]
            },
            {
              id: 22,
              name: '二级 2-2',
              children: [
                {
                  id: 221,
                  name: '三级 2-2-1'
                }
              ]
            }
          ]
        },
        {
          name: '一级 3',
          id: 3,
          children: [
            {
              id: 31,
              name: '二级 3-1',
              children: [
                {
                  id: 311,
                  name: '三级 3-1-1'
                }
              ]
            },
            {
              name: '二级 3-2',
              id: 32,
              children: [
                {
                  id: 321,
                  name: '三级 3-2-1'
                }
              ]
            }
          ]
        }
      ]
    })

    const resetValues = () => {
      state.nodeIds = []
      state.detailValue = {}
    }

    return { ...toRefs(state), resetValues }
  }
})
</script>
