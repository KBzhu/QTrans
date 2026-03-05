<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const pageTitle = computed(() => String(route.meta.title || 'QTrans'))
</script>

<template>
  <section class="page-container">
    <header class="page-container__header">
      <h1>{{ pageTitle }}</h1>
    </header>
    <div class="page-container__content">
      <slot />
    </div>
  </section>
</template>

<style scoped src="./styles/page-container.scss"></style>
