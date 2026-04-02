import { setupWorker } from 'msw/browser'
import { initDemoData } from './data/demo-init'
import { handlers } from './handlers'

initDemoData()

// MSW 的 serviceWorker 注册需要从根路径加载脚本
// 当 Vite base 不为 '/' 时（如 /tenant/ 或 /admin/），
// 默认会在 base 路径下寻找 mockServiceWorker.js，但该文件实际在 public/ 根目录
// 因此显式指定从根路径加载
export const worker = setupWorker(...handlers, {
  serviceWorker: {
    url: '/mockServiceWorker.js',
  },
})
