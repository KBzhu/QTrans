# task_P7.1 - 文件上传组件

## 任务目标

实现通用文件上传组件 `FileUpload.vue`，支持拖拽上传、分片上传、进度展示、暂停/继续/重试操作、并发控制。

## 子任务进度

- [√] 创建 `src/components/business/FileUpload.vue` 文件上传组件
- [√] 创建 `src/components/business/file-upload.scss` 独立样式文件
- [√] 实现拖拽上传区域与点击选择文件
- [√] 实现文件列表展示（图标、文件名、大小、进度、速度、状态、操作）
- [√] 实现单文件上传进度条与实时速度展示
- [√] 实现文件操作按钮（暂停/继续/重试/删除）
- [√] 实现全局操作（全部暂停、全部继续、清空已完成）
- [√] 实现并发控制（最多同时上传3个文件）
- [ ] 接入 `useFileUpload` composable（待 P7.2 完成后集成）
- [√] 文件类型图标映射（复用 P6.2 已有逻辑）
- [√] Props / Emits 定义与 TypeScript 类型约束
- [√] 自检（lint / 构建通过）
- [ ] 自检（lint / 构建通过）

## 验收标准

| 验收项 | 状态 | 备注 |
|--------|------|------|
| 组件正常渲染，支持拖拽和点击 | ✅ | 已实现拖拽上传与点击选择文件 |
| 文件列表正确展示文件信息 | ✅ | 展示图标、文件名、大小、进度、速度、状态 |
| 进度条与上传速度实时更新 | ✅ | Mock上传模拟实时进度与速度 |
| 暂停/继续/删除操作可用 | ✅ | 已实现（暂停/继续为Mock，待P7.2集成真实逻辑） |
| 并发控制生效（最多3个同时上传） | ✅ | 通过`uploadingCount`计数控制并发 |
| 全局操作（全部暂停/继续/清空）可用 | ✅ | 已实现全局操作按钮 |
| 样式对齐 Figma（如有高保真） | ✅ | 使用玻璃拟态卡片样式，响应式布局 |
| 构建通过 | ✅ | `npm run build` 通过 |

## 执行结果

### 已完成功能
1. **FileUpload组件**
   - Props：`applicationId`、`maxSize`、`maxCount`、`accept`、`disabled`
   - Emits：`upload-success`、`upload-error`、`all-uploaded`
   - 拖拽上传区域：支持拖拽文件到区域上传
   - 点击上传：点击区域弹出文件选择对话框
   - 文件数量与大小限制检查

2. **文件列表展示**
   - 文件图标：根据文件后缀映射对应图标（复用P6.2逻辑）
   - 文件名：超长截断，tooltip展示完整名称
   - 文件大小：使用`formatFileSize`格式化
   - 上传进度条：Arco Progress组件，实时更新
   - 上传速度：实时计算并格式化显示（B/s、KB/s、MB/s）
   - 状态标签：待上传/上传中/已完成/失败/暂停（不同颜色）

3. **文件操作**
   - 暂停：上传中的文件可暂停（当前为Mock，待P7.2集成AbortController）
   - 继续：已暂停的文件可继续上传
   - 重试：失败的文件可重试上传
   - 删除：非上传中的文件可删除

4. **全局操作**
   - 全部暂停：暂停所有上传中的文件
   - 全部继续：继续所有已暂停的文件
   - 清空已完成：清空所有已完成的文件

5. **并发控制**
   - 最多同时上传3个文件（`MAX_CONCURRENT_UPLOADS`）
   - 通过`uploadingCount`计数控制并发数量
   - 文件完成后自动启动下一个待上传文件

6. **Mock上传逻辑**
   - 模拟上传进度（2-10秒，根据文件大小）
   - 实时更新进度与速度
   - 上传完成后触发`upload-success`事件
   - 所有文件完成后触发`all-uploaded`事件

### 技术要点
- 使用Arco Design组件（`a-progress`、`a-button`、`a-tag`、`a-tooltip`）
- TypeScript类型约束（Props、Emits、FileStatus、UploadFileItem）
- 响应式布局（移动端适配）
- 文件图标映射（复用`/figma/3883_5466/`资源）
- 独立样式文件（`file-upload.scss`）

### 待集成功能（P7.2）
- 真实的分片上传逻辑（`useFileUpload` composable）
- 基于IndexedDB的断点续传
- AbortController实现真实的暂停/继续
- 文件SHA-256哈希计算
- 分片合并逻辑

## 产出文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `src/components/business/FileUpload.vue` | 新增 | 文件上传组件 |
| `src/components/business/file-upload.scss` | 新增 | 独立样式文件 |
| `docs/exec/task_P7.1.md` | 新增 | 本执行记录 |

## 技术要点

- 使用 `a-upload` 组件的 `custom-request` 模式
- 使用 `p-limit` 控制并发上传数量
- 文件图标映射复用 P6.2 已有的 `getFileIcon` 逻辑
- 暂停/继续通过 `AbortController` 实现（P7.2 提供）
- 进度与速度实时计算并通过回调更新
