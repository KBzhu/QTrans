# 大文件上传 Hash 计算修复任务

## 问题描述

上传大文件（5GB 及以上）时，`calculateSHA256(file)` 使用 `file.arrayBuffer()` 一次性读取整个文件到内存，导致 `NotReadableError`。50GB 文件场景下该问题必然触发，上传流程完全中断。

## 根因分析

1. `transWebService.ts` 中 `calculateSHA256` 使用 `file.arrayBuffer()` 全量读取
2. `TransUploadView.vue` / `StepTwoUploadFile.vue` 上传前重复检测对所有文件调用全量 hash
3. `useTransUpload.ts` 上传完成后再次调用 `calculateSHA256(file)` 计算全文件 hash
4. 代码中不存在 Web Worker 实现，hash 计算全在主线程

## 修复方案

采用**方案3：边上传边累积 hash**，核心原则：
- 引入 `hash-wasm` 支持流式 SHA-256 计算
- 大文件上传前跳过全量 hash 重复检测
- 上传分片的同时将分片数据喂给流式 hasher
- 上传完成后直接取 hasher.digest()，零额外文件读取

## 子任务清单

- [√] 安装 `hash-wasm` 依赖
- [√] 重写 `transWebService.ts` `calculateSHA256` 为流式实现
- [√] `transWebService.ts` 增加 `calculateChunkHashFromBuffer` 辅助函数
- [√] 改造 `useTransUpload.ts` `uploadSingleChunk` 支持传入 fileHasher
- [√] 改造 `useTransUpload.ts` `uploadFile` 边上传边累积 hash
- [√] 改造 `useTransUpload.ts` 重试逻辑边上传边累积 hash
- [√] 优化 `TransUploadView.vue` 上传前大文件跳过全量 hash 检测
- [√] 优化 `StepTwoUploadFile.vue` 上传前大文件跳过全量 hash 检测
- [√] 更新 `CHANGELOG.md`
- [√] 记录 `failedLog.md`
- [√] 验证 lint 通过
