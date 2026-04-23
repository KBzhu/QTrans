## Product Overview

在现有大文件传输平台（QTrans）前端代码中，引入 Web Worker 技术，将文件上传流程中的 CPU 密集型计算任务从主线程剥离到后台线程执行，解决主线程阻塞导致的 UI 卡顿问题，提升大文件上传场景下的用户体验。

## Core Features

- **哈希计算 Worker 化**：将全量 SHA-256 哈希（`calculateSHA256`）、分片哈希（`calculateChunkHashFromBuffer`）、流式哈希累积（`hash-wasm` 的 `createSHA256/update/digest`）全部迁移至 Web Worker 内执行，主线程零阻塞
- **分片预处理 Worker 化**：将文件的分片切片（`file.slice`）、ArrayBuffer 读取、FormData 构建等操作移入 Worker，主线程仅负责 UI 状态管理和网络请求调度
- **上传前重复检测优化**：TransUploadView 中对 <=100MB 文件的预计算哈希改为通过 Worker 异步执行，不再阻塞用户交互
- **断点续传/重试场景的 Worker 协作**：恢复已传分片的 hash 累积、重试时的 hasher 重建均在 Worker 内完成
- **渐进式降级策略**：Worker 创建失败或浏览器不支持时自动降级为主线程计算，确保功能可用性
- **Worker 生命周期管理**：支持按需创建、空闲回收、页面卸载时清理，避免内存泄漏

## Tech Stack

- **基础技术栈**：Vue 3 + TypeScript + Vite（与项目现有栈一致）
- **Web Worker 通信**：Vite 原生 Worker 支持（`new Worker(new URL(..., import.meta.url))`），使用 postMessage/onmessage 进行结构化数据通信
- **哈希库迁移**：Worker 内继续使用 `hash-wasm`（WASM 库可在 Worker 中正常加载）；分片哈希可选用 Worker 内置的 `crypto.subtle`
- **Transferable Objects**：Worker 与主线程之间传递 ArrayBuffer 时使用 Transferable 零拷贝传输，减少大数组序列化开销

## 技术架构

### 系统架构：双 Worker 分层模型

```
┌─────────────────────────────────────────────────────┐
│                   Main Thread                        │
│                                                     │
│  TransUploadView.vue                                 │
│      │                                              │
│      ▼                                              │
│  useTransUpload.ts (调度器/状态机)                    │
│      │         │          │                         │
│      ▼         ▼          ▼                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐     │
│  │ API 层   │ │ IndexedDB│ │ Vue Reactive State│     │
│  │(axios)   │ │(Dexie.js)│ │ (UI 渲染)        │     │
│  └──────────┘ └──────────┘ └──────────────────┘     │
│      │                                              │
│  ┌───┴───────────────────────────────────────┐       │
│  │           Worker Bridge Layer             │       │
│  │  (useHashWorker / useUploadWorker)         │       │
│  └───┬──────────────────────┬────────────────┘       │
│      │ postMessage          │ postMessage            │
├──────┼──────────────────────┼────────────────────────┤
│      ▼                      ▼                        │
│  ┌──────────────────┐  ┌──────────────────────┐      │
│  │  HashWorker.ts   │  │  UploadWorker.ts     │      │
│  │                  │  │                      │      │
│  │ · 全量SHA-256    │  │ · 文件切片 slice()   │      │
│  │ · 流式hash累积   │  │ · ArrayBuffer读取    │      │
│  │ · 分片hash计算   │  │ · 分片hash计算       │      │
│  │ · 进度上报       │  │ · FormData构建       │      │
│  │                  │  │ · 上传进度回调       │      │
│  └──────────────────┘  └──────────────────────┘      │
└─────────────────────────────────────────────────────┘
```

### 方案选择：为什么是双 Worker 而非单 Worker？

| 维度 | 单 Worker | 双 Worker（推荐） |
| --- | --- | --- |
| **职责分离** | 所有计算混合在一起，消息处理复杂 | 哈希计算 vs 上传准备，职责清晰 |
| **并发能力** | 同一时刻只能做一件事 | 可同时进行多个文件的哈希 + 上传准备 |
| **生命周期** | 长期驻留，无法按需释放 | UploadWorker 按上传任务创建/销毁；HashWorker 复用 |
| **复杂度** | 较低 | 中等，但通过 composable 封装后对调用方透明 |


### 实现策略

#### Phase 1: HashWorker — 哈希计算专用 Worker（核心收益最大）

**目标**：将所有 SHA-256 计算从主线程移出，这是当前最大的性能瓶颈。

**Worker 职责**：

