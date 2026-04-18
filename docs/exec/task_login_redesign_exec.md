# SSO 统一登录系统对接 - 执行记录

## 执行时间

- 初始执行: 2026-04-03（表单登录 UI 重设计）
- **重构为 SSO 回调中转**: 2026-04-16
- **最新更新**: 2026-04-17（logout redirect 修复 / roles 调整 / refreshToken 接口替换）

---

## 一、整体架构

### 核心设计原则

QTrans **不自行处理账号密码**，所有认证委托给外部统一 SSO 登录中心。

```
┌──────────────────────────────────────────────────────────────┐
│                     用户浏览器                               │
│                                                             │
│  ┌──────────┐   ①未登录拦截    ┌───────────┐                │
│  │ 业务页面  │ ─────────────→ │ /login 页面 │ (SSO回调中转)  │
│  └──────────┘                 └─────┬─────┘                │
│         ↑  ④跳转目标页              │ ③解析token            │
│         │                    ┌─────▼─────┐                │
│         └──────────────────── │ Auth Store │ ← 持久化到LS   │
│                               └───────────┘                │
└──────────────────────────────────────────────────────────────┘
          ↑ ②用户登录成功回调              │
          │                         ┌──────▼──────┐
┌─────────────────────────┐        │  统一SSO登录  │
│ https://10.90.37.157     │◄───────│   系统        │
│ /usercenter/login        │        └─────────────┘
└─────────────────────────┘
```

### 涉及文件清单

| 文件 | 职责 |
|------|------|
| `src/api/auth.ts` | SSO 常量定义、URL 构建、API 调用、字段映射 |
| `src/stores/auth.ts` | Pinia 状态管理（token/user/持久化/刷新/登出） |
| `src/composables/useLogin.ts` | SSO 回调处理逻辑（URL 解析 → 存 store → 跳转） |
| `src/router/guards.ts` | 路由守卫（认证检查、角色校验、appType 隔离） |
| `src/views/auth/LoginView.vue` | `/login` 页面 —— 纯 SSO 回调中转，无表单 |

---

## 二、各模块详细实现

### 2.1 API 层 (`src/api/auth.ts`)

#### 常量与类型

```typescript
// SSO 登录中心地址
export const SSO_LOGIN_URL = 'https://10.90.37.157/usercenter/login'

// SSO 回调 URL 参数名
export const SSO_TOKEN_PARAM = 'token'
export const SSO_USER_PARAMS = {
  userId: 'userId', account: 'account', name: 'name',
  email: 'email', deptCode: 'deptCode', groupName: 'groupName', isActive: 'isActive',
} as const
```

#### 字段映射函数 `mapSsoUserToUser()`

将 SSO 后端响应的 `userDO` 对象映射为前端内部 `User` 格式：

- `userDO.id`(number) → `user.id`(string)
- `userDO.account` → `user.username`
- `userDO.deptCode` → `user.department`
- `userDO.groupName` → `user.departmentName`
- roles: SSO 不返回角色 → 当前临时写死 `['admin']`（待后端接口就绪后改为动态获取）

> **注意**: 此函数被 `login()` 和 `refreshToken()` 两个方法调用，**不被 SSO 主流程调用**。

#### API 方法一览

| 方法 | 接口 | 用途 | 是否活跃 |
|------|------|------|---------|
| `login(params)` | POST `/service/v1/userCenter/authentication/login` | 旧方式登录（主流程不再使用） | 保留兼容 |
| `parseSsoCallback(query)` | 无接口（URL 参数解析） | **SSO 主流程** — 从 URL query 提取 token + 用户信息 | ✅ 核心 |
| `refreshToken()` | POST `/service/v1/userCenter/authentication/login` | 复用登录接口刷新 token | ✅ 每15分钟 |
| `logout()` | POST `/auth/logout` | 通知后端登出 | ✅ |
| `getProfile()` | GET `/auth/profile` | 获取当前用户详情 | 预留 |
| `suggestUser(keyWord)` | POST `/workflowService/.../suggestUser` | 人员模糊搜索 | ✅ |

#### `parseSsoCallback()` — SSO 主流程核心

```typescript
parseSsoCallback(query): LoginResponse {
  // 从 URL query 直接提取，无需任何 HTTP 请求
  token = query['token']
  user = {
    id: query['userId'], username: query['account'], name: query['name'],
    email: query['email'], department: query['deptCode'],
    departmentName: query['groupName'],
    roles: ['admin'],          // ← 临时写死 admin
    status: isActive === '0' ? 'disabled' : 'enabled',
  }
}
```

#### `refreshToken()` — Token 定时刷新

复用同一 SSO 登录接口：
```typescript
async refreshToken(): Promise<LoginResponse> {
  const res = await request.raw<SsoLoginResponse>(
    '/service/v1/userCenter/authentication/login'  // ← 与 login 同一接口
  )
  return { token: res.token, user: mapSsoUserToUser(res.userDO, ...) }
}
```

---

### 2.2 状态管理层 (`src/stores/auth.ts`)

#### 状态结构

