# 双 Worker 上传重构 QuickStart

> 本文档面向**开发人员**、**测试人员**和**验收人员**，用于说明本次上传链路从“部分 Worker 化”升级到“完整双 Worker 架构”后的实现范围、业务收益、验收清单与回归步骤。

---

## 1. 本次重构结论

本次上传链路已经完成从单点哈希 Worker 化到**完整双 Worker 架构**的升级，核心分工如下：

- **`HashWorker`**：负责全量文件哈希、分片哈希、流式哈希累积。
- **`UploadPrepWorker`**：负责分片边界计算、`slice()`、`ArrayBuffer` 读取、分片哈希预处理。
- **主线程 `useTransUpload.ts`**：负责状态机、上传调度、`FormData` 组装、API 调用、IndexedDB 持久化和 UI 响应。

这意味着当前实现已经对齐 `task_download.md` 中“双 Worker 分层模型”的主目标；同时对 `FormData` 不能跨线程序列化这一限制，采用了文档中推荐的折中方案：**由 Worker 返回分片二进制与元信息，主线程再组装 `FormData`**。

---

## 2. 架构与职责划分

```text
用户选择文件
  ↓
上传入口组件（`TransUploadView.vue` / `StepTwoUploadFile.vue`）
  ↓
`useTransUpload.ts`
  ├─ 状态管理（pending / uploading / hashing / verifying / completed / error / paused）
  ├─ 并发控制、暂停/继续/重试、断点续传
  ├─ IndexedDB 上传记录维护
  ├─ `FormData` 组装与上传 API 调用
  ├─ `useHashWorker()`
  │   ├─ 小文件全量哈希
  │   ├─ 大文件流式哈希 init/update/digest
  │   └─ 分片哈希降级支持
  └─ `useUploadPrepWorker()`
      ├─ 计算分片边界
      ├─ `file.slice()`
      ├─ `chunkBlob.arrayBuffer()`
      └─ 返回 `chunkBuffer + chunkHash + metadata`
```

### 2.1 关键实现文件

| 文件 | 角色 |
| --- | --- |
| `src/workers/hash.worker.ts` | `HashWorker` 入口，维护流式哈希任务并输出进度/摘要 |
| `src/workers/upload-prep.worker.ts` | `UploadPrepWorker` 入口，执行分片读取与预处理 |
| `src/types/worker-messages.ts` | 双 Worker 通信协议类型定义 |
| `src/composables/useHashWorker.ts` | `HashWorker` bridge，提供 Promise 化 API 与主线程降级 |
| `src/composables/useUploadPrepWorker.ts` | `UploadPrepWorker` bridge，封装分片预处理与读取 |
| `src/composables/useTransUpload.ts` | 上传主流程调度器，接入双 Worker 并负责业务状态管理 |
| `src/composables/useUploadHashWorker.ts` | 兼容层，避免旧引用直接失效 |
| `src/composables/useFileChunk.ts` | 对齐新哈希路径，支持 Worker/主线程双通路 |

---

## 3. 对照原始方案的验收映射

| 原始要求（`task_download.md`） | 当前实现 | 验收结论 |
| --- | --- | --- |
| 双 Worker 分层模型 | 已新增 `HashWorker` 与 `UploadPrepWorker`，并有各自 bridge composable | **通过** |
| 哈希计算迁移出主线程 | `useHashWorker.ts` 接管文件哈希、分片哈希、流式哈希 | **通过** |
| 分片预处理迁移出主线程 | `useUploadPrepWorker.ts` 负责 `slice`、`arrayBuffer`、分片哈希预处理 | **通过** |
| 主线程只负责调度与请求 | `useTransUpload.ts` 仅保留状态机、并发控制、请求组装和持久化 | **通过** |
| Worker 通信协议类型化 | `worker-messages.ts` 已定义 inbound/outbound 消息类型 | **通过** |
| Worker 不可用时自动降级 | `useHashWorker.ts`、`useUploadPrepWorker.ts` 都有 fallback | **通过** |
| 生命周期清理 | Worker composable 有 `terminate*`；流式任务在 `finally` 调用 `dispose()` | **通过** |
| 重名校验 bug 不回退 | 两个上传入口统一使用 `detectUploadNameConflicts` | **通过** |

