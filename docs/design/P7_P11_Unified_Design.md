# P7 & P11 文件上传下载统一设计方案

> 本文档明确 P7（文件管理模块）与 P11（TransWebService 上传下载）的统一方案。

---

## 1. 现状问题

### 1.1 两套独立系统

| 维度 | P7 (task_P7) | P11 (task_P11) |
|------|-------------|----------------|
| **API 层** | Mock `/api/file/` | TransWebService `/Handler/` |
| **Composable** | `useFileUpload.ts` (IndexedDB) | `useTransUpload.ts` |
| **组件** | `StepTwoUploadFile.vue` (展示组件) | `TransUploadView.vue` (页面组件) |
| **断点续传** | 前端 IndexedDB 实现 | 依赖后端 |
| **哈希校验** | 无 | SHA-256 |

### 1.2 需要统一的原因

1. **后端流程一致**：P7 和 P11 的后端流程实际上是同一个 TransWebService
2. **避免重复代码**：两套 API、两套 Composable 造成维护困难
3. **用户体验一致**：内部用户和外部用户应该有一致的上传下载体验

---

## 2. 统一方案

### 2.1 API 层统一

**统一使用 TransWebService API**：

```
src/api/transWebService.ts
├── 上传相关
│   ├── initUpload(params) → 获取 Token
│   ├── getUploadedFiles(token) → 获取已上传文件列表
│   ├── uploadFile(file, token, onProgress) → 分片上传
│   ├── deleteUploadFile(fileId, token) → 删除已上传文件
│   └── confirmUpload(token) → 确认上传完成
├── 下载相关
│   ├── getDownloadList(params) → 获取下载文件列表
│   ├── getDownloadUrl(fileId, token) → 获取下载链接
│   └── verifyHash(fileId, hash, token) → 校验哈希
└── 公共
    └── calcFileHash(file) → 计算 SHA-256
```

**删除**：
- `src/api/file.ts` (Mock API)

**保留并迁移**：
- `src/composables/useFileUpload.ts` 中的 IndexedDB 断点续传逻辑迁移到 `useTransUpload.ts`

### 2.2 Composable 层统一

**统一使用 `useTransUpload.ts`**，但需要增强：

```typescript
// src/composables/useTransUpload.ts
export function useTransUpload() {
  // 状态
  const token = ref<string>('')
  const uploadFileList = ref<UploadFileItem[]>([])
  const uploadedFiles = ref<UploadedFileItem[]>([])
  const uploading = ref(false)
  
  // 方法
  const initialize = async (params: string) => { ... }
  const selectFiles = async (files: File[]) => { ... }
  const pauseUpload = (uid: string) => { ... }
  const resumeUpload = (uid: string) => { ... }
  const removeUploadingFile = (uid: string) => { ... }
  const removeUploadedFile = (uid: string) => { ... }
  const confirmUpload = async () => { ... }
  
  // 批量操作（需要补充）
  const batchPause = () => { ... }
  const batchResume = () => { ... }
  const batchRemoveUploading = () => { ... }
  const batchRemoveUploaded = () => { ... }
  
  return {
    // 状态
    token,
    uploadFileList,
    uploadedFiles,
    uploading,
    // 方法
    initialize,
    selectFiles,
    pauseUpload,
    resumeUpload,
    removeUploadingFile,
    removeUploadedFile,
    confirmUpload,
    batchPause,
    batchResume,
    batchRemoveUploading,
    batchRemoveUploaded,
  }
}
```

### 2.3 组件层统一策略

**方案：共享 UI 组件，分离容器逻辑**

```
src/components/business/
├── TransFileTable.vue          # 通用文件表格组件（新建）
│   ├── Props: files, mode, showHash, showBatchActions
│   └── Emits: pause, resume, remove, batch*
│
└── TransDropZone.vue           # 拖拽上传区域组件（新建）
    ├── Props: disabled, accept, maxSize
    └── Emits: select-files

src/views/
├── application/components/
│   └── StepTwoUploadFile.vue   # 改造：使用 TransFileTable + useTransUpload
│
└── trans/
    ├── TransUploadView.vue     # 改造：使用 TransFileTable + useTransUpload
    └── TransDownloadView.vue   # 改造：使用 TransFileTable + useTransDownload
```

---

## 3. 入口场景统一

### 3.1 场景 A：Dashboard 发起申请

```
Dashboard → 点击卡片 → /application/create
  → StepOneBasicInfo（填写申请信息）
  → 点击「下一步」→ 调用 create 接口 → 返回 params
  → StepTwoUploadFile（使用 useTransUpload + params）
```

**关键点**：
- StepOneBasicInfo 提交后，后端返回 params
- StepTwoUploadFile 通过 `provide/inject` 或 route query 获取 params
- 调用 `useTransUpload.initialize(params)` 初始化

### 3.2 场景 B：我的申请单继续编辑

```
我的申请单 → 申请详情页 → 点击「继续编辑」
  → /application/create?draftId=xxx&params=xxx
  → StepTwoUploadFile（使用 useTransUpload + params）
```

**关键点**：
- 申请详情页需要获取已有的 params（或重新生成）
- 如果 params 已失效，需要重新调用后端获取

### 3.3 场景 C：外部邮件链接

```
邮件链接 → /trans/upload?params=xxx&lang=zh_CN
  → TransUploadView（使用 useTransUpload + params）
```

**关键点**：
- 外部用户无需登录
- params 包含加密的身份信息
- lang 参数控制界面语言

---

## 4. 数据流统一

### 4.1 上传流程

```
┌──────────────────────────────────────────────────────────────┐
│                      用户选择文件                             │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  useTransUpload.selectFiles(files)                           │
│  ├── 遍历文件列表                                             │
│  ├── 计算 SHA-256 哈希                                        │
│  └── 添加到 uploadFileList                                    │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  分片上传循环                                                 │
│  ├── uploadChunk(chunk, token)                               │
│  ├── 更新进度                                                 │
│  ├── 支持暂停/继续                                            │
│  └── 失败重试                                                 │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  确认上传完成                                                 │
│  ├── confirmUpload(token)                                    │
│  └── 更新申请单状态                                           │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 下载流程

```
┌──────────────────────────────────────────────────────────────┐
│  useTransDownload.initialize(params)                         │
│  ├── 获取 Token                                              │
│  └── 获取下载文件列表                                         │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  用户点击下载                                                 │
│  ├── getDownloadUrl(fileId, token)                           │
│  ├── 下载文件                                                │
│  ├── 计算 SHA-256                                            │
│  └── verifyHash(fileId, hash, token) 校验                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. 文件变更清单

### 5.1 删除文件

| 文件 | 原因 |
|------|------|
| `src/components/business/FileUpload.vue` | ✅ 已删除 |
| `src/components/business/__tests__/FileUpload.spec.ts` | ✅ 已删除 |
| `src/api/file.ts` | Mock API，统一使用 TransWebService |
| `src/composables/useFileUpload.ts` | IndexedDB 版本，统一使用 useTransUpload |

### 5.2 新建文件

| 文件 | 说明 |
|------|------|
| `src/components/business/TransFileTable.vue` | 通用文件表格组件 |
| `src/components/business/TransDropZone.vue` | 拖拽上传区域组件 |
| `src/components/business/trans-file-table.scss` | 表格样式 |

### 5.3 修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/composables/useTransUpload.ts` | 补充批量操作方法 |
| `src/views/application/components/StepTwoUploadFile.vue` | 改用 useTransUpload |
| `src/views/trans/TransUploadView.vue` | 改用 TransFileTable 组件 |
| `src/views/trans/TransDownloadView.vue` | 改用 TransFileTable 组件 |

---

## 6. 设计决策（已确认）

### 6.1 params 参数传递方式

**决策：route query（统一方案）**

