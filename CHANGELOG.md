# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2026-04-09

#### 老代码遗漏逻辑补充（按 P 级优先级）

- **P0-1 上传错误分类处理**: 新增 `src/types/upload-error.ts`，定义 `UploadErrorType` 枚举和 `classifyUploadError` 函数，对齐老代码 `onError` 中的错误分类（登录过期、文件已存在、文件正在上传、文件名超长、拒绝访问等），`useTransUpload.ts` 的 `catch` 块使用错误分类替代简单 `error.message`
- **P0-2 取消上传通知后端**: 新增 `cancelUploadApi` API（`UploadHandler?act=cancel`），`cancelUpload` 方法在取消上传时通知后端清理临时分片文件，对齐老代码 `onCancel` 逻辑
- **P0-3 文件名/路径合法性校验**: 新增 `src/utils/upload-validator.ts`，实现 `validateFileName` 和 `validateFilePath`，对齐老代码 `onSubmit` 校验（黑名单字符 `blackList`、文件名长度 `maxLength4Name`、路径长度 `maxLength4Path`），两个上传页面在上传前批量校验

- **P1-4 分片哈希传后端**: `uploadSingleChunk` 将 `qqhashcode` 附到 FormData，对齐老代码 `onUploadChunk` 将分片哈希传给后端
- **P1-5 存储空间上限校验**: 新增 `getStorageInfo` API（`UploadHandler?act=storage`），`useTransUpload` 新增 `checkStorageSpace` 方法，两个上传页面在上传前检查总空间是否超限，对齐老代码 `onValidate`
- **P1-6 自动重试机制**: `useTransUpload.ts` 的 `catch` 块中，对可重试错误（网络错误、服务端 5xx）自动重试最多 3 次（`MAX_AUTO_RETRY`），每次间隔 2 秒，对齐老代码 `retry.enableAuto: true, autoAttempts: 3`

- **P2-7 小文件预计算哈希**: 对 ≤4MB 的文件，在分片上传前预计算 SHA256 哈希（`preCalculatedHash`），避免上传后再计算，对齐老代码 `onUpload` 中小文件先算 hash 的逻辑
- **P2-9 服务端耗时/剩余时间展示**: `HashVerifyState` 新增 `elapsedTime`/`timeLeft` 字段，从分片上传响应中解析，`TransFileTable.vue` 在校验中和校验通过时展示耗时/剩余时间信息

#### API 变更

- `transWebService.ts`: 新增 `cancelUploadApi`、`getStorageInfo`，`UploadResponse` 已有 `elapsedTime`/`timeLeft` 字段（补充注释）
- `useTransUpload.ts`: `cancelUpload` 签名改为 `(fileId: string, params?: string)`，`batchCancel` 签名改为 `(params?: string)`

### Fixed - 2026-04-09

#### 进度条修复

- **修复进度条立即打满**: `useTransUpload.ts` 分片上传完成后不再用 `uploadedCount / totalChunks * 100` 暴力赋值进度，改为基于精确字节数计算；上传阶段进度上限99%，完成校验后才到100%
- **断点续传进度基准修正**: 恢复已上传分片时使用精确字节累加（考虑最后一个分片非整块），替代 `count * CHUNK_SIZE`

#### 哈希校验逻辑对齐老项目

- **哈希校验改为无限轮询**: `useTransUpload.ts` 去掉30次重试上限，对齐老代码 `getServerHashTimer` 逻辑，服务端大文件算哈希可能很慢，需无限轮询直到 `serverFileHashCode.length === 64`
- **双端哈希都有效才比对**: 对齐老代码 `validHashTimer` 逻辑，`clientFileHashCode` 和 `serverFileHashCode` 都有有效值后才进行比对
- **去掉 `skipped` 状态**: 哈希校验不再有超时跳过的场景，状态只保留 `matched` / `mismatched` / `pending`
- **`getHashVerifyStatus` 增加长度校验**: `clientFileHashCode` 需长度为64才视为有效，与老代码 `clientFileHashCode.length === 64` 一致
- **自动提交逻辑适配**: 去掉 `skipped` 判断，只有 `matched` 才视为校验通过

#### 重复上传拦截优化

- **提示文案优化**: 从"以下文件已上传，已跳过"改为"XX文件在服务器上已存在，请勿重复上传"
- **比对逻辑增强**: 同时检查 `clientFileHashCode` 和 `hashCode`，任一有效且匹配即视为已存在
- 涉及文件: `StepTwoUploadFile.vue`, `TransUploadView.vue`

#### 重复上传拦截增加文件名校验

- **同hash不同文件名放行**: hash 相同但文件名不同的文件不再被拦截，只有 hash + 文件名都匹配才视为重复
- 涉及文件: `StepTwoUploadFile.vue`, `TransUploadView.vue`

#### 已上传文件 hashCode 为 null 时延迟刷新

- **问题**: 上传完成后立即 `loadFileList` 刷新已上传列表，此时后端 `hashCode` 还没算完，FileListHandler 返回 null，导致显示"未校验"
- **修复**: 新增 `refreshFileListWithRetry` 函数，上传完成后延迟刷新文件列表（最多3次/3秒间隔），直到 `hashCode` 有值
- 涉及文件: `StepTwoUploadFile.vue`, `TransUploadView.vue`

#### 上传组件 Bug 修复

