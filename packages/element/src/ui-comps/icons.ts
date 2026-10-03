import { Component, defineComponent, h, AllowedComponentProps } from 'vue'
import { ElIcon, IconProps } from 'element-plus'
import {
  Search,
  QuestionFilled as Question,
  DocumentCopy,
  Hide,
  Check,
  Close,
  Edit,
  Loading,
  ArrowLeft,
  ArrowRight
} from '@element-plus/icons-vue'

const createIconComponent = (
  name: string,
  // 用 Component 而不是 DefineComponent：@element-plus/icons-vue 的图标组件把
  // data 参数声明为 void，与 DefineComponent 的默认 {} 不兼容（TS2345）。
  component: Component,
  props?: IconProps & AllowedComponentProps
) =>
  defineComponent({
    name,
    setup() {
      return () => h(ElIcon, props, { default: () => h(component) })
    }
  })

export const SearchOutlined = createIconComponent('SearchOutlined', Search)
export const QuestionFilled = createIconComponent('QuestionFilled', Question)
export const CopyOutlined = createIconComponent('CopyOutlined', DocumentCopy)
export const EyeOutlined = createIconComponent('EyeOutlined', Hide)
export const CheckOutlined = createIconComponent('CheckOutlined', Check)
export const CloseOutlined = createIconComponent('CloseOutlined', Close)
export const EditOutlined = createIconComponent('EditOutlined', Edit)
export const LoadingOutlined = createIconComponent('LoadingOutlined', Loading, {
  class: 'is-loading'
})
export const ArrowLeftOutlined = createIconComponent('ArrowLeftOutlined', ArrowLeft)
export const ArrowRightOutlined = createIconComponent('ArrowRightOutlined', ArrowRight)