**理由**：
- 外网场景必须通过 URL params，因为外部用户没有登录态
- params 是加密的，包含申请单 ID、传输类型、用户身份、时效性
- 内网场景也使用相同方式，保持一致性

**场景流程**：

| 场景 | params 来源 | 传递方式 |
|------|------------|----------|
| A. Dashboard 发起申请 | 后端 `create` 接口返回 | 跳转时携带 `?params=xxx` |
| B. 我的申请单继续编辑 | 申请详情页重新生成或从缓存获取 | 跳转时携带 `?params=xxx` |
| C. 外部邮件链接 | 邮件中直接包含 | 用户点击链接直接进入 |

**URL 格式**：
```
内网：/application/create?params=xxx&lang=zh_CN
外网：/trans/upload?params=xxx&lang=zh_CN
```

### 6.2 断点续传策略

**决策：前端 IndexedDB + 后端分片状态接口（方案 B：真·断点续传）**

#### 6.2.1 后端现状分析

| 操作 | 后端接口 | 状态 |
|------|----------|------|
| 暂停上传 | `act=pause` | ✅ 已有 |
| 继续上传 | 隐含在 `act=add` | ✅ 已有 |
| 分片上传 | `act=add` + `qqpartindex` | ✅ 已有 |
| **查询已上传分片** | ❌ 不存在 | ⚠️ **需要新增** |

**问题**：现有后端无法查询「某个文件已上传了哪些分片」，导致跨会话断点续传无法实现。

#### 6.2.2 后端需要新增的接口

```
┌─────────────────────────────────────────────────────────────────┐
│  新增接口：查询文件已上传分片状态（含哈希校验）                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GET /Handler/UploadHandler?act=chunks                          │
│      &qqpath={relativeDir}                                      │
│      &qquuid={fileUUID}                                         │
│      &params={encryptedParams}                                  │
│                                                                 │
│  响应：                                                         │
│  {                                                              │
│    "success": true,                                             │
│    "data": {                                                    │
│      "totalChunks": 10,                                         │
│      "fileSize": 41943040,                                      │
│      "chunkSize": 4194304,                                      │
│      "chunks": [                                                │
│        { "index": 0, "hash": "a1b2c3", "size": 4194304 },       │
│        { "index": 1, "hash": "d4e5f6", "size": 4194304 },       │
│        { "index": 2, "hash": "g7h8i9", "size": 4194304 },       │
│        { "index": 3, "hash": "partial", "size": 2097152 }       │
│        // ↑ 哈希为 "partial" 表示分片不完整                        │
│      ]                                                          │
│    }                                                            │
│  }                                                              │
│                                                                 │
│  说明：                                                         │
│  - hash: 分片 MD5 哈希值，用于校验完整性                          │
│  - size: 服务端实际接收的字节数                                   │
│  - 如果 size < chunkSize（非最后分片），说明分片不完整             │
│  - 哈希为 "partial" 或空表示分片不完整，需要重新上传               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.2.3 分片完整性校验策略

| 校验方式 | 实现位置 | 说明 |
|----------|----------|------|
| **分片大小** | 后端返回 `size` | 快速判断，非最后分片如果 `size < chunkSize` 则不完整 |
| **分片哈希** | 后端返回 `hash` | 精确校验，前端对比本地计算的 MD5 |

**前端校验流程**：
```typescript
// 上传前计算每个分片的 MD5
const chunkHash = await calcMD5(chunk)

// 恢复上传时，对比哈希
for (const serverChunk of response.data.chunks) {
  const localChunk = localChunks[serverChunk.index]
  
  if (serverChunk.hash === 'partial' || serverChunk.size < CHUNK_SIZE) {
    // 分片不完整，需要重新上传
    needReupload.push(serverChunk.index)
  } else if (serverChunk.hash !== localChunk?.hash) {
    // 哈希不匹配，需要重新上传
    needReupload.push(serverChunk.index)
  } else {
    // 分片完整，跳过
    skipChunks.push(serverChunk.index)
  }
}
```

#### 6.2.4 前端 IndexedDB 设计

```typescript
// src/utils/db.ts - IndexedDB 结构设计
interface ChunkInfo {
  index: number           // 分片索引
  hash: string            // 分片 MD5 哈希
  size: number            // 分片大小（字节）
  uploadedAt: Date        // 上传完成时间
}

