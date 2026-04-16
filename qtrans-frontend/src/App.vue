<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import BlankLayout from '@/layouts/BlankLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useRegionConfigStore } from '@/stores'

const route = useRoute()

const layoutComponent = computed(() => {
  return route.meta.layout === 'blank' ? BlankLayout : DefaultLayout
})

// 初始化全局区域配置（从后端动态获取，替代硬编码映射）
const regionConfigStore = useRegionConfigStore()
onMounted(() => {
  regionConfigStore.fetchRegionConfig()
})
</script>

<template>
  <RouterView v-slot="{ Component }">
    <component :is="layoutComponent">
      <component :is="Component" />
    </component>
  </RouterView>
</template>
