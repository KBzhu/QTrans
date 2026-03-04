# task_P3 - 状态管理层

> 对应需求：设计文档 4. 状态管理设计
> 前置依赖：P1.1（类型定义）、P2.3（MSW Handlers）
> 预估工时：9h

---

## 任务目标

使用 Pinia 实现全局状态管理，配置 `pinia-plugin-persistedstate` 持久化关键状态，每个 Store 独立可测。

---

## 子任务清单

### P3.1 Auth Store（2h）

- [√] 创建 `src/stores/auth.ts`
- [√] 定义 state：`token`, `currentUser`
- [√] 实现 `login(username, password)` - 调用登录 API，存储 token 和 user
- [√] 实现 `logout()` - 清除 token 和 user，跳转登录页
- [√] 实现 `initAuth()` - 从 LocalStorage 恢复登录状态
- [√] 实现 `hasRole(role: UserRole): boolean`
- [√] 实现 `hasPermission(permission: string): boolean`
- [√] 计算属性：`isLoggedIn`, `userRoles`, `isAdmin`
- [√] 配置 `persist: { pick: ['token', 'currentUser'] }`

**单元测试：** 登录成功设置 token；登出清除 token；hasRole 返回正确布尔值

---

### P3.2 Application Store（2h）

- [√] 创建 `src/stores/application.ts`
- [√] 定义 state：`applications`, `currentApplication`, `drafts`, `total`, `loading`
- [√] 实现 `fetchApplications(params)` - 分页查询
- [√] 实现 `fetchApplicationDetail(id)` - 获取详情
- [√] 实现 `createApplication(data)` - 创建申请单
- [√] 实现 `updateApplication(id, data)` - 更新申请单
- [√] 实现 `deleteApplication(id)` - 删除申请单
- [√] 实现 `saveDraft(data)` - 保存草稿到 LocalStorage
- [√] 实现 `deleteDraft(id)` - 删除草稿
- [√] 实现 `submitApplication(id)` - 提交申请单（状态变为 pending_upload）
- [√] 配置 `persist: { pick: ['drafts'] }`

**单元测试：** saveDraft 正确写入；createApplication 后 applications 列表包含新数据

---

### P3.3 File Store（2h）

- [√] 创建 `src/stores/file.ts`
- [√] 定义 state：`files: Map<string, FileInfo>`, `uploadProgress: Map<string, UploadProgress>`, `transferProgress: Map<string, number>`, `uploadStatus: Map<string, UploadStatus>`
- [√] 实现 `addFile(fileInfo)` - 添加文件记录
- [√] 实现 `updateUploadProgress(fileId, progress, speed)` - 更新上传进度
- [√] 实现 `pauseUpload(fileId)` - 设置暂停状态
- [√] 实现 `resumeUpload(fileId)` - 恢复上传
- [√] 实现 `updateTransferProgress(fileId, progress)` - 更新传输进度
- [√] 实现 `removeFile(fileId)` - 删除文件记录
- [√] 实现 `getFilesByApplicationId(applicationId)` - 查询某申请单的文件列表
- [√] **不持久化**（传输进度为实时状态）

**单元测试：** updateUploadProgress 正确更新进度值；pauseUpload 后状态为 paused

---

### P3.4 Approval Store（2h）

- [√] 创建 `src/stores/approval.ts`
- [√] 定义 state：`pendingApprovals`, `approvalHistory`, `loading`
- [√] 实现 `fetchPendingApprovals()` - 获取待审批列表
- [√] 实现 `approve(id, comment)` - 审批通过
- [√] 实现 `reject(id, reason)` - 审批驳回
- [√] 实现 `skip(id, reason)` - 免审通过
- [√] 实现 `fetchApprovalHistory(applicationId)` - 查询审批历史
- [√] 计算属性：`pendingCount` - 待审批数量（用于角标）

**单元测试：** approve 后该条从 pendingApprovals 移除；pendingCount 返回正确数量

---

### P3.5 Notification Store（1h）

- [√] 创建 `src/stores/notification.ts`
- [√] 定义 state：`notifications`, `unreadCount`
- [√] 实现 `fetchNotifications()` - 获取通知列表
- [√] 实现 `markAsRead(id)` - 标记单条已读
- [√] 实现 `markAllAsRead()` - 全部已读
- [√] 实现 `addNotification(notification)` - 前端模拟新通知推送
- [√] 配置 `persist: { pick: ['notifications', 'unreadCount'] }`

**单元测试：** markAsRead 后 unreadCount 减 1；markAllAsRead 后 unreadCount 为 0

---

### P3.6 Store 统一导出（0.5h）

- [√] 创建 `src/stores/index.ts` - 统一导出所有 Store
- [√] 在 `src/main.ts` 中注册 pinia 和 `pinia-plugin-persistedstate`

---

## 测试要求

```typescript
// src/stores/__tests__/auth.spec.ts
describe('useAuthStore', () => {
  it('login sets token and currentUser', async () => {
    const store = useAuthStore(createPinia())
    await store.login('submitter', '123456')
    expect(store.token).toBeTruthy()
    expect(store.currentUser?.username).toBe('submitter')
    expect(store.isLoggedIn).toBe(true)
  })

  it('logout clears state', () => {
    const store = useAuthStore(createPinia())
    store.logout()
    expect(store.token).toBe('')
    expect(store.currentUser).toBeNull()
  })

  it('hasRole returns correct boolean', () => {
    const store = useAuthStore(createPinia())
    // 设置 currentUser...
    expect(store.hasRole('submitter')).toBe(true)
    expect(store.hasRole('admin')).toBe(false)
  })
})
```

---

## 完成标志

- [√] 所有子任务勾选完毕
- [√] 所有 Store 单元测试通过
- [√] pinia-plugin-persistedstate 持久化验证（刷新页面后状态恢复）
