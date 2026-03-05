<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <section class="placeholder-card">
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <slot />
  </section>
</template>

<style scoped>
.placeholder-card {
  border: 1px solid var(--q-card-border);
  border-radius: 14px;
  background: var(--q-card-bg);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
  padding: 20px;
}

h2 {
  margin: 0 0 8px;
  color: #0f172a;
}

p {
  margin: 0;
  color: #475569;
}
</style>
