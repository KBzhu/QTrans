# P10 辅助模块 Quick Start

> 当前文档覆盖已完成的 `P10.3 消息中心` 和 `P10.4 用户管理`。`P10.1 Dashboard`、`P10.2 个人中心` 按当前任务安排暂缓，后续再补充到同一文档。

## 1. 模块概述

本轮已落地以下能力：

### P10.3 消息中心
- `/notifications` 从占位页切换为真实消息中心
- 标题区展示未读数量徽标
- 支持 `全部 / 未读 / 系统通知 / 审批通知 / 传输通知` 五类筛选
- 支持单条已读、全部已读、删除、清空已读
- 支持展开查看长消息内容
- 支持点击相关申请单跳转到 `/application/:id`
- 使用 `useIntersectionObserver` 实现滚动加载更多
- 顶部 `AppHeader` 未读角标在角色切换后自动刷新

### P10.4 用户管理
- `/users` 从占位页切换为真实用户管理页面
- 用户列表展示（用户名、姓名、邮箱、部门、角色、状态、创建时间）
- 筛选功能（用户名/姓名、角色、状态）
- 新建/编辑用户弹窗，表单校验
- 状态切换（启用/禁用）
- 重置密码功能，展示临时密码
- 删除用户功能，二次确认
- 角色标签多彩显示

## 2. 关键文件

### P10.3 消息中心
- `src/views/notification/NotificationListView.vue`
- `src/views/notification/notification-list.scss`
- `src/views/notifications/index.vue`
- `src/composables/useNotificationList.ts`
- `src/composables/__tests__/useNotificationList.spec.ts`
- `src/stores/notification.ts`
- `src/stores/__tests__/notification.spec.ts`
- `src/api/notification.ts`
- `src/mocks/handlers/notification.ts`
- `src/mocks/data/demo-init.ts`
- `src/components/common/AppHeader.vue`

### P10.4 用户管理
- `src/views/admin/UserManageView.vue`
- `src/views/admin/UserManageModal.vue`
- `src/views/admin/user-manage.scss`
- `src/views/users/index.vue`
- `src/composables/useUserManage.ts`
- `src/composables/__tests__/useUserManage.spec.ts`
- `src/api/user.ts`
- `src/mocks/handlers/user.ts`

## 3. 开发侧使用说明

### 3.1 页面入口

#### 消息中心
- 路由：`/notifications`
- 路由组件：`src/views/notifications/index.vue`
- 实际页面实现：`src/views/notification/NotificationListView.vue`

#### 用户管理
- 路由：`/users`
- 路由组件：`src/views/users/index.vue`
- 实际页面实现：`src/views/admin/UserManageView.vue`
- 权限：仅 admin 角色可访问

### 3.2 组合式能力

#### 消息中心
```ts
import { useNotificationList } from '@/composables/useNotificationList'

const {
  listData,
  unreadCount,
  loading,
  hasMore,
  activeTab,
  fetchList,
  handleTabChange,
  handleMarkRead,
  handleMarkAllRead,
  handleDelete,
  handleClearRead,
  loadMore,
} = useNotificationList()
```

说明：
- `fetchList()`：并行拉取申请单映射与当前账号消息
- `handleTabChange(tab)`：切换分类并重置滚动分页
- `loadMore()`：按 5 条/批次递增展示消息
- `handleClearRead()`：只清理当前账号的已读消息

#### 用户管理
```ts
import { useUserManage } from '@/composables/useUserManage'

const {
  listData,
  loading,
  filters,
  modalVisible,
  editingUser,
  isEditMode,
  modalTitle,
  roleOptions,
  statusOptions,
  fetchList,
  handleSearch,
  handleReset,
  handleCreate,
  handleEdit,
  handleSave,
  handleDelete,
  handleToggleStatus,
  handleResetPassword,
  getRoleName,
  getRoleColor,
} = useUserManage()
```

说明：
- `fetchList()`：按筛选条件加载用户列表
- `handleCreate()`：打开新建用户弹窗
- `handleEdit(user)`：打开编辑用户弹窗
- `handleSave(formData)`：保存用户（新建/编辑）
- `handleToggleStatus(user)`：切换用户启用/禁用状态
- `handleResetPassword(user)`：重置密码并展示临时密码

### 3.3 Store / API 扩展点

#### 消息中心 Store / API
当前通知 Store 已补齐：
- `markAsRead(id)`
- `markAllAsRead(userId)`
- `deleteNotification(id)`
- `clearRead(userId)`
- `addNotification(notification)`

Mock 接口已补齐：
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `DELETE /api/notifications/:id`
- `DELETE /api/notifications/read-items`

#### 用户管理 API
- `GET /api/users?keyword=&role=&department=&status=`
- `POST /api/users`
- `PUT /api/users/:id`
- `PUT /api/users/:id/status`
- `DELETE /api/users/:id`
- `PUT /api/users/:id/reset-password`

#### 系统配置 API
- `GET /api/system-config/:tab` - 获取指定Tab配置（transfer/approval/notification/storage）
- `PUT /api/system-config/:tab` - 更新指定Tab配置

### 3.4 角色切换验证

开发环境下可通过头部 `Demo` 角色切换器验证不同账号：

#### 消息中心
- `submitter`：可看到审批结果、传输通知、系统提醒
- `approver1 / approver2 / approver3`：可看到审批待办提醒
- `admin`：可看到系统公告与传输异常通知

#### 用户管理
- 只有 `admin` 角色可见 `/users` 页面
- 其他角色访问会被路由守卫拦截

#### 系统配置
- 只有 `admin` 角色可见 `/settings` 页面
- 其他角色访问会被路由守卫拦截

## 4. 当前限制

