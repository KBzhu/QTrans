# task_P5 - 认证模块

## 任务目标

实现完整的用户认证功能，包括登录页面、登录业务逻辑、以及 Demo 模式下的角色快速切换器。

## 前置依赖

- P3.1 Auth Store 已完成
- P4.2 路由守卫已完成
- P4.3 布局组件已完成

---

## 子任务清单

### P5.1 登录页面（3h）

- [ ] 创建 `src/views/auth/LoginView.vue`
  - 整体布局：左侧品牌展示区（背景图 + 系统名称 + 安全域示意图）+ 右侧登录表单区
  - 系统标题：「B端企业跨安全域大文件传输平台」
  - 安全域标记：顶部展示绿区/黄区/红区色块，传达系统背景
  - 表单字段：用户名（a-input）、密码（a-input-password）、记住我（a-checkbox）
  - 登录按钮：a-button type="primary" long，loading 状态绑定
  - 错误提示：a-alert type="error"，非空时显示登录失败原因
  - 快速体验入口：下方展示 Demo 账号列表（表格形式），点击即可一键填入
  - 响应式适配：移动端隐藏左侧品牌区，表单居中
- [ ] 样式文件 `src/views/auth/login.scss`
  - 左侧品牌区渐变背景（蓝色系，体现科技感）
  - 安全域色块：绿区 #00b42a / 黄区 #ff7d00 / 红区 #f53f3f
  - 登录卡片阴影、圆角

### P5.2 登录逻辑（2h）

- [ ] 创建 `src/composables/useLogin.ts`
  - `loginForm` - 响应式表单数据 `{ username, password, remember }`
  - `loginRules` - ArcoDesign 表单校验规则（用户名必填/密码必填）
  - `loading` - 登录请求 loading 状态
  - `errorMessage` - 登录错误信息
  - `handleLogin(formRef)` - 执行登录
    1. 调用 `formRef.validate()` 校验表单
    2. 调用 `authStore.login(username, password)`
    3. 成功：跳转 `/`（或 redirect query 参数指定的路由）
    4. 失败：设置 `errorMessage`，清空密码
  - `handleQuickLogin(user)` - 快速体验登录（填入表单 + 自动提交）
  - `handleRememberMe` - 持久化用户名到 localStorage
- [ ] 在 `LoginView.vue` 中接入 `useLogin` composable
- [ ] 登录成功后：
  - 清除 URL 中的 `redirect` query 参数
  - 根据角色跳转默认页面（submitter → /applications，approver → /approvals，admin → /dashboard）

### P5.3 角色切换器组件（Demo）（1h）

- [ ] 创建 `src/components/common/RoleSwitcher.vue`
  - 仅在 `import.meta.env.MODE === 'development'` 时渲染
  - 使用 `a-dropdown` 展示所有 Demo 账号列表
  - 触发按钮：显示当前用户名 + 角色徽标
  - 下拉列表项：用户名 + 姓名 + 角色标签（带颜色区分）
    - submitter：蓝色
    - approver1/2/3：橙色
    - admin：红色
  - 切换逻辑：调用 `authStore.switchUser(username, password)`，切换成功后 `router.push('/')`
  - 加载状态：切换中显示 spin
- [ ] 在 `AppHeader.vue` 中引入 `RoleSwitcher` 并放置在头部右侧区域（仅开发环境）
- [ ] 确保角色切换后，Pinia Store 状态、路由权限均正确更新

---

## 技术要点

### 表单校验规则示例
```typescript
const loginRules = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [
    { required: true, message: '请输入密码' },
    { minLength: 6, message: '密码长度不少于6位' }
  ]
}
```

### Demo 账号快速体验数据
```typescript
const demoAccounts = [
  { username: 'submitter', password: '123456', role: '提交人', name: '张三' },
  { username: 'approver1', password: '123456', role: '一级审批人', name: '李四' },
  { username: 'approver2', password: '123456', role: '二级审批人', name: '王五' },
  { username: 'approver3', password: '123456', role: '三级审批人', name: '赵六' },
  { username: 'admin',     password: '123456', role: '管理员',     name: '管理员' }
]
```

### 登录重定向逻辑
```typescript
// router/guards.ts 中设置 redirect
router.push({ name: 'Login', query: { redirect: to.fullPath } })

// LoginView 中处理 redirect
const redirect = route.query.redirect as string
router.push(redirect || getDefaultRouteByRole(authStore.currentUser?.roles))
```

---

## 验收标准

1. 输入正确账号密码可成功登录，跳转对应首页
2. 输入错误账号密码显示错误提示，不跳转
3. 未登录访问需鉴权页面，自动跳转登录页且携带 redirect 参数
4. 登录成功后 redirect 参数生效，跳转到原目标页
5. Demo 账号列表一键填入并自动登录正常
6. 角色切换器（开发模式）可快速切换账号
7. 页面响应式布局：1440px 宽屏 / 768px 平板 均正常显示

---

## 单元测试要求

- `useLogin.ts`：测试表单校验、成功跳转、失败提示
- `RoleSwitcher.vue`：测试角色切换后 store 状态变化
- 路由守卫：测试未登录重定向、登录后跳过 /login
