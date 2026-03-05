<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { UserRole } from '@/types'
import { menuRoutes, type AppRouteMeta } from '@/router/routes'
import { useAuthStore } from '@/stores'

const props = defineProps<{
  collapsed: boolean
}>()

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

function routeMeta(meta: unknown): AppRouteMeta {
  return (meta || {}) as AppRouteMeta
}

const menuItems = computed(() => {
  const currentRoles = authStore.userRoles
  return menuRoutes.filter((item) => {
    const roles = routeMeta(item.meta).roles as UserRole[] | undefined

    if (!roles || roles.length === 0)
      return true

    return roles.some(role => currentRoles.includes(role))
  })
})

function jump(path: string) {
  router.push(path)
}
</script>

<template>
  <aside class="app-sidebar" :class="{ collapsed: props.collapsed }">
    <nav>
      <button
        v-for="item in menuItems"
        :key="String(item.name)"
        class="menu-item"
        :class="{ active: route.path === item.path }"
        @click="jump(item.path)"
      >
        <span class="menu-icon">{{ String(routeMeta(item.meta).icon || '•') }}</span>
        <span v-if="!props.collapsed" class="menu-title">{{ String(routeMeta(item.meta).title) }}</span>
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.app-sidebar {
  width: 224px;
  padding: 14px 10px;
  border-right: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(6px);
  transition: width 0.2s;
}

.app-sidebar.collapsed {
  width: 72px;
}

.menu-item {
  width: 100%;
  height: 42px;
  border: none;
  border-radius: 12px;
  margin-bottom: 8px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  background: transparent;
  color: #334155;
  cursor: pointer;
}

.menu-item.active {
  color: #fff;
  background: linear-gradient(90deg, #ad46ff 0%, #00bba7 100%);
}

.menu-icon {
  font-size: 12px;
  opacity: 0.9;
}

.menu-title {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .app-sidebar {
    position: fixed;
    left: 0;
    top: 64px;
    bottom: 0;
    z-index: 20;
  }
}
</style>
