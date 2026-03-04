# task_P9 - 传输模块

## 任务目标

实现文件传输进度展示、传输模拟逻辑和传输管理页面。核心是使用 `setInterval` 模拟 10-15 秒的传输过程，配合随机波动展示真实感进度条。

## 前置依赖

- P1.2 工具函数实现已完成
- P3.3 File Store 已完成
- P7.1 文件上传组件已完成

---

## 子任务清单

### P9.1 传输进度组件（3h）

- [ ] 创建 `src/components/business/TransferProgress.vue`
  - Props：
    - `applicationId: string` - 申请单 ID
    - `fileSize: number` - 文件总大小（字节）
    - `autoStart: boolean` - 是否自动开始传输，默认 false
  - Emits：
    - `complete()` - 传输完成
    - `error(error)` - 传输失败
  - 展示内容：
    - 传输状态标签（a-tag）：等待传输/传输中/传输完成/传输失败
    - 进度条（a-progress）：
      - type="line"
      - 显示百分比
      - 根据状态显示不同颜色（normal/success/danger）
    - 传输信息：
      - 已传输大小 / 总大小（formatFileSize）
      - 传输速度（formatTransferSpeed，单位 MB/s）
      - 剩余时间（formatRemainingTime，单位 秒/分钟/小时）
    - 操作按钮：
      - 开始传输（status='pending'）
      - 暂停传输（status='transferring'）
      - 继续传输（status='paused'）
      - 重试（status='error'）
  - 传输动画：进度条带动画效果（transition）
- [ ] 样式文件 `src/components/business/TransferProgress.scss`

### P9.2 传输模拟逻辑（2h）

- [ ] 创建 `src/composables/useTransferSimulator.ts`
  - `simulateTransfer(applicationId, fileSize, onProgress, onComplete)` - 主要模拟方法
    - 参数：
      - `applicationId: string` - 申请单 ID
      - `fileSize: number` - 文件总大小（字节）
      - `onProgress: (progress: number, speed: number) => void` - 进度回调
      - `onComplete: () => void` - 完成回调
    - 返回：`() => void` - 取消传输的函数
    - 实现逻辑：
      1. 计算总传输时间：`10000 + Math.random() * 5000` (10-15秒)
      2. 计算每次更新间隔：100ms
      3. 计算每次进度增量：`100 / (totalTime / interval)`
      4. 使用 `setInterval` 每 100ms 更新一次进度
      5. 每次更新时：
         - 进度增加：`progress += progressPerStep + Math.random() * 2` (增加随机波动)
         - 速度计算：`speed = (fileSize * progress / 100) / elapsed` (MB/s)
         - 调用 `onProgress(progress, speed)`
      6. 进度达到 100% 时：
         - 清除定时器
         - 调用 `onComplete()`
      7. 返回取消函数：`() => clearInterval(timer)`
  - `pauseTransfer(applicationId)` - 暂停传输（清除定时器）
  - `resumeTransfer(applicationId)` - 继续传输（重新启动定时器）
- [ ] 在 File Store 中集成传输模拟：
  - `startTransfer(applicationId)` - 开始传输
    1. 更新申请单状态为 `'transferring'`
    2. 调用 `simulateTransfer()`
    3. 传输完成后，更新状态为 `'completed'`
    4. 发送通知给申请人和下载人
  - `pauseTransfer(applicationId)` - 暂停传输
  - `resumeTransfer(applicationId)` - 继续传输

### P9.3 传输管理页面（3h）

- [ ] 创建 `src/views/transfer/TransferManageView.vue`（仅管理员可访问）
  - 页面标题：「传输管理」
  - Tab 切换：传输中 / 已完成 / 全部
  - 筛选区域（a-form inline）：
    - 申请单号（a-input）
    - 传输类型（a-select）
    - 申请人（a-input）
    - 传输时间范围（a-range-picker）
    - 查询按钮 + 重置按钮
  - 数据表格（a-table）：
    - 列：申请单号、传输类型、申请人、文件大小、传输进度、传输速度、状态、操作
    - 传输进度列：使用 `a-progress` 展示（type="circle" size="small"）
    - 传输速度列：formatTransferSpeed
    - 状态列：使用 `a-tag` 展示（transferring蓝色/completed绿色/error红色）
    - 操作列：
      - 传输中：暂停/查看详情
      - 已完成：查看详情
      - 失败：重试/查看详情
  - 分页器（a-pagination）
  - 批量操作：批量暂停、批量继续
