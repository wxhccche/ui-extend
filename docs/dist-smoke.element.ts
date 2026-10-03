// 产物可用性冒烟检查 —— element 单独一份（不参与文档站点构建）。
//
// 拆成两份是为了让两个库能真正独立发布：element 出问题不应该卡住 antd-vue 的发布。
// 运行：pnpm typecheck:dist:element
import ElementLib, { DataTable, Cropper, useVModel, vueTypeProp, type AnyObject } from '@wxhccc/ue-element'
// 走 exports 里的 "./components/*"，验证按组件拆分的深路径导入
import ElementCropper from '@wxhccc/ue-element/components/cropper'
import ElementPagedTable, { exposeMethods } from '@wxhccc/ue-element/components/paged-table'

export const lib: AnyObject = { ElementLib }
export const components = [DataTable, Cropper, ElementCropper, ElementPagedTable]
// element 的 paged-table/index.ts 额外导出了 exposeMethods：
// 若 index.vue 抢走 index.js，这里就会失败（JS 少导出，而 d.ts 声明了它）
export const methods: string[] = exposeMethods
// ue-element 会 `export * from '@wxhccc/ue-shared'`，一并验证这条再导出链
export const helpers = [useVModel, vueTypeProp]
