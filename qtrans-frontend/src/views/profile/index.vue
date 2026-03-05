<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()
const user = computed(() => authStore.currentUser)
</script>

<template>
  <section class="profile-card">
    <h2>个人中心</h2>
    <p><strong>姓名：</strong>{{ user?.name || '-' }}</p>
    <p><strong>账号：</strong>{{ user?.username || '-' }}</p>
    <p><strong>邮箱：</strong>{{ user?.email || '-' }}</p>
    <p><strong>角色：</strong>{{ user?.roles?.join(' / ') || '-' }}</p>
  </section>
</template>

<style scoped>
.profile-card {
  border: 1px solid var(--q-card-border);
  border-radius: 14px;
  background: var(--q-card-bg);
  padding: 20px;
}

p {
  color: #334155;
}
</style>