1. **全量文件 hash**（替代 `calculateSHA256`）：接收 File 对象引用（通过 `file.name` + `file.size` 标识后由主线程 transfer ArrayBuffer），返回完整 hex digest
2. **流式 hash 累积**（替代 `createSHA256().update().digest()`）：维护一个 WASM hasher 实例，支持增量 update + 最终 digest
3. **批量分片 hash**：一次传入多个分片的 ArrayBuffer，批量计算各分片 hash

**通信协议设计**：

```
Main → Worker:
  { type: 'init-hash', taskId: string, fileSize: number }
  { type: 'update-chunk', taskId: string, chunkData: ArrayBuffer, chunkIndex: number }
  { type: 'digest', taskId: string }
  { type: 'hash-file', taskId: string, fileData: ArrayBuffer }
  { type: 'hash-chunks', taskId: string, chunks: Array<{ index: number, data: ArrayBuffer }> }
  { type: 'dispose', taskId: string }

Worker → Main:
  { type: 'progress', taskId: string, processedBytes: number, totalBytes: number, percent: number }
  { type: 'hash-result', taskId: string, hash: string }
  { type: 'chunk-hashes', taskId: string, hashes: Array<{ index: number, hash: string }> }
  { type: 'error', taskId: string, error: string }
```

#### Phase 2: UploadPrepWorker — 分片预处理 Worker

**目标**：将分片切片、读取、FormData 构建移出主线程，进一步减轻主线程压力。

**Worker 职责**：

1. 接收 File 对象 + 分片索引范围
2. 执行 file.slice() → arrayBuffer()
3. 计算分片 hash（内置 crypto.subtle）
4. 构建 FormData 并返回给主线程
5. 主线程拿到 FormData 后直接调用 API 发送

**注意点**：

- FormData 对象**不能**在 Worker 和主线程之间传递（不可序列化）
- 解决方案：Worker 返回 `{ blob: Blob, fields: Record<string, string> }` 给主线程，由主线程组装 FormData
- 或者更好的方案：Worker 返回已准备好的 ArrayBuffer 数据 + 元信息，主线程构建 FormData 后发送

### 关键修改点清单

#### 1. 新增文件

| 文件路径 | 用途 |
| --- | --- |
| `src/workers/hash.worker.ts` | HashWorker 入口，加载 hash-wasm，处理所有哈希相关消息 |
| `src/workers/upload-prep.worker.ts` | UploadPrepWorker 入口，处理分切片和 FormData 准备 |
| `src/composables/useHashWorker.ts` | HashWorker 的 composable 封装，提供类型安全的 Promise 化 API |
| `src/composables/useUploadPrepWorker.ts` | UploadPrepWorker 的 composable 封装 |
| `src/types/worker-messages.ts` | Worker 通信协议的 TypeScript 类型定义 |


#### 2. 需要修改的核心文件

| 文件 | 修改内容 | 影响 |
| --- | --- | --- |
| `src/composables/useTransUpload.ts` | 将 `calculateSHA256` / `createSHA256().update()` / `calculateChunkHashFromBuffer` 替换为 Worker 调用 | 核心改动，~1345 行中的 ~15 处调用点 |
| `src/api/transWebService.ts` | `calculateSHA256` / `calculateChunkHashFromBuffer` 函数标记为 `@deprecated` 或重写为 Worker 代理 | 3 个函数 |
| `src/views/trans/TransUploadView.vue` | handleFiles 中上传前重复检测的 hash 计算改用 Worker | 1 处调用 |
| `src/composables/useFileChunk.ts` | calculateChunkHash 方法可选走 Worker 路径 | 1 个方法 |


#### 3. 不需要修改的部分

- `src/utils/upload-db.ts` — IndexedDB 操作本身已是异步，无需 Worker
- `src/utils/upload-validator.ts` — 纯字符串校验，无性能瓶颈
- `src/api/transWebService.ts` 中的 HTTP 请求部分 — axios 已异步
- UI 组件（TransFileTable 等）— 仅消费响应式状态，不受影响

### 性能预期

| 场景 | 当前（主线程） | Worker 化后 | 改善幅度 |
| --- | --- | --- | --- |
| 5GB 文件全量 hash | 主线程阻塞 10-30s，UI 冻结 | 后台计算，UI 正常响应 | **消除卡顿** |
| 分片上传时边传边算 hash | 每个分片占用主线程 ~50ms | Worker 并行处理 | **提升吞吐约 20%** |
| 断点续传恢复（100+ 分片） | 串行读取 + hash 累积阻塞数秒 | Worker 后台处理 | **消除卡顿** |
| 上传前重复检测（100MB 文件 x N） | 串行阻塞，用户无法操作 | 并行计算，UI 流畅 | **大幅改善** |


