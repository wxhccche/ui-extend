<template>
  <div>
    <a-alert message="滚动到底部触发懒加载"></a-alert>
    <div ref="contianer" class="demo-media-container-box3">
      <ue-media-container class="demo-media-container" container-force-render :media-size="mediaSize">
        <img ref="el" :data-src="src" @load="setMediaSize" />
      </ue-media-container>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { useMediaLazyLoad } from '@wxhccc/ue-antd-vue'

export default defineComponent({
  setup() {
    const contianer = ref()
    const el = ref()
    const mode = ref('dynamic')
    const mediaSize = ref({})
    const src = ref('https://oss.sw.wxhice.com/adm/459d9f227ccbbbbaac4a429971f78461.jpg')
    
    const observer = useMediaLazyLoad(contianer, mode)

    const setMediaSize = (e) => {
      const img = e.target
      mediaSize.value = { width: img.naturalWidth, height: img.naturalHeight }
    }

    onMounted(() => {
      observer.lazyObserve(el.value)
    })
    return { contianer, el, src, mediaSize, setMediaSize }
  }
})
</script>

<style>
.demo-media-container-box3 {
  width: 500px;
  height: 240px;
  overflow: hidden auto;
  border: 1px solid #eaeaea;
  background-color: rgba(0, 0, 0, 0.4);
}
.demo-media-container-box3 .demo-media-container {
  margin-top: 300px;
  width: 400px;
  height: 200px;
}

.demo-media-container-box3 .media-content-cover {
  
  color: #ffffff;
}
</style>