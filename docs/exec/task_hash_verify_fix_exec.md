# 哈希校验逻辑修复 & 对齐老项目 — 执行文档

## 任务概述

对齐老项目（FineUploader + jQuery）的哈希校验逻辑，修复 3 个 BUG，并梳理老代码遗漏逻辑的待补充清单。

---

## 一、已完成的改动

### 1. 哈希校验逻辑对齐老项目

**文件**: `qtrans-frontend/src/composables/useTransUpload.ts`

| 改动项 | 改动前 | 改动后 |
|--------|--------|--------|
| 轮询策略 | 最多30次（约90秒）后 `skipped` | **无限轮询**，直到 `serverFileHashCode.length === 64` |
| 校验条件 | 仅 `clientHash` 有效即比对 | **双端哈希都有效**才比对（对齐老代码 `validHashTimer`） |
| `HashVerifyState.status` | 含 `skipped` 状态 | 去掉 `skipped`，只保留 `matched`/`mismatched`/`pending` |
| `clientFileHashCode` 长度校验 | 不检查长度 | 需 `length === 64` 才视为有效（对齐老代码） |

### 2. 重复上传拦截优化

**文件**: `StepTwoUploadFile.vue`, `TransUploadView.vue`

| 改动项 | 改动前 | 改动后 |
|--------|--------|--------|
| 提示文案 | "以下文件已上传，已跳过：XX" | "XX 在服务器上已存在，请勿重复上传" |
| 比对逻辑 | 仅比对 hash | **hash + 文件名都匹配**才视为重复，hash 相同但文件名不同放行 |
| hash 来源 | 仅比对 `clientFileHashCode` | 同时比对 `clientFileHashCode` 和 `hashCode` |

### 3. `getHashVerifyStatus` 对齐老项目

**文件**: `qtrans-frontend/src/components/business/TransFileTable.vue`

- `clientFileHashCode` 需 `length === 64` 才视为有效
- 双端哈希都有效才比对，否则返回 `pending`

### 4. 自动提交逻辑适配

**文件**: `StepTwoUploadFile.vue`, `TransUploadView.vue`

- 去掉 `skipped` 判断，只有 `matched` 才视为校验通过

### 5. BUG 修复

#### BUG 1: 进度条立即打满

**根因**: 分片上传完成后用 `uploadedCount / totalChunks * 100` 暴力赋值进度，覆盖了 `onUploadProgress` 的实时进度。

**修复**:
- 分片完成后改为基于精确字节数计算进度
- 上传阶段进度上限 99%，完成校验后才到 100%
- 断点续传恢复时使用精确字节累加（考虑最后一个分片非整块）

#### BUG 2: 同 hash 不同文件名被误拦

**根因**: 重复上传拦截只比对 hash，不比对文件名。

**修复**: hash 匹配 + 文件名相同才视为重复，hash 相同但文件名不同放行。

#### BUG 3: hashCode 为 null 显示"未校验"

**根因**: 上传完成后立即 `loadFileList` 刷新已上传列表，此时后端 `hashCode` 还没算完，FileListHandler 返回 null。

**修复**: 新增 `refreshFileListWithRetry` 函数，上传完成后延迟刷新文件列表（最多3次/3秒间隔），检测到 `clientFileHashCode` 有值但 `hashCode` 为 null 的文件时自动重试刷新。

---

## 二、产出文件清单

| 文件 | 改动类型 |
|------|----------|
| `qtrans-frontend/src/composables/useTransUpload.ts` | 修改：哈希校验逻辑、进度计算 |
| `qtrans-frontend/src/components/business/TransFileTable.vue` | 修改：`getHashVerifyStatus` |
| `qtrans-frontend/src/views/application/components/StepTwoUploadFile.vue` | 修改：重复拦截、进度回调、延迟刷新 |
| `qtrans-frontend/src/views/trans/TransUploadView.vue` | 修改：重复拦截、进度回调、延迟刷新 |
| `CHANGELOG.md` | 更新 |

---

## 三、老代码遗漏逻辑清单（待补充）

### P0 — 高优先级

| # | 遗漏项 | 老代码实现 | 当前状态 |
|---|--------|-----------|---------|
| 1 | 上传错误分类处理 | `onError` 中分类处理：登录过期、文件已存在、文件正在上传、文件名超长、拒绝访问等，每种错误自动 cancel | 仅 `status = 'error'`，无分类 |
| 2 | 取消上传通知后端 | `onCancel` 调 `UploadHandler?act=cancel` | 仅前端清理，未通知后端 |
| 3 | 文件名/路径合法性校验 | `onSubmit` 校验：黑名单字符、文件名长度、路径长度 | 未实现 |

### P1 — 中优先级

| # | 遗漏项 | 老代码实现 | 当前状态 |
|---|--------|-----------|---------|
| 4 | 分片哈希未传后端 | `onUploadChunk` 将 `qqhashcode` 附到请求参数 | 计算了但未附加到 FormData |
| 5 | 存储空间上限校验 | `onValidate` 检查总空间 | 仅检查单文件大小 |
| 6 | 自动重试机制 | FineUploader `retry.enableAuto: true, autoAttempts: 3` | 无自动重试 |

### P2 — 低优先级

| # | 遗漏项 | 老代码实现 | 当前状态 |
|---|--------|-----------|---------|
| 7 | 小文件预计算哈希 | `onUpload` 中小文件先算 hash 附到参数 | 所有文件上传完后才算 |
| 8 | 文件夹上传 | FineUploader `extraButtons + folders: true` | 不支持 |
| 9 | 服务端耗时/剩余时间 | `onUploadChunkSuccess` 从响应获取 `elapsedTime`/`timeLeft` | 本地计算 |

---

## 四、验收标准

### 功能验收

- [ ] 上传文件时进度条按真实字节进度增长，不再立即打满
- [ ] 上传大文件时进度条平滑增长，分片间无跳变
- [ ] 哈希校验无限轮询直到服务端返回，不再超时跳过
- [ ] 重复上传拦截：同名同hash文件被拦截，提示"XX在服务器上已存在"
- [ ] 重复上传放行：同hash不同文件名正常上传
- [ ] 上传完成后已上传列表中 hashCode 不再闪为 null（延迟刷新机制生效）
- [ ] 自动提交只在所有文件哈希校验 matched 时触发

### QA 回归步骤

1. 上传一个小文件（<4MB），观察进度条是否平滑增长到100%
2. 上传一个大文件（>4MB），观察分片进度是否逐分片增长
3. 上传后观察已上传列表的哈希校验状态，应从"校验中"变为"通过"
4. 上传一个已存在的同名文件，应被拦截并提示"在服务器上已存在"
5. 上传一个 hash 相同但文件名不同的文件，应正常上传不被拦截
6. 勾选"上传完毕后自动提交"，上传文件后观察是否在哈希校验通过后自动提交
