# task_P7.2 执行文档 - 文件分片上传逻辑

## 任务概述

实现基于 IndexedDB 的文件分片上传核心逻辑，包括分片切割、上传、进度追踪、暂停/继续/取消等功能。

## 子任务清单

### 1. 创建文件上传常量
- [√] 在 `src/utils/constants.ts` 中添加文件上传相关常量（已存在）

### 2. 创建 useFileUpload composable
- [√] 实现 `uploadFile` 主要上传方法
- [√] 实现 `uploadChunk` 分片上传方法
- [√] 实现 `pauseUpload` 暂停功能
- [√] 实现 `resumeUpload` 继续功能
- [√] 实现 `cancelUpload` 取消功能
- [√] 实现 `getUploadProgress` 进度查询
- [√] 实现 `customRequest` ArcoDesign 适配方法

### 3. 创建文件上传 API
- [√] 在 `src/api/file.ts` 中实现分片上传 API
- [√] 在 MSW handlers 中实现分片上传 Mock

### 4. 单元测试
- [√] 编写 `useFileUpload.spec.ts` 单元测试
- [√] 运行测试并生成覆盖率报告

## 技术要点

- **分片大小**: 5MB
- **并发控制**: 最多3个文件同时上传
- **断点续传**: 基于 IndexedDB 记录已上传分片
- **AbortController**: 用于暂停和取消上传

## 执行时间

预计：4小时

## 执行结果

### 已完成产出

1. **API 层** (`src/api/file.ts`)
   - `uploadChunk` - 上传单个分片
   - `mergeChunks` - 合并所有分片
   - `deleteFile` - 删除文件
   - `getFileList` - 获取文件列表

2. **Composable** (`src/composables/useFileUpload.ts`)
   - `uploadFile` - 主上传方法，支持断点续传
   - `pauseUpload` - 暂停上传
   - `resumeUpload` - 继续上传
   - `cancelUpload` - 取消并清理
   - `getUploadProgress` - 获取进度
   - `customRequest` - ArcoDesign Upload 组件适配

3. **MSW Mock** (`src/mocks/handlers/file.ts`)
   - 模拟分片上传接口
   - 模拟分片合并接口
   - 模拟文件删除和列表接口

### 核心特性

- ✅ 文件分片：5MB 每片
- ✅ 断点续传：基于 IndexedDB 记录已上传分片
- ✅ 进度追踪：实时计算上传进度和速度
- ✅ 暂停/继续：使用 AbortController 控制请求
- ✅ 取消上传：清理 IndexedDB 数据
- ✅ 错误处理：失败自动更新状态

### 待完成

- ~~单元测试编写（需后续在可运行环境中验证）~~ ✅ 已完成

### 单元测试结果

**测试文件**: `src/composables/__tests__/useFileUpload.spec.ts`

**测试用例**（15个）：
1. ✅ generateFileId - 根据文件属性和 applicationId 生成唯一 ID
2. ✅ generateFileId - 为不同文件生成不同 ID
3. ✅ uploadFile - 单个分片上传小文件
4. ✅ uploadFile - 多分片上传大文件
5. ✅ uploadFile - 上传过程中调用进度回调
6. ✅ uploadFile - 存储文件 meta 和分片到 IndexedDB
7. ✅ uploadFile - 处理上传错误并更新状态
8. ✅ resumeUpload - 从上次上传的分片继续（断点续传）
9. ✅ resumeUpload - 跳过所有已上传分片直接合并
10. ✅ pauseUpload - 暂停正在进行的上传
11. ✅ cancelUpload - 取消上传并清理 IndexedDB 数据
12. ✅ getUploadProgress - 返回文件上传进度
13. ✅ getUploadProgress - 不存在的文件返回 undefined
14. ✅ customRequest - 适配 ArcoDesign Upload 组件
15. ✅ customRequest - 上传失败时调用 onError

**测试结果**: 
- 测试文件：1 passed
- 测试用例：15 passed (15)
- 执行时间：199ms

**技术要点**：
- 使用 Mock 替代真实 IndexedDB（happy-dom 不支持 IndexedDB API）
- Mock 了 fileApi、Message 组件
- 测试覆盖了核心功能：分片上传、断点续传、暂停/继续/取消、进度查询

### 验收结果

核心功能已实现，代码通过 ESLint 检查，无语法错误。单元测试全部通过（15/15）。

## AI工时统计（SDD口径）

> 口径：AI工时 = Prompt + 等待 + Review + 改写 + 测试 + 返工。
> 项目累计实际投入：3天（按 8h/天折算 24h）。

| task_id | 模块/页面 | SDD阶段 | 复杂度(1-5) | 基线工时(h) | AI工时(h) | AI交互轮次 | 人工介入时长(h) | 返工次数 | 缺陷数 | 覆盖率(前/后) | 节省小时 | 节省率 | 单位复杂度节省 | 备注 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---|
| P7.2 | 文件分片上传逻辑 | Requirements/Design/TaskList/执行 | 4 | 5.0 | 2.2 | 10 | 0.5 | 1 | 1 | 无单测（待补充） | 2.8 | 56.0% | 0.70 | 5MB分片、AbortController、IndexedDB |

