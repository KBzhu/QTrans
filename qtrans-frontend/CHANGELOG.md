# Changelog

所有重要变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，并遵循语义化记录方式。

## [Unreleased]

### Added
- 新增 `src/composables/useUploadHashWorker.ts`，基于 VueUse `useWebWorkerFn` 提供文件哈希与分片哈希的 Worker 计算能力。
- 新增 `src/utils/__tests__/upload-validator.spec.ts`，覆盖服务端重名、上传队列重名与本次选择重名场景。
- 新增 `docs/exec/task_web_worker_exec.md`，记录本次 Web Worker 上传链路改造执行过程。

### Changed
- `src/composables/useTransUpload.ts` 改为通过 Worker 处理小文件哈希、断点续传比对哈希与分片哈希，并使用 VueUse `useIntervalFn` 管理 Session 保活和 Token 刷新。
- `src/views/trans/TransUploadView.vue` 与 `src/views/application/components/StepTwoUploadFile.vue` 统一复用公共重名冲突检测与 VueUse 轮询能力。
- `src/utils/upload-validator.ts` 扩展为同时负责文件名合法性校验和上传冲突分类。
- `docs/tasks/task_web_worker.md` 补充本次任务目标、范围与拆解步骤。

### Fixed
- 修复上传中的文件不会执行重名校验的问题，避免上传列表同时出现多个同名上传任务。
- 修复两个上传入口重名判断逻辑分叉的问题，保证外网上传页与申请单上传步骤行为一致。
