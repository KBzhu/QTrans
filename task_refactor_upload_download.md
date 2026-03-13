# 重构任务：useApplicationForm 和 TransDownloadView

> 将模拟上传逻辑替换为真实 API 调用，将下载页面列表组件化

## 1. useApplicationForm.ts 改造

### 现状问题
- 纯模拟实现，使用 `setInterval` 假进度
- 无真实 API 调用
- 无断点续传支持
- 无分片上传支持

### 改造方案
- [ ] 将上传逻辑委托给 `useTransUpload`
- [ ] 保留表单状态管理（formData, currentStep 等）
- [ ] 新增 `initUploadParams()` 方法获取上传参数
- [ ] 适配 `StepTwoUploadFile.vue` 组件

## 2. TransDownloadView.vue 改造

### 现状问题
- 手写列表模板，代码重复
- 未使用通用组件

### 改造方案
- [ ] 扩展 `TransFileTable` 支持下载场景
- [ ] 新增 `mode="download"` 模式
- [ ] 支持文件夹和文件混合显示
- [ ] 支持进入目录操作

## 执行记录

### 2024-03-13

#### 已完成

1. **扩展 TransFileTable 支持下载模式**
   - 新增 `mode="download"` 支持
   - 支持文件夹和文件混合显示
   - 支持进入目录、批量下载、进度显示

2. **改造 TransDownloadView.vue**
   - 使用 TransFileTable 组件替代手写模板
   - 代码量从 335 行减少到 140 行
   - 功能完全保留

3. **useApplicationForm 决策**
   - 保持模拟上传模式（符合 SSD 流程：纯前端演示 + Mock）
   - 申请表单与传输页面是不同业务场景，各自独立

#### 决策说明

| 组件 | 业务场景 | 上传逻辑 | 决策 |
|------|----------|----------|------|
| `StepTwoUploadFile.vue` | 申请表单 | 模拟上传 | 保持不变 |
| `TransFileTable.vue` | TransWebService | 真实 API + 断点续传 | 已扩展 |

#### 文件变更

| 文件 | 操作 |
|------|------|
| `TransFileTable.vue` | 扩展 - 新增下载模式 |
| `trans-file-table.scss` | 扩展 - 新增下载样式 |
| `TransDownloadView.vue` | 重构 - 使用 TransFileTable |

### 验证结果

- [√] Linter 检查通过
- [√] 类型检查通过
