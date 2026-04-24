# Web Worker 双 Worker 架构升级任务

## 目标

- 在现有哈希 Worker 化基础上，升级为 `HashWorker + UploadPrepWorker` 双 Worker 分层模型。
- 将流式全文件哈希、全量文件哈希、分片哈希统一收敛到 `HashWorker`。
- 将分片切片、`ArrayBuffer` 读取、上传分片预处理迁移到 `UploadPrepWorker`。
- 保持 `useTransUpload.ts` 仅负责上传调度、状态机与网络请求，不回退已修复的重名校验行为。
- 增加 Worker 通信协议类型、降级策略与清理逻辑，保证可维护性。

## 影响范围

- `src/workers/*`
- `src/composables/useHashWorker.ts`
- `src/composables/useUploadPrepWorker.ts`
- `src/composables/useTransUpload.ts`
- `src/composables/useFileChunk.ts`
- `src/api/transWebService.ts`
- `src/types/worker-messages.ts`
- `src/utils/__tests__/*`
- `docs/exec/*`
- `CHANGELOG.md`
- `failedLog.md`

## 子任务

- [ √ ] 2.1 设计双 Worker 通信协议与目录结构
- [ √ ] 2.2 实现 `HashWorker` 与桥接 composable
- [ √ ] 2.3 实现 `UploadPrepWorker` 与桥接 composable
- [ √ ] 2.4 接入上传主流程与断点续传流式哈希
- [ √ ] 2.5 补充测试、执行记录与变更文档

