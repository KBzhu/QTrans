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

---

## P10.7 区域管理

### 开发说明

**路由入口**：`/region`（仅 admin 角色可见）

**主要文件**：

| 文件 | 说明 |
|------|------|
| `src/views/admin/RegionManageView.vue` | 主页面（双 Tab） |
| `src/views/admin/RegionManageModal.vue` | 城市映射 / 安全域共用弹窗 |
| `src/composables/useRegionManage.ts` | 状态管理与操作逻辑 |
| `src/api/regionManage.ts` | CRUD 接口（含 `getAllDomains` 下拉）|
| `src/mocks/handlers/regionManage.ts` | 完整 Mock（12条城市 + 4个安全域）|
| `src/views/region/index.vue` | 路由入口 |

**Mock 默认数据**：
- 安全域：绿区 `#00b42a`、黄区 `#ff7d00`、红区 `#f53f3f`、黑区 `#1d2129`（禁用）
- 城市：北京（红区）、上海（黄区）、深圳（绿区）等 12 条，覆盖中/日/美/英/法

**权限说明**：仅 `admin` 角色可访问 `/region` 路由。

**安全域代码**：新建时必须唯一，且只能含小写字母、数字、`-`、`_`；编辑时代码不可修改。

---

### QA 回归步骤（P10.7）

以 `admin` 账号登录，从侧边栏进入「区域管理」页面。

#### Tab1：城市与安全域映射

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 进入区域管理页面 | 默认显示「城市与安全域映射」Tab，加载 12 条城市映射数据，安全域列显示彩色标签 |
| 2 | 在搜索框输入「北京」后点击「查询」 | 列表筛选为北京，安全域显示红色「红区」标签 |
| 3 | 选择安全域下拉为「绿区」后点击「查询」 | 仅显示绿区城市（深圳、成都等） |
| 4 | 点击「重置」 | 筛选条件清空，列表恢复全量 |
| 5 | 点击「新增映射」 | 弹出「新增城市映射」弹窗，包含城市名称、国家、安全域（下拉）三个字段 |
| 6 | 不填任何内容点击「确定」 | 显示必填校验提示 |
| 7 | 填写城市名称「杭州」、国家「中国」、安全域「黄区」后点击「确定」 | 弹窗关闭，列表新增「杭州」一行 |
| 8 | 点击某条记录的「编辑」 | 弹出「编辑城市映射」弹窗，表单回填原有数据 |
| 9 | 修改安全域后点击「确定」 | 列表中该条安全域标签更新 |
| 10 | 点击某条记录的「删除」 | 弹出确认对话框，确认后该条从列表移除 |

#### Tab2：可选安全域配置

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 11 | 切换到「可选安全域配置」Tab | 显示 4 个安全域，黑区显示为禁用状态（Switch 关闭） |
| 12 | 点击黑区行的 Switch 开关 | 状态切换为启用，显示成功提示 |
| 13 | 点击「新增安全域」 | 弹出「新增安全域」弹窗，含名称、代码、颜色、描述、启用状态 |
| 14 | 点击任意预设颜色圆点 | 颜色输入框值同步更新，圆点高亮边框 |
| 15 | 填写名称「蓝区」、代码「blue」、颜色选蓝色后点击「确定」 | 列表新增「蓝区」，城市映射的安全域下拉可选到「蓝区」 |
| 16 | 尝试新增与已有代码相同的安全域（如代码 `green`） | 接口返回错误，弹窗保持打开并提示「安全域代码已存在」 |
| 17 | 编辑已有安全域 | 弹窗中安全域代码字段为只读（禁用状态） |
| 18 | 切换到非 admin 账号（如 submitter） | 侧边栏不显示「区域管理」菜单项，直接访问 `/region` 被重定向 |

## 7. 本轮测试命令（P10.7 后）

- `npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run test -- src/composables/__tests__/useRegionManage.spec.ts`
- 测试结果：**16 个用例全部通过**

---

## P10.8 传输通道管理

### 开发说明

**路由入口**：`/channels`（仅 admin 角色可见）

**主要文件**：

| 文件 | 说明 |
|------|------|
| `src/views/admin/ChannelManageView.vue` | 主页面（筛选+表格+分页） |
| `src/views/admin/ChannelManageModal.vue` | 通道新增/编辑弹窗 |
| `src/views/admin/ChannelServerModal.vue` | 服务器配置弹窗（transfer + 拖拽排序） |
| `src/composables/useChannelManage.ts` | 通道状态与操作逻辑 |
| `src/api/channelManage.ts` | 通道 CRUD + 服务器配置接口 |
| `src/mocks/handlers/channelManage.ts` | 通道与服务器 Mock 数据 |
| `src/views/channel/index.vue` | 路由入口 |

**核心能力**：
- 通道列表支持按名称/代码和状态筛选
- 通道支持新增/编辑/删除/启停切换
- 服务器配置弹窗支持：
  - 左右穿梭选择服务器（a-transfer）
  - 已选服务器拖拽调整优先级
  - 每台服务器端口和状态可单独配置

