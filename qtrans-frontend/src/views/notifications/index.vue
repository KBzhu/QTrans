<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useNotificationStore, useAuthStore } from '@/stores'

const notificationStore = useNotificationStore()
const authStore = useAuthStore()

const notifications = computed(() => notificationStore.notifications)

onMounted(async () => {
  if (authStore.currentUser?.id)
    await notificationStore.fetchNotifications(authStore.currentUser.id)
})

async function markAsRead(id: string) {
  await notificationStore.markAsRead(id)
}

async function markAllAsRead() {
  await notificationStore.markAllAsRead(authStore.currentUser?.id)
}
</script>

<template>
  <section class="notification-card">
    <header>
      <h2>通知中心</h2>
      <button @click="markAllAsRead">全部已读</button>
    </header>
    <ul>
      <li v-for="item in notifications" :key="item.id" :class="{ unread: !item.read }">
        <div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.content }}</p>
          <small>{{ item.createdAt }}</small>
        </div>
        <button v-if="!item.read" @click="markAsRead(item.id)">标记已读</button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.notification-card {
  border: 1px solid var(--q-card-border);
  border-radius: 14px;
  background: var(--q-card-bg);
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

ul {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

li {
  border: 1px solid #dbeafe;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

li.unread {
  border-color: #2563eb;
  background: #eff6ff;
}

h3 {
  margin: 0;
}

p {
  margin: 6px 0;
}

small {
  color: #64748b;
}

button {
  border: none;
  border-radius: 6px;
  background: #155dfc;
  color: #fff;
  padding: 0 10px;
  height: 30px;
  cursor: pointer;
}
</style>
