# Task: 补充老代码遗漏逻辑（按 P 级优先级）

## 背景

对齐老项目（FineUploader + jQuery）的上传逻辑，补充 8 项遗漏功能（排除文件夹上传 P2-#8）。

## 任务列表

### P0 — 高优先级

- [√] 1. 上传错误分类处理（`useTransUpload.ts` + `transWebService.ts`）
- [√] 2. 取消上传通知后端（`useTransUpload.ts` + `transWebService.ts`）
- [√] 3. 文件名/路径合法性校验（`utils/upload-validator.ts` + 两个上传页面）

### P1 — 中优先级

- [√] 4. 分片哈希传后端（`useTransUpload.ts`）
- [√] 5. 存储空间上限校验（`useTransUpload.ts` + 两个上传页面）
- [√] 6. 自动重试机制（`useTransUpload.ts`）

### P2 — 低优先级

- [√] 7. 小文件预计算哈希（`useTransUpload.ts`）
- [ ] 8. ~~文件夹上传~~ — 用户要求不做，跳过
- [√] 9. 服务端耗时/剩余时间展示（`useTransUpload.ts` + `TransFileTable.vue`）

## 需新增的文件/类

| 文件 | 用途 |
|------|------|
| `src/utils/upload-validator.ts` | 文件名/路径合法性校验工具函数 |
| `src/types/upload-error.ts` | 上传错误分类枚举和类型定义 |

## 产出文件清单

| 文件 | 改动类型 |
|------|----------|
| `src/types/upload-error.ts` | 新增 |
| `src/utils/upload-validator.ts` | 新增 |
| `src/api/transWebService.ts` | 修改：新增 `cancelUploadApi`、`getStorageInfo` API |
| `src/composables/useTransUpload.ts` | 修改：错误分类、取消通知、分片hash附加、自动重试、小文件预hash、服务端耗时 |
| `src/views/application/components/StepTwoUploadFile.vue` | 修改：文件名校验、存储空间校验 |
| `src/views/trans/TransUploadView.vue` | 修改：文件名校验、存储空间校验 |
| `src/components/business/TransFileTable.vue` | 修改：服务端耗时/剩余时间展示 |
| `CHANGELOG.md` | 更新 |
| `docs/exec/task_old_logic_supplement_exec.md` | 新增 |