interface UploadChunkRecord {
  id?: number
  fileUUID: string          // 文件唯一标识
  fileName: string          // 文件名
  fileSize: number          // 文件大小
  totalChunks: number       // 总分片数
  chunks: ChunkInfo[]       // 已上传分片详情（含哈希）
  uploadParams: string      // 加密的 params
  relativeDir: string       // 上传目录
  lastUpdated: Date         // 最后更新时间
  status: 'uploading' | 'paused' | 'completed' | 'failed'
}

// 使用示例
const record: UploadChunkRecord = {
  fileUUID: 'uuid-xxx',
  fileName: 'large-file.zip',
  fileSize: 41943040,
  totalChunks: 10,
  chunks: [
    { index: 0, hash: 'a1b2c3', size: 4194304, uploadedAt: new Date() },
    { index: 1, hash: 'd4e5f6', size: 4194304, uploadedAt: new Date() },
  ],
  uploadParams: 'encrypted-params',
  relativeDir: '/uploads/2024/',
  lastUpdated: new Date(),
  status: 'uploading'
}
```

#### 6.2.4 断点续传完整流程

```
┌─────────────────────────────────────────────────────────────────┐
│  场景 1：正常上传（页面不关闭）                                    │
├─────────────────────────────────────────────────────────────────┤
│  1. 用户选择文件                                                 │
│  2. 计算文件 SHA-256，生成 UUID                                  │
│  3. 分片上传，每完成一个分片：                                    │
│     - 更新 IndexedDB: uploadedChunks.push(chunkIndex)           │
│  4. 上传完成，标记 status = 'completed'                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  场景 2：暂停后继续（页面不关闭）                                  │
├─────────────────────────────────────────────────────────────────┤
│  1. 用户点击暂停 → 调用 act=pause                               │
│  2. IndexedDB 更新 status = 'paused'                           │
│  3. 用户点击继续 → 从 IndexedDB 读取 uploadedChunks             │
│  4. 跳过已上传分片，继续上传剩余分片                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  场景 3：关闭浏览器后重新打开（跨会话断点续传）                     │
├─────────────────────────────────────────────────────────────────┤
│  1. 页面初始化 → 读取 URL 中的 params                            │
│  2. 调用 GET /Handler/UploadHandler?act=chunks 查询后端状态      │
│  3. 同时从 IndexedDB 查询本地缓存记录                            │
│  4. 合并后端状态 + 本地缓存：                                    │
│     finalChunks = backendChunks ∪ localChunks                   │
│  5. 显示文件列表，标记已上传分片                                  │
│  6. 用户点击继续 → 只上传缺失的分片                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  场景 4：服务重启后恢复                                           │
├─────────────────────────────────────────────────────────────────┤
│  1. 后端服务重启 → 内存缓存丢失                                  │
│  2. 用户重新进入页面                                             │
│  3. 调用 act=chunks → 后端返回 uploadedChunks: []（空）          │
│  4. 从 IndexedDB 读取本地缓存                                    │
│  5. 用户选择：重新上传全部 或 从头开始                            │
│                                                                 │
│  ⚠️ 注意：服务重启后，临时文件可能被清理，需要后端确认             │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.2.6 数据一致性策略

| 场景 | 策略 | 说明 |
|------|------|------|
| 本地有记录，后端无记录 | 以本地为准，重新上传 | 后端可能服务重启 |
| 本地无记录，后端有记录 | 校验哈希后决定 | 哈希匹配则跳过，否则重新上传 |
| 两边都有记录，哈希匹配 | 跳过该分片 | 数据一致 |
| 两边都有记录，哈希不匹配 | 重新上传该分片 | 数据不一致 |
| 后端分片不完整（size < chunkSize）| 重新上传该分片 | 网络中断导致 |