- [ ] 创建 `src/composables/useTransferManage.ts`
  - `activeTab` - 当前 Tab（transferring/completed/all）
  - `listData` - 列表数据
  - `loading` - 加载状态
  - `pagination` - 分页参数
  - `filters` - 筛选条件
  - `selectedRows` - 选中的行
  - `fetchList()` - 获取列表数据
  - `handleTabChange(tab)` - 切换 Tab
  - `handleSearch()` - 搜索
  - `handleReset()` - 重置筛选
  - `handlePageChange()` - 翻页
  - `handlePause(id)` - 暂停传输
  - `handleResume(id)` - 继续传输
  - `handleRetry(id)` - 重试传输
  - `handleBatchPause()` - 批量暂停
  - `handleBatchResume()` - 批量继续
- [ ] 样式文件 `src/views/transfer/transfer-manage.scss`

---

## 技术要点

### 传输模拟核心代码
```typescript
export const useTransferSimulator = () => {
  const simulateTransfer = (
    applicationId: string,
    fileSize: number,
    onProgress: (progress: number, speed: number) => void,
    onComplete: () => void
  ) => {
    let progress = 0
    const totalTime = 10000 + Math.random() * 5000 // 10-15秒
    const interval = 100 // 100ms更新一次
    const progressPerStep = 100 / (totalTime / interval)
    const startTime = Date.now()

    const timer = setInterval(() => {
      // 增加随机波动（±2%）
      progress += progressPerStep + (Math.random() * 4 - 2)
      progress = Math.min(progress, 100)

      // 计算速度（MB/s）
      const elapsed = (Date.now() - startTime) / 1000
      const transferredBytes = (fileSize * progress) / 100
      const speed = transferredBytes / elapsed / (1024 * 1024)

      onProgress(progress, speed)

      if (progress >= 100) {
        clearInterval(timer)
        onComplete()
      }
    }, interval)

    // 返回取消函数
    return () => clearInterval(timer)
  }

  return { simulateTransfer }
}
```

### 剩余时间计算
```typescript
const formatRemainingTime = (progress: number, speed: number, fileSize: number): string => {
  if (progress === 0 || speed === 0) return '--'

  const remainingBytes = fileSize * (100 - progress) / 100
  const remainingSeconds = remainingBytes / (speed * 1024 * 1024)

  if (remainingSeconds < 60) return `${Math.ceil(remainingSeconds)}秒`
  if (remainingSeconds < 3600) return `${Math.ceil(remainingSeconds / 60)}分钟`
  return `${Math.ceil(remainingSeconds / 3600)}小时`
}
```

### 传输状态管理
```typescript
// File Store 中
const transferStates = reactive<Map<string, TransferState>>(new Map())

interface TransferState {
  applicationId: string
  status: 'pending' | 'transferring' | 'paused' | 'completed' | 'error'
  progress: number
  speed: number
  cancelFn: (() => void) | null
}

const startTransfer = (applicationId: string) => {
  const state: TransferState = {
    applicationId,
    status: 'transferring',
    progress: 0,
    speed: 0,
    cancelFn: null
  }

  state.cancelFn = simulateTransfer(
    applicationId,
    fileSize,
    (progress, speed) => {
      state.progress = progress
      state.speed = speed
    },
    () => {
      state.status = 'completed'
      // 发送通知
      notificationStore.sendNotification({
        type: 'transfer_complete',
        applicationId
      })
    }
  )

  transferStates.set(applicationId, state)
}
```

---

## 验收标准

1. 传输进度组件：
   - 进度条正常展示
   - 传输速度、剩余时间实时更新
   - 状态标签颜色正确
2. 传输模拟逻辑：
   - 传输时间在 10-15 秒之间
   - 进度条有随机波动（更真实）
   - 传输完成后触发回调
3. 传输管理页面：
   - 列表数据正常加载
   - Tab 切换正常
   - 暂停/继续/重试功能正常
   - 批量操作正常
4. 传输完成后：
   - 申请单状态更新为 `'completed'`
   - 发送通知给申请人和下载人

---

## 单元测试要求

- `useTransferSimulator.ts`：测试传输模拟逻辑、进度计算、取消功能
- `TransferProgress.vue`：测试进度展示、操作按钮
- `useTransferManage.ts`：测试列表加载、操作方法
- File Store：测试传输状态管理、开始/暂停/继续
