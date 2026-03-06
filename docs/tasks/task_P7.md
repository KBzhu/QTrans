# task_P7 - 文件管理模块

## 任务目标

实现文件分片上传、断点续传、文件列表展示和文件预览功能。核心是基于 IndexedDB（Dexie.js）的分片记录机制和 MSW 模拟上传 API。

## 前置依赖

- P2.1 IndexedDB 数据库设计已完成
- P2.4 文件分片逻辑已完成
- P3.3 File Store 已完成

---

## 子任务清单

### P7.1 文件上传组件（4h）

- [√] 创建 `src/components/business/FileUpload.vue`
  - 使用 `a-upload` 组件的自定义上传模式（`custom-request`）
  - Props：
    - `applicationId: string` - 所属申请单 ID
    - `maxSize: number` - 最大文件大小（字节），默认 50GB
    - `maxCount: number` - 最大文件数，默认 20
    - `accept: string` - 允许的文件类型，默认全部
    - `disabled: boolean` - 是否禁用
  - Emits：
    - `upload-success(file, fileId)` - 上传成功
    - `upload-error(file, error)` - 上传失败
    - `all-uploaded()` - 所有文件上传完成
  - 上传区域：拖拽上传 + 点击选择文件
  - 文件列表：展示已选文件，每个文件有独立进度条
  - 每个文件条目展示：
    - 文件图标（根据后缀区分类型）
    - 文件名（超长截断 tooltip 展示完整名）
    - 文件大小（formatFileSize）
    - 上传进度条（a-progress）
    - 上传速度（formatTransferSpeed）
    - 状态标签：待上传/上传中/已完成/失败/暂停
    - 操作按钮：暂停/继续/重试/删除
  - 全局操作：全部暂停、全部继续、清空已完成
  - 并发控制：最多同时上传3个文件（`p-limit` 控制并发）
- [√] 创建 `src/components/business/file-upload.scss`

### P7.2 文件分片上传逻辑（4h）

- [√] 创建 `src/composables/useFileUpload.ts`
  - `uploadFile(file, applicationId, onProgress)` - 主要上传方法
    1. 生成 fileId：`${applicationId}-${file.name}-${file.size}-${file.lastModified}`
    2. 从 IndexedDB 查询已上传的分片列表（`db.fileChunks.where({ fileId }).toArray()`）
    3. 计算总分片数：`Math.ceil(file.size / CHUNK_SIZE)` (CHUNK_SIZE = 5MB)
    4. 遍历所有分片，跳过已完成的分片索引
    5. 逐分片调用 `uploadChunk(file, chunkIndex, fileId)` 上传
    6. 每片上传成功后，更新 IndexedDB 记录
    7. 全部分片完成后，调用 `mergeChunks(fileId)` 合并
  - `uploadChunk(file, chunkIndex, fileId)` - 上传单个分片
    - 切割文件：`file.slice(start, end)`
    - 构建 FormData（fileId, chunkIndex, totalChunks）
    - 调用 `fileApi.uploadChunk(formData)`
    - 返回上传结果
  - `pauseUpload(fileId)` - 暂停上传（设置 AbortController 取消请求）
  - `resumeUpload(fileId)` - 继续上传（重新启动上传流程）
  - `cancelUpload(fileId)` - 取消并清理 IndexedDB 数据
  - `getUploadProgress(fileId)` - 获取上传进度
- [√] 文件上传相关常量（`src/utils/constants.ts` 中增加）：
  ```typescript
  export const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB
  export const MAX_CONCURRENT_UPLOADS = 3
  export const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024 // 50GB
  export const MAX_FILE_COUNT = 20
  ```

### P7.3 断点续传实现（3h）

- [ ] 在 `useFileUpload.ts` 中实现断点续传核心逻辑：
  - **分片记录**：每片上传成功后立即写入 IndexedDB
    ```typescript
    await db.fileChunks.add({
      fileId,
      chunkIndex,
      size: chunkBlob.size,
      uploadedAt: Date.now()
    })
    ```
  - **续传检测**：上传前检查 IndexedDB 中已存在的分片
    ```typescript
    const uploadedChunks = await db.fileChunks
      .where('fileId').equals(fileId)
      .toArray()
    const uploadedIndexes = new Set(uploadedChunks.map(c => c.chunkIndex))
    ```
  - **跳过已完成分片**：遍历时跳过 `uploadedIndexes` 中的分片
  - **进度恢复**：初始进度 = 已上传分片数 / 总分片数 * 100
- [ ] 文件 Meta 管理（`db.fileMetas`）：
  - 上传开始时，写入文件 Meta（fileId, fileName, fileSize, applicationId, totalChunks, status）
  - 上传完成时，更新 Meta status 为 `'completed'`
  - 上传失败/取消时，更新 Meta status 为 `'error'`/'`cancelled`'
