// 产物可用性冒烟检查 —— antd-vue 单独一份（不参与文档站点构建）。
//
// 拆成两份是为了让两个库能真正独立发布：antd-vue 出问题不应该卡住 element 的发布。
// 它站在「使用方」角度验证 dist——这类问题各包自己的 vue-tsc 构建发现不了：
// d.ts 能生成、却因为 @/ 别名没改写、或引用了使用方解析不到的类型而无法消费。
//
// 运行：pnpm typecheck:dist:antd-vue
import AntdLib, {
  PagedTable,
  MultiLineInput,
  Cropper,
  AlertItem,
  useVModel,
  vueTypeProp,
  type AnyObject,
  type MultiLineInputProps
} from '@wxhccc/ue-antd-vue'
// 走 exports 里的 "./components/*"，验证按组件拆分的深路径导入
import AntdCropper from '@wxhccc/ue-antd-vue/components/cropper'
import AntdFormBtns, { FormBtnsProps } from '@wxhccc/ue-antd-vue/components/form-btns'

export const lib: AnyObject = { AntdLib }
export const components = [PagedTable, MultiLineInput, Cropper, AntdCropper, AntdFormBtns]
export const alert: AlertItem = { title: 'hello', description: ['a'] }
export const multiLineProps: MultiLineInputProps = {}
// FormBtnsProps.submit 是必填项，用 Partial 表达「只传一部分」
export const formBtnProps: Partial<FormBtnsProps> = {}
// ue-antd-vue 会 `export * from '@wxhccc/ue-shared'`，一并验证这条再导出链
export const helpers = [useVModel, vueTypeProp]