```
state:
  token: string           // SSO token
  currentUser: User | null  // 完整用户对象（含 roles）
computed:
  isLoggedIn: boolean      // token && currentUser 同时存在
  userRoles: UserRole[]    // currentUser.roles || []
  isAdmin: boolean         // roles 包含 'admin'
```

#### 持久化配置

- **存储位置**: `localStorage`
- **Key 格式**: `auth:${VITE_APP_TYPE}` （如 `auth:tenant`、`auth:admin`）— 租户面/管理面隔离
- **持久化字段**: 仅 `token` 和 `currentUser`
- **自定义 Serializer**:
  - 序列化: token 存为 `STORAGE_KEYS.AUTH_TOKEN` 键，user JSON.stringify 为 `STORAGE_KEYS.USER_INFO` 键
  - 反序列化: 对应 key 取回并 parse
- **恢复时机**: `pinia-plugin-persistedstate` 在应用初始化时自动从 localStorage 恢复，路由守卫直接使用 `isLoggedIn` 无需手动 initAuth

#### 核心方法

| 方法 | 说明 |
|------|------|
| `redirectToSso(redirectPath?)` | `window.location.href` 跳转到 SSO 登录页，参数为 `redirectUrl=...`。默认取当前页面 URL |
| `login(params)` | 旧登录方式，调 `authApi.login()`。**主流程不再使用** |
| `loginBySsoCallback(query)` | 调 `authApi.parseSsoCallback()` 解析 URL 参数，存入 store |
| `logout()` | ①调 `/auth/logout` → ②暂停刷新定时器 → ③清理 store → ④构造 `/login?redirect=<首页>` 作为 callbackUrl → ⑤`redirectToSso()` 跳 SSO |
| `refreshToken()` | 调 `authApi.refreshToken()` 更新 token + currentUser；失败则自动 logout |

#### Token 自动刷新机制

```
useIntervalFn(refreshToken, 15分钟, { immediate: false })
  ↓
watch(isLoggedIn):
  true  → resumeRefresh()   // 登录后启动定时器
  false → pauseRefresh()    // 登出后停止定时器
```

- **间隔**: 15 分钟 (`TOKEN_REFRESH_INTERVAL`)
- **失败处理**: refresh 失败 → 自动调用 `logout()`

#### 权限控制

```typescript
permissionMap = {
  submitter:  ['application:create', 'application:update', 'application:submit'],
  approver1:  ['approval:handle', 'application:read'],
  approver2:  ['approval:handle', 'application:read'],
  approver3:  ['approval:handle', 'application:read'],
  admin:      ['*'],          // 全部权限
  partner:    ['application:read'],
  vendor:     ['application:read'],
  subsidiary: ['application:read'],
}

hasRole(role)       → userRoles.includes(role)
hasPermission(perm) → isAdmin ? true : permissionMap[role].includes(perm)
```

---

### 2.3 SSO 回调处理层 (`src/composables/useLogin.ts`)

#### 角色默认路由

```
getDefaultRouteByRole(roles):
  appType === 'admin'  → '/transfers'        // 管理面统一到传输管理
  submitter             → '/applications'     // 申请单列表
  approver*             → '/approvals'        // 审批管理
  admin                 → '/dashboard'        // 工作台
  其他                  → '/dashboard'        // 默认工作台
```

#### `handleSsoCallback()` — 核心流程

```
onMounted → handleSsoCallback()
  │
  ├─ URL 上没有 token？
  │     → 还没走 SSO，redirectToSso() 跳去登录页
  │
  ├─ 有 token（正常 SSO 回调）
  │     1. loading = true
  │     2. loginBySsoCallback(query) → 解析并存入 store
  │     3. router.replace 清除 URL 上所有 SSO 参数（token/userId/account/name/...）
  │     4. 有 redirect 参数？→ push(redirect)
  │        没有？→ push(getDefaultRouteByRole(roles))
  │     5. loading = false
  │
  └─ 异常
        1. 显示错误提示 "登录失败，请重新登录"
        2. 清除 URL 参数
        3. 1.5秒后 redirectToSso() 重新跳转登录
```

**清除的 URL 参数**: `[token, userId, account, name, email, deptCode, groupName, isActive]`

---

### 2.4 路由守卫 (`src/router/guards.ts`)

#### `setupRouterGuards(router)` — beforeEach 逻辑

```
进入任意路由 to:
  │
  ├─ 已登录 && to.path === '/login'?
  │     → redirect getDefaultHome()    // 已登录不放行到回调页
  │
  ├─ requiresAuth && 未登录?
  │     构造 /login?redirect=<to.fullPath>
  │     → redirectToSso(loginUrl)       // 带 redirectUrl 跳 SSO
  │     → return false                  // 阻止本次导航
  │
  ├─ meta.appType !== currentAppType 且非 shared?
  │     → redirect getDefaultHome()     // 多面隔离兜底
  │
  ├─ requiresAuth && 角色不匹配?
  │     → redirect '/403'               // 无权限页
  │
  └─ 设置 document.title
      → return true                     // 放行
```

#### 关键点

