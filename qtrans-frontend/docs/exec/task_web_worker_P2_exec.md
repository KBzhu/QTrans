# Web Worker 双 Worker 架构升级 - 执行记录

## 任务编号

`task_web_worker_P2`

## 执行日期

2026-04-23

## 执行步骤

- [ √ ] 2.1 设计双 Worker 通信协议与目录结构
- [ √ ] 2.2 实现 `HashWorker` 与桥接 composable
- [ √ ] 2.3 实现 `UploadPrepWorker` 与桥接 composable
- [ √ ] 2.4 接入上传主流程与断点续传流式哈希
- [ √ ] 2.5 补充测试、执行记录与变更文档

## 产出文件清单

- `src/types/worker-messages.ts`
- `src/workers/hash.worker.ts`
- `src/workers/upload-prep.worker.ts`
- `src/workers/shared/hash-utils.ts`
- `src/workers/shared/hash-utils.spec.ts`
- `src/composables/useHashWorker.ts`
- `src/composables/useUploadPrepWorker.ts`
- `src/composables/useUploadHashWorker.ts`
- `src/composables/useFileChunk.ts`
- `src/composables/useTransUpload.ts`
- `src/api/transWebService.ts`
- `docs/tasks/task_web_worker_P2.md`
- `docs/exec/task_web_worker_P2_exec.md`
- `CHANGELOG.md`
- `failedLog.md`

## 验收要点

- [√] 上传链路存在独立的 `HashWorker` 与 `UploadPrepWorker`。
- [√] 主线程不再直接负责分片 `slice` / `arrayBuffer` 读取与流式 hash 累积。
- [√] `useTransUpload.ts` 仅负责调度、状态管理与网络请求组装。
- [√] Worker 不可用时可自动降级到主线程实现。
- [√] 已修复的上传队列重名校验行为保持不变。
- [√] `vitest` 已通过：`hash-utils.spec.ts` + `upload-validator.spec.ts`。
- [√] `npx vue-tsc --noEmit -p tsconfig.app.json` 已通过。

