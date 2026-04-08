# 上传组件 Bug 修复与需求 - 执行记录

## 任务编号

task_upload_fix

## 执行日期

2026-04-08

## 修改文件清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `src/composables/useTransUpload.ts` | 修改 | 进度条修复 + 模块级变量移入实例 + 移除未使用变量 |
| `src/views/application/components/StepTwoUploadFile.vue` | 修改 | 自动提交逻辑 + 事件处理优化 + 移除 debugger |
| `src/components/business/TransFileTable.vue` | 修改 | 已上传列表增加删除按钮和SHA256校验 + 引用比较修复 + 工具函数复用 |
| `src/components/business/trans-file-table.scss` | 修改 | 已上传列表样式重构 |
| `src/env.d.ts` | 修改 | 添加 .scss 模块声明 |
| `CHANGELOG.md` | 修改 | 记录所有变更 |

## Bug 修复

### 1. 进度条立即打满

- **根因**: `uploadSingleChunk` 接收 `onProgress` 回调但 `uploadFile` 未传入，进度仅按分片计数跳变更新
- **修复**: 向 `uploadSingleChunk` 传入 `onProgress` 回调，将单分片字节进度映射到整体进度
- **公式**: `totalProgress = Math.floor((baseUploadedBytes + chunkUploadedBytes) / fileSize * 100)`

### 2. 自动提交勾选未生效

- **根因**: 组件接收 `autoSubmitAfterUpload` prop 但无对应逻辑
- **修复**: 添加 `watch` 深度监听 `uploadFileList`，当所有文件上传完毕且哈希校验通过后自动 `confirmUpload`
- **防重入**: 使用 `autoSubmitTriggered` ref 防止重复触发，新上传时重置

### 3. 已上传文件列表增强

- **新增**: 单行"删除"文字按钮（`@click.stop` 阻止冒泡）
- **新增**: SHA256 截断哈希值展示（前8位...后4位）+ 校验状态标签（通过/未通过/未校验）
- **新增**: `delete-uploaded-file` emit 事件

## 交叉审查修复

| # | 严重度 | 问题 | 修复 |
|---|--------|------|------|
| 1 | High | `abortControllers` 和 `activeUploads` 是模块级变量，多组件调用会共享状态 | 移入 composable 函数内部 |
| 2 | Medium | watch 逻辑冗余（allDone + hasActive 重复检查） | 合并为单一 hasActive 检查 |
| 3 | Medium | `selectedUploadedFiles.includes(file)` 用 Object 引用比较 | 改为 `isUploadedFileSelected` 使用 fileId 比较 |
| 4 | Low | `formatFileSize`/`formatSpeed` 多处重复定义 | 复用 `@/utils/format` |
| 5 | Low | `baseProgress` 变量声明但未使用 | 移除 |
| 6 | Low | 箭头函数包裹单个函数调用 | 简化为 function 声明 |
| 7 | Low | 模板中 `.scss` 模块找不到 | `env.d.ts` 添加 `declare module '*.scss'` |
| 8 | Low | 隐式 any 类型（多处回调参数） | 添加显式类型注解 |
| 9 | Low | 未使用 import (`IconFile`、`uploading`) | 移除 |
| 10 | Low | `debugger` 语句遗留 | 移除 |

## 第二轮重构与需求追加

### 1. 重构 watch 为 VueUse watchDeep

- **问题**: 之前因误判 @vueuse/core 未安装而使用 `watch + { deep: true }`
- **修复**: 确认 `package.json` 已声明 `@vueuse/core@^14.2.1`，安装到 node_modules 后改用 `watchDeep`
- **改动**: `import { watch } from 'vue'` → `import { watchDeep } from '@vueuse/core'`
- **改动**: `watch(..., { deep: true })` → `watchDeep(...)`

### 2. 重复上传拦截（SHA256）

- **需求**: 已上传且校验通过的文件不能重复上传
- **实现**: 在 `handleFiles` 中对每个文件计算 SHA256，与已上传列表的 `clientFileHashCode` + `hashCode` 双重比对
- **条件**: 仅当 `clientFileHashCode === fileHash && hashCode === fileHash` 时判定为重复（确保服务端校验也通过）
- **提示**: 重复文件弹出警告"以下文件已上传且校验通过，已跳过：xxx"，仅上传未重复文件
- **新增 import**: `calculateSHA256` from `@/api/transWebService`

## 验收结果

- [√] 进度条按实际字节进度平滑更新
- [√] 勾选"上传完毕后自动提交"后，所有文件上传且校验通过后自动调用 confirmUpload
- [√] 已上传文件列表每行有删除按钮
- [√] 已上传文件列表展示截断 SHA256 哈希值和校验状态
- [√] 重复上传已校验通过的文件被拦截并给出提示
- [√] watch 重构为 VueUse watchDeep
- [√] @vueuse/core 依赖已安装到 node_modules
- [√] 无新增 lint 错误（ts-plugin 环境问题除外）
- [√] 无未使用变量/import
