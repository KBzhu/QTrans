<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '@/components/common/AppHeader.vue'
import AppSidebar from '@/components/common/AppSidebar.vue'
import PageContainer from '@/components/common/PageContainer.vue'

const collapsed = ref(false)

function toggleSidebar() {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <div class="default-layout">
    <AppHeader />
    <div class="default-layout__body">
      <AppSidebar :collapsed="collapsed" @toggle-sidebar="toggleSidebar" />
      <PageContainer>
        <slot />
      </PageContainer>
    </div>
  </div>
</template>

<style scoped>
.default-layout {
  min-height: 100vh;
  background: var(--q-bg-main);
}

.default-layout__body {
  display: flex;
  min-height: calc(100vh - 64px);
}
</style>
