# task_P11 - 测试与优化

## 任务目标

为核心功能编写单元测试和组件测试，并进行性能优化，确保代码质量和运行效率。

## 前置依赖

- P0~P10 所有模块已完成

---

## 子任务清单

### P11.1 单元测试（8h）

- [ ] 配置测试环境：
  - 确认 `vitest.config.ts` 配置正确（`environment: 'happy-dom'`）
  - 配置 `src/test/setup.ts`（全局 Mock 设置、MSW 集成）
  - 配置 MSW 在测试环境中的 server 模式（`setupServer` 而非 `setupWorker`）
- [ ] 工具函数测试 `src/utils/__tests__/`：
  - `format.test.ts`：测试 `formatFileSize`、`formatDateTime`、`formatTransferSpeed`
  - `validate.test.ts`：测试各类校验函数
  - `storage.test.ts`：测试 LocalStorage 工具函数
  - `file.test.ts`：测试文件工具函数（getFileIcon、isPreviewable）
- [ ] Store 测试 `src/stores/__tests__/`：
  - `auth.store.test.ts`：测试登录/登出/角色检查
  - `application.store.test.ts`：测试草稿管理 CRUD
  - `approval.store.test.ts`：测试审批操作（通过/驳回/免审）
  - `notification.store.test.ts`：测试通知已读/未读管理
- [ ] Composables 测试 `src/composables/__tests__/`：
  - `useLogin.test.ts`：测试登录流程、错误处理
  - `useApplicationForm.test.ts`：测试表单校验、步骤切换、草稿保存
  - `useFileUpload.test.ts`：测试文件分片、断点续传逻辑
  - `useTransferSimulator.test.ts`：测试传输模拟进度计算

### P11.2 组件测试（6h）

- [ ] 配置组件测试环境：
  - 安装 `@vue/test-utils`（Vite 项目中通常已包含）
  - 创建测试辅助工具 `src/test/helpers.ts`（createTestWrapper、mockRouter、mockPinia）
- [ ] 业务组件测试 `src/components/__tests__/`：
  - `FileUpload.test.ts`：
    - 文件拖拽/选择功能
    - 文件大小限制校验
    - 上传进度展示
    - 暂停/继续/取消操作
  - `TransferProgress.test.ts`：
    - 进度条渲染
    - 状态变化展示
    - 操作按钮响应
  - `ApprovalTimeline.test.ts`：
    - 时间线节点渲染
    - 不同状态样式
    - 审批意见展开/收起
  - `DepartmentSelector.test.ts`：
    - 部门树加载
    - 选择操作、v-model 绑定
  - `CitySelector.test.ts`：
    - 城市级联加载
    - 选择操作、v-model 绑定
- [ ] 页面组件测试 `src/views/__tests__/`：
  - `LoginView.test.ts`：
    - 表单渲染
    - 登录成功跳转
    - 登录失败提示
  - `ApplicationListView.test.ts`：
    - 列表数据渲染
    - 筛选功能
    - 分页功能
  - `ApprovalListView.test.ts`：
    - Tab 切换
    - 列表数据渲染

### P11.3 性能优化（4h）

- [ ] 路由懒加载优化：
  - 确认所有路由组件都使用动态 import（`() => import(...)`）
  - 按模块分组 chunk（`/* webpackChunkName: "auth" */` 注释）
  - 预加载关键路由（`router.push` 时预取下一页）
- [ ] 组件级别优化：
  - 列表页使用 `v-memo` 优化重复渲染（Table 行）
  - 大型表单使用 `shallowRef` 替代 `ref` 减少深度侦听
  - 频繁更新的传输进度使用 `markRaw` 避免响应式开销
  - 审批时间线组件使用 `v-once` 渲染历史记录部分（不会变化的数据）
- [ ] 虚拟滚动：
  - 长列表（>100条）使用 ArcoDesign `a-table` 的虚拟滚动（`:virtual-list-props`）
  - 消息中心使用 `@vueuse/core` 的 `useVirtualList`
- [ ] 图片和资源优化：
  - 所有静态图片使用 WebP 格式（如有）
  - 图标使用 ArcoDesign 内置图标，不引入额外图标库
  - 大型静态资源移至 CDN（仅配置，实际演示不涉及）
- [ ] Vite 构建优化（`vite.config.ts`）：
  - `build.rollupOptions.output.manualChunks` 分包策略：
    - `vendor`：vue + vue-router + pinia
    - `arco`：@arco-design/web-vue
    - `utils`：axios + dexie
  - `build.sourcemap: false`（生产环境）
  - `build.minify: 'terser'`
  - `terserOptions.compress.drop_console: true`（生产环境去除 console）

### P11.4 文档完善（2h）

- [ ] 更新 `docs/TaskList.md` 中所有模块的状态为「已完成」
- [ ] 创建 `src/README.md`（项目运行说明）：
  - 环境要求（Node.js >=18、pnpm >=8）
  - 安装依赖命令
  - 启动开发服务器命令
  - 构建命令
  - Demo 账号列表
  - 演示场景说明
- [ ] 在 `src/mocks/data/` 目录下确认所有 Mock 数据完整
- [ ] 在代码中关键位置添加 JSDoc 注释（Store、Composables、工具函数）

---

## 技术要点

### Vitest 配置
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/composables/**', 'src/stores/**', 'src/utils/**']
    }
  }
})
```

### MSW 测试服务器配置
```typescript
// src/test/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Vite 分包策略
```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['vue', 'vue-router', 'pinia'],
        arco: ['@arco-design/web-vue'],
        utils: ['axios', 'dexie', 'msw']
      }
    }
  }
}
```

### 虚拟滚动使用示例
```vue
<!-- 长列表虚拟滚动 -->
<a-table
  :data="listData"
  :virtual-list-props="{ height: 600 }"
  :pagination="false"
/>
```

---

## 验收标准

1. 单元测试：
   - 核心工具函数覆盖率 ≥ 90%
   - Store 测试覆盖率 ≥ 80%
   - Composables 测试覆盖率 ≥ 70%
   - 所有测试用例通过，无 Error
2. 组件测试：
   - 核心业务组件（FileUpload、TransferProgress、ApprovalTimeline）测试覆盖率 ≥ 60%
   - 所有测试用例通过
3. 性能优化：
   - 首屏加载时间 < 2s（本地开发服务器）
   - Lighthouse Performance 评分 ≥ 80
   - 长列表（100条）滚动流畅，无明显卡顿
4. 生产构建：
   - `pnpm build` 成功无报错
   - 产物 gzip 后总大小 < 1MB

---

## 执行命令

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview
```
