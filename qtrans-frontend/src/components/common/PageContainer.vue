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
    <div v-if="breadcrumbItems.length" class="page-container__breadcrumb">
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

<style scoped src="./styles/page-container.scss"></style>
