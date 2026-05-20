<script setup lang="ts">
import { CSSProperties, computed } from 'vue'
import { cloneDeep } from 'lodash-es'
import {
  UeInput,
  UeButton,
  UeInputNumber,
  PlusOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@/ui-comps'
import { StrOrNum, vueTypeProp } from '@wxhccc/ue-shared'
import { createFormFieldItem, createFFIRulesProps } from '@/optionals'
import FormFieldItem, { FormFieldItemProps } from '../form-field-item'
import { ObjectArrayColumn, ObjectArrayFieldProps, ValueItem } from './types'

type OAFProps = ObjectArrayFieldProps

const props = defineProps({
  gridStyle: vueTypeProp<OAFProps['gridStyle']>(Object),
  modelValue: vueTypeProp<OAFProps['modelValue']>(Array, () => []),
  staticValue: vueTypeProp<OAFProps['staticValue']>(Array, () => []),
  columns: vueTypeProp<OAFProps['columns']>(Array, () => [
    { label: 'Label', name: 'label' },
    { label: 'Value', name: 'value' }
  ]),
  labelTop: vueTypeProp<boolean>(Boolean, true),
  prevNames: vueTypeProp<OAFProps['prevNames']>(Array, () => []),
  deleteConfirm: vueTypeProp<OAFProps['deleteConfirm']>([Boolean, Function]),
  addButton: vueTypeProp<OAFProps['addButton']>([Boolean, String], true),
  orderKey: vueTypeProp<OAFProps['orderKey']>([Boolean, String]),
  bordered: Boolean,
  actions: vueTypeProp<OAFProps['actions']>(Boolean, true)
})
const emit = defineEmits<{
  (e: 'update:modelValue', value?: OAFProps['modelValue']): void
}>()

const handleGridStyle = computed((): CSSProperties => {
  const parts: string[] = []
  const { columns } = props
  let lastFr = columns[0].colFr ?? 1
  let count = 1
  for (let i = 1; i < columns.length; i++) {
    const fr = columns[i].colFr ?? 1
    if (fr === lastFr) {
      count++
    } else {
      const track = `minmax(100px, ${lastFr}fr)`
      parts.push(count === 1 ? track : `repeat(${count}, ${track})`)
      lastFr = fr
      count = 1
    }
  }
  // 输出最后一段
  const track = `minmax(100px, ${lastFr}fr)`
  parts.push(count === 1 ? track : `repeat(${count}, ${track})`)
  return {
    ...props.gridStyle,
    gridTemplateColumns: `${parts.join(' ')}${props.actions ? ' 100px' : ''}`
  }
})
const handledValue = computed({
  get(): OAFProps['modelValue'] {
    return props.staticValue.concat(cloneDeep(props.modelValue))
  },
  set(val: OAFProps['modelValue']) {
    const dyncValue = val.slice(props.staticValue.length)
    emit('update:modelValue', addIndexToValue(dyncValue))
  }
})
const addBtnText = computed(() => {
  const { addButton } = props
  return typeof addButton === 'string' ? addButton : '新增'
})
// 将元素的索引添加到对象中
const addIndexToValue = (data: ValueItem[]) => {
  const { orderKey } = props
  if (!orderKey) {
    return data
  }
  const key = typeof orderKey === 'string' ? orderKey : 'index'
  return data.map((item, index) => ({ ...item, [key]: index }))
}

// 交换对象在数组中的顺序
const swapArray = (orgIndex: number, targIndex: number) => {
  const arr = cloneDeep(handledValue.value)
  arr[orgIndex] = arr.splice(targIndex, 1, arr[orgIndex])[0]
  handledValue.value = arr
}
// 由配置参数创建FormItemFieldProps
const getFieldItem = (item: ObjectArrayColumn, index: number, isStatic?: boolean) => {
  const {
    component = item.isNumber ? UeInputNumber : UeInput,
    name,
    label,
    required = true,
    placeholder: ph,
    fieldProps
  } = item
  const placeholder = ph || '请输入' + label
  const fiProps: FormFieldItemProps = props.labelTop ? { wrapperCol: { span: 24 } } : {}
  const trueIndex = index - props.staticValue.length
  return createFormFieldItem(
    component,
    createFFIRulesProps(props.labelTop ? '' : label, required, [], fiProps),
    isStatic ? undefined : name,
    { placeholder, readonly: isStatic, ...fieldProps },
    { prevNames: (props.prevNames || []).concat([trueIndex]) }
  )
}
const trueIndex = (index: number) => {
  return index - props.staticValue.length
}
const objectMove = (index: number, moveIndex: number) => {
  swapArray(index, index + moveIndex)
}
/** event **/
const createNewItem = (name: StrOrNum = '', value: StrOrNum = '') => {
  handledValue.value = handledValue.value.concat([name ? { [name]: value } : {}])
}
const updateObject = (object: ValueItem, name: StrOrNum, val: StrOrNum) => {
  object[name] = val
  handledValue.value = cloneDeep(handledValue.value)
}
const deleteObject = (index: number) => {
  const deleteFn = () => {
    const value = cloneDeep(handledValue.value)
    value.splice(index, 1)
    handledValue.value = value
  }
  const { deleteConfirm } = props
  if (typeof deleteConfirm === 'function') {
    const promise = deleteConfirm()
    if (promise instanceof Promise) {
      promise.then(deleteFn)
    }
  } else {
    deleteFn()
  }
}
</script>
<script lang="ts">
export default { name: 'UeObjectArrayField' }
</script>

<template>
  <ul :class="['ue-object-array-field', { 'is-bordered': bordered }]" :style="handleGridStyle">
    <template v-if="labelTop">
      <li v-for="(item, index) in columns" :key="item.name || index" class="cell-col labal-col">
        <span class="labal-span">{{ item.label }}</span>
      </li>
      <li v-if="props.actions" class="cell-col ope-btns">操作</li>
    </template>
    <template v-for="(object, oindex) in handledValue" :key="oindex">
      <li v-for="(item, index) in columns" :key="index" class="cell-col value-col">
        <span v-if="item.text">{{ object[item.name] }}</span>
        <FormFieldItem
          v-else
          v-bind="getFieldItem(item, oindex, object.static)"
          :ref="`${item.name}.field`"
          :model-value="object[item.name]"
          @update:model-value="updateObject(object, item.name, $event)"
        ></FormFieldItem>
      </li>
      <li v-if="props.actions" class="cell-col ope-btns">
        <template v-if="!object.static">
          <slot name="actionBtns" :item="object" :index="trueIndex(oindex)" :value="modelValue">
            <UeButton
              class="sw-link-icon"
              :disabled="trueIndex(oindex) === modelValue.length - 1"
              type="link"
              size="small"
              @click="objectMove(oindex, +1)"
            >
              <ArrowDownOutlined />
            </UeButton>
            <UeButton
              :disabled="trueIndex(oindex) === 0"
              type="link"
              size="small"
              @click="objectMove(oindex, -1)"
            >
              <ArrowUpOutlined />
            </UeButton>
          </slot>
          <UeButton type="link" size="small" @click="deleteObject(oindex)">
            <delete-outlined />
          </UeButton>
        </template>
      </li>
    </template>
    <div v-if="addButton" class="add-btn-row">
      <UeButton type="link" @click="createNewItem()">
        <PlusOutlined />
        {{ addBtnText }}
      </UeButton>
    </div>
  </ul>
</template>

<style lang="scss">
.ue-object-array-field {
  --ue-border-color: var(--ant-border-color, #ebeef5);
  display: grid;
  padding: 0;
  grid-gap: 4px 20px;
  li {
    position: relative;
    list-style: none;
  }
  .ue-form-field-item {
    .ue-common-field {
      width: 100%;
    }
  }
  &.is-bordered {
    grid-gap: 0;
    .cell-col {
      padding: 6px 6px;
      border: 1px solid var(--ue-border-color);
    }
    .top-label-row {
      background-color: #eaeaea;
    }
  }
  .add-btn-row .ant-btn {
    padding: 0;
  }
  .ope-btns {
    display: flex;
    white-space: nowrap;
    align-items: baseline;
    min-width: 104px;
  }
}
</style>
