import { fileURLToPath, URL } from 'node:url'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appType = env.VITE_APP_TYPE || (mode.startsWith('admin') ? 'admin' : 'tenant')
  const appTitle = env.VITE_APP_TITLE || (appType === 'admin' ? 'QTrans-管理端' : 'QTrans-租户端')

  // 根据 appType 设置不同的文根和端口
  const base: Record<string, string> = {
    tenant: '/tenant/',
    admin: '/admin/',
  }
  const port: Record<string, number> = {
    tenant: 3000,
    admin: 3001,
  }
  const basePath = base[appType] || '/'
  const basePrefix = basePath.replace(/\/$/, '')

  function withBaseProxy(path: string, config: ProxyOptions): Record<string, ProxyOptions> {
    if (!basePrefix)
      return { [path]: config }

    return {
      [path]: config,
      [`${basePrefix}${path}`]: {
        ...config,
        rewrite: proxyPath => proxyPath.replace(new RegExp(`^${basePrefix}`), ''),
      },
    }
  }

  const proxy = {
    ...withBaseProxy('/api', {
      target: 'http://127.0.0.1:8087',
      changeOrigin: true,
      secure: false,
    }),
    ...withBaseProxy('/transWeb', {
      target: 'https://localhost.huawei.com:8110',
      changeOrigin: true,
      secure: false,
    }),
    ...withBaseProxy('/workflowService', {
      target: 'http://127.0.0.1:8109',
      changeOrigin: true,
      secure: false,
    }),
    ...withBaseProxy('/service', {
      target: 'http://127.0.0.1:8087',
      changeOrigin: true,
      secure: false,
    }),
    ...withBaseProxy('/commonService', {
      target: 'http://localhost.huawei.com:8104',
      changeOrigin: true,
      secure: false,
      headers: {
        Referer: 'http://localhost.huawei.com',
      },
    }),
    ...withBaseProxy('/user-center', {
      target: 'http://127.0.0.1:8087',
      changeOrigin: true,
      secure: false,
    }),
  }

  return {
    base: basePath,
    plugins: [
      vue(),
      AutoImport({
        resolvers: [ArcoResolver()],
        imports: ['vue', 'vue-router', 'pinia'],
        dts: 'src/auto-imports.d.ts',
      }),
      Components({
        resolvers: [ArcoResolver({ sideEffect: true })],
        dts: 'src/components.d.ts',
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: Number(env.VITE_DEV_PORT) || port[appType] || 3000,
      strictPort: true,
      proxy,
    },
    define: {
      __APP_TITLE__: JSON.stringify(appTitle),
    },
  }
})
