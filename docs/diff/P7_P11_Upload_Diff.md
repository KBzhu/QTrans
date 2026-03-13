# P7 与 P11 上传流程统一实施记录

> 本文档记录 P7 文件管理模块与 P11 TransWebService 上传模块的统一实施过程。

## 0. 实施完成情况

### 已完成的变更

| 操作 | 文件 | 状态 |
|------|------|------|
| ✅ 删除 | `src/components/business/FileUpload.vue` | 已删除（未使用）|
| ✅ 删除 | `src/components/business/__tests__/FileUpload.spec.ts` | 已删除 |
| ✅ 删除 | `src/composables/useFileUpload.ts` | 已删除（迁移到 useTransUpload）|
| ✅ 删除 | `src/api/file.ts` | 已删除（Mock API）|
| ✅ 删除 | `src/composables/__tests__/useFileUpload.spec.ts` | 已删除 |
| ✅ 新建 | `src/utils/upload-db.ts` | IndexedDB 断点续传数据库 |
| ✅ 新建 | `src/components/business/TransFileTable.vue` | 通用文件表格组件 |
| ✅ 新建 | `src/components/business/trans-file-table.scss` | 表格样式 |
| ✅ 增强 | `src/api/transWebService.ts` | 新增 getUploadedChunks、pauseUpload API |
| ✅ 增强 | `src/composables/useTransUpload.ts` | 批量操作、断点续传、IndexedDB |
| ✅ 改造 | `src/views/trans/TransUploadView.vue` | 使用 TransFileTable + 批量操作 |

---

## 1. 统一架构

### 1.1 组件层次结构

```
┌─────────────────────────────────────────────────────────────────┐
│              useTransUpload (Composable)                         │
│  ───────────────────────────────────────────────────────────────│
│  状态: uploading, uploadFileList, initData, selectedFiles       │
│  方法: initialize, uploadFile, pauseUpload, resumeUpload,       │
│        batchPause, batchResume, batchCancel, confirmUpload      │
│  特性: 断点续传(IndexedDB)、分片哈希校验、并发控制(3个)          │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ 使用
          ┌───────────────────┼───────────────────┐
          │                   │                   │
  ┌───────┴───────┐   ┌───────┴───────┐   ┌───────┴───────┐
  │useApplication │   │TransUploadView│   │TransDownload  │
  │Form.ts        │   │.vue           │   │View.vue       │
  │(模拟上传)     │   │(外网独立页面) │   │(外网下载)     │
  └───────────────┘   └───────────────┘   └───────────────┘
          │                   │
          ▼                   ▼
  ┌───────────────────────────────────────────────────────────────┐
  │            TransFileTable.vue (通用组件)                       │
  │  ────────────────────────────────────────────────────────────│
  │  Props: files, mode, showHashStatus, showBatchActions        │
  │  Emits: pause, resume, delete, retry, batch*                 │
  │  模式: upload(上传列表) / uploaded(已上传列表)                 │
  └───────────────────────────────────────────────────────────────┘
```

### 1.2 API 层统一

所有上传下载操作统一使用 `src/api/transWebService.ts`：

```typescript
// 初始化
initUpload(params, lang)
initDownload(params, lang)

// 文件操作
getFileList(relativeDir, params)
uploadChunk(formData, params, onProgress)
pauseUpload(fileName, qqpath, params)
deleteFiles(files, params)
completeUpload(params)

// 断点续传（新增）
getUploadedChunks(fileUUID, relativeDir, params)

// 哈希校验
getServerHash(relativeFileName, params)
updateClientHash(fileName, relativeDir, hashCode)
calculateSHA256(file)
calculateChunkHash(chunk)
```

---

## 2. 断点续传实现

### 2.1 IndexedDB 数据结构

```typescript
// src/utils/upload-db.ts

interface ChunkInfo {
  id?: number
  fileUUID: string          // 文件唯一标识
  chunkIndex: number        // 分片索引
  chunkHash: string         // 分片 SHA-256 哈希
  chunkSize: number         // 分片大小
  uploadedAt: Date          // 上传完成时间
}

interface UploadRecord {
  id?: number
  fileUUID: string
  fileName: string
  fileSize: number
  totalChunks: number
  uploadParams: string      // 加密的 params
  relativeDir: string
  status: 'uploading' | 'paused' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}
```

### 2.2 断点续传流程

```
用户关闭浏览器后重新打开：
1. 页面初始化 → 读取 URL params
2. 调用 getUploadedChunks 获取服务端分片状态
   响应: { chunks: [{ index, hash, size }, ...] }
3. 从 IndexedDB 读取本地缓存
4. 对比哈希：
   - 哈希匹配 → 跳过该分片
   - 哈希不匹配 / size < chunkSize → 重新上传
5. 只上传缺失的分片
```

### 2.3 分片完整性校验

| 校验方式 | 条件 | 结果 |
|----------|------|------|
| 大小校验 | `size < chunkSize`（非最后分片）| 分片不完整 |
| 哈希校验 | `serverHash !== localHash` | 数据不一致 |

---

## 3. 后端需要新增的接口

### 3.1 查询已上传分片接口（P0）

```http
GET /Handler/UploadHandler?act=chunks
    &qquuid={fileUUID}
    &qqpath={relativeDir}
    &params={encryptedParams}

响应：
{
  "success": true,
  "data": {
    "totalChunks": 10,
    "fileSize": 41943040,
    "chunkSize": 4194304,
    "chunks": [
      { "index": 0, "hash": "a1b2c3d4e5f6", "size": 4194304 },
      { "index": 1, "hash": "partial", "size": 2097152 }
    ]
  }
}
```

### 3.2 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `chunks[].index` | number | 分片索引（从 0 开始）|
| `chunks[].hash` | string | 分片哈希，`"partial"` 表示不完整 |
| `chunks[].size` | number | 服务端实际接收的字节数 |

---

## 4. 待完成工作

### 4.1 useApplicationForm 改造（可选）

当前 `useApplicationForm.ts` 使用模拟上传逻辑，可以选择：
- **方案 A**：保持模拟模式（演示项目）
- **方案 B**：改造使用 `useTransUpload`（需要 params 传递）

### 4.2 TransDownloadView 改造

`src/views/trans/TransDownloadView.vue` 也需要使用 `TransFileTable` 组件。

---

## 5. 变更日志

### 2024-03-13

- 删除未使用的 `FileUpload.vue` 和相关测试文件
- 删除 Mock API `file.ts`
- 删除旧的 `useFileUpload.ts`（逻辑已迁移）
- 新建 `upload-db.ts` IndexedDB 数据库
- 新建 `TransFileTable.vue` 通用组件
- 增强 `useTransUpload.ts` 支持断点续传和批量操作
- 增强 `transWebService.ts` 新增 `getUploadedChunks` API
- 改造 `TransUploadView.vue` 使用新架构
