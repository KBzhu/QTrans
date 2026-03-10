# P9 传输模块 Quick Start

> 当前 `P9.1 / P9.2 / P9.3` 已全部完成，可直接演示传输详情、自动传输与管理员传输管理页。

## 1. 模块概述

本轮已打通以下链路：

- 新增 `TransferProgress.vue` 统一展示传输状态、进度、速度、剩余时间与操作按钮
- `ApplicationDetailView.vue`、`ApprovalDetailView.vue` 在 `approved / transferring / completed` 状态下可展示传输进度
- 最后一级审批通过后自动开始传输模拟
- 管理员免审后自动开始传输模拟
- File Store 统一维护传输状态（开始/暂停/继续/重试）
- 新增管理员传输管理页，支持 Tab、筛选、分页、单条/批量暂停继续与失败重试
- 传输完成后自动把申请单状态更新为 `completed`
- 传输完成后给申请人和下载人写入站内通知

## 2. 关键文件

- `src/components/business/TransferProgress.vue`
- `src/components/business/TransferProgress.scss`
- `src/components/business/__tests__/TransferProgress.spec.ts`
- `src/composables/useTransferSimulator.ts`
- `src/composables/useTransferManage.ts`
- `src/composables/__tests__/useTransferManage.spec.ts`
- `src/composables/useApprovalDetail.ts`
- `src/stores/file.ts`
- `src/views/application/ApplicationDetailView.vue`
- `src/views/approvals/ApprovalDetailView.vue`
- `src/views/transfer/TransferManageView.vue`
- `src/views/transfer/transfer-manage.scss`
- `src/views/transfers/index.vue`
- `src/types/file.ts`

## 3. 开发侧使用说明

### 3.1 在详情页接入传输进度组件

```vue
<TransferProgress
  :application-id="detailData.id"
  :file-size="transferFileSize"
  :status-hint="transferStatusHint"
/>
```

关键参数：

- `applicationId`：申请单 ID，用于关联 File Store 内的实时传输状态
- `fileSize`：总文件大小（字节），用于 fallback 展示
- `statusHint`：当实时状态尚未建立时的兜底状态，当前详情页使用 `pending / transferring / completed`
- `autoStart`：如需页面挂载后直接开始传输，可传 `true`

事件：

- `complete()`：传输完成时触发
- `error(error)`：传输异常时触发

### 3.2 管理员传输管理页

路由入口：`/transfers`

页面能力：

- Tab：`传输中 / 异常`、`已完成`、`全部`
- 筛选：申请单号、传输类型、申请人、传输时间范围
- 列表：申请单号、传输类型、申请人、文件大小、进度、速度、状态、操作
- 操作：暂停、继续、重试、查看详情
- 批量：批量暂停、批量继续

### 3.3 直接从 File Store 启动 / 控制传输

```ts
import { useFileStore } from '@/stores'

const fileStore = useFileStore()

await fileStore.startTransfer(applicationId)
fileStore.pauseTransfer(applicationId)
fileStore.resumeTransfer(applicationId)
await fileStore.retryTransfer(applicationId)
```

### 3.4 获取当前传输状态

```ts
const state = fileStore.getTransferStateByApplicationId(applicationId)
// state?.status => pending / transferring / paused / completed / error
// state?.progress => 0 ~ 100
// state?.speedBytesPerSec => 当前字节速度
// state?.remainingSeconds => 预计剩余秒数
```

### 3.5 审批详情页自动触发

当前 `useApprovalDetail.ts` 已接入：

- 最后一级 `handleApprove()` -> `fileStore.startTransfer(id)`
- `handleExempt()` -> `fileStore.startTransfer(id)`

因此只要审批流走到最后一级，或管理员执行免审，就会自动进入传输模拟。

## 4. 当前限制

- 传输实时状态当前仍以内存态为主，刷新页面后不会恢复到精确的中间进度
- 通知目前以站内通知为主，后续如需对接真实消息渠道，再扩展通知 API 即可
- 传输管理页当前基于前端 Mock / Store 聚合，不含真实后端任务日志

## 5. QA 回归步骤

| 步骤 | 操作 | 预期结果 |
|---|---|---|
| 1 | 打开一个状态为 `approved / transferring / completed` 的申请单详情 | 页面出现 `TransferProgress` 区块，展示状态/进度/速度/剩余时间 |
| 2 | 对 `approved` 状态点击“开始传输” | 组件状态切到 `传输中`，按钮变为“暂停传输” |
| 3 | 点击“暂停传输”后再点击“继续传输” | 组件状态依次变为 `已暂停`、`传输中` |
| 4 | 以管理员身份进入 `/transfers` | 页面展示传输管理表格，可切换 Tab、筛选与分页 |
| 5 | 在 `/transfers` 对传输中记录执行“暂停”，对已暂停记录执行“继续”，对失败记录执行“重试” | 单条操作即时生效，状态与按钮同步变化 |
| 6 | 勾选多条记录执行“批量暂停/批量继续” | 仅符合条件的记录被批量处理，并给出成功提示 |
| 7 | 打开一个“最后一级审批”的审批详情并点击“通过” | 提示“审批通过，已自动开始传输”，详情状态进入传输流程 |
| 8 | 选择管理员执行“免审” | 同样自动开始传输并最终完成 |
| 9 | 等待约 10~15 秒 | 申请单状态由 `transferring` 最终变为 `completed` |
| 10 | 打开通知中心 | 申请人和下载人都能看到“文件传输已完成”通知 |

## 6. 本轮测试命令

- `pnpm --dir "d:\VibeCoding\QTrans-0302new\qtrans-frontend" test:coverage`