- [ ] 演示断点续传的 Demo 辅助：
  - 在 `FileUpload.vue` 中增加「模拟断点」按钮（仅开发模式），点击后随机暂停当前上传
  - 重新上传时自动从断点处继续

### P7.4 文件列表组件（2h）

- [ ] 创建 `src/components/business/FileList.vue`
  - Props：
    - `applicationId: string` - 申请单 ID
    - `mode: 'upload' | 'download' | 'view'` - 模式
    - `files: FileMeta[]` - 文件列表
  - 文件列表表格（a-table）：
    - 列：文件名、文件大小、上传时间、状态、操作
    - 操作列根据 `mode` 不同显示：
      - upload 模式：删除（待上传状态）
      - download 模式：下载
      - view 模式：预览（支持的格式）
  - 文件总大小统计：列表底部展示「共 N 个文件，总大小 X.X GB」
  - 空状态：无文件时展示上传引导

### P7.5 文件预览功能（2h）

- [ ] 创建 `src/components/business/FilePreview.vue`
  - 使用 `a-modal` 弹窗展示
  - 支持的预览格式：
    - 图片：`.jpg .jpeg .png .gif .webp` → 使用 `<img>` 标签
    - 文本：`.txt .log .json .xml .csv` → 使用 `<pre>` 标签展示（限制前1000行）
    - PDF：`.pdf` → 使用 `<iframe>` 嵌入（Mock 模式跳过实际内容）
    - 其他格式：展示「该格式不支持预览，请下载后查看」
  - Props：
    - `file: FileMeta` - 文件信息
    - `visible: boolean` - 是否显示
  - Emits：`update:visible`, `download`
  - Mock 模式下：生成对应类型的模拟预览内容
- [ ] 在 `FileList.vue` 中集成 `FilePreview.vue`
- [ ] 文件图标辅助工具 `src/utils/file.ts`：
  - `getFileIcon(fileName)` - 根据后缀返回对应图标名
  - `isPreviewable(fileName)` - 判断是否支持预览
  - `formatFileSize(bytes)` - 已在 P1.2 实现，此处直接引用

---

## 技术要点

### 分片上传核心流程
```typescript
const uploadFile = async (
  file: File,
  applicationId: string,
  onProgress: (progress: number, speed: number) => void
) => {
  const fileId = generateFileId(file, applicationId)
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

  // 查询已上传分片（断点续传）
  const uploadedIndexes = await getUploadedIndexes(fileId)

  let uploadedCount = uploadedIndexes.size
  const startTime = Date.now()

  for (let i = 0; i < totalChunks; i++) {
    if (uploadedIndexes.has(i)) continue // 跳过已上传

    const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    await uploadChunk(fileId, i, totalChunks, chunk)

    // 更新 IndexedDB
    await db.fileChunks.add({ fileId, chunkIndex: i, size: chunk.size, uploadedAt: Date.now() })

    uploadedCount++
    const progress = (uploadedCount / totalChunks) * 100
    const elapsed = (Date.now() - startTime) / 1000
    const speed = (uploadedCount * CHUNK_SIZE) / elapsed / (1024 * 1024) // MB/s
    onProgress(progress, speed)
  }

  await mergeChunks(fileId, totalChunks)
}
```

### AbortController 暂停/取消
```typescript
const abortControllers = new Map<string, AbortController>()

const pauseUpload = (fileId: string) => {
  abortControllers.get(fileId)?.abort()
  abortControllers.delete(fileId)
}

const uploadChunk = async (fileId: string, chunkIndex: number, ...) => {
  const controller = new AbortController()
  abortControllers.set(fileId, controller)

  await fileApi.uploadChunk(formData, { signal: controller.signal })
}
```

---

## 验收标准

1. 文件上传组件正常渲染，支持拖拽和点击选择
2. 文件分片上传：选择大文件（>5MB）后可看到分片上传进度
3. 断点续传：上传过程中暂停，刷新页面后重新上传，从断点继续（进度不从0开始）
4. 并发控制：同时选择5个文件，最多3个并发上传
5. 文件列表正常展示文件信息和状态
6. 图片/文本文件点击预览可打开弹窗展示内容
7. 暂停/继续/取消功能正常

---

## 单元测试要求

- `useFileUpload.ts`：测试分片逻辑、断点续传、暂停/继续
- `FileUpload.vue`：测试文件选择、上传流程、进度展示
- `FileList.vue`：测试列表渲染、操作按钮
- `file.ts` 工具函数：测试文件图标、预览判断、大小格式化
