import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        // P6: 应用管理模块 - utils
        'src/utils/format.ts',
        'src/utils/validate.ts',
        'src/utils/storage.ts',
        // P7: 文件管理模块 - utils + stores + composables
        'src/utils/file.ts',
        'src/stores/file.ts',
        'src/composables/useFileUpload.ts',
        // P8: 审批模块 - stores + composables
        'src/stores/approval.ts',
        'src/composables/useApprovalList.ts',
        'src/composables/useApprovalDetail.ts',
      ],
    },
  },
})
