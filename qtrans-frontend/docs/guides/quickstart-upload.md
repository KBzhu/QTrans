# 文件上传模块 QuickStart

> 本文档面向**开发人员**和 **QA 测试人员**，涵盖文件上传功能的架构、使用方式、开发指南及回归测试用例。

---

## 1. 架构总览

```
┌─────────────────────────────────────────────────────┐
│                   View 层                           │
│  StepTwoUploadFile.vue (上传页面)                    │
│    ├── 拖拽/点击上传区                                │
│    ├── TransFileTable (upload模式) - 上传中列表       │
│    └── TransFileTable (uploaded模式) - 已上传列表     │
├─────────────────────────────────────────────────────┤
│                Composable 层                        │
│  useTransUpload.ts (核心业务逻辑)                     │
│    ├── 分片 / 断点续传 / 并发控制                     │
│    ├── 哈希校验（SHA256 客户端 vs 服务端）             │
│    ├── 暂停 / 继续 / 重试 / 删除                     │
│    └── IndexedDB 持久化（断点恢复）                  │
├─────────────────────────────────────────────────────┤
│                  API 层                             │
│  transWebService.ts                                  │
│    ├── initUpload          → 初始化上传              │
│    ├── uploadChunk         → 分片上传               │
│    ├── getServerHash       → 获取服务端哈希          │
│    ├── updateClientHash    → 写入客户端哈希          │
│    ├── completeUpload      → 确认上传完成            │
│    ├── getFileList         → 文件列表查询            │
│    └── pauseUpload / deleteFiles 等                 │
└─────────────────────────────────────────────────────┘
```

---

## 2. 核心类型定义

### `TransUploadFileItem` — 上传文件项

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 文件唯一标识，格式：`{name}-{size}-{lastModified}-{timestamp}` |
| `file` | `File` | 原始 File 对象 |
| `status` | `'pending' \| 'uploading' \| 'hashing' \| 'verifying' \| 'completed' \| 'error' \| 'paused'` | 当前状态 |
| `progress` | `number` | 上传进度 0–99（分片阶段），100（校验完成） |
| `speed` | `number` | 上传速率 (bytes/s) |
| `relativeDir` | `string` | 相对目录路径 |
| `hashState` | `HashVerifyState?` | 哈希校验状态 |
| `error` | `string?` | 错误信息 |
| `totalChunks` | `number?` | 总分片数 |
| `uploadedChunkCount` | `number` | 已上传分片数 |

### `HashVerifyState` — 哈希校验状态

| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | `'pending' \| 'calculating' \| 'verifying' \| 'matched' \| 'mismatched'` | 校验阶段 |
| `clientHash` | `string` | SHA256 客户端计算值 |
| `serverHash` | `string` | 服务端返回的 SHA256 值 |
| `elapsedTime` | `string?` | 服务端计算耗时（如 `"00:03"`） |
| `timeLeft` | `string?` | 预估剩余时间 |

---

## 3. Composable 使用方法 (`useTransUpload`)

### 3.1 基本引入与初始化

```typescript
// StepTwoUploadFile.vue
import { useTransUpload } from '@/composables/useTransUpload'
import type { TransUploadFileItem } from '@/composables/useTransUpload'

const {
  // 响应式数据
  initLoading,        // boolean — 是否正在初始化
  initData,           // UploadInitResponse | null — 上传配置（大小限制、黑名单等）
  fileListData,       // FileListData | null — 已上传文件列表
  uploadFileList,     // Ref<TransUploadFileItem[]> — 正在上传的文件队列

  // 核心方法
  initialize,         // (params, lang?) → Promise<Response | null>
  loadFileList,       // (relativeDir, params) → Promise<FileListData | null>
  uploadFiles,        // (files[], params, relativeDir?, onProgress?) → Promise<{success, failed}>
  confirmUpload,      // (params) → Promise<boolean>

  // 单文件操作
  pauseUpload,        // (fileId, params) → void
  resumeUpload,       // (fileId, params, onProgress?) → Promise<boolean>
  cancelUpload,       // (fileId, params) → void
  retryUpload,        // (fileId, params, onProgress?) → Promise<boolean>

  // 批量操作
  batchPause,         // (params) → void
  batchResume,        // (params, onProgress?) → void
  batchCancel,        // (params) → void
  clearCompleted,     // () → void

  // 其他
  removeFiles,        // ({fileName, relativeDir}[], params) → Promise<boolean>
  checkStorageSpace,  // (params, totalSize) → Promise<boolean>
} = useTransUpload()

// 页面挂载时初始化
onMounted(async () => {
  const ok = await initialize(props.params, props.lang)
  if (!ok) Message.error('初始化失败')
})
```

