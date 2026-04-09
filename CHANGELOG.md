# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed - 2026-04-08

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