## Implementation Details

### 目录结构

```
qtrans-frontend/src/
├── workers/
│   ├── hash.worker.ts              # [NEW] HashWorker：所有 SHA-256 计算
│   ├── upload-prep.worker.ts       # [NEW] UploadPrepWorker：分片预处理
│   └── shared/                     # [NEW] Worker 共享工具
│       └── hash-utils.ts           # [NEW] Worker 内部使用的 hash 工具函数
├── composables/
│   ├── useHashWorker.ts            # [NEW] HashWorker composable 封装
│   ├── useUploadPrepWorker.ts      # [NEW] UploadPrepWorker composable 封装
│   └── useTransUpload.ts          [MODIFY] 接入 Worker 替代直接计算
├── types/
│   └── worker-messages.ts          # [NEW] Worker 通信协议类型定义
├── api/
│   └── transWebService.ts         [MODIFY] 哈希函数增加 Worker 代理选项
└── views/trans/
    └── TransUploadView.vue        [MODIFY] 上传前检测改用 Worker
```

### Key Code Structures

#### Worker 消息类型定义（worker-messages.ts）

```typescript
// ============ Main → Worker 消息类型 ============
export type HashWorkerInboundMessage =
  | { type: 'init-stream'; taskId: string; totalSize: number }
  | { type: 'update-chunk'; taskId: string; chunkData: ArrayBuffer; chunkIndex: number }
  | { type: 'digest'; taskId: string }
  | { type: 'hash-file-directly'; taskId: string; fileData: ArrayBuffer; totalSize: number }
  | { type: 'hash-batch-chunks'; taskId: string; chunks: ChunkData[] }
  | { type: 'dispose-task'; taskId: string }

export interface ChunkData {
  index: number
  data: ArrayBuffer
}

// ============ Worker → Main 消息类型 ============
export type HashWorkerOutboundMessage =
  | { type: 'progress'; taskId: string; processedBytes: number; totalBytes: number; percent: number }
  | { type: 'hash-done'; taskId: string; hash: string }
  | { type: 'chunk-hashes-done'; taskId: string; hashes: Array<{ index: number; hash: string }> }
  | { type: 'task-ready'; taskId: string }
  | { type: 'error'; taskId: string; error: string; code?: ErrorCode }

export type ErrorCode = 'WASM_INIT_FAILED' | 'INVALID_DATA' | 'TASK_NOT_FOUND'
```

### 实施注意事项

1. **hash-wasm 在 Worker 中的初始化**：首次调用需要异步初始化 WASM 模块（~50ms），应在 Worker 启动时预初始化而非延迟到首次使用
2. **Transferable 使用**：`postMessage` 传递 ArrayBuffer 时必须使用 `[arrayBuffer]` 作为 transfer 列表，否则会触发拷贝开销
3. **File 对象不可传递到 Worker**：File/Blob 对象可以传递到 Worker（实现了 Structured Clone），但大文件应避免整体复制。推荐在主线程 slice 后 transfer ArrayBuffer 到 Worker
4. **错误边界**：Worker 内部 try-catch 所有操作，错误必须通过 postMessage 回传，不能让 Worker 静默崩溃
5. **降级策略**：封装一个 `isWorkerSupported` 检测，当 `typeof Worker === 'undefined'` 或 Worker 创建失败时回退到主线程同步计算
6. **Worker 数量控制**：建议最多创建 `navigator.hardwareConcurrency - 1` 个 Worker 实例，避免过度消耗资源
7. **内存管理**：每个上传任务完成后 dispose 对应的 hasher 实例，释放 WASM 内存；页面 `beforeunload` 时 terminate 所有 Worker
8. **Vite 配置兼容性**：Vite 原生支持 Worker 导入，使用 `new Worker(new URL('./hash.worker.ts', import.meta.url))` 格式即可，无需额外插件

## Agent Extensions

### Skill: vue-best-practices

- **Purpose**: 确保 Web Worker composable 封装符合 Vue 3 Composition API 最佳实践（script setup、ref/reactive 响应式状态、正确的 cleanup 逻辑）
- **Expected outcome**: `useHashWorker.ts` 和 `useUploadPrepWorker.ts` 的代码风格与项目现有的 `useTransUpload.ts` 保持一致

### Skill: vue-debug-guides

- **Purpose**: 在 Worker 集成过程中帮助诊断潜在的运行时错误（如 Worker 消息丢失、Transferable 使用不当、WASM 加载失败等）
- **Expected outcome**: 快速定位并修复 Worker 通信层面的调试问题