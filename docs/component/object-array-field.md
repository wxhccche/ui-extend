## ObjectArrayField 对象数组表单域

<libs-content>
  <template #antd-vue>

用于编辑对象数组的表单域组件，通过`columns`配置每一项对象的字段，支持新增、删除、排序、静态行等功能。适合"活动配置"、"商品明细"这类可以动态增删的多字段行数据。

### 基础用法

只需要`columns`就可以渲染出可编辑的表格，`v-model`绑定值为对象数组。

::: demo base no-limit-lib
@[code](@demo/object-array-field/antd-vue/base.vue)
:::

### 列配置

`columns`的每项配置对应一列，`colFr`控制列的宽度占比，`isNumber`会让该列默认使用数字输入框。

::: demo cell-config no-limit-lib
@[code](@demo/object-array-field/antd-vue/cell-config.vue)
:::

### 在表单中使用

组件本身是一个表单域，可以配合`FormFields`的`createFormFieldItem`放入表单中，从而获得校验能力。本例中`prevNames`与`FormFieldItem`的`prevNames`配合，让数组内每个字段的完整`name`为`configs.0.name`这样的路径。

::: demo form-field no-limit-lib
@[code](@demo/object-array-field/antd-vue/form-field.vue)
:::

::: tip 提示
组件内部使用[FormFieldItem](./form-field-item)渲染每个单元格，列配置会转换成`FormFieldItem`的props，具体见[FormFieldItem](./form-field-item)文档。
:::

!!!include(object-array-field/index.zh-CN.md)!!!

  </template>
  <template #element>

本组件仅在 `@wxhccc/ue-antd-vue` 中提供，请切换到 ant-design-vue 版本文档查看。

  </template>
</libs-content>
