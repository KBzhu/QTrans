# Failed Log

## 2026-04-22: 大文件上传 calculateSHA256 NotReadableError

**现象**: 在上传页面选择 5GB 大文件后页面无任何反应，`UploadHandler` 接口未被调用。F12 控制台报错：`Uncaught (in promise) NotReadableError: The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired.`

**根因**:
1. `transWebService.ts` `calculateSHA256(file)` 使用 `await file.arrayBuffer()` 一次性将全文件读取到内存，浏览器无法为 5GB+ 文件分配连续内存
2. `TransUploadView.vue` / `StepTwoUploadFile.vue` 上传前重复检测对所有文件调用 `calculateSHA256(file)`，大文件在此环节直接报错，后续上传流程完全中断
3. `useTransUpload.ts` 上传完成后（第 618 行）再次调用 `calculateSHA256(file)` 计算全文件 hash，大文件同样会触发内存溢出
4. 代码中不存在 Web Worker 实现，所有 hash 计算在主线程执行

**修复过程**:
1. 引入 `hash-wasm` 库，提供流式 SHA-256 计算能力
2. 重写 `calculateSHA256` 为流式实现：通过 `file.stream()` + `stream.getReader()` 分片读取，每次仅处理一小块数据到内存
3. 新增 `calculateChunkHashFromBuffer`，使 `uploadSingleChunk` 只需读取一次 ArrayBuffer，同时用于分片 hash 和全文件 hash 累积
4. `useTransUpload.ts` 改造：
   - 大文件（>4MB）上传前不再预计算 hash，改为创建流式 hasher
   - `uploadSingleChunk` 增加 `fileHasher` 可选参数，将分片数据 `update` 到 hasher
   - 上传完成后用 `fileHasher.digest()` 直接获取全文件 hash，零额外读取
   - 重试逻辑同步改造，重试时重新创建 hasher 并边传边算
5. `TransUploadView.vue` / `StepTwoUploadFile.vue` 对 >100MB 文件跳过上传前全量 hash 重复检测，避免上传前卡死

**影响文件**:
- `qtrans-frontend/src/api/transWebService.ts`
- `qtrans-frontend/src/composables/useTransUpload.ts`
- `qtrans-frontend/src/views/trans/TransUploadView.vue`
- `qtrans-frontend/src/views/application/components/StepTwoUploadFile.vue`

## 2026-04-16: CreateApplicationView 黄区场景刷新丢失区域信息

**现象**: 直接在 `/application/create` 路由刷新浏览器，涉及黄区的场景（绿传黄、外网传黄、黄传绿、黄传外网、黄传黄）丢失区域和 label 信息；而绿/外网组合正常。

**根因**: 黄区的后端 ID 是 `0`。原代码使用 `if (fromId && toId)` 判断是否调用 `setMetadataFromIds`，而 JavaScript 中 `0` 是 falsy 值，导致黄区 ID=0 时条件判断为 false，`setMetadataFromIds` 不被执行。

原代码：
```ts
const fromId = Number(route.query.fromId) ?? 1  // "0" → 0，0 ?? 1 仍为 0
const toId = Number(route.query.toId) ?? 1
if (fromId && toId) {  // 0 && ... → false，黄区被过滤
  regionMetadataStore.setMetadataFromIds(fromId, toId)
}
```

**修复**: 改用 `!isNaN()` 判断，0 是合法 ID：
```ts
const fromId = Number(route.query.fromId)
const toId = Number(route.query.toId)
if (!isNaN(fromId) && !isNaN(toId)) {
  regionMetadataStore.setMetadataFromIds(fromId, toId)
}
```

**影响文件**: `qtrans-frontend/src/views/application/CreateApplicationView.vue`
