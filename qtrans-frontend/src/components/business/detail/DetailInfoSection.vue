<script setup lang="ts">
import type { DetailFieldItem } from '@/types'

interface Props {
  title: string
  rows: DetailFieldItem[]
}

defineProps<Props>()
</script>

<template>
  <section class="detail-info-section">
    <h3 class="detail-info-section__title">{{ title }}</h3>
    <div class="detail-info-section__grid">
      <div
        v-for="item in rows"
        :key="`${title}-${item.label}`"
        class="detail-info-section__item"
        :class="{ 'is-full': item.fullRow }"
      >
        <span class="detail-info-section__label">{{ item.label }}：</span>
        <span class="detail-info-section__value">{{ item.value || '-' }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss" src="./detail-info-section.scss"></style>
