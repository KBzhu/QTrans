# task_P10 - 辅助模块

## 任务目标

实现 Dashboard 首页、个人中心、消息中心、用户管理、系统配置和日志审计等辅助管理功能。

## 前置依赖

- P3.5 Notification Store 已完成
- P4.3 布局组件已完成
- P5-P9 核心功能模块已完成

---

## 子任务清单

### P10.1 首页 Dashboard（4h）

- [ ] 创建 `src/views/dashboard/DashboardView.vue`
  - 根据用户角色展示不同 Dashboard 内容
  - **提交人角色（submitter）**：
    - 我的申请单统计卡片（4个）：总计/待审批/传输中/已完成
    - 最近申请单列表（5条，可跳转）
    - 快速操作区：「新建申请单」大按钮 + 7种传输类型快捷卡片
    - 待处理事项提示（草稿数量、待上传数量）
  - **审批人角色（approver1/2/3）**：
    - 审批统计卡片（4个）：待审批/今日已审批/本月已审批/总审批数
    - 待审批列表（5条，可跳转审批详情）
    - 审批趋势图（近7天，a-chart 折线图）
  - **管理员角色（admin）**：
    - 系统总览统计卡片（6个）：总申请单/传输中/已完成/今日新增/用户总数/存储使用量
    - 传输中列表（5条，可跳转）
    - 系统活动日志（最近10条）
    - 存储使用趋势图（近30天）
  - 欢迎语：「您好，${姓名}！今天是 ${日期}`
- [ ] 创建 `src/composables/useDashboard.ts`
  - `role` - 当前用户角色
  - `stats` - 统计数据
  - `recentList` - 最近数据列表
  - `fetchStats()` - 获取统计数据
  - `fetchRecentList()` - 获取最近数据
- [ ] 样式文件 `src/views/dashboard/dashboard.scss`
  - 统计卡片样式（阴影、圆角、图标）
  - 快速操作区网格布局

### P10.2 个人中心（2h）

- [ ] 创建 `src/views/user/ProfileView.vue`
  - 个人信息展示：
    - 头像（a-avatar，首字母生成）
    - 姓名、用户名、邮箱、手机号
    - 所属部门、角色标签
  - 编辑个人信息：
    - 姓名（a-input）
    - 邮箱（a-input）
    - 手机号（a-input）
    - 保存按钮
  - 修改密码区域：
    - 当前密码、新密码、确认新密码
    - 密码强度指示器
    - 保存按钮
  - 通知偏好设置：
    - 邮件通知（a-switch）
    - 短信通知（a-switch）
    - 站内信通知（a-switch）
- [ ] 创建 `src/composables/useProfile.ts`
  - `profileData` - 个人信息数据
  - `passwordForm` - 密码表单
  - `notifyPreference` - 通知偏好
  - `handleUpdateProfile()` - 更新个人信息
  - `handleChangePassword()` - 修改密码
  - `handleUpdateNotifyPreference()` - 更新通知偏好
- [ ] 样式文件 `src/views/user/profile.scss`

### P10.3 消息中心（3h）

- [√] 创建 `src/views/notification/NotificationListView.vue`
  - 页面标题：「消息中心」+ 未读数量徽标
  - Tab 切换：全部 / 未读 / 系统通知 / 审批通知 / 传输通知
  - 操作栏：全部已读 / 清空已读
  - 消息列表：
    - 每条消息展示：
      - 消息类型图标（不同类型不同颜色）
      - 消息标题（未读加粗）
      - 消息内容（截断，展开查看）
      - 相关申请单号（可点击跳转）
      - 时间（相对时间，hover展示完整时间）
      - 操作：标记已读、删除
    - 未读消息背景色浅蓝
  - 无限滚动加载（useIntersectionObserver）
- [√] 创建 `src/composables/useNotificationList.ts`
  - `listData` - 消息列表
  - `unreadCount` - 未读数量
  - `loading` - 加载状态
  - `hasMore` - 是否有更多
  - `activeTab` - 当前 Tab
  - `fetchList()` - 获取消息列表
  - `handleTabChange(tab)` - 切换 Tab
  - `handleMarkRead(id)` - 标记单条已读
  - `handleMarkAllRead()` - 全部已读
  - `handleDelete(id)` - 删除消息
  - `handleClearRead()` - 清空已读
  - `loadMore()` - 加载更多（无限滚动）
- [√] 样式文件 `src/views/notification/notification-list.scss`


### P10.4 用户管理（管理员）（4h）

- [√] 创建 `src/views/admin/UserManageView.vue`
  - 页面标题：「用户管理」
  - 顶部操作栏：新建用户按钮
  - 筛选区域：
    - 用户名/姓名（a-input）
    - 角色（a-select）
    - 部门（DepartmentSelector）
    - 状态（a-select：启用/禁用）
    - 查询按钮 + 重置按钮
  - 数据表格（a-table）：
    - 列：用户名、姓名、邮箱、部门、角色、状态、创建时间、操作
    - 角色列：使用 `a-tag` 展示不同颜色
    - 状态列：使用 `a-switch`（在线切换）
    - 操作列：编辑、重置密码、禁用/启用、删除
  - 分页器（a-pagination）
- [√] 创建 `src/views/admin/UserManageModal.vue`（新增/编辑用户弹窗）
  - 表单字段：用户名、姓名、邮箱、手机号、所属部门、角色（多选）、初始密码（新增时）
  - 表单校验
- [√] 创建 `src/composables/useUserManage.ts`
  - `listData` - 列表数据
  - `loading` - 加载状态
  - `pagination` - 分页参数
  - `filters` - 筛选条件
  - `modalVisible` - 弹窗显示状态
  - `editingUser` - 正在编辑的用户
  - `fetchList()` - 获取列表数据
  - `handleCreate()` - 新建用户
  - `handleEdit(user)` - 编辑用户
  - `handleDelete(id)` - 删除用户
  - `handleToggleStatus(id, status)` - 切换用户状态
  - `handleResetPassword(id)` - 重置密码
- [√] 样式文件 `src/views/admin/user-manage.scss`


### P10.5 系统配置（管理员）（3h）

- [√] 创建 `src/views/admin/SystemConfigView.vue`
  - 使用 `a-tabs` 分组展示配置项
  - **Tab1：传输配置**：
    - 单申请单最大文件大小（GB，默认50）
    - 最大文件数量（默认20）
    - 文件分片大小（MB，默认5）
    - 最大并发传输数（默认3）
    - 上传有效期默认值（天，默认7）
    - 下载有效期默认值（天，默认30）
  - **Tab2：审批配置**：
    - 各传输类型的审批层级配置（表格形式）
    - 审批超时时间（小时，默认48）
    - 超时自动驳回（a-switch）
  - **Tab3：通知配置**：
    - 邮件服务配置（SMTP 服务器、端口、发件人）
    - 短信服务配置（服务商、模板）
    - 通知触发事件配置（a-checkbox-group）
  - **Tab4：存储配置**：
    - 草稿有效期（天，默认30）
    - 存储清理周期（天）
  - 保存按钮（每个 Tab 独立保存）
- [√] 创建 `src/composables/useSystemConfig.ts`
  - `configData` - 配置数据
  - `loading` - 加载状态
  - `fetchConfig()` - 获取配置
  - `handleSave(tab)` - 保存配置
- [√] 样式文件 `src/views/admin/system-config.scss`
- [√] API 接口 `src/api/systemConfig.ts`
- [√] Mock 数据 `src/mocks/handlers/systemConfig.ts`
- [√] 更新路由 `src/views/settings/index.vue`
- [√] 单元测试 `src/composables/__tests__/useSystemConfig.spec.ts`


### P10.6 日志审计（管理员）（3h）

- [√] 创建 `src/views/admin/AuditLogView.vue`
  - 页面标题：「日志审计」
  - 筛选区域：
    - 操作类型（a-select：登录/申请单/文件/审批/传输/系统配置）
    - 操作用户（a-input）
    - 操作时间范围（a-range-picker）
    - IP地址（a-input）
    - 查询按钮 + 重置按钮
  - 数据表格（a-table）：
    - 列：操作时间、操作类型、操作用户、IP地址、操作详情、关联资源、操作结果
    - 操作类型列：使用 `a-tag` 展示不同颜色
    - 操作结果列：成功（绿色）/失败（红色）
    - 操作详情列：文字截断，可点击展开查看完整内容
  - 分页器（a-pagination）
  - 导出按钮（导出 CSV，仅 Mock 数据）
- [√] 创建 `src/composables/useAuditLog.ts`
  - `listData` - 列表数据
  - `loading` - 加载状态
  - `pagination` - 分页参数
  - `filters` - 筛选条件
  - `fetchList()` - 获取日志列表
  - `handleSearch()` - 搜索
  - `handleReset()` - 重置筛选
  - `handlePageChange()` - 翻页
  - `handleExport()` - 导出 CSV
- [√] 样式文件 `src/views/admin/audit-log.scss`
- [√] API 接口 `src/api/auditLog.ts`
- [√] Mock 数据 `src/mocks/handlers/auditLog.ts`
- [√] 更新路由入口 `src/views/logs/index.vue`
- [√] 单元测试 `src/composables/__tests__/useAuditLog.spec.ts`

### P10.7 区域管理（管理员）（3h）

- [√] 创建 `src/views/admin/RegionManageView.vue`
  - 页面标题：「区域管理」
  - 使用 `a-tabs` 分组展示
  - **Tab1：城市与安全域映射**：
    - 数据表格（a-table）：
      - 列：城市名称、国家、安全域、状态、操作
      - 安全域列：使用 `a-tag` 展示（绿区/黄区/红区）
      - 操作列：编辑、删除
    - 顶部操作栏：新增映射按钮
    - 分页器（a-pagination）
  - **Tab2：可选安全域配置**：
    - 数据表格（a-table）：
      - 列：安全域名称、安全域代码、颜色标识、描述、启用状态、操作
      - 启用状态列：使用 `a-switch`（在线切换）
      - 操作列：编辑、删除
    - 顶部操作栏：新增安全域按钮
- [√] 创建 `src/views/admin/RegionManageModal.vue`（新增/编辑弹窗）
  - 城市映射表单字段：城市名称、国家、安全域（下拉选择）
  - 安全域配置表单字段：安全域名称、安全域代码、颜色标识（颜色选择器）、描述、启用状态
  - 表单校验
- [√] 创建 `src/composables/useRegionManage.ts`
  - `cityListData` - 城市映射列表
  - `domainListData` - 安全域列表
  - `loading` - 加载状态
  - `pagination` - 分页参数
  - `modalVisible` - 弹窗显示状态
  - `editingItem` - 正在编辑的项
  - `activeTab` - 当前 Tab
  - `fetchCityList()` - 获取城市映射列表
  - `fetchDomainList()` - 获取安全域列表
  - `handleCreateCity()` - 新增城市映射
  - `handleEditCity(item)` - 编辑城市映射
  - `handleDeleteCity(id)` - 删除城市映射
  - `handleCreateDomain()` - 新增安全域
  - `handleEditDomain(item)` - 编辑安全域
  - `handleDeleteDomain(id)` - 删除安全域
  - `handleToggleDomainStatus(id, status)` - 切换安全域启用状态
- [√] 样式文件 `src/views/admin/region-manage.scss`
- [√] API 接口 `src/api/regionManage.ts`
- [√] Mock 数据 `src/mocks/handlers/regionManage.ts`
- [√] 更新路由 `src/views/region/index.vue` + `src/router/routes.ts`
- [√] 单元测试 `src/composables/__tests__/useRegionManage.spec.ts`（16 个用例全通过）

### P10.8 传输通道管理（管理员）（4h）

- [ ] 创建 `src/views/admin/ChannelManageView.vue`
  - 页面标题：「传输通道管理」
  - 顶部操作栏：新建通道按钮
  - 数据表格（a-table）：
    - 列：通道名称、通道代码、加密配置、服务器数量、状态、创建时间、操作
    - 加密配置列：使用 `a-tag-group` 展示（数据加密/RMS加密/资产检测）
    - 状态列：使用 `a-switch`（在线切换）
    - 操作列：编辑、配置服务器、删除
  - 分页器（a-pagination）
- [√] 创建 `src/views/admin/ChannelManageModal.vue`（新增/编辑通道弹窗）
  - 表单字段：
    - 通道名称
    - 通道代码
    - 加密配置（a-checkbox-group）：数据加密、RMS加密、资产检测
    - 描述
    - 启用状态
  - 表单校验
- [ ] 创建 `src/views/admin/ChannelServerModal.vue`（配置服务器弹窗）
  - 服务器列表（a-transfer）：
    - 左侧：可选服务器列表
    - 右侧：已选服务器列表
    - 支持搜索、批量选择
  - 已选服务器配置：
    - 服务器IP
    - 服务器端口
    - 优先级（拖拽排序）
    - 状态（启用/禁用）
- [√] 创建 `src/composables/useChannelManage.ts`
  - `listData` - 通道列表
  - `loading` - 加载状态
  - `pagination` - 分页参数
  - `modalVisible` - 弹窗显示状态
  - `serverModalVisible` - 服务器配置弹窗显示状态
  - `editingChannel` - 正在编辑的通道
  - `currentChannelId` - 当前配置服务器的通道ID
  - `fetchList()` - 获取通道列表
  - `handleCreate()` - 新建通道
  - `handleEdit(channel)` - 编辑通道
  - `handleDelete(id)` - 删除通道
  - `handleToggleStatus(id, status)` - 切换通道状态
  - `handleConfigServer(channelId)` - 打开服务器配置弹窗
  - `handleSaveServers(channelId, servers)` - 保存服务器配置
- [√] 样式文件 `src/views/admin/channel-manage.scss`

### P10.9 界面配置（管理员）（5h）

- [ ] 创建 `src/views/admin/UIConfigView.vue`
  - 页面标题：「界面配置」
  - 使用 `a-tabs` 分组展示配置项
  - **Tab1：文字内容配置**：
    - 树形结构展示（a-tree）：
      - 按模块分组（登录、首页、申请单、审批、传输、下载、通知、用户管理等）
      - 每个节点显示：配置键、当前文字内容
      - 点击节点展开编辑表单
    - 编辑表单：
      - 配置键（只读）
      - 中文文字（a-input）
      - 英文文字（a-input）
      - 描述（a-textarea）
    - 批量导入/导出按钮（JSON格式）
  - **Tab2：申请单卡片配置**：
    - 卡片列表（可拖拽排序）：
      - 卡片名称
      - 卡片代码
      - 显示顺序
      - 是否必填
      - 启用状态（a-switch）
      - 操作：编辑、删除
    - 新增卡片按钮
    - 卡片编辑表单：
      - 卡片名称
      - 卡片代码
      - 显示顺序
      - 是否必填
      - 字段配置（JSON编辑器）
      - 启用状态
  - **Tab3：国际化配置**：
    - 语言列表：
      - 语言名称（中文/English）
      - 语言代码（zh-CN/en-US）
      - 启用状态（a-switch）
      - 翻译完成度（进度条）
      - 操作：编辑翻译、导入、导出
    - 翻译编辑器（a-table）：
      - 列：配置键、中文、英文、状态
      - 支持在线编辑
      - 支持批量导入/导出
  - **Tab4：按钮显隐配置**：
    - 按钮列表（a-table）：
      - 列：按钮名称、按钮代码、所属页面、角色权限、显示条件、启用状态、操作
      - 角色权限列：使用 `a-tag-group` 展示
      - 启用状态列：使用 `a-switch`
      - 操作列：编辑、删除
    - 新增按钮配置
    - 按钮编辑表单：
      - 按钮名称
      - 按钮代码
      - 所属页面（下拉选择）
      - 角色权限（多选）
      - 显示条件（JSON编辑器）
      - 启用状态
  - 保存按钮（每个 Tab 独立保存）
- [ ] 创建 `src/composables/useUIConfig.ts`
  - `textConfigData` - 文字内容配置数据
  - `cardConfigData` - 申请单卡片配置数据
  - `i18nConfigData` - 国际化配置数据
  - `buttonConfigData` - 按钮显隐配置数据
  - `loading` - 加载状态
  - `activeTab` - 当前 Tab
  - `selectedNode` - 选中的树节点
  - `editingItem` - 正在编辑的项
  - `fetchTextConfig()` - 获取文字内容配置
  - `fetchCardConfig()` - 获取申请单卡片配置
  - `fetchI18nConfig()` - 获取国际化配置
  - `fetchButtonConfig()` - 获取按钮显隐配置
  - `handleSaveTextConfig(key, data)` - 保存文字内容配置
  - `handleSaveCardConfig(data)` - 保存申请单卡片配置
  - `handleSaveI18nConfig(lang, data)` - 保存国际化配置
  - `handleSaveButtonConfig(data)` - 保存按钮显隐配置
  - `handleImportConfig(type, file)` - 导入配置
  - `handleExportConfig(type)` - 导出配置
  - `handleCardSort(newOrder)` - 卡片排序
- [ ] 样式文件 `src/views/admin/ui-config.scss`

---
---

## 技术要点

### Dashboard 统计卡片组件
```vue
<!-- src/components/business/StatCard.vue -->
<template>
  <a-card class="stat-card" :bordered="false">
    <div class="stat-card__content">
      <div class="stat-card__icon" :style="{ background: iconBg }">
        <component :is="icon" :size="24" />
      </div>
      <div class="stat-card__info">
        <div class="stat-card__value">{{ value }}</div>
        <div class="stat-card__label">{{ label }}</div>
      </div>
    </div>
    <div v-if="trend" class="stat-card__trend">
      <icon-arrow-rise v-if="trend > 0" style="color: #00b42a" />
      <icon-arrow-fall v-else style="color: #f53f3f" />
      <span :class="trend > 0 ? 'up' : 'down'">{{ Math.abs(trend) }}%</span>
      <span class="period">较上月</span>
    </div>
  </a-card>
