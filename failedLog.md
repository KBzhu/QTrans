# 修复记录

## 2026-04-24 StepTwoUploadFile 组件 Bug 修复

### Bug1：已上传文件列表选中状态与删除计数不稳定
- **根因**：`handleToggleSelectUploaded` 使用 `indexOf(file)` 进行对象引用比较，当文件列表刷新后对象引用变化，导致无法找到已选项或重复添加。
- **修复**：改为按 `fileId` 比较（`findIndex(f => f.fileId === file.fileId)`）。
- **文件**：`src/views/application/components/StepTwoUploadFile.vue`

### Bug2：全部暂停 / 全部开始按钮无效
- **根因**：`batchPause` / `batchResume` 只操作 `selected` 为 true 的文件，但点击"全部暂停"时用户并未选中任何文件。
- **修复**：`batchPause` 改为操作所有 `status === 'uploading'` 的文件；`batchResume` 改为操作所有 `status === 'paused' || status === 'error'` 的文件。
- **补充修复1**：`batchResume` 将顺序 `for...of + await` 改为 `forEach` 同时触发所有任务，由 `uploadFile` 内部并发控制自动排队，实现"同时继续多个任务，但最多并发 3 个"。
- **补充修复2**：`pauseUpload` 增加 `silent` 参数，批量暂停时传入 `true` 屏蔽单条提示，避免"上传已暂停"和"已暂停x个文件"重复弹出。
- **文件**：`src/composables/useTransUpload.ts`

### Bug7（新增）：已上传文件刷新后重复出现在上传列表
- **根因**：文件上传完成后，IndexedDB 中的记录状态被更新为 `completed`，但记录本身没有被删除；`getPendingUploads` 查询条件是 `status === 'uploading' || status === 'paused'`，理论上不会查到 `completed` 记录。但用户反馈刷新后仍出现，说明可能存在：1) `updateUploadStatus` 未成功更新状态；2) 或 `completed` 记录被错误恢复。经排查，上传成功后的清理逻辑缺失——`uploadFile` 主路径和重试成功路径均未清理 IndexedDB 记录，若 `updateUploadStatus` 因异常未执行或状态未正确写入，则刷新后会恢复。
- **修复**：在 `uploadFile` 主路径和重试成功路径中，上传完成后立即调用 `deleteChunksByFileUUID` + `deleteUploadRecord` 清理 IndexedDB，确保无论状态更新是否成功，已完成文件都不会被恢复。
- **文件**：`src/composables/useTransUpload.ts`

### Bug2-1：全选 / 取消全选未生效
- **根因1**：`toggleSelectAll` 排除了 `status === 'uploading'` 的文件，导致全选时上传中文件无法被选中。
- **根因2**：工具栏未提供未选中状态下的"全选"按钮。
- **修复**：`toggleSelectAll` 不再排除上传中文件；`TransFileTable` 在未选中状态下显示"全选"按钮。
- **文件**：`src/composables/useTransUpload.ts`、`src/components/business/TransFileTable.vue`

### Bug3：0KB 文件上传卡死
- **根因**：`totalChunks = Math.ceil(file.size / CHUNK_SIZE)` 对 0KB 文件返回 0，`reupload` 为空数组，导致上传循环不执行，后续流程卡住。
- **修复**：创建上传项时 `totalChunks` 取 `Math.max(totalChunks, 1)`；对 0KB 文件单独调用一次 `uploadSingleChunk`（chunkIndex=0, totalChunks=1）触发 `act=add` 接口，完成后正常进入哈希校验流程；`uploadSingleChunk` 中增加判断，0KB 文件不保存空分片到 IndexedDB。
- **文件**：`src/composables/useTransUpload.ts`

### Bug4：上传相同文件无提示（正在上传场景）
- **根因**：`detectUploadNameConflicts` 未区分队列中文件是"正在上传"还是"已暂停/已完成"，无法给出"正在上传"的精确提示。
- **修复**：在 `upload-validator.ts` 中新增 `queueUploadingDuplicates` 字段，当队列中文件状态为 `uploading` 时归类到此字段；`StepTwoUploadFile.vue` 中针对该字段给出 `Message.error('以下文件正在上传中，请勿重复添加')`。
- **文件**：`src/utils/upload-validator.ts`、`src/views/application/components/StepTwoUploadFile.vue`

### Bug5：未使用 init 接口返回的 maxFileCount
- **根因**：`UploadInitResponse` 类型定义缺少 `maxFileCount` 字段；`handleFiles` 中使用的是基于 `maxLength4Name` 的兜底逻辑（1000/20）。
- **修复**：在 `UploadInitResponse` 中添加 `maxFileCount?: number`；`handleFiles` 中优先使用 `initData.value?.maxFileCount`，兜底保持原有逻辑。
- **文件**：`src/api/transWebService.ts`、`src/views/application/components/StepTwoUploadFile.vue`

### Bug6：取消上传弹框过多
- **根因**：批量点击删除或快速连续点击时，`cancelUpload` 内部会触发多次 `Modal.confirm`（或 `Message.success`），导致弹框堆积。
- **修复**：在 `StepTwoUploadFile.vue` 中新增 `cancelUploadModalLock` 锁变量，对 `handleDelete`、`handleDeleteSelectedUploaded`、`handleDeleteUploadedFile` 增加 300ms 防抖限流。
- **文件**：`src/views/application/components/StepTwoUploadFile.vue`

---

### Lint 修复
- 将 `[...new Set(...)]` 替换为 `Array.from(new Set(...))` 以兼容当前 tsconfig target。
- 为多个 `.map`/`.filter` 回调参数补充显式类型注解，消除 `implicit any` 报错。
- **文件**：`src/views/application/components/StepTwoUploadFile.vue`

---

### 2026-04-25 useIntervalFn 定时器卸载后仍轮询

- **根因**：`stopSessionKeepAlive` / `stopTransTokenRefresh` 中通过 `if (!isActive.value) return` 守卫判断后才调用 `pause()`。组件卸载时 `useIntervalFn` 内部状态与实际 interval 可能不同步，`isActive` 已为 `false`，导致 `pause()` 被跳过，轮询请求继续发送。
- **修复**：移除两个停止函数中的 `isActive` 守卫，确保 `pause()` 一定被调用；同时移除未使用的 `isSessionKeepAliveActive` 和 `isTransTokenRefreshActive` 变量解构，消除编译警告。
- **文件**：`src/composables/useTransUpload.ts`

---

### 2026-04-27 Token 刷新接口变更

- **根因**：原刷新 token 接口 `/service/v1/userCenter/authentication/login` 复用 SSO 登录接口，存在语义不清及潜在安全问题；后端提供了专门用于保活的 `/api/usercenter/service/v1/userCenter/user/getUserAuthority` 接口。
- **修复**：
  - `authApi.refreshToken` 接口地址改为 `/api/usercenter/service/v1/userCenter/user/getUserAuthority`，请求方式由 POST 改为 GET，返回类型由 `Promise<LoginResponse>` 改为 `Promise<void>`（新接口不返回 token）。
  - `stores/auth.ts` 中同步移除 `token.value = result.token` 和 `currentUser.value = result.user` 赋值逻辑，避免接口不返回 token 时被空值覆盖导致用户被登出。
- **文件**：`src/api/auth.ts`、`src/stores/auth.ts`
