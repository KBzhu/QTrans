# P3 Store 快速上手（Pinia）

> 目标：让你在 10 分钟内能用起来这一阶段的状态管理层（`Auth/Application/File/Approval/Notification`）。

## 1. 先确认启动条件

1. 安装依赖（已在项目中）：`pinia`、`pinia-plugin-persistedstate`
2. 入口已注册（`qtrans-frontend/src/main.ts`）：
   - 创建 `pinia`
   - `pinia.use(piniaPluginPersistedstate)`
   - `app.use(pinia)`

如果你是新同学，只要直接运行：

```bash
npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run dev
```

---

## 2. 文件结构（先记这个）

- Store：`qtrans-frontend/src/stores/*.ts`
- Store 统一导出：`qtrans-frontend/src/stores/index.ts`
- 业务 API：`qtrans-frontend/src/api/*.ts`
- 请求封装：`qtrans-frontend/src/utils/request.ts`

你在页面里只需要：
1) 引入 Store；2) 调 action；3) 读 state/getter。

---

## 3. 每个 Store 的最小用法

### 3.1 Auth（登录态/权限）

文件：`src/stores/auth.ts`

核心 state / getter：
- `token`
- `currentUser`
- `isLoggedIn`
- `userRoles`
- `isAdmin`

核心 action：
- `login(username, password)`
- `logout()`
- `initAuth()`
- `hasRole(role)`
- `hasPermission(permission)`

持久化：`persist.pick = ['token', 'currentUser']`

常见调用顺序：
1. 页面初始化：`initAuth()`
2. 登录页提交：`await login(...)`
3. 路由/按钮权限：`hasRole/hasPermission`

---

### 3.2 Application（申请单）

文件：`src/stores/application.ts`

核心 state：
- `applications`
- `currentApplication`
- `drafts`
- `total`
- `loading`

核心 action：
- `fetchApplications(params)`
- `fetchApplicationDetail(id)`
- `createApplication(data)`
- `updateApplication(id, data)`
- `deleteApplication(id)`
- `saveDraft(data)`
- `deleteDraft(id)`
- `submitApplication(id)`（内部将状态推进到 `pending_upload`）

持久化：`persist.pick = ['drafts']`

建议页面接入顺序：
1. 列表页先接 `fetchApplications`
2. 表单页接 `saveDraft` + `submitApplication`
3. 详情页接 `fetchApplicationDetail`

---

### 3.3 File（上传/传输进度）

文件：`src/stores/file.ts`

核心 state（均为 `Map`）：
- `files`
- `uploadProgress`
- `transferProgress`
- `uploadStatus`

核心 action：
- `addFile(fileInfo)`
- `updateUploadProgress(fileId, progress, speed)`
- `pauseUpload(fileId)` / `resumeUpload(fileId)`
- `updateTransferProgress(fileId, progress)`
- `removeFile(fileId)`
- `getFilesByApplicationId(applicationId)`

说明：该 Store **不持久化**，用于实时态。

---

### 3.4 Approval（审批）

文件：`src/stores/approval.ts`

核心 state / getter：
- `pendingApprovals`
- `approvalHistory`
- `loading`
- `pendingCount`

核心 action：
- `fetchPendingApprovals()`
- `approve(id, comment)`
- `reject(id, reason)`
- `skip(id, reason)`
- `fetchApprovalHistory(applicationId)`

接入建议：审批工作台先拉 `fetchPendingApprovals`，操作后依赖 `pendingCount` 自动刷新角标。

---

### 3.5 Notification（通知）

文件：`src/stores/notification.ts`

核心 state：
- `notifications`
- `unreadCount`

核心 action：
- `fetchNotifications(userId?)`
- `markAsRead(id)`
- `markAllAsRead(userId?)`
- `addNotification(notification)`

持久化：`persist.pick = ['notifications', 'unreadCount']`

---

## 4. API 对应关系（排障时很好用）

- `auth.ts` -> `/auth/*`
- `application.ts` -> `/applications*`
- `approval.ts` -> `/approvals*`
- `notification.ts` -> `/notifications*`

如果状态没更新，先看：
1. action 是否 `await` 接口
2. 返回结构是否符合当前 `request` 封装
3. 对应 handler 是否已在 MSW 中注册

---

## 5. 新增一个业务状态功能的推荐模板

1. 先在 `src/api/*.ts` 增加接口方法
2. 在对应 `src/stores/*.ts` 增加 action 与 state 更新
3. 若需跨页面保留，配置 `persist.pick`
4. 在 `src/stores/__tests__` 补用例

---

## 6. 本阶段最常见问题

### Q1：刷新后登录态丢失
- 确认 `main.ts` 已注册 `pinia-plugin-persistedstate`
- 确认 `auth` store 的 `persist.pick` 包含 `token/currentUser`

### Q2：草稿没保存
- 确认调用的是 `saveDraft` 而不是仅改本地表单状态
- 确认 `application` store 的 `persist.pick` 包含 `drafts`

### Q3：文件进度刷新后归零
- 这是预期行为：`file` store 是实时态，默认不持久化

### Q4：通知角标不对
- 检查是否调用 `markAsRead/markAllAsRead`
- 检查是否触发了 `recalculateUnreadCount`
