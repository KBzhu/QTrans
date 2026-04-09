# 老代码遗漏逻辑补充 — 执行文档

## 任务概述

对齐老项目（FineUploader + jQuery）的上传逻辑，按 P 级优先级补充 8 项遗漏功能（排除文件夹上传 P2-#8）。

---

## 一、已完成改动

### P0-1: 上传错误分类处理

**新增文件**: `src/types/upload-error.ts`

| 内容 | 说明 |
|------|------|
| `UploadErrorType` 枚举 | AUTH_EXPIRED / FILE_EXISTS / FILE_UPLOADING / FILENAME_TOO_LONG / PATH_TOO_LONG / ACCESS_DENIED / NETWORK_ERROR / SERVER_ERROR / STORAGE_FULL / INVALID_FILENAME / UNKNOWN |
| `UploadErrorInfo` 接口 | type / message / originalError / shouldCancel / retryable |
| `classifyUploadError` 函数 | 根据错误信息关键词自动分类，返回 `UploadErrorInfo` |

**修改文件**: `src/composables/useTransUpload.ts`

- `catch` 块使用 `classifyUploadError` 替代简单 `error.message`
- 登录过期触发 `window.dispatchEvent(new CustomEvent('trans-token-expired'))`
- `shouldCancel` 类错误直接标记失败，`retryable` 类错误进入自动重试逻辑

### P0-2: 取消上传通知后端

**新增 API**: `src/api/transWebService.ts` → `cancelUploadApi`

- 接口: `POST /Handler/UploadHandler?act=cancel`
- 参数: `name`, `qqpath`, `params`

**修改**: `useTransUpload.ts` → `cancelUpload(fileId, params?)`

- 取消上传时调用 `cancelUploadApi` 通知后端清理临时分片
- `batchCancel(params?)` 同步传参

### P0-3: 文件名/路径合法性校验

**新增文件**: `src/utils/upload-validator.ts`

| 函数 | 说明 |
|------|------|
| `validateFileName(fileName, blackList, maxLength4Name)` | 校验黑名单字符、默认非法字符、文件名长度 |
| `validateFilePath(relativeDir, fileName, maxLength4Path)` | 校验完整路径长度 |
| `validateFileNames(files, blackList, maxLength4Name, maxLength4Path, relativeDir)` | 批量校验，返回非法文件列表 |

**修改**: `StepTwoUploadFile.vue`、`TransUploadView.vue`

- 上传前调用 `validateFileNames`，使用 `initData` 的 `blackList`/`maxLength4Name`/`maxLength4Path`
- 非法文件弹出错误提示并过滤，仅上传合法文件

### P1-4: 分片哈希传后端

**修改**: `useTransUpload.ts` → `uploadSingleChunk`

- FormData 中新增 `qqhashcode` 字段，值为 `calculateChunkHash` 的结果
- 对齐老代码 `onUploadChunk` 将 `qqhashcode` 附到请求参数

### P1-5: 存储空间上限校验

**新增 API**: `src/api/transWebService.ts` → `getStorageInfo`

- 接口: `GET /Handler/UploadHandler?act=storage`
- 返回: `{ success, usedSize, totalSize, error? }`

**新增方法**: `useTransUpload.ts` → `checkStorageSpace(params, fileSize)`

- 查询存储空间，判断剩余空间是否足够
- 两个上传页面在上传前调用

### P1-6: 自动重试机制

**修改**: `useTransUpload.ts` → `uploadFile` 的 `catch` 块

- 常量: `MAX_AUTO_RETRY = 3`、`AUTO_RETRY_DELAY = 2000ms`
- `retryable` 错误自动重试，重试时重新走断点续传逻辑
- `TransUploadFileItem` 新增 `retryCount` 字段跟踪重试次数
- 重试成功后继续哈希校验流程

### P2-7: 小文件预计算哈希

**修改**: `useTransUpload.ts` → `uploadFile`

