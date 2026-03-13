# P7 & P11 统一实现任务

> 按照 `docs/design/P7_P11_Unified_Design.md` 设计文档实现

## 1. API 层增强

- [√] 新增 `getUploadedChunks` API 接口封装
- [√] 新增 `pauseUpload` API 接口封装

## 2. IndexedDB 数据库

- [√] 创建 `src/utils/upload-db.ts` 断点续传数据库

## 3. Composable 增强

- [√] 迁移 IndexedDB 断点续传逻辑到 `useTransUpload.ts`
- [√] 新增批量操作方法
- [√] 新增并发控制（最大 3 个并发）

## 4. 通用组件

- [√] 创建 `TransFileTable.vue` 通用文件表格组件
- [√] 创建 `trans-file-table.scss` 样式文件

## 5. 页面改造

- [√] 改造 `TransUploadView.vue` 使用 TransFileTable + 批量操作
- [ ] 改造 `StepTwoUploadFile.vue` 使用新架构（可选：useApplicationForm 仍为模拟模式）
- [ ] 改造 `TransDownloadView.vue` 使用 TransFileTable（待完成）

## 6. 清理工作

- [√] 删除 `useFileUpload.ts`
- [√] 删除 `file.ts` (Mock API)
- [√] 删除 `FileUpload.vue` 及测试文件

## 7. 文档更新

- [√] 更新 `docs/diff/P7_P11_Upload_Diff.md`

## 执行记录

### 2024-03-13

已完成主要功能：
1. 新增 `upload-db.ts` IndexedDB 数据库
2. 新增 `getUploadedChunks` 和 `pauseUpload` API
3. 增强 `useTransUpload.ts` 支持断点续传、分片哈希校验、批量操作
4. 创建 `TransFileTable.vue` 通用组件
5. 改造 `TransUploadView.vue` 使用新架构
6. 删除旧的 Mock API 和未使用的组件

### 待后端配合

后端需要新增 `GET /Handler/UploadHandler?act=chunks` 接口，用于查询已上传分片状态。