---

### QA 回归步骤（P10.8）

以 `admin` 账号登录，从侧边栏进入「传输通道管理」页面。

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 进入页面 | 列表显示通道名称、代码、加密配置、服务器数量、状态、创建时间 |
| 2 | 输入关键字 `default` 点击查询 | 仅显示匹配通道 |
| 3 | 状态筛选为「禁用」 | 仅显示禁用通道 |
| 4 | 点击「重置」 | 筛选条件清空，恢复全量列表 |
| 5 | 点击「新建通道」 | 打开弹窗，展示名称、代码、加密配置、描述、启用状态 |
| 6 | 不填必填字段直接提交 | 出现表单校验提示 |
| 7 | 新建通道（如 `华东高安全通道`）并提交 | 新通道出现在列表中 |
| 8 | 点击某通道「编辑」并修改描述 | 保存后列表数据更新 |
| 9 | 点击状态开关 | 通道状态在启用/禁用间切换并提示成功 |
| 10 | 点击「配置服务器」 | 弹出服务器配置弹窗，左侧可选服务器，右侧已选服务器 |
| 11 | 选择两台服务器后拖拽右侧顺序 | 优先级顺序即时变化（#1/#2） |
| 12 | 修改某服务器端口并禁用，点击确定 | 保存成功，列表服务器数量同步更新 |
| 13 | 点击某通道「删除」并确认 | 该通道从列表移除 |

## 8. 本轮测试命令（P10.8 后）

- `npm --prefix D:\VibeCoding\QTrans-0302new\qtrans-frontend run test -- src/composables/__tests__/useChannelManage.spec.ts`
- 测试结果：**12 个用例全部通过**

---

## P10.9 界面配置

### 开发说明

**路由入口**：`/ui-config`（仅 admin 角色可见）

**主要文件**：

| 文件 | 说明 |
|------|------|
| `src/views/admin/UIConfigView.vue` | 主页面（4 个 Tab） |
| `src/views/admin/ui-config.scss` | 界面配置页样式 |
| `src/composables/useUIConfig.ts` | 界面配置状态与操作逻辑 |
| `src/api/uiConfig.ts` | 界面配置接口（文本/卡片/i18n/按钮/导入导出） |
| `src/mocks/handlers/uiConfig.ts` | 界面配置 Mock 数据与接口实现 |
| `src/types/uiConfig.ts` | 界面配置类型定义 |
| `src/views/ui-config/index.vue` | 路由入口 |

**核心能力**：
- Tab1 文字内容配置：树形分组、选中编辑、单条保存
- Tab2 申请单卡片配置：新增/编辑/删除，顺序调整（上移/下移）
- Tab3 国际化配置：语言启停、翻译列表在线编辑与保存
- Tab4 按钮显隐配置：按钮 CRUD、角色权限、条件 JSON、状态切换
- 四类配置均支持 JSON 导入/导出

---

### QA 回归步骤（P10.9）

以 `admin` 账号登录，从侧边栏进入「界面配置」页面。

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 进入页面 | 默认显示「文字内容配置」Tab，左侧为模块树，右侧为编辑表单 |
| 2 | 点击任意文字配置节点（如 `login.title`） | 表单回填配置键、中文、英文、描述 |
| 3 | 修改中文文案并点击保存 | 提示保存成功，再次选中该节点显示更新后文案 |
| 4 | 点击「导出 JSON」 | 浏览器下载 `ui-config-text.json` |
| 5 | 切换到「申请单卡片配置」Tab | 展示卡片表格与新增按钮 |
| 6 | 点击「新增卡片」，填写名称/代码并保存 | 列表新增卡片记录 |
| 7 | 对某卡片点击「上移/下移」 | 卡片顺序更新 |
| 8 | 切换到「国际化配置」Tab | 展示语言列表与翻译编辑表格 |
| 9 | 切换语言为 `en-US`，修改翻译并点击保存翻译 | 提示保存成功，状态与进度刷新 |
| 10 | 切换到「按钮显隐配置」Tab | 展示按钮列表（名称、代码、页面、角色、状态） |
| 11 | 点击某按钮状态开关 | 状态在启用/禁用间切换并提示成功 |
| 12 | 点击「新增按钮」并填写信息保存 | 列表新增按钮配置 |
| 13 | 点击导入按钮，粘贴任意合法 JSON 并确认 | 提示导入成功（Mock 下重置为默认数据） |
| 14 | 切换到非 admin 账号 | 侧边栏不显示「界面配置」，直接访问 `/ui-config` 被拦截 |

## 9. 本轮测试命令（P10.9 后）

- `npm --prefix D:\VibeCoding\QTrans-0302new\qtrans-frontend run test -- src/composables/__tests__/useUIConfig.spec.ts`
- 测试结果：**12 个用例全部通过**
- `npm --prefix D:\VibeCoding\QTrans-0302new\qtrans-frontend run test:coverage`
- 覆盖率执行结果：**失败（存量问题：`useSystemConfig.spec.ts` 两个断言失败）**