### 3.2 触发文件上传

```typescript
async function handleFiles(files: File[]) {
  // 前置校验（数量、大小、文件名、存储空间、重复检测）...
  
  // 调用上传
  const result = await uploadFiles(files, props.params, '', updateUploadProgress)
  console.log(`成功 ${result.success} 个，失败 ${result.failed} 个`)
}

function updateUploadProgress(item: TransUploadFileItem) {
  // 上传完成后从队列中移除并刷新已上传列表
  if (item.status === 'completed') {
    const idx = uploadFileList.value.findIndex(f => f.id === item.id)
    if (idx >= 0) {
      uploadFileList.value.splice(idx, 1)
      loadFileList('', props.params)
    }
  }
}
```

### 3.3 提交前校验

```typescript
// StepTwoUploadFile.vue 中通过 defineExpose 暴露给父组件
defineExpose({ validateBeforeSubmit })

function validateBeforeSubmit(): boolean {
  // 1. 检查是否有正在上传中的文件（pending/uploading/hashing/verifying）
  const activeFiles = uploadFileList.value.filter(f =>
    f.status === 'pending' || f.status === 'uploading'
      || f.status === 'hashing' || f.status === 'verifying',
  )
  if (activeFiles.length > 0) {
    Message.error(`以下文件尚未上传完成：${activeFiles.map(f => f.file.name).join('、')}`)
    return false
  }

  // 2. 检查上传队列中是否有哈希校验失败的文件
  const mismatchedUploading = uploadFileList.value.filter(
    f => f.hashState?.status === 'mismatched',
  )
  if (mismatchedUploading.length > 0) { /* ... */ return false }

  // 3. 检查已上传文件列表中是否有哈希校验未通过的文件
  // ...

  return true
}

// 父组件调用：
// if (!stepTwoRef.value.validateBeforeSubmit()) return
```

---

## 4. 上传流程时序

```
用户选择文件
    ↓
[立即] push 进 uploadFileList（status=pending），UI 显示进度条 ← "待上传"
    ↓
[异步] 小文件(≤4MB): 计算 SHA256 预计算哈希
[异步] 创建 AbortController + IndexedDB 记录
[异步] checkChunkStatus API（查询已上传分片，支持断点续传）
    ↓
status = uploading ← "上传中"
[异步] 等待并发队列空位（最多 3 个并发）
[循环] 逐个上传缺失分片 (POST /Handler/UploadHandler?act=add)
    ↓ 更新 progress / speed
所有分片上传完成
    ↓
status = hashing ← "计算哈希"
[await] calculateSHA256(file) — 全量哈希
[await] updateClientHash — 写入后端
    ↓
status = verifying ← "校验中"
[轮询] getServerHash API（每 3 秒一次，直到服务端返回 64 位哈希）
    ↓
比对 clientHash vs serverHash
    ├─ 一致 → hashState.status = 'matched' ✓
    └─ 不一致 → hashState.status = 'mismatched' ✗
    ↓
status = completed, progress = 100
触发 onProgress 回调 → UI 移除此项 + 刷新已上传列表
```

---

## 5. 暂停 / 继续 / 重试

### 暂停

```typescript
// 内部调用 controller.abort() 中断当前请求循环
// + 调用后端 pauseUpload API
pauseUpload(fileId, params)

// 用户看到：status = 'paused', speed = 0
```

### 继续（重要：复用已有项）

