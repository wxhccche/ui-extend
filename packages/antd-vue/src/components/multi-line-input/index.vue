<script lang="ts">
import { ref, shallowRef, computed, defineComponent, nextTick, h } from 'vue'
import { AnyFunction, resolveProps, useIgnoreWatch, vueTypeProp } from '@wxhccc/ue-shared'
import {
  UeInput,
  UeButton,
  UeInputProps,
  PlusOutlined,
  DeleteOutlined,
  UeMessage,
  ButtonSize,
  ON_UI_UPDATE_MODEL_VALUE,
  UI_MODEL_VALUE
} from '@/ui-comps'

type Value = string[]

export interface MultiLineInputProps {
  modelValue?: Value
  size?: ButtonSize
  /** Input组件props对象或者返回返回对象的函数 */
  inputProps?: UeInputProps | ((index: number) => UeInputProps)
  /** 是否支持文本导入，或者指定导入文本时的替换方式 */
  textImport?: boolean | 'append' | 'replace'
  /** 是否使用紧凑布局方式 */
  inline?: boolean
}

type InputInstance = { focus: AnyFunction<void> }

type MLIProps = Required<MultiLineInputProps>

export default defineComponent({
  name: 'UeMultiLineInput',
  props: {
    modelValue: vueTypeProp<MLIProps['modelValue']>(Array),
    size: vueTypeProp<ButtonSize>(String, 'small'),
    /** Input组件props，可以用函数来设置 */
    inputProps: vueTypeProp<MLIProps['inputProps']>([Object, Function]),
    /** 是否支持本地text文件导入 */
    textImport: vueTypeProp<MLIProps['textImport']>([Boolean, String]),
    inline: vueTypeProp<MLIProps['inline']>(Boolean)
  },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    const inputs = shallowRef<Record<string, InputInstance>>({})

    const getInitValue = () => {
      const { modelValue } = props
      return Array.isArray(modelValue) && modelValue.length ? modelValue.slice(0) : ['']
    }
    // 是否是内部触发的value变动
    const innerValue = ref<Value>(getInitValue())

    const handleValue = computed({
      get: () => innerValue.value,
      set: (value: string[]) => {
        const filterValue = value.filter((val) => !!val)
        ignoreWatch.value = true
        emit('update:modelValue', filterValue)
      }
    })

    const setItemRef = (el: any, index: number) => {
      if (el) {
        inputs.value[index] = el
      }
    }
    const setValue = (value: string, index: number) => {
      const trimVal = value.trim()
      innerValue.value.splice(index, 1, trimVal)
      handleValue.value = innerValue.value
    }
    const addNewItem = (index: number) => {
      innerValue.value.splice(index + 1, 0, '')
      handleValue.value = innerValue.value
      nextTick(() => {
        inputs.value[index + 1]?.focus()
      })
    }
    const deleteItem = (index: number) => {
      innerValue.value.splice(index, 1)
      handleValue.value = innerValue.value
    }

    const checkAndReadFile = (e: Event) => {
      const [file] = (e.target as any).files as File[]
      console.log(111, file)
      if (!file || file.type !== 'text/plain') {
        return false
      }
      if (file.size > 2 * 1024 * 1024) {
        UeMessage.error('文件大小不得超过2MB')
        return false
      }
      const fileReader = new FileReader()
      fileReader.readAsText(file)
      fileReader.onload = () => {
        const result = fileReader.result as string
        if (result === '') {
          UeMessage.error('文件为空')
          return
        }
        const values = result.replace(/\r/g, '').split(/\n/)
        innerValue.value = props.textImport === 'replace' ? values : innerValue.value.concat(values)
        handleValue.value = innerValue.value
      }
      return false
    }

    const { ignoreWatch } = useIgnoreWatch(
      () => props.modelValue,
      () => {
        innerValue.value = getInitValue()
      }
    )

    const { extraSuffix, default: defSlot } = slots

    const suffixSlotRender = (index: number) => {
      const { size } = props
      return [
        ...(extraSuffix ? extraSuffix(index) : []),
        h(
          UeButton,
          {
            type: 'link',
            size,
            disabled: handleValue.value.length === 1,
            onClick: () => deleteItem(index)
          },
          { icon: () => h(DeleteOutlined) }
        ),
        h(
          UeButton,
          {
            type: 'link',
            size,
            onClick: () => addNewItem(index)
          },
          { icon: () => h(PlusOutlined) }
        )
      ]
    }

    const importBtnRender = () => {
      return h('div', { class: 'ue-input-file-box' }, [
        h(UeButton, { class: 'ue-import-txt-btn', type: 'primary', size: props.size }, '从TXT导入'),
        h('input', {
          type: 'file',
          class: 'ue-file-input',
          accept: 'text/plain',
          onChange: checkAndReadFile
        })
      ])
    }

    return () =>
      h('div', { class: ['ue-multi-line-input', { 'inline-layout': props.inline }] }, [
        ...handleValue.value.map((item, index) => {
          const { inputProps = {} } = props
          const otherProps = resolveProps(inputProps, index)
          return h(
            UeInput,
            {
              ref: (el) => setItemRef(el, index),
              key: index,
              ...otherProps,
              [UI_MODEL_VALUE]: item,
              size: props.size,
              [ON_UI_UPDATE_MODEL_VALUE]: (value: string) => setValue(value, index),
              onPressEnter: () => addNewItem(index)
            },
            {
              suffix: () => suffixSlotRender(index)
            }
          )
        }),
        props.textImport ? importBtnRender() : null,
        defSlot ? defSlot() : null
      ])
  }
})
</script>

<style lang="scss">
.ue-multi-line-input {
  --ue-border-color: #e2e2e2;

  border: 1px solid var(--ue-border-color);
  padding: 0 4px;
  
  .ant-input-affix-wrapper {
    margin: 4px 0;
  }

  .ue-input-file-box {
    display: flex;
    position: relative;
    margin-top: 8px;
    max-width: fit-content;
  }
  .ue-file-input {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    opacity: 0;
  }
  &.inline-layout {
    display: flex;
    flex-wrap: wrap;
    column-gap: 12px;
    .ant-input-affix-wrapper {
      width: auto;
    }
  }
}
</style>