### P10.3 消息中心
- 无限滚动当前仍是前端分页切片，未接入真实后端分页接口
- 消息详情页尚未单独拆页，当前通过列表内展开查看长文本
- 站内消息仍以 Mock 数据 + 本地 Store 增量通知为主，后续如接真实消息服务需再补同步策略

### P10.4 用户管理
- 当前为 Mock 数据，用户列表无真实分页（前端筛选）
- 部门选择器当前使用静态树，后续可接真实部门 API
- 重置密码生成临时密码，实际项目需配合邮件/短信通知

### P10.5 系统配置
- 当前为 Mock 数据，配置保存仅存储在内存中
- 审批层级映射表包含11条默认规则，实际项目需支持动态增删改
- 通知配置的邮件/短信密钥当前明文存储，实际项目需加密处理
- 存储配置的清理策略当前仅为配置项，实际项目需配合定时任务执行

## 5. QA 回归步骤

### P10.3 消息中心

| 步骤 | 操作 | 预期结果 |
|---|---|---|
| 1 | 登录后点击头部通知图标进入 `/notifications` | 页面显示"消息中心"，右上角展示未读徽标 |
| 2 | 切换 `全部 / 未读 / 系统通知 / 审批通知 / 传输通知` Tab | 列表按分类即时过滤，数量标签同步变化 |
| 3 | 对未读消息点击"标记已读" | 该消息取消未读样式，头部未读数同步减少 |
| 4 | 点击"全部已读" | 当前账号消息全部转为已读，未读徽标归零 |
| 5 | 点击"清空已读" | 当前账号所有已读消息被清理，未读消息保留 |
| 6 | 点击某条消息的"相关申请单"链接 | 正常跳转到对应申请单详情页 |
| 7 | 保持 submitter 账号滚动到列表底部 | 自动加载更多消息，底部提示从"向下滚动加载更多消息"变为"没有更多消息了" |
| 8 | 在头部切换到 `admin` 或 `approver` 账号后再进入消息中心 | 消息列表与头部未读角标切换为当前账号的数据 |

### P10.4 用户管理

| 步骤 | 操作 | 预期结果 |
|---|---|---|
| 1 | 以 `admin` 账号登录，点击侧边栏"用户管理" | 进入 `/users` 页面，显示用户列表 |
| 2 | 在筛选区输入用户名关键词点击"查询" | 列表过滤显示匹配的用户 |
| 3 | 选择角色筛选为"管理员"，点击"查询" | 列表只显示 admin 角色用户 |
| 4 | 点击"重置"按钮 | 筛选条件清空，列表显示全部用户 |
| 5 | 点击"新建用户"按钮 | 弹出新建用户弹窗，表单为空 |
| 6 | 填写表单（用户名/姓名/邮箱/手机/部门/角色），点击"确定" | 弹窗关闭，列表新增用户，显示成功提示 |
| 7 | 点击某用户的"编辑"按钮 | 弹出编辑用户弹窗，表单回填用户信息 |
| 8 | 修改姓名/邮箱，点击"确定" | 弹窗关闭，列表更新，显示成功提示 |
| 9 | 点击某用户的状态 Switch 开关 | 用户状态在"启用"/"禁用"间切换，显示成功提示 |
| 10 | 点击某用户的"重置密码"按钮 | 弹出确认框，确认后显示临时密码弹窗 |
| 11 | 点击某用户的"删除"按钮 | 弹出确认框，确认后用户从列表移除，显示成功提示 |
| 12 | 切换到非 admin 账号（如 submitter） | 侧边栏不显示"用户管理"菜单项 |

### P10.5 系统配置

| 步骤 | 操作 | 预期结果 |
|---|---|---|
| 1 | 以 `admin` 账号登录，点击侧边栏"系统配置" | 进入 `/settings` 页面，默认显示"传输配置"Tab |
| 2 | 查看传输配置表单 | 显示6个配置项：最大文件大小(50GB)、最大文件数量(20)、分片大小(5MB)、最大并发数(3)、上传有效期(7天)、下载有效期(30天) |
| 3 | 修改"最大文件大小"为100，点击"保存" | 显示"传输配置保存成功"提示 |
| 4 | 切换到"审批配置"Tab | 显示审批层级映射表（11条规则）、超时时间(48h)、超时自动驳回开关 |
| 5 | 查看审批层级映射表 | 包含绿区/黄区/红区/跨国/例行等11种传输类型及对应审批层级 |
| 6 | 修改"审批超时时间"为72，点击"保存" | 显示"审批配置保存成功"提示 |
| 7 | 切换到"通知配置"Tab | 显示邮件配置（SMTP服务器、端口、发件人）、短信配置（服务商、模板）、事件触发配置 |
| 8 | 查看"通知触发事件"复选框组 | 默认勾选5个事件：申请单提交、审批通过、审批驳回、传输完成、下载就绪 |
| 9 | 修改邮件服务器地址，点击"保存" | 显示"通知配置保存成功"提示 |
| 10 | 切换到"存储配置"Tab | 显示4个配置项：草稿有效期(30天)、清理周期(7天)、临时文件保留(7天)、日志保留(180天) |
| 11 | 修改"草稿有效期"为60，点击"保存" | 显示"存储配置保存成功"提示 |
| 12 | 切换回"传输配置"Tab | 显示之前修改的配置值（100GB） |
| 13 | 切换到非 admin 账号（如 submitter） | 侧边栏不显示"系统配置"菜单项 |

## 6. 本轮测试命令

- `pnpm --dir "d:\VibeCoding\QTrans-0302new\qtrans-frontend" test:coverage`
- 测试结果：19 个测试文件，83 个用例全部通过

