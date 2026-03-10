# P10 辅助模块 Quick Start

> 当前文档先覆盖已完成的 `P10.3 消息中心`。`P10.1 Dashboard`、`P10.2 个人中心` 按当前任务安排暂缓，后续再补充到同一文档。

## 1. 模块概述

本轮已落地以下能力：

- `/notifications` 从占位页切换为真实消息中心
- 标题区展示未读数量徽标
- 支持 `全部 / 未读 / 系统通知 / 审批通知 / 传输通知` 五类筛选
- 支持单条已读、全部已读、删除、清空已读
- 支持展开查看长消息内容
- 支持点击相关申请单跳转到 `/application/:id`
- 使用 `useIntersectionObserver` 实现滚动加载更多
- 顶部 `AppHeader` 未读角标在角色切换后自动刷新

## 2. 关键文件

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

## 3. 开发侧使用说明

### 3.1 页面入口

- 路由：`/notifications`
- 路由组件：`src/views/notifications/index.vue`
- 实际页面实现：`src/views/notification/NotificationListView.vue`

### 3.2 组合式能力

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

### 3.3 Store / API 扩展点

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

### 3.4 角色切换验证

开发环境下可通过头部 `Demo` 角色切换器验证不同账号消息：

- `submitter`：可看到审批结果、传输通知、系统提醒
- `approver1 / approver2 / approver3`：可看到审批待办提醒
- `admin`：可看到系统公告与传输异常通知

## 4. 当前限制

- 无限滚动当前仍是前端分页切片，未接入真实后端分页接口
- 消息详情页尚未单独拆页，当前通过列表内展开查看长文本
- 站内消息仍以 Mock 数据 + 本地 Store 增量通知为主，后续如接真实消息服务需再补同步策略

## 5. QA 回归步骤

| 步骤 | 操作 | 预期结果 |
|---|---|---|
| 1 | 登录后点击头部通知图标进入 `/notifications` | 页面显示“消息中心”，右上角展示未读徽标 |
| 2 | 切换 `全部 / 未读 / 系统通知 / 审批通知 / 传输通知` Tab | 列表按分类即时过滤，数量标签同步变化 |
| 3 | 对未读消息点击“标记已读” | 该消息取消未读样式，头部未读数同步减少 |
| 4 | 点击“全部已读” | 当前账号消息全部转为已读，未读徽标归零 |
| 5 | 点击“清空已读” | 当前账号所有已读消息被清理，未读消息保留 |
| 6 | 点击某条消息的“相关申请单”链接 | 正常跳转到对应申请单详情页 |
| 7 | 保持 submitter 账号滚动到列表底部 | 自动加载更多消息，底部提示从“向下滚动加载更多消息”变为“没有更多消息了” |
| 8 | 在头部切换到 `admin` 或 `approver` 账号后再进入消息中心 | 消息列表与头部未读角标切换为当前账号的数据 |

## 6. 本轮测试命令

- `pnpm --dir "d:\VibeCoding\QTrans-0302new\qtrans-frontend" test:coverage`
