# Web Worker 上传链路优化 - 执行记录

## 任务编号

`task_web_worker`

## 执行日期

2026-04-23

## 执行步骤

- [ ] 1.1 读取现有上传链路与 VueUse 能力，确认改造落点
- [ ] 1.2 新增 Worker 哈希能力并接入 `useTransUpload`
- [ ] 1.3 用 VueUse 重构定时轮询与保活逻辑
- [ ] 1.4 抽取公共重名检测并修复上传中同名任务 bug
- [ ] 1.5 补充测试、变更记录与验收结论

## 产出文件清单

- `src/composables/useUploadHashWorker.ts`
- `src/composables/useTransUpload.ts`
- `src/views/trans/TransUploadView.vue`
- `src/views/application/components/StepTwoUploadFile.vue`
- `src/utils/upload-validator.ts`
- `src/utils/__tests__/upload-validator.spec.ts`
- `docs/tasks/task_web_worker.md`
- `docs/exec/task_web_worker_exec.md`
- `CHANGELOG.md`
- `failedLog.md`

## 验收要点

- [√] 上传过程中的分片哈希计算不再直接阻塞主线程。
- [√] 上传保活、Token 刷新、文件列表轮询改为可控的 VueUse 定时能力。
- [√] 上传队列内已有同名文件时，新增文件会被拦截，不再生成重复上传任务。
- [√] 两个上传入口的重名校验行为保持一致。
- [√] `src/utils/__tests__/upload-validator.spec.ts` 已通过（3/3）。