**哈希对比逻辑**：
```typescript
function compareChunks(
  serverChunks: ServerChunkInfo[],
  localChunks: ChunkInfo[]
): { skip: number[]; reupload: number[] } {
  const skip: number[] = []
  const reupload: number[] = []
  
  for (const serverChunk of serverChunks) {
    const localChunk = localChunks.find(c => c.index === serverChunk.index)
    
    // 分片不完整
    if (serverChunk.hash === 'partial' || serverChunk.size < CHUNK_SIZE) {
      reupload.push(serverChunk.index)
      continue
    }
    
    // 本地没有记录
    if (!localChunk) {
      // 需要从服务端获取分片哈希进行验证
      // 如果服务端哈希正确，可以跳过
      skip.push(serverChunk.index)
      continue
    }
    
    // 哈希匹配
    if (serverChunk.hash === localChunk.hash) {
      skip.push(serverChunk.index)
    } else {
      // 哈希不匹配，需要重新上传
      reupload.push(serverChunk.index)
    }
  }
  
  return { skip, reupload }
}
```

#### 6.2.6 IndexedDB 数据清理策略

```typescript
// 清理条件
1. 上传完成 7 天后自动清理
2. 上传失败 30 天后自动清理
3. 用户手动清理
4. params 失效后清理（后端返回 401）

### 6.3 并发控制

**决策：前端限制并发上传数为 3**

```typescript
// src/utils/constants.ts
export const MAX_CONCURRENT_UPLOADS = 3
```

**注意**：原系统 `maxConnect = 1`，需要确认后端是否支持更高并发。

---

## 7. 统一架构设计

### 7.1 页面入口统一

```
┌─────────────────────────────────────────────────────────────────┐
│                        入口场景                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  场景 A: Dashboard 发起申请                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Dashboard → StepOneBasicInfo                            │   │
│  │     → 点击「下一步」→ POST /api/application/create       │   │
│  │     → 响应 { params: "xxx" }                            │   │
│  │     → 跳转 /application/create?params=xxx               │   │
│  │     → StepTwoUploadFile 使用 useTransUpload             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  场景 B: 我的申请单继续编辑                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 申请详情页 → 点击「继续编辑」                              │   │
│  │     → GET /api/application/{id}/params                   │   │
│  │     → 响应 { params: "xxx" }                             │   │
│  │     → 跳转 /application/create?params=xxx               │   │
│  │     → StepTwoUploadFile 使用 useTransUpload             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  场景 C: 外部邮件链接                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 邮件链接 → 点击                                           │   │
│  │     → 直接打开 /trans/upload?params=xxx&lang=zh_CN       │   │
│  │     → TransUploadView 使用 useTransUpload                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 组件复用策略

```
┌─────────────────────────────────────────────────────────────────┐
│                     组件层次结构                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              useTransUpload (Composable)                 │   │
│  │  ───────────────────────────────────────────────────────│   │
│  │  状态: token, uploadFileList, uploadedFiles, uploading  │   │
│  │  方法: initialize, selectFiles, pause, resume,          │   │
│  │        batchPause, batchResume, confirmUpload           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ▲                                  │
│                              │ 使用                             │
│          ┌───────────────────┼───────────────────┐             │
│          │                   │                   │             │
│  ┌───────┴───────┐   ┌───────┴───────┐   ┌───────┴───────┐    │
│  │StepTwoUpload  │   │TransUploadView│   │TransDownload  │    │
│  │File.vue       │   │.vue           │   │View.vue       │    │
│  │               │   │               │   │               │    │
│  │ 内网申请流程   │   │ 外网独立页面   │   │ 外网下载页面   │    │
│  │ 使用 params   │   │ 使用 params   │   │ 使用 params   │    │
│  └───────────────┘   └───────────────┘   └───────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            TransFileTable.vue (通用组件)                 │   │
│  │  ───────────────────────────────────────────────────────│   │
│  │  Props: files, mode, showHash, showBatchActions         │   │
│  │  Emits: pause, resume, remove, batch*, download        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ▲                                  │
│                              │ 使用                             │
│          ┌───────────────────┼───────────────────┐             │
│  StepTwoUploadFile     TransUploadView    TransDownloadView    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 API 层统一

```typescript
// src/api/transWebService.ts - 统一 API 封装

