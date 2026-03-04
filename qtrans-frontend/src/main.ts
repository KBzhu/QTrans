import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

async function bootstrap() {
  if (import.meta.env.DEV && import.meta.env.VITE_MOCK_ENABLED === 'true') {
    try {
      const { worker } = await import('./mocks/browser')
      await worker.start({
        onUnhandledRequest: 'bypass',
      })
    }
    catch (error) {
      console.error('MSW 启动失败:', error)
    }
  }

  createApp(App).mount('#app')
}

bootstrap()
