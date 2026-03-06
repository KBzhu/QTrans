# P7 文件管理模块 Quick Start

## 模块概述

P7 文件管理模块提供完整的文件上传、下载、预览功能，支持大文件分片上传、断点续传、并发控制等高级特性。

## 核心功能

### P7.1 文件上传组件 ✅
**组件**: `src/components/business/FileUpload.vue`

**功能**:
- 拖拽上传 + 点击选择
- 文件大小和数量限制
- 上传进度展示
- 并发上传控制（最多3个）
- 暂停/继续/删除操作

**使用示例**:
```vue
<FileUpload
  application-id="app-123"
  :max-size="50 * 1024 * 1024 * 1024"
  :max-count="20"
  accept="*"
  @upload-success="handleSuccess"
  @upload-error="handleError"
  @all-uploaded="handleAllUploaded"
/>
```

### P7.2 文件分片上传逻辑 ✅
**Composable**: `src/composables/useFileUpload.ts`

**核心方法**:
- `uploadFile(file, applicationId, onProgress)` - 上传文件（自动分片）
- `pauseUpload(fileId)` - 暂停上传
- `resumeUpload(file, applicationId, onProgress)` - 继续上传
- `cancelUpload(fileId)` - 取消上传
- `getUploadProgress(fileId)` - 获取进度

**使用示例**:
```typescript
import { useFileUpload } from '@/composables/useFileUpload'

const { uploadFile, pauseUpload, resumeUpload } = useFileUpload()

// 上传文件
const uploadedFileId = await uploadFile(
  file,
  'app-123',
  (progress) => {
    console.log(`进度: ${progress.progress}%`)
    console.log(`速度: ${progress.speed} bytes/s`)
  }
)
```

### P7.3 断点续传实现 ✅
**技术**: 基于 IndexedDB（Dexie.js）

**数据库表**:
- `fileChunks` - 存储已上传的分片信息
- `fileMetas` - 存储文件元数据

**自动恢复**:
- 暂停后继续：自动从断点处继续
- 关闭浏览器后：重新选择同一文件，自动恢复进度

**验证方法**:
1. 上传大文件（>10MB）
2. 上传过程中点击暂停或关闭浏览器
3. 重新上传同一文件
4. 观察进度从之前的断点继续

### P7.4 文件列表组件 ✅
**组件**: `src/components/business/FileList.vue`

**三种模式**:
- `upload` - 上传模式（显示删除按钮）
- `download` - 下载模式（显示下载按钮）
- `view` - 查看模式（显示预览按钮）

**使用示例**:
```vue
<FileList
  application-id="app-123"
  mode="download"
  :files="fileList"
  :loading="loading"
  @delete="handleDelete"
  @download="handleDownload"
  @preview="handlePreview"
/>
```

## 代码结构

```
qtrans-frontend/src/
├── api/
│   └── file.ts                    # 文件上传 API
├── components/business/
│   ├── FileUpload.vue             # 文件上传组件
│   ├── file-upload.scss           # 上传组件样式
│   ├── FileList.vue               # 文件列表组件
│   └── file-list.scss             # 列表组件样式
├── composables/
│   └── useFileUpload.ts           # 文件上传 Composable
├── mocks/
│   ├── db.ts                      # IndexedDB 数据库定义
│   └── handlers/file.ts           # MSW Mock Handlers
└── utils/
    └── constants.ts               # 文件上传常量
```

## 技术要点

### 1. 分片上传
- **分片大小**: 5MB
- **计算方式**: `Math.ceil(file.size / CHUNK_SIZE)`
- **上传流程**: 切割 → 上传 → 记录 → 合并

### 2. 断点续传
```typescript
// 查询已上传分片
const uploadedChunks = await db.fileChunks
  .where('fileId').equals(fileId)
  .toArray()
const uploadedIndexes = new Set(uploadedChunks.map(c => c.chunkIndex))

// 跳过已上传分片
for (let i = 0; i < totalChunks; i++) {
  if (uploadedIndexes.has(i)) continue
  await uploadChunk(file, fileId, i, totalChunks)
}
```