</template>
```

### 无限滚动实现
```typescript
// 使用 VueUse 的 useIntersectionObserver
import { useIntersectionObserver } from '@vueuse/core'

const loadMoreRef = ref<HTMLElement>()

useIntersectionObserver(loadMoreRef, ([{ isIntersecting }]) => {
  if (isIntersecting && hasMore.value && !loading.value) {
    loadMore()
  }
})
```

### CSV 导出工具
```typescript
// src/utils/export.ts
export const exportToCsv = (data: any[], filename: string) => {
  if (!data.length) return

  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row => Object.values(row).join(','))
  const csvContent = [headers, ...rows].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
```

---

## 验收标准

1. Dashboard：
   - 不同角色展示对应 Dashboard 内容
   - 统计数据正常加载
   - 快速操作跳转正常
2. 个人中心：
   - 个人信息展示和编辑正常
   - 密码修改校验（新密码不能与旧密码相同）
3. 消息中心：
   - 消息列表正常加载
   - 未读消息有视觉区分
   - 已读/全部已读/删除操作正常
   - 无限滚动正常触发
4. 用户管理（管理员）：
   - 列表加载、筛选、分页正常
   - 新增/编辑用户弹窗正常
   - 状态切换、重置密码操作正常
5. 系统配置（管理员）：
   - 各 Tab 配置项正常展示和保存
6. 日志审计（管理员）：
   - 列表加载、筛选、分页正常
   - CSV 导出正常
7. 区域管理（管理员）：
   - 城市与安全域映射列表正常加载
   - 安全域配置列表正常加载
   - 新增/编辑/删除操作正常
   - 状态切换正常
8. 传输通道管理（管理员）：
   - 通道列表正常加载
   - 加密配置展示正常
   - 服务器配置弹窗正常
   - 服务器列表拖拽排序正常
9. 界面配置（管理员）：
   - 文字内容配置树形结构展示正常
   - 申请单卡片配置拖拽排序正常
   - 国际化配置编辑正常
   - 按钮显隐配置正常
   - 导入/导出功能正常

---

## 单元测试要求

- `useDashboard.ts`：测试角色判断、数据加载
- `useNotificationList.ts`：测试消息操作、未读统计
- `useUserManage.ts`：测试 CRUD 操作
- `useAuditLog.ts`：测试列表加载、导出
- `useRegionManage.ts`：测试城市映射、安全域配置 CRUD
- `useChannelManage.ts`：测试通道 CRUD、服务器配置
- `useUIConfig.ts`：测试各类配置的加载、保存、导入导出
- `exportToCsv` 工具函数：测试 CSV 生成
