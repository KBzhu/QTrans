import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { permissionDirective, roleDirective } from './directives/permission'
import '@arco-design/web-vue/es/message/style/css.js'
import '@arco-design/web-vue/es/modal/style/css.js'
import './assets/styles/index.scss'
import { assetPath, getBasePath } from '@/utils/path'

async function bootstrap() {

  if (import.meta.env.DEV && import.meta.env.VITE_MOCK_ENABLED === 'true') {
    try {
      const { worker } = await import('./mocks/browser')
      await worker.start({
        serviceWorker: {
          url: assetPath('/mockServiceWorker.js'),
          options: {
            scope: getBasePath(),
          },
        },
        onUnhandledRequest: 'bypass',
      })

    }
    catch (error) {
      console.error('MSW 启动失败:', error)
    }
  }

  const app = createApp(App)
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)

  app.use(pinia)
  app.use(router)

  app.directive('permission', permissionDirective)
  app.directive('role', roleDirective)

  app.mount('#app')
}

bootstrap()