### 3. AbortController 暂停控制
```typescript
const controller = new AbortController()
abortControllers.set(fileId, controller)

// 上传分片时传入 signal
await fileApi.uploadChunk(formData, { signal: controller.signal })

// 暂停时 abort
controller.abort()
```

### 4. 进度追踪
```typescript
interface UploadProgress {
  fileId: string
  fileName: string
  progress: number        // 0-100
  speed: number          // bytes per second
  uploadedBytes: number
  totalBytes: number
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error'
}
```

## API 接口

### 上传分片
```typescript
POST /api/files/upload/chunk
Content-Type: multipart/form-data

FormData:
  - file: Blob
  - fileId: string
  - chunkIndex: number
  - totalChunks: number
  - fileName: string
```

### 合并分片
```typescript
POST /api/files/upload/merge

Body:
  {
    fileId: string,
    totalChunks: number
  }

Response:
  {
    success: boolean,
    uploadedFileId: string,
    fileUrl: string
  }
```

## 配置常量

```typescript
// src/utils/constants.ts
export const CHUNK_SIZE = 5 * 1024 * 1024              // 5MB
export const MAX_CONCURRENT_UPLOADS = 3                 // 最多3个并发
export const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024  // 50GB
export const MAX_FILES_PER_APPLICATION = 100           // 单个申请最多100个文件
```

## QA 测试用例

### 测试场景1: 小文件上传
**步骤**:
1. 选择小文件（< 5MB）
2. 点击上传
3. 观察上传进度

**预期**:
- 上传成功
- 进度条正常显示
- 状态变为"已完成"

### 测试场景2: 大文件分片上传
**步骤**:
1. 选择大文件（> 10MB）
2. 点击上传
3. 观察分片上传过程

**预期**:
- 文件被分成多片上传
- 每片上传后进度增加
- 最后合并成功

### 测试场景3: 断点续传
**步骤**:
1. 上传大文件
2. 上传到50%时点击暂停
3. 点击继续上传

**预期**:
- 暂停后上传停止
- 继续后从50%继续上传
- 不会重复上传已完成的分片

### 测试场景4: 并发控制
**步骤**:
1. 同时选择5个文件
2. 开始上传
3. 观察并发数量

**预期**:
- 最多3个文件同时上传
- 前3个完成后，后2个自动开始

### 测试场景5: 取消上传
**步骤**:
1. 上传文件
2. 点击删除按钮
3. 检查 IndexedDB

**预期**:
- 上传立即停止
- IndexedDB 中的分片记录被清除
- 文件从列表中移除

## 常见问题

### Q1: 上传失败如何处理？
A: 组件会自动捕获错误并显示失败状态，可以点击"重试"按钮重新上传。

### Q2: 如何限制文件类型？
A: 使用 `accept` prop，例如 `accept="image/*"` 只允许图片。

### Q3: 如何自定义分片大小？
A: 修改 `src/utils/constants.ts` 中的 `CHUNK_SIZE` 常量。

### Q4: IndexedDB 数据会一直保留吗？
A: 是的。建议在上传成功或取消后手动清理，避免占用过多存储空间。

### Q5: 如何查看 IndexedDB 数据？
A: 打开浏览器开发者工具 → Application → IndexedDB → QTransDB。

## 下一步

- P7.5: 文件预览功能（图片、文本、PDF）
- P9: 传输模块（下载进度、传输状态）
- P11: 测试与优化（单元测试覆盖率）

## 扩展建议

1. **MD5 校验**: 上传前计算文件 MD5，上传后验证完整性
2. **秒传功能**: 基于 MD5 检测，已上传文件直接返回
3. **多线程上传**: 使用 Web Worker 并行上传多个分片
4. **压缩上传**: 支持文件压缩后上传，节省带宽
5. **加密上传**: 敏感文件加密后上传