// ============ 初始化（需要后端新增） ============
export async function initUpload(params: string, lang = 'zh_CN')
export async function initDownload(params: string, lang = 'zh_CN')

// ============ 文件列表（复用现有接口） ============
export async function getFileList(relativeDir: string, params: string)

// ============ 上传相关（复用现有接口） ============
export async function uploadChunk(formData: FormData, params: string, onProgress?)
export async function pauseUpload(fileName: string, qqpath: string, params: string)
export async function deleteFiles(files: Array, params: string)
export async function completeUpload(params: string)
export async function getServerHash(relativeFileName: string, params: string)
export async function updateClientHash(fileName: string, relativeDir: string, hashCode: string)

// ============ 断点续传（后端需要新增） ============
/**
 * 查询文件已上传分片状态
 * @param fileUUID 文件唯一标识
 * @param relativeDir 上传目录
 * @param params 加密参数
 * @returns 已上传的分片索引列表
 */
export async function getUploadedChunks(
  fileUUID: string,
  relativeDir: string,
  params: string
): Promise<{ totalChunks: number; uploadedChunks: number[] }>

// ============ 下载相关（复用现有接口 + 新增） ============
export async function downloadFile(fileName: string, relativeDir: string, params: string, onProgress?)
export async function checkPackageStatus(relativeDir: string, params: string)
```

---

## 8. 文件变更清单

### 8.1 删除文件

| 文件 | 状态 | 原因 |
|------|------|------|
| `src/components/business/FileUpload.vue` | ✅ 已删除 | 未使用 |
| `src/components/business/__tests__/FileUpload.spec.ts` | ✅ 已删除 | 未使用 |
| `src/api/file.ts` | 待删除 | Mock API，统一使用 TransWebService |

### 8.1.1 需要迁移的代码

| 源文件 | 迁移内容 | 目标文件 |
|--------|----------|----------|
| `src/composables/useFileUpload.ts` | IndexedDB 断点续传逻辑 | `src/composables/useTransUpload.ts` |
| `src/composables/useFileUpload.ts` | 分片上传状态管理 | `src/composables/useTransUpload.ts` |

**注意**：迁移完成后删除 `useFileUpload.ts`

### 8.2 新建文件

| 文件 | 说明 |
|------|------|
| `src/components/business/TransFileTable.vue` | 通用文件表格组件 |
| `src/components/business/trans-file-table.scss` | 表格样式 |
| `src/composables/useTransUpload.ts` | 增强：批量操作、断点续传 |

### 8.3 修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/api/transWebService.ts` | 补充 pause、断点续传相关接口 |
| `src/views/application/components/StepTwoUploadFile.vue` | 改用 useTransUpload + TransFileTable |
| `src/views/trans/TransUploadView.vue` | 改用 TransFileTable + 批量操作 |
| `src/views/trans/TransDownloadView.vue` | 改用 TransFileTable |

---

## 9. 下一步行动

### 9.1 后端协调（优先）

- [ ] 与后端确认新增 `GET /Handler/UploadHandler?act=chunks` 接口
- [ ] 确认接口参数格式和响应结构
- [ ] 确认服务重启后临时文件的处理策略

### 9.2 前端开发

