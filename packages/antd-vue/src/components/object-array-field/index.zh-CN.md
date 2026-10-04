### Attributes

| 参数          | 类型                       | 说明                                                                                                                             | 可选值 | 默认值  |
| :------------ | :------------------------- | :------------------------------------------------------------------------------------------------------------------------------- | :----- | :------ |
| value/v-model | object[]                   | 绑定值，每一项为一个对象，对象的key对应`columns`中配置的`name`                                                                    | --     | []      |
| static-value  | object[]                   | 静态数据，会拼接在`modelValue`前面展示，且不会随`v-model`更新。可在数据项内设置`static: true`来标记，用于展示不可编辑的固定行 | --     | []      |
| columns       | object[]                   | 列配置数组，具体见[ObjectArrayColumn](#objectarraycolumn)                                                                         | --     | --      |
| label-top     | boolean                    | 是否在顶部显示表头标题                                                                                                           | --     | true    |
| prevNames     | (string/number)[]          | 上级`name`路径，会拼接在列`name`之前，生成表单项的完整`name`                                                                     | --     | []      |
| addButton     | boolean / string           | 是否显示新增按钮。传字符串时同时作为按钮文字                                                                                     | --     | true    |
| bordered      | boolean                    | 是否显示边框                                                                                                                     | --     | false   |
| orderKey      | boolean / string           | 是否在每一项数据中写入其在数组内的索引。传字符串时作为索引的键名，传`true`时键名为`index`                                        | --     | --      |
| deleteConfirm | boolean / Function         | 删除时是否需要确认。传函数时，需要返回`Promise`，在`resolve`后才会执行删除                                                        | --     | --      |
| actions       | boolean                    | 是否显示操作列（上移/下移/删除按钮）                                                                                             | --     | true    |
| gridStyle     | object                     | 根层列表格的额外`style`对象。`gridTemplateColumns`由`columns`的`colFr`计算得出，无法通过此属性覆盖                              | --     | --      |

### ObjectArrayColumn

| 参数        | 类型              | 说明                                                                                                                                                 | 可选值 | 默认值  |
| :---------- | :---------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :----- | :------ |
| name        | string            | 列字段名，对应数据对象中的key                                                                                                                        | --     | --      |
| label       | string            | 列标题                                                                                                                                               | --     | --      |
| colFr       | number            | 该列宽度占比，相邻的相同值会被合并为一个`fr`轨道，默认为1即所有列等宽                                                                                 | --     | 1       |
| required    | boolean           | 字段是否必填                                                                                                                                         | --     | true    |
| placeholder | string            | 占位文字，未设置时使用`请输入+label`                                                                                                                 | --     | --      |
| text        | boolean           | 是否仅作文本展示，为true时不会渲染表单项                                                                                                             | --     | --      |
| isNumber    | boolean           | 字段值是否为数字，为true且未指定`component`时默认使用`InputNumber`组件                                                                               | --     | --      |
| component   | string / object   | 自定义表单域组件，具体见[CommonField](./common-field)的`component`字段                                                                               | --     | --      |
| fieldProps  | object            | 传递给表单域组件的props，具体见[CommonField](./common-field)的`fieldProps`字段                                                                       | --     | --      |

### Slots

| 名称      | 说明                                             | 参数                                                          |
| :-------- | :----------------------------------------------- | :------------------------------------------------------------ |
| actionBtns | 自定义操作列内的按钮，会替换默认的上移/下移按钮 | { item: object, index: number, value: object[] }，其中`index`为去除静态数据后的真实索引，`value`为当前绑定值 |
