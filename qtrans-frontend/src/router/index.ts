import { createRouter, createWebHistory } from 'vue-router'
import { setupRouterGuards } from './guards'
import { filteredRoutes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: filteredRoutes,
  scrollBehavior: () => ({ top: 0 }),
})

setupRouterGuards(router)

export default router
