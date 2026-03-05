<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbItems = computed(() => {
  return route.matched
    .filter(item => item.meta?.title)
    .map(item => ({
      path: item.path,
      title: String(item.meta.title),
    }))
})

const pageTitle = computed(() => String(route.meta.title || 'QTrans'))
</script>

<template>
  <section class="page-container">
    <div class="page-container__breadcrumb" v-if="breadcrumbItems.length">
      <span
        v-for="(item, idx) in breadcrumbItems"
        :key="item.path"
        class="crumb"
      >
        {{ item.title }}
        <span v-if="idx < breadcrumbItems.length - 1" class="sep">/</span>
      </span>
    </div>
    <header class="page-container__header">
      <h1>{{ pageTitle }}</h1>
    </header>
    <div class="page-container__content">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.page-container {
  flex: 1;
  min-width: 0;
  padding: clamp(12px, 1.2vw, 20px);
}

.page-container__breadcrumb {
  margin-bottom: 8px;
  color: #64748b;
  font-size: 12px;
}

.crumb {
  margin-right: 4px;
}

.sep {
  margin-left: 4px;
}

.page-container__header {
  margin-bottom: 12px;
}

.page-container__header h1 {
  margin: 0;
  font-size: clamp(18px, 1.5vw, 24px);
  color: var(--q-text-primary);
}

.page-container__content {
  min-height: calc(100vh - 170px);
}
</style>