- [√] 确认 params 参数传递方式 → **route query**
- [√] 确认断点续传策略 → **方案 B：真·断点续传**
- [√] 确认并发控制 → **前端限制 3 个并发**
- [ ] 迁移 `useFileUpload.ts` 中的 IndexedDB 逻辑到 `useTransUpload.ts`
- [ ] 新增 `getUploadedChunks` API 封装
- [ ] 创建 `TransFileTable.vue` 通用组件
- [ ] 增强 `useTransUpload.ts`（批量操作、断点续传、IndexedDB）
- [ ] 改造 `StepTwoUploadFile.vue` 使用新架构
- [ ] 改造 `TransUploadView.vue` 添加批量操作
- [ ] 删除旧的 `useFileUpload.ts` 和 `file.ts`
- [ ] 更新差异文档 `docs/diff/P7_P11_Upload_Diff.md`

---

## 10. 后端接口需求清单

### 10.1 需要新增的接口

| 接口 | 方法 | 用途 | 优先级 |
|------|------|------|--------|
| `/Handler/UploadHandler?act=chunks` | GET | 查询文件已上传分片状态 | **P0** |
| `/api/upload/init` | GET | 初始化上传页面（返回 Token） | P1 |
| `/api/download/init` | GET | 初始化下载页面（返回 Token） | P1 |

### 10.2 接口详细设计

#### 10.2.1 查询已上传分片接口（P0）

**请求**：
```http
GET /Handler/UploadHandler?act=chunks&qquuid={fileUUID}&qqpath={relativeDir}&params={encryptedParams}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "totalChunks": 10,
    "fileSize": 41943040,
    "chunkSize": 4194304,
    "chunks": [
      { "index": 0, "hash": "a1b2c3d4e5f6", "size": 4194304 },
      { "index": 1, "hash": "g7h8i9j0k1l2", "size": 4194304 },
      { "index": 2, "hash": "partial", "size": 2097152 }
    ]
  }
}
```

**字段说明**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `totalChunks` | number | 总分片数 |
| `fileSize` | number | 文件总大小 |
| `chunkSize` | number | 标准分片大小（4MB）|
| `chunks` | array | 已上传分片列表 |
| `chunks[].index` | number | 分片索引（从 0 开始）|
| `chunks[].hash` | string | 分片 MD5 哈希，`"partial"` 表示不完整 |
| `chunks[].size` | number | 服务端实际接收的字节数 |

**错误响应**：
```json
{
  "success": false,
  "error": "FILE_NOT_FOUND",
  "message": "文件不存在或已过期"
}
```

### 10.3 复用现有接口

| 接口 | 方法 | 操作 | 说明 |
|------|------|------|------|
| `/Handler/UploadHandler` | POST | `act=add` | 分片上传 |
| `/Handler/UploadHandler` | POST | `act=pause` | 暂停上传 |
| `/Handler/UploadHandler` | POST | `act=delete` | 删除文件 |
| `/Handler/UploadHandler` | POST | `act=complete` | 确认上传完成 |
| `/Handler/UploadHandler` | POST | `act=HASH` | 获取服务端哈希 |

### 10.4 后端改造影响评估

| 改造项 | 影响范围 | 风险等级 |
|--------|----------|----------|
| 新增 `act=chunks` 接口 | `UploadPageRestController` | 低（新增逻辑，不影响现有功能） |
| 分片状态持久化 | 临时文件目录 | 中（需要确认临时文件保留策略） |
| 服务重启后恢复 | `RequestInfoModule` | 中（需要确认内存缓存恢复机制） |

---

## 11. 风险与待确认事项

| 风险项 | 影响 | 建议 |
|--------|------|------|
| 后端临时文件清理策略 | 断点续传可能失败 | 确认临时文件保留时间 |
| 服务重启后内存缓存丢失 | 跨会话断点续传失败 | 后端考虑持久化分片状态 |
| 并发上传数从 1 改为 3 | 后端可能不支持 | 先测试后端并发能力 |
| params 有效期 | 用户中断后无法恢复 | 确认 params 有效期策略 |
