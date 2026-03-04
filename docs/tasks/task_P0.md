# task_P0 - 工程初始化

> 对应需求：技术要求章节 9.1 技术栈 / 9.2 代码规范
> 前置依赖：无
> 预估工时：3h

---

## 任务目标

搭建符合技术规范的 Vue3 + TypeScript + Vite 项目骨架，配置完整的工程化工具链，创建标准目录结构。

---

## 子任务清单

### P0.1 项目脚手架搭建（0.5h）

- [ ] 使用 `pnpm create vite qtrans-frontend --template vue-ts` 初始化项目
- [ ] 验证项目可以正常 `pnpm dev` 启动
- [ ] 配置 `vite.config.ts` 路径别名 `@` → `src/`
- [ ] 配置 `tsconfig.json` `strict: true` 严格模式
- [ ] 更新 `index.html` 标题为 `QTrans - 跨安全域大文件传输平台`

**验收标准：** `pnpm dev` 正常启动，访问 `http://localhost:3000` 无报错

---

### P0.2 依赖安装与配置（1h）

- [ ] 安装 UI 组件库：`pnpm add @arco-design/web-vue`
- [ ] 安装路由：`pnpm add vue-router@4`
- [ ] 安装状态管理：`pnpm add pinia pinia-plugin-persistedstate`
- [ ] 安装 HTTP 客户端：`pnpm add axios`
- [ ] 安装 Mock 工具：`pnpm add -D msw`
- [ ] 安装 IndexedDB 封装：`pnpm add dexie`
- [ ] 安装工具库：`pnpm add lodash-es dayjs`
- [ ] 安装工具库类型：`pnpm add -D @types/lodash-es`
- [ ] 安装 ArcoDesign 按需引入插件：`pnpm add -D unplugin-vue-components unplugin-auto-import`
- [ ] 安装 SCSS：`pnpm add -D sass`
- [ ] 配置 `vite.config.ts` 中 ArcoDesign 按需引入

**验收标准：** 所有依赖安装成功，`pnpm dev` 正常运行

---

### P0.3 代码规范配置（0.5h）

- [ ] 安装 ESLint：`pnpm add -D eslint @antfu/eslint-config`
- [ ] 创建 `eslint.config.ts`，继承 antfu 规范配置
- [ ] 安装 Prettier：`pnpm add -D prettier`
- [ ] 创建 `.prettierrc.json`（`printWidth: 100, singleQuote: true, semi: false`）
- [ ] 安装 Husky：`pnpm add -D husky lint-staged`
- [ ] 执行 `npx husky init`，配置 `pre-commit` 钩子
- [ ] 配置 `package.json` 中 `lint-staged` 规则
- [ ] 在 `package.json` 添加 `lint` 和 `format` 脚本

**验收标准：** `pnpm lint` 无报错，提交代码时自动触发检查

---

### P0.4 目录结构创建（0.5h）

- [ ] 创建 `src/api/` 目录及 `index.ts`
- [ ] 创建 `src/assets/styles/` 目录及 `variables.scss`, `mixins.scss`, `global.scss`
- [ ] 创建 `src/components/common/` 目录
- [ ] 创建 `src/components/business/` 目录
- [ ] 创建 `src/composables/` 目录
- [ ] 创建 `src/layouts/` 目录
- [ ] 创建 `src/mocks/handlers/` 目录
- [ ] 创建 `src/mocks/data/` 目录
- [ ] 创建 `src/router/` 目录
- [ ] 创建 `src/stores/` 目录
- [ ] 创建 `src/types/` 目录
- [ ] 创建 `src/utils/` 目录
- [ ] 创建 `src/views/` 下所有页面目录（login/dashboard/transfer/applications/approvals/transfers/users/settings/logs/profile/notifications/error）
- [ ] 创建 `docs/tasks/` 目录

**验收标准：** 目录结构与 Design.md 章节 2.3 完全一致

---

### P0.5 环境变量配置（0.5h）

- [ ] 创建 `.env.development`
  ```
  VITE_APP_TITLE=QTrans开发环境
  VITE_API_BASE_URL=/api
  VITE_MOCK_ENABLED=true
  VITE_UPLOAD_CHUNK_SIZE=5242880
  ```
- [ ] 创建 `.env.production`
  ```
  VITE_APP_TITLE=QTrans
  VITE_API_BASE_URL=https://api.qtrans.com
  VITE_MOCK_ENABLED=false
  VITE_UPLOAD_CHUNK_SIZE=5242880
  ```
- [ ] 创建 `src/env.d.ts`，声明所有 `VITE_*` 环境变量的类型
- [ ] 在 `vite.config.ts` 中读取并使用环境变量

**验收标准：** `import.meta.env.VITE_MOCK_ENABLED` 类型推导正确

---

## 测试要求

```typescript
// P0 无需单元测试，验收方式：
// 1. pnpm dev 启动无报错
// 2. pnpm build 构建成功
// 3. pnpm lint 无 ESLint 错误
```

---

## 完成标志

- [ ] 所有子任务勾选完毕
- [ ] `pnpm dev` / `pnpm build` / `pnpm lint` 全部通过
- [ ] 目录结构符合规范