```typescript
// resumeUpload 会复用已有列表项，不会重复创建新条目
resumeUpload(fileId, params, updateUploadProgress)

// 内部逻辑：
// 1. 找到 uploadFileList 中的已有项
// 2. 重置 status='pending', error=undefined
// 3. 调用 uploadFile(file, params, relativeDir, onProgress, existingItem)
//    ↑ 第5个参数传入已有项，uploadFile 不会 push 新项
```

### 重试

```typescript
// 仅对 error 状态的文件可用
retryUpload(fileId, params, updateUploadProgress)
```

---

## 6. 关键参数说明

| 参数 | 来源 | 说明 |
|------|------|------|
| `params` | URL query / 父组件传入 | 申请单标识参数，贯穿所有 API 调用 |
| `CHUNK_SIZE` | `getChunkSize()` 动态获取 | 分片大小（由后端 initUpload 返回决定） |
| `MAX_CONCURRENT_UPLOADS` | 固定值 `3` | 最大并发上传数 |
| `SMALL_FILE_THRESHOLD` | 固定值 `4MB` | 小文件预计算哈希阈值 |
| `MAX_AUTO_RETRY` | 固定值 `3` | 可重试错误的自动重试次数 |

---

## 7. 开发者注意事项

### 7.1 文件名校验规则

在调用 `uploadFiles` 前，需通过 `validateFileNames` 校验：

```typescript
import { validateFileNames } from '@/utils/upload-validator'

const invalidFiles = validateFileNames(
  files,
  initData.value.blackList || '',     // 黑名单字符
  initData.value.maxLength4Name || 256, // 文件名最大长度
  initData.value.maxLength4Path || 512, // 路径最大长度
  '',                                   // 相对目录前缀
)
```

### 7.2 重复上传拦截

基于 **SHA256 + 文件名** 双重比对：

```typescript
// 同名 + 同 hash → 重复，拦截
// 同名 + 不同 hash → 放行
// 不同名 → 放行（即使 hash 相同也放行）
```

### 7.3 编码兼容（HASH 接口）

`getServerHash` 的 `RelativeFileName` 参数使用自定义 `escapeUnicode()` 函数编码（模拟原生 `escape()` 行为），输出 `%uXXXX` 格式的 Unicode 编码，以兼容老代码后端。**不可替换为 `encodeURIComponent()`**。

### 7.4 进度条显示优化

文件选择后会**立刻**在 UI 中显示进度条（初始状态为 `pending`/"待上传"），后续的 SHA256 计算、IndexedDB 写入、分片状态查询均为异步执行，不阻塞 UI 渲染。

---

## 8. QA 回归测试用例

> 测试环境准备：进入「创建申请」→ 第二步「上传文件」页面

### T1: 基础上传

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 选择 1 个小文件 (< 4MB) 点击上传 | **进度条立即出现**，状态依次：待上传 → 上传中 → 计算哈希 → 校验中 → 已完成 ✓ |
| 2 | 上传完成后查看下方「已上传文件」区域 | 出现该文件，SHA256 状态显示"通过" |
| 3 | 刷新页面 | 已上传文件仍然存在 |

### T2: 大文件上传

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 选择 1 个大文件 (> 50MB) | 进度条立即出现，显示分片上传进度和速度 |
| 2 | 观察进度变化 | 进度从 0% 逐步增长至 99%（分片阶段），速度动态更新 |
| 3 | 等待上传完成 | 进入哈希校验阶段，最终标记 completed |

### T3: 多文件并发上传

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 同时选择 5+ 个文件 | 所有文件的进度条**立即全部出现** |
| 2 | 观察并发行为 | 最多同时有 3 个处于"上传中"状态，其余等待 |
| 3 | 等待全部完成 | 逐个进入校验 → 完成，已上传文件列表正确展示 |

### T4: 暂停 → 继续（核心场景）

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 上传 1 个大文件 (> 20MB)，等待进度开始增长 | 状态为"上传中"，进度 > 0% |
| 2 | 点击「暂停」按钮 | 状态变为"已暂停"，进度停止增长，速度归零 |
| 3 | 再次点击同一行的「继续」按钮 | **文件总数不变（仍为 1 条）**，原进度条复用，从断点处继续上传 |
| 4 | 重复暂停 → 继续 3 次 | **始终只有 1 条进度条**，无僵尸条目产生 |