---

## 4. 具体业务功能总结

### 4.1 上传性能与交互

- **小文件上传**：上传前可异步计算文件哈希，不阻塞主线程渲染。
- **大文件上传**：边上传边在 `HashWorker` 内做流式哈希累积，避免上传完成后再整文件读取一次。
- **分片预处理后台化**：分片边界计算、二进制读取和分片哈希不再占用主线程。
- **UI 保持响应**：文件进入上传队列后，进度条和状态能立即显示，减少“大文件一选中就卡住”的体验问题。

### 4.2 断点续传与重试

- **断点续传恢复**：已上传分片会先通过 `readChunkBuffer()` 回补流式哈希上下文，保证最终全文件摘要正确。
- **失败重试**：重试路径也会重新创建 `HashWorker` 流式会话，并恢复已上传分片的哈希累积。
- **资源释放**：主流程和重试流程结束后都会 `dispose()` 流式任务，避免 Worker 任务泄漏。

### 4.3 业务规则一致性

两个上传入口：

- `src/views/trans/TransUploadView.vue`
- `src/views/application/components/StepTwoUploadFile.vue`

都已经统一为同一套冲突处理规则：

- **本次选择内重复**：后续重复项自动忽略，并给出 warning。
- **上传队列内重复**：直接拦截，并提示“请勿重复添加”。
- **服务器已有同名文件**：弹出确认框，允许用户选择是否覆盖上传。
- **相对目录隔离**：相同文件名但目录不同，不会被误判为重复。

### 4.4 哈希校验链路

- 客户端摘要来自 `HashWorker` 流式摘要或全量文件哈希。
- 服务端摘要仍通过现有 `getServerHash` 链路获取。
- 上传完成后继续执行客户端/服务端摘要比对，确保文件完整性校验逻辑不变。

---

## 5. 开发自查清单

> 下面这份清单适合开发自测、联调验收和代码 review 时逐项核对。

### 5.1 架构验收清单

- [ ] 仓库中存在 `hash.worker.ts` 与 `upload-prep.worker.ts` 两个独立 Worker 文件。
- [ ] `useHashWorker.ts` 可提供 `calculateFileHashInWorker()`、`createStreamFileHasher()` 等桥接能力。
- [ ] `useUploadPrepWorker.ts` 可提供 `prepareUploadChunk()` 与 `readChunkBuffer()`。
- [ ] `worker-messages.ts` 已定义双向消息类型，调用方不再使用裸对象随意通信。
- [ ] `useUploadHashWorker.ts` 作为兼容层保留，旧入口不会直接失效。

### 5.2 主流程验收清单

- [ ] `useTransUpload.ts` 已通过 `useHashWorker()` / `useUploadPrepWorker()` 接入 Worker。
- [ ] `uploadSingleChunk()` 使用 `prepareUploadChunk()` 结果构建上传请求。
- [ ] 断点续传与重试恢复哈希时，使用 `readChunkBuffer()` + `fileHasher.update()`。
- [ ] 最终文件哈希优先取流式摘要结果，其次才是小文件预计算哈希或降级路径。
- [ ] 主上传流程与重试流程结束后，都有 `dispose()` 清理。

### 5.3 业务规则验收清单

- [ ] 同一批次选择重名文件时，仅保留第一份，后续重复项被忽略。
- [ ] 上传队列中已有同名文件时，后续同名文件不能再次加入队列。
- [ ] 服务端已有同名文件时，会弹出覆盖确认框。
- [ ] 两个上传入口页面的冲突提示文本与行为一致。
- [ ] 上传成功后的客户端/服务端哈希比对流程未被破坏。

### 5.4 稳定性验收清单

- [ ] 浏览器不支持 Worker 或 Worker 创建失败时，可自动走主线程 fallback。
- [ ] 多文件并发上传时，UI 无明显卡顿或冻结。
- [ ] 暂停 / 继续 / 重试后不会产生重复上传条目。
- [ ] 刷新页面或恢复上传记录后，断点续传行为仍正确。

---

## 6. QA 回归步骤与预期结果

### Q1：双 Worker 基础链路

