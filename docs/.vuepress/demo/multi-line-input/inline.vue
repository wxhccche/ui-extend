<template>
  <div>
    <ue-multi-line-input v-model="value" inline></ue-multi-line-input>
    <p>{{ value }}</p>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  data () {
    return {
      value: []
    }
  }
})
</script>