# task_P5 执行记录 - 认证模块

## 执行概览

| 项目 | 内容 |
|------|------|
| 任务来源 | `docs/tasks/task_P5.md` |
| Figma 来源 | `.codebuddy/figma/3971_1023/figma.html` |
| 差异文档 | `docs/diff/P5_Figma_Doc_Diff.md` |
| 执行状态 | ✅ 全部完成 |
| 构建验证 | vue-tsc ✅ / vite build ✅ |

---

## 执行进度

### P5.1 登录页面

- [√] 创建 `src/views/auth/LoginView.vue` — 按 Figma 还原居中卡片布局
- [√] 创建 `src/views/auth/login.scss` — 独立样式文件，复用 mixins
- [√] 底部 Demo 快速体验账号表格（a-table，点击行一键登录）
- [√] 响应式适配（768px 断点，移动端缩小 padding/字号）
- [√] 错误提示（a-alert type="error"，可关闭）
- [√] 路由迁移：`/login` 从 `login/index.vue` → `auth/LoginView.vue`

### P5.2 登录逻辑

- [√] 创建 `src/composables/useLogin.ts`
  - loginForm（reactive）/ loginRules / loading / errorMessage
  - handleLogin(formRef) — 校验 + 登录 + 按角色跳转
  - handleQuickLogin(account) — 一键填入 + 自动提交
  - handleRememberMe — localStorage 持久化用户名
- [√] LoginView 中接入 useLogin composable
- [√] 角色跳转规则：submitter→/applications，approver*→/approvals，admin→/dashboard
- [√] redirect 查询参数优先跳转

### P5.3 角色切换器组件（Demo）

- [√] 创建 `src/components/common/RoleSwitcher.vue`（仅 development 渲染）
- [√] 创建 `src/components/common/styles/role-switcher.scss`
- [√] 替换 AppHeader 中旧的 `<select>` 切换器为 RoleSwitcher（a-dropdown）
- [√] 角色标签颜色：submitter 蓝 / approver 橙 / admin 红
- [√] 切换中显示 a-spin 加载态
- [√] 切换后 authStore 状态 + 路由权限正确更新

### P5.4 资源与验证

- [√] Figma SVG 同步到 `public/figma/3971_1023/`（1.svg / 2.svg / 3.svg）
- [√] vue-tsc --noEmit 通过
- [√] vite build 通过（4.33s）
- [√] CHANGELOG 已更新
- [√] task_P5.md 已勾选

---

## 验收结果

| # | 验收标准 | 结果 |
|---|---------|------|
| 1 | 正确账号密码可登录，跳转对应首页 | ✅ |
| 2 | 错误账号密码显示错误提示，不跳转 | ✅ |
| 3 | 未登录访问鉴权页，跳转登录页带 redirect | ✅ |
| 4 | 登录后 redirect 参数生效 | ✅ |
| 5 | Demo 账号一键登录 | ✅ |
| 6 | 角色切换器快速切换 | ✅ |
| 7 | 响应式布局正常 | ✅ |

---

## 产出文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/views/auth/LoginView.vue` | 新增 | 登录页面（Figma 还原） |
| `src/views/auth/login.scss` | 新增 | 登录页独立样式 |
| `src/composables/useLogin.ts` | 新增 | 登录逻辑 composable |
| `src/components/common/RoleSwitcher.vue` | 新增 | 角色切换器组件 |
| `src/components/common/styles/role-switcher.scss` | 新增 | 角色切换器样式 |
| `src/router/routes.ts` | 修改 | 登录路由指向 auth/LoginView |
| `src/components/common/AppHeader.vue` | 修改 | 引入 RoleSwitcher 替换旧切换器 |
| `src/components/common/styles/app-header.scss` | 修改 | 移除旧 role-switcher 样式 |
| `public/figma/3971_1023/` | 新增 | Figma SVG 资源 |

---

## 执行中遇到的问题

本次执行未遇到构建或类型错误，无需写入 failedLog.md。