### T5: 暂停 → 继续后提交

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 上传 1 个文件，暂停后继续 | 文件上传完成，状态变为已完成 |
| 2 | 点击「提交申请」按钮 | 提交成功，无报错提示 |

### T6: 未完成上传禁止提交

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 选择 1 个大文件上传，等待进度条出现 | 状态为"上传中"或"待上传" |
| 2 | 直接点击「提交申请」按钮 | **被拦截**，提示"以下文件尚未上传完成：{文件名}" |
| 3 | 等待文件上传完成后再点击 | 提交成功 |

### T7: 哈希校验失败处理

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 上传一个文件（若可构造校验失败的场景） | 校验结果显示"未通过"(红色) |
| 2 | 尝试提交申请 | **被拦截**，提示"以下文件校验未通过，请删除后重新上传" |
| 3 | 删除该文件重新上传正常文件 | 新文件校验通过，可以提交 |

### T8: 自动提交开关

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 勾选「上传完毕后自动提交」，然后选择文件上传 | 所有文件上传完成且校验通过后，自动触发表单提交 |
| 2 | 不勾选该选项上传文件 | 上传完成后停留在第二步，需手动点击「提交申请」 |

### T9: 文件名校验

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 选择包含特殊字符的文件（如 `\`, `/`, `*` 等黑名单字符） | 提示"文件名校验不通过"，非法文件被过滤 |
| 2 | 选择超长文件名文件 | 提示文件名超过限制，被过滤 |
| 3 | 合法文件 + 非法文件混合选择 | 仅合法文件进入上传队列 |

### T10: 存储空间检查

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 选择超过存储配额大小的文件集合 | 提示存储空间不足，不上传 |

### T11: 重复上传拦截

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 上传一个文件 A，等待其出现在「已上传」列表 | A 在已上传列表中 |
| 2 | 再次选择同一个文件 A 上传 | **提示"A 在服务器上已存在，请勿重复上传"**，不上传 |
| 3 | 选择同名但内容不同的文件 B | 正常上传（即使同名，内容不同则 hash 不同） |

### T12: 批量操作

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 上传多个文件，选中其中几个 | 工具栏出现批量操作按钮 |
| 2 | 点击「暂停选中」 | 选中的文件全部暂停 |
| 3 | 点击「继续选中」（或「全部继续」） | 选中的文件全部恢复，**不产生新条目** |
| 4 | 点击「删除选中」 | 选中的文件从上传队列移除 |
| 5 | 点击「清空已完成」 | 已完成的条目从列表清除 |

### T13: 已上传文件管理

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 上传完成后查看「已上传文件」区域 | 显示文件名、大小、SHA256 哈希值（截断显示）、校验状态标签 |
| 2 | 点击单个文件的「删除」按钮 | 该文件从列表移除，后端同步删除 |
| 3 | 勾选多个已上传文件，点「删除选中」 | 批量删除成功 |
| 4 | 点「刷新」按钮 | 从后端重新拉取最新文件列表 |

### T14: 错误恢复

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 断网状态下上传文件 | 文件进入 error 状态，显示错误信息 |
| 2 | 恢复网络，点击「重试」按钮 | 从断点处续传（跳过已上传的分片） |
| 3 | 可重试错误会自动重试最多 3 次 | 控制台可见重试日志 |

---

## 9. 相关文件索引

| 文件 | 职责 |
|------|------|
| `src/composables/useTransUpload.ts` | 上传核心 Composable（状态管理 + 业务逻辑） |
| `src/views/application/components/StepTwoUploadFile.vue` | 上传页面 View 组件 |
| `src/components/business/TransFileTable.vue` | 通用文件表格组件（upload/download/uploaded 三种模式） |
| `src/api/transWebService.ts` | 上传相关 API 接口层 |
| `src/utils/format.ts` | `formatFileSize`、`formatTransferSpeed` 工具函数 |
| `src/utils/upload-validator.ts` | 文件名校验工具 |
| `src/utils/upload-db.ts` | IndexedDB 持久化（断点续传记录） |
| `src/types/upload-error.ts` | 上传错误分类定义 |
