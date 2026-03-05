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
    <div class="default-layout__body" :class="{ 'is-collapsed': collapsed }">
      <AppSidebar :collapsed="collapsed" @toggle-sidebar="toggleSidebar" />
      <div class="default-layout__content">
        <PageContainer>
          <slot />
        </PageContainer>
      </div>
    </div>
  </div>

</template>

<style scoped>
.default-layout {
  height: 100vh;
  overflow: hidden;
  background: var(--q-bg-main);
}

.default-layout__body {
  display: flex;
  height: calc(100vh - 64px);
  margin-top: 64px;
  min-height: 0;
}

.default-layout__content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  margin-left: 224px;
  transition: margin-left 0.2s;
}

.default-layout__body.is-collapsed .default-layout__content {
  margin-left: 72px;
}

@media (max-width: 768px) {
  .default-layout__content {
    margin-left: 224px;
  }

  .default-layout__body.is-collapsed .default-layout__content {
    margin-left: 72px;
  }
}
</style>

