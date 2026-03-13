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
- `src/composables/useFileUpload.ts` (IndexedDB 版本)

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

## 6. 需要确认的问题

### 6.1 params 参数管理

**问题**：params 参数如何在不同页面间传递？

**方案 A**：route query
```
/application/create?params=xxx
/trans/upload?params=xxx
```

**方案 B**：provide/inject
```typescript
// CreateApplicationView.vue
provide('uploadParams', params)

// StepTwoUploadFile.vue
const params = inject('uploadParams')
```

**方案 C**：Pinia Store
```typescript
// stores/useUploadStore.ts
const uploadStore = useUploadStore()
uploadStore.setParams(params)
```

### 6.2 断点续传

**问题**：TransWebService 是否支持断点续传？

- 如果支持：后端记录已上传分片
- 如果不支持：前端需要 IndexedDB 缓存

### 6.3 并发控制

**问题**：是否需要限制并发上传数？

- P7 设计了 MAX_CONCURRENT_UPLOADS = 3
- TransWebService 是否有服务端限制？

---

## 7. 下一步行动

- [ ] 确认 params 参数传递方式
- [ ] 确认 TransWebService 断点续传能力
- [ ] 确认并发控制需求
- [ ] 创建 `TransFileTable.vue` 通用组件
- [ ] 增强 `useTransUpload.ts` 批量操作
- [ ] 改造 `StepTwoUploadFile.vue` 使用新架构
- [ ] 删除旧的 `useFileUpload.ts` 和 `file.ts`
