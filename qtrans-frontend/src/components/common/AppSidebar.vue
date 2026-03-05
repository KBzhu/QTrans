<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IconApps,
  IconCheckCircle,
  IconFile,
  IconFolder,
  IconHome,
  IconList,
  IconMenuFold,
  IconMenuUnfold,
  IconSend,
  IconSettings,
  IconUserGroup,
} from '@arco-design/web-vue/es/icon'
import type { UserRole } from '@/types'
import { menuRoutes, type AppRouteMeta } from '@/router/routes'
import { useAuthStore } from '@/stores'

const props = defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggleSidebar: []
}>()

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const iconMap: Record<string, Component> = {
  'icon-home': IconHome,
  'icon-file': IconFile,
  'icon-check-circle': IconCheckCircle,
  'icon-send': IconSend,
  'icon-folder': IconFolder,
  'icon-user-group': IconUserGroup,
  'icon-settings': IconSettings,
  'icon-list': IconList,
}

function routeMeta(meta: unknown): AppRouteMeta {
  return (meta || {}) as AppRouteMeta
}

function resolveIcon(icon?: string): Component {
  if (!icon)
    return IconApps

  return iconMap[icon] || IconApps
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
    <nav class="app-sidebar__menu">
      <button
        v-for="item in menuItems"
        :key="String(item.name)"
        class="menu-item"
        :class="{ active: route.path === item.path }"
        @click="jump(item.path)"
      >
        <component :is="resolveIcon(routeMeta(item.meta).icon)" class="menu-icon" />
        <span v-if="!props.collapsed" class="menu-title">{{ String(routeMeta(item.meta).title) }}</span>
      </button>
    </nav>

    <div class="app-sidebar__footer">
      <button class="collapse-trigger" @click="emit('toggleSidebar')">
        <component :is="props.collapsed ? IconMenuUnfold : IconMenuFold" class="menu-icon" />
      </button>
    </div>
  </aside>
</template>

<style scoped src="./styles/app-sidebar.scss"></style>