- **修复进度条立即打满问题**: 在 `useTransUpload.ts` 的 `uploadFile` 函数中，向 `uploadSingleChunk` 传入 `onProgress` 回调，利用 axios `onUploadProgress` 将单分片内的字节进度实时映射到整体进度，替代原有的分片计数式跳变更新
- **修复自动提交勾选未生效**: 在 `StepTwoUploadFile.vue` 中添加 `watch` 监听 `uploadFileList` 变化，当所有文件上传完毕且哈希校验通过后自动调用 `confirmUpload` 并 emit `confirmed` 事件
- **移除 `debugger` 语句**: 清理 `StepTwoUploadFile.vue` 中遗留的 `debugger`

### Added - 2026-04-08

#### 已上传文件列表增强

- **单行删除按钮**: 已上传文件列表每行末尾增加"删除"文字按钮，支持单文件快速删除
- **SHA256 校验状态展示**: 已上传文件列表展示截断的 SHA256 哈希值（前8位...后4位），并通过颜色标记和状态标签展示校验结果（通过/未通过/未校验）
- **新增 emit 事件**: `TransFileTable` 组件新增 `delete-uploaded-file` 事件

### Changed - 2026-04-08

- `TransFileTable.vue` 已上传列表项布局从水平排列改为上下排列，以容纳更多文件信息
- 隐式 `any` 类型修复：`TransFileTable.vue`、`StepTwoUploadFile.vue` 中所有回调参数添加显式类型注解
- 移除未使用的 `IconFile` import 和 `uploading` 变量
- 重构自动提交 watch：从 `vue` 的 `watch + deep: true` 改为 VueUse 的 `watchDeep`，更简洁且语义明确
- 新增 `@vueuse/core` 依赖（已在 `package.json` 声明，本次确认安装到 node_modules）

### Added - 2026-04-08 (第二轮)

#### 重复上传拦截

- **SHA256 重复检测**: 上传文件时自动计算 SHA256 哈希值，与已上传且校验通过的文件进行双重比对（`clientFileHashCode === hashCode === fileHash`），拦截重复上传
- **重复提示**: 被拦截的文件名以警告提示展示给用户，未重复的文件正常上传

#### TransUploadView 功能对齐

- **自动提交**: 新增 `autoSubmitAfterUpload` 勾选框 + `watchDeep` 监听，上传完毕自动 `confirmUpload`
- **重复上传拦截**: 与 StepTwoUploadFile 一致的 SHA256 双重比对逻辑
- **已上传文件单个删除**: 新增 `handleDeleteUploadedFile` 方法 + `@delete-uploaded-file` 事件绑定
- **已上传列表 show-hash-status**: 已上传文件列表新增 `:show-hash-status="true"` prop
- **移除调试日志**: 删除 `updateUploadProgress` 中的 `console.log`

### Fixed - 2026-04-09

#### 哈希校验判断逻辑修复

- **问题**: 后端 `FileListHandler` 返回的 `hashCode` 始终为字符串 `"null"`，导致 `getHashVerifyStatus` 比对 `hashCode === clientFileHashCode` 永远为 `mismatched`
- **问题**: `updateClientHash` 在 HASH 校验之前调用，导致 `clientFileHashCode` 有值仅代表"客户端算过"，不代表"校验通过"
- **修复**: `useTransUpload.ts` 将 `updateClientHash` 调用移到 `UploadHandler?act=HASH` 返回 `success:true` 之后，确保 `clientFileHashCode` 有值 = 后端确认校验通过
- **修复**: `TransFileTable.vue` 的 `getHashVerifyStatus` 改为仅判断 `clientFileHashCode` 是否有有效值（非空且非 `"null"`），不再依赖 `hashCode`
- **修复**: `StepTwoUploadFile.vue` 和 `TransUploadView.vue` 的重复上传拦截逻辑，改为仅比对 `clientFileHashCode === fileHash`

### Added - 2026-04-03

#### 申请单管理（管理员）功能

- **新增页面**: `/admin/applications` - 管理员申请单管理页面
- **新增类型**: `AdminApplicationRecord`, `AdminApplicationFilters` 等类型定义
- **新增API**: `getAdminApplicationByPage` - 获取管理员视角申请单列表
- **新增Composable**: `useAdminApplication` - 申请单管理业务逻辑
- **新增组件**: `AdminApplicationDetailModal` - 申请单详情全屏对话框

#### 功能特性

- 多条件筛选：申请单号、申请人、下载人、安全等级、源/目标区域、时间范围
- 响应式网格布局：3列 → 2列 → 1列 自适应
- 分页表格展示：支持排序、固定列、状态着色
- 详情查看：基本信息、文件列表、资产检测、流程进展

#### 样式优化

- 筛选区域：渐变背景、图标前缀、响应式布局
- 表格：状态标签着色、文本溢出省略
- 对话框：90%宽度、85vh高度、居中显示

### Fixed - 2026-04-03

- 修复对话框不显示问题：添加 `ref`、`IconEye` 导入及组件引用
- 修复筛选区域布局问题：改用固定列数网格布局
- 修复对话框尺寸过大问题：调整为 90% 宽度、85vh 高度

---

## 初始化版本

项目基础架构搭建完成，包含：

- Vue 3 + TypeScript + Vite 前端框架
- Arco Design Vue 组件库
- Pinia 状态管理
- Vue Router 路由管理
- Axios 请求封装