- 常量: `SMALL_FILE_THRESHOLD = 4MB`
- ≤4MB 的文件在分片上传前预计算 SHA256 哈希（`preCalculatedHash`）
- 上传完成后哈希计算阶段直接复用预计算结果

### P2-9: 服务端耗时/剩余时间展示

**修改**: `useTransUpload.ts`

- `HashVerifyState` 新增 `elapsedTime?` 和 `timeLeft?` 字段
- 分片上传成功后从响应解析 `elapsedTime`/`timeLeft`

**修改**: `TransFileTable.vue`

- 校验中状态显示: "正在校验文件完整性...（预计剩余 Xs）"
- 校验通过状态显示: "✓ 文件校验通过（耗时 Xs）"

---

## 二、新增文件清单

| 文件 | 用途 |
|------|------|
| `src/types/upload-error.ts` | 上传错误分类枚举和类型定义 |
| `src/utils/upload-validator.ts` | 文件名/路径合法性校验工具函数 |

## 三、修改文件清单

| 文件 | 改动内容 |
|------|----------|
| `src/api/transWebService.ts` | 新增 `cancelUploadApi`、`getStorageInfo`；`UploadResponse` 补充注释 |
| `src/composables/useTransUpload.ts` | 错误分类、取消通知、分片hash附加、存储空间校验、自动重试、小文件预hash、服务端耗时 |
| `src/views/application/components/StepTwoUploadFile.vue` | 文件名校验、存储空间校验、cancelUpload 传参 |
| `src/views/trans/TransUploadView.vue` | 文件名校验、存储空间校验、cancelUpload 传参 |
| `src/components/business/TransFileTable.vue` | 服务端耗时/剩余时间展示 |
| `CHANGELOG.md` | 更新 |
| `docs/tasks/task_old_logic_supplement.md` | 新增 |
| `docs/exec/task_old_logic_supplement_exec.md` | 新增（本文件） |

---

## 四、API 变更汇总

| 变更项 | 说明 |
|--------|------|
| `cancelUpload(fileId, params?)` | 新增可选 `params` 参数，有值时通知后端取消 |
| `batchCancel(params?)` | 新增可选 `params` 参数 |
| `checkStorageSpace(params, fileSize)` | 新增方法，检查存储空间 |
| `cancelUploadApi(fileName, qqpath, params)` | 新增 API |
| `getStorageInfo(params)` | 新增 API |
| `UploadResponse.elapsedTime/timeLeft` | 已有字段，补充注释说明 |
| `HashVerifyState.elapsedTime/timeLeft` | 新增字段 |
| `TransUploadFileItem.retryCount` | 新增字段 |

---

## 五、验收标准

### 功能验收

- [ ] 上传错误时，根据错误类型显示对应中文提示（如"登录信息已过期"而非原始 error）
- [ ] 取消上传时，后端临时分片文件被清理（可通过后端日志验证 `act=cancel` 被调用）
- [ ] 上传含非法字符的文件名时，弹出提示并阻止上传
- [ ] 上传文件名/路径超长时，弹出提示并阻止上传
- [ ] 分片上传请求中包含 `qqhashcode` 字段（可通过 Network 面板验证）
- [ ] 存储空间不足时，弹出提示并阻止上传
- [ ] 网络异常时自动重试，最多 3 次，重试成功后继续哈希校验
- [ ] ≤4MB 文件上传时预计算哈希，上传后不再重复计算
- [ ] 哈希校验阶段显示服务端耗时和剩余时间

### QA 回归步骤

1. 上传一个非法文件名的文件（如含 `*` 或 `?`），应被拦截并提示
2. 上传一个文件名超长的文件，应被拦截并提示
3. 正常上传文件后取消，检查后端是否收到 cancel 通知
4. 在 Network 面板中查看分片上传请求，确认包含 `qqhashcode` 字段
5. 模拟网络异常（如断开网络），观察是否自动重试
6. 上传 ≤4MB 文件，观察日志中是否出现"小文件预计算哈希"
7. 上传大文件，观察校验中是否显示剩余时间、校验通过是否显示耗时
