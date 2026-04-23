# Web Worker 上传链路优化任务

## 目标

- 使用 VueUse 的 `useWebWorkerFn` 将上传链路中的重 CPU 哈希计算迁移到 Worker，降低主线程阻塞。
- 使用 VueUse 的 `useIntervalFn` 重构保活、Token 刷新与列表轮询逻辑，统一定时任务生命周期管理。
- 修复上传中的文件不会执行重名校验，导致上传列表可以同时存在多个同名上传任务的问题。

## 影响范围

- `src/composables/useTransUpload.ts`
- `src/views/trans/TransUploadView.vue`
- `src/views/application/components/StepTwoUploadFile.vue`
- `src/utils/upload-validator.ts`
- `src/utils/__tests__/*`
- `CHANGELOG.md`

## 子任务

- [ √ ] 1.1 补充执行记录与技术方案
- [ √ ] 1.2 引入 `useWebWorkerFn` 改造分片哈希与文件哈希计算
- [ √ ] 1.3 引入 `useIntervalFn` 重构上传保活、Token 刷新与文件列表轮询
- [ √ ] 1.4 抽取公共重名检测并修复上传中同名任务拦截
- [ √ ] 1.5 补充测试、CHANGELOG 与验收记录

