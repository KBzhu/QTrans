# Changelog

所有重要变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，并遵循语义化记录方式。

## [Unreleased]

### Added
- 新增 `src/composables/useUploadHashWorker.ts`，作为兼容层衔接新的 `useHashWorker` 双 Worker 架构。
- 新增 `src/composables/useHashWorker.ts`，封装 `HashWorker` 的全量哈希、流式哈希与降级逻辑。
- 新增 `src/composables/useUploadPrepWorker.ts`，封装 `UploadPrepWorker` 的分片切片、读取与预处理逻辑。
- 新增 `src/workers/hash.worker.ts`、`src/workers/upload-prep.worker.ts`、`src/types/worker-messages.ts`，形成完整的双 Worker 通信层。
- 新增 `src/workers/shared/hash-utils.ts` 与 `src/workers/shared/hash-utils.spec.ts`，沉淀共享哈希工具与基础测试。
- 新增 `src/utils/__tests__/upload-validator.spec.ts`，覆盖服务端重名、上传队列重名与本次选择重名场景。
- 新增 `docs/exec/task_web_worker_exec.md`、`docs/exec/task_web_worker_P2_exec.md` 与 `docs/exec/task_web_worker_acceptance_exec.md`，记录 Web Worker 上传链路改造与验收过程。
- 新增 `docs/guides/quickstart-upload-worker-refactor.md`，汇总双 Worker 重构说明、验收清单与 QA 回归步骤。


### Changed
- `src/composables/useTransUpload.ts` 升级为完整双 Worker 调度模式：主线程仅负责状态管理、FormData 组装与网络请求，分片预处理与流式哈希迁移至 Worker。
- `src/composables/useFileChunk.ts` 对齐新的 HashWorker 路径，支持 Worker 计算与主线程降级。
- `src/api/transWebService.ts` 为旧哈希工具补充废弃说明，明确双 Worker 升级后的推荐入口。
- `src/views/trans/TransUploadView.vue` 与 `src/views/application/components/StepTwoUploadFile.vue` 统一复用公共重名冲突检测与 VueUse 轮询能力。
- `src/utils/upload-validator.ts` 扩展为同时负责文件名合法性校验和上传冲突分类。
- `docs/tasks/task_web_worker.md`、`docs/tasks/task_web_worker_P2.md` 补充本次任务目标、范围与拆解步骤。


### Fixed
- 修复上传中的文件不会执行重名校验的问题，避免上传列表同时出现多个同名上传任务。
- 修复两个上传入口重名判断逻辑分叉的问题，保证外网上传页与申请单上传步骤行为一致。
