---
name: code-review-web-worker-refactor
overview: 审查暂存区 Web Worker 重构相关代码（12个文件），发现并修复：P0级 CHUNK_SIZE 不一致、retryFileHasher 内存泄漏、item.file 空安全问题；以及 DRY 违反、死代码等中等问题。
todos:
  - id: fix-chunk-size
    content: 修复 CHUNK_SIZE 数据源不一致：删除 transWebService 硬编码，统一引用 constants.ts
    status: completed
  - id: fix-retry-hash-leak
    content: 修复 retryFileHasher 内存泄漏：将变量提升到外层并在 finally 中 dispose
    status: completed
  - id: fix-null-safety
    content: 修复 item.file 空安全：为 pauseUpload/cancelUpload/batchDeleteUploaded 添加 null 守卫
    status: completed
  - id: cleanup-dead-code
    content: 清理死代码：删除无引用的 useUploadHashWorker.ts
    status: completed
  - id: fix-dry-format
    content: 消除 DRY 违反：提取 formatFileSize/formatSpeed 到共享位置并统一导入
    status: completed
  - id: update-changelog
    content: 更新 CHANGELOG 记录本次审查修复内容
    status: completed
    dependencies:
      - fix-chunk-size
      - fix-retry-hash-leak
      - fix-null-safety
      - cleanup-dead-code
      - fix-dry-format
---

## 产品概述

对 git 暂存区及新增的代码文件进行全面交叉审查，修复发现的 bug、死代码、逻辑缺陷和安全隐患，并更新 CHANGELOG。

## 核心问题清单（经 Oracle AI + 手动双确认）

### P0 级别（必须修复）

1. **CHUNK_SIZE 不一致导致分片计算错位**：`transWebService.ts` 硬编码 4MB，`constants.ts` 定义 5MB，`useFileChunk` 使用 constants 的值，`useTransUpload` 使用 transWebService 的 `getChunkSize()` 返回 4MB -- 分片大小不一致会导致断点续传分片索引越界、进度计算错误`useUploadHashWorker`。
2. **retryFileHasher 内存泄漏**：`useTransUpload.ts` 重试路径创建的流式 hasher 在 finally 块中从未被 dispose。
3. **item.file 空指针崩溃风险**：`pauseUpload`/`cancelUpload`/`batchDeleteUploaded` 直接访问 `item.file.name`，但断点续传恢复的任务 `file` 可能为 null。

### P1 级别（建议修复）

4. **useUploadHashWorker.ts 死代码**：仅自身引用，无任何外部 import，是 useHashWorker 的无意义包装层。
5. **formatFileSize/formatSpeed DRY 违反**：在 `transWebService.ts` 和 `useTransUpload.ts` 中重复定义相同函数。

## 技术栈

- Vue 3 Composition API + TypeScript
- Vitest 测试框架（已有 upload-validator 和 hash-utils 测试）
- 项目约定：CSS 复用用 less mixin、错误写 failedLog.md、变更记录 CHANGELOG

## 实施方案

### 修复 1：统一 CHUNK_SIZE 为单一数据源（P0-1）

- 删除 `transWebService.ts` 中第 98-99 行硬编码的 `CHUNK_SIZE = 4 * 1024 * 1024`
- 改为从 `@/utils/constants` 导入 CHUNK_SIZE
- `getChunkSize()` 函数改为直接返回导入的常量
- `useTransUpload.ts` 第 48 行无需修改，它已调用 `getChunkSize()`
- `useFileChunk.ts` 已正确使用 constants，无需改动
- 效果：所有模块统一使用 `constants.ts` 中唯一的 `CHUNK_SIZE = 5 * 1024 * 1024`

### 修复 2：retryFileHasher 内存泄漏（P0-2）

- 将 `retryFileHasher` 声明位置从 try 内部的重试 catch 块提升到外层 try 块之前（与 `fileHasher` 同级）
- 在 finally 块中同时 dispose `retryFileHasher` 和 `fileHasher`
- 具体改动：
- 第 579 行附近增加 `let retryFileHasher: StreamFileHasher | null = null`
- 第 824 行改为赋值而非声明：`retryFileHasher = await createStreamFileHasher(file.size)`
- 第 961-964 行 finally 块增加 `if (retryFileHasher) { await retryFileHasher.dispose() }`

### 修复 3：item.file 空安全守卫（P0-3）

- `pauseUpload`（~1052行）：在访问 `item.file.name` 前加 `if (!item.file)` 提前 return 并 warn
- `cancelUpload`（~1170行）：同上
- `batchDeleteUploaded`（~1276行）：过滤掉 `!item.file` 的条目或跳过

### 修复 4：清理死代码（P1-1）

- 删除 `src/composables/useUploadHashWorker.ts` 文件
- 确认无外部引用后移除（已验证：全局搜索仅自身引用）

### 修复 5：消除 DRY 违反（P1-2）

- 将 `formatFileSize` 和 `formatSpeed` 提取到共享位置（如 `src/utils/file-utils.ts` 或复用 `transWebService.ts` 已导出的版本）
- `useTransUpload.ts` 改为导入使用