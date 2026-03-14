import { fileURLToPath, URL } from 'node:url'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
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
      port: 3000,
      strictPort: true,
      proxy: {
        // TransWebService 代理 - 上传下载服务
        '/transWeb': {
          target: 'https://localhost.huawei.com:8110',
          changeOrigin: true,
          secure: false, // 允许自签名证书
          // 如果后端路径不包含 /transWeb 前缀，取消下面的注释
          // rewrite: (path) => path.replace(/^\/transWeb/, ''),
        },
        // 通用 API 代理（如需要可配置）
        // '/api': {
        //   target: 'https://localhost.huawei.com:其他端口',
        //   changeOrigin: true,
        //   secure: false,
        // },
      },
    },
    define: {
      __APP_TITLE__: JSON.stringify(env.VITE_APP_TITLE || 'QTrans'),
    },
  }
})
