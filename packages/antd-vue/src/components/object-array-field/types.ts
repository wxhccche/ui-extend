import { StrOrNum } from '@wxhccc/ue-shared'
import { CommonFieldProps } from '../common-field'
import { CSSProperties } from 'vue'

export interface ObjectArrayColumn {
  /** 当前列的Col组件的宽度占比，默认为1，所有列等宽 */
  colFr?: number
  /** 列字段名 */
  name: string
  /** 列标题 */
  label: string
  /** 字段是否必填，默认为true */
  required?: boolean
  placeholder?: string
  /** 是否仅作文本展示 */
  text?: boolean
  /** 字段值是否为数字 */
  isNumber?: boolean
  component?: CommonFieldProps['component']
  fieldProps?: CommonFieldProps['fieldProps']
}

export type ValueItem = Record<string, StrOrNum> & { static?: boolean }

export interface ObjectArrayFieldProps {
  /** 当前列的Row组件的props属性 */
  gridStyle?: CSSProperties
  modelValue: ValueItem[]
  staticValue: ValueItem[]
  columns: ObjectArrayColumn[]
  /** 是否显示表头标题 */
  labelTop?: boolean
  /** 上级names */
  prevNames?: StrOrNum[]
  /** 删除时是否需要确认 */
  deleteConfirm?: boolean | (() => Promise<void>)
  /** 是否通过按添加新行, 如果是字符串则设置为按钮内文字，默认为true */
  addButton?: boolean | string
  /** 是否显示边框 */
  bordered?: boolean
  /** 是否需要再数据项中添加索引作为排序 */
  orderKey?: boolean | string
  /** 是否折叠选项，如果折叠，默认显示多少行 */
  collapseRow?: boolean | number
  /** 是否显示操作列 */
  actions?: boolean
}