| 步骤 | 操作 | 预期结果 |
| --- | --- | --- |
| 1 | 选择一个大文件开始上传 | 页面立即出现进度条，界面可继续点击其他控件 |
| 2 | 打开浏览器开发者工具观察控制台/性能 | 上传过程中无长时间主线程冻结 |
| 3 | 等待上传结束 | 文件进入哈希校验并最终完成 |

### Q2：断点续传

| 步骤 | 操作 | 预期结果 |
| --- | --- | --- |
| 1 | 上传大文件到 20% 以上 | 进度正常增长 |
| 2 | 点击暂停，再点击继续 | 复用原条目继续上传，不新增重复条目 |
| 3 | 上传完成 | 最终哈希校验通过 |

### Q3：自动重试

| 步骤 | 操作 | 预期结果 |
| --- | --- | --- |
| 1 | 上传中制造一次可恢复错误（如临时断网） | 文件进入 error 或触发自动重试 |
| 2 | 恢复网络后重试 | 从断点继续上传，不重复已传分片 |
| 3 | 上传完成 | 文件可正常完成哈希校验 |

### Q4：重名冲突分类

| 步骤 | 操作 | 预期结果 |
| --- | --- | --- |
| 1 | 一次选择两个同名文件 | 后续重复项被忽略，并提示 warning |
| 2 | 在上传队列已有 `A.txt` 时再次添加 `A.txt` | 被拦截，并提示“请勿重复添加” |
| 3 | 服务端已存在 `A.txt` 时再次上传 | 弹出是否覆盖上传确认框 |
| 4 | 相同文件名但不同目录 | 不应误判为重复 |

### Q5：降级验证

| 步骤 | 操作 | 预期结果 |
| --- | --- | --- |
| 1 | 在不支持 Worker 的环境或模拟 Worker 初始化失败 | 上传功能仍可执行 |
| 2 | 上传一个小文件和一个大文件 | 功能正确，只是性能回到主线程实现 |
| 3 | 完成后检查结果 | 上传、校验、重名规则均保持正确 |

---

## 7. 已完成的验证记录

### 7.1 自动化验证

- **`vitest`**：
  - `src/workers/shared/hash-utils.spec.ts`
  - `src/utils/__tests__/upload-validator.spec.ts`
- **`vue-tsc`**：`npx vue-tsc --noEmit -p tsconfig.app.json`

### 7.2 本次验证覆盖的重点

- `hash-utils.spec.ts`：验证分片边界计算、`ArrayBuffer` 哈希、`Blob` 哈希。
- `upload-validator.spec.ts`：验证本次选择重复、上传队列重复、服务端重复、按目录区分同名文件。

---

## 8. 相关文件索引

| 文件 | 说明 |
| --- | --- |
| `docs/tasks/task_download.md` | 原始双 Worker 方案定义 |
| `docs/tasks/task_web_worker_P2.md` | 本次双 Worker 升级任务拆解 |
| `docs/exec/task_web_worker_P2_exec.md` | 双 Worker 升级执行记录 |
| `src/composables/useTransUpload.ts` | 上传主流程调度器 |
| `src/composables/useHashWorker.ts` | 哈希 Worker bridge |
| `src/composables/useUploadPrepWorker.ts` | 分片预处理 Worker bridge |
| `src/workers/hash.worker.ts` | HashWorker 实现 |
| `src/workers/upload-prep.worker.ts` | UploadPrepWorker 实现 |
| `src/types/worker-messages.ts` | Worker 通信协议 |
| `src/utils/upload-validator.ts` | 重名冲突检测与校验 |
| `src/workers/shared/hash-utils.spec.ts` | Worker 共享工具测试 |
| `src/utils/__tests__/upload-validator.spec.ts` | 上传规则测试 |

---

## 9. 推荐验收方式

如果你要做一次完整验收，建议按下面顺序执行：

1. **先看第 3 节**，确认原始方案与当前实现的映射关系。
2. **再走第 5 节**，从代码和功能两个维度做清单式核对。
3. **再跑第 6 节** 的 QA 场景，确认交互和业务规则没有回退。
4. **最后看第 7 节**，确认自动化验证和类型检查已覆盖基础能力。