- **不需要手动 initAuth**: pinia 持久化插件在应用启动前已恢复 `token` 和 `currentUser`
- **return false**: 调用 `redirectToSso()` 后返回 `false` 阻止 Vue Router 导航，因为接下来是 `window.location.href` 整页跳转

---

### 2.5 LoginView.vue — SSO 回调中转页

**不是登录表单！** 这是一个纯状态展示 + 回调处理的中间页：

```vue
<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 状态1: 正在处理SSO回调 -->
      <a-spin v-if="loading" tip="正在登录..." />

      <!-- 状态2: SSO回调处理失败 -->
      <a-result v-else-if="errorMessage" status="error"
        :title="errorMessage" sub-title="即将跳转到统一登录系统..." />

      <!-- 状态3: 没有token，等待跳转到SSO -->
      <a-spin v-else tip="正在跳转到统一登录系统..." />
    </div>
  </div>
</template>

<script setup>
onMounted(() => handleSsoCallback())
</script>
```

三种 UI 状态对应 `handleSsoCallback()` 的三个分支。

---

## 三、完整请求链路图

### 3.1 正常登录流程

```
① 用户访问 /applications（requiresAuth=true）

② [guards.ts] 未登录 → 构造 URL:
   /login?redirect=/applications
   → redirectToSso()
   → window.location.href =
     https://10.90.37.157/usercenter/login?redirectUrl=
       https%3A%2F%2F...%2Ftenant%2Flogin%3Fredirect%3D%2Fapplications

③ 用户在 SSO 输入账号密码，登录成功

④ SSO 重定向回 QTrans:
   /login?token=abc123&userId=1&account=zhangsan&name=张三&email=xx@xx.com&...&redirect=/applications

⑤ [LoginView onMounted] → handleSsoCallback()
   → loginBySsoCallback(query) → parseSsoCallback() → 存入 store (pinia自动持久化)
   → router.replace({ path: '/login', query: {} })  // 清除敏感参数
   → router.push('/applications')  // 跳转到目标页

⑥ [guards.ts] isLoggedIn=true → 放行 → 用户看到申请单列表
```

### 3.2 Token 刷新流程（每15分钟）

```
[useIntervalFn] 触发 refreshToken()
  → authApi.refreshToken()
    → POST /service/v1/userCenter/authentication/login
    → mapSsoUserToUser(res.userDO) 映射字段
  → store.token = newToken
  → store.currentUser = newUser  (roles 仍为 ['admin'])
  → localStorage 自动同步
```

### 3.3 登出流程

```
用户点击"退出登录"
  → authStore.logout()
    ① POST /auth/logout  （通知后端，失败不阻断）
    ② pauseRefresh()      （停止定时刷新）
    ③ clearAuthState()    （清空 token + currentUser，LS同步清理）
    ④ 构造 callbackUrl:
       https://.../tenant/login?redirect=%2Fdashboard  (注意：指向 /login 而非根路径)
    ⑤ redirectToSso(callbackUrl)
       → window.location.href =
         https://10.90.37.157/usercenter/login?redirectUrl=...

⑥ 用户在 SSO 重新登录 → ④ 的完整回调链路 → 到达 /dashboard
```

> **重要**: logout 时 redirectUrl 必须指向 `/login` 页面（SSO 回调中转页），不能指向根路径。
> 因为根路径没有 SSO token 处理逻辑，会导致用户登录成功后卡在空白页。

### 3.4 页面刷新（已登录）

```
用户按 F5 或关闭标签页重新打开
  → 应用初始化
  → pinia-plugin-persistedstate 从 localStorage 恢复 token + currentUser
  → isLoggedIn = true
  → useIntervalFn resumeRefresh() 启动定时器
  → [guards.ts] 放行 → 正常使用
```

---

## 四、已知限制与待办

### 当前临时方案

| 项目 | 现状 | 待改进 |
|------|------|--------|
| 角色 (roles) | `parseSsoCallback` 和 `mapSsoUserToUser` 中都硬编码 `['admin']` | 后端角色接口就绪后改为动态获取 |
| refreshToken 接口 | 复用 `/service/v1/userCenter/authentication/login` | 后端提供专用 refresh 接口后替换 |
| SSO URL | 硬编码内网 IP `10.90.37.157` | 可考虑移至环境变量 |
| `authApi.login()` | 保留但标注"主流程不再使用" | 确认无调用后可删除 |

### 安全注意事项

- SSO 回调通过 URL query 传递 token，解析完成后必须立即通过 `router.replace` 清除参数
- token 和用户信息持久化在 localStorage（非 cookie），存在 XSS 风险，需保证前端无注入漏洞
- `isActive === '0'` 表示禁用用户，其他值均视为启用

---

## 五、变更历史

| 日期 | 变更内容 |
|------|---------|
| 2026-04-03 | 表单登录 UI 重设计（Tab切换、渐变背景等）—— 已废弃 |
| 2026-04-16 | 全面重构为 SSO 回调中转架构，移除自建登录表单 |
| 2026-04-17 | 修复 logout redirectUrl 指向问题（根路径 → /login）；roles 从 submitter 改为 admin（两处同步）；refreshToken 接口从 /auth/refresh 替换为 /service/v1/userCenter/authentication/login |
