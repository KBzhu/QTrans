# MSW + IndexedDB 快速上手（QTrans）

> 只覆盖开发中最容易卡住的两块：`MSW` 接口 Mock 与 `IndexedDB` 分片缓存。

## 1. 先确认开关与依赖

- 依赖已在 `qtrans-frontend/package.json`：`msw`、`dexie`
- 开发环境开关在 `qtrans-frontend/.env.development`

```env
VITE_MOCK_ENABLED=true
VITE_UPLOAD_CHUNK_SIZE=5242880
```

含义：
- `VITE_MOCK_ENABLED=true`：开发模式启用 MSW
- `VITE_UPLOAD_CHUNK_SIZE`：分片大小（字节），默认 5MB

---

## 2. MSW 启动链路（你只要记住这 3 个文件）

1) 入口条件启动：`qtrans-frontend/src/main.ts`
- `DEV && VITE_MOCK_ENABLED === 'true'` 时启动 worker

2) worker 配置：`qtrans-frontend/src/mocks/browser.ts`
- `setupWorker(...handlers)`
- 启动时会执行 `initDemoData()` 初始化演示数据

3) handler 聚合：`qtrans-frontend/src/mocks/handlers/index.ts`
- 已聚合：`auth/application/approval/file/user/department/city/notification`

### 本地运行

在项目根执行：

```bash
npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run dev
```

浏览器 DevTools -> Network 中看到 `/api/*` 请求被拦截即正常。

---

## 3. 新增一个 Mock 接口（最小流程）

1) 在对应 handler 文件加路由（例如 `src/mocks/handlers/application.ts`）
2) 返回统一结构（当前项目请求拦截器按 `code/message/data` 解析）
3) 若是新 handler 文件，记得在 `src/mocks/handlers/index.ts` 合并导出

建议保持已有工具函数风格（如 `success/failed/mockDelay`）一致，避免前端解析异常。

---

## 4. IndexedDB 结构与用途

数据库定义：`qtrans-frontend/src/mocks/db.ts`

- DB 名：`QTransDB`
- 表 1：`fileChunks`
  - 存分片内容与分片哈希（断点续传核心）
- 表 2：`fileMetas`
  - 存文件上传状态（`pending/uploading/paused/completed/...`）

你可以理解为：
- `fileChunks` 解决“传到第几片了”
- `fileMetas` 解决“这个文件整体状态是什么”

---

## 5. 分片上传怎么工作（实际使用入口）

入口 composable：`qtrans-frontend/src/composables/useFileUpload.ts`

核心能力：
- `uploadFile(file, applicationId, onProgress)`：上传（自动跳过已存在分片）
- `pause()` / `resume()`：暂停恢复
- `cancel(fileId?)`：取消并清理记录
- `clearFileRecord(fileId)`：手动清理某文件分片与元数据

分片细节在：`qtrans-frontend/src/composables/useFileChunk.ts`
- `calculateChunks`：算总片数
- `sliceFile`：切片
- `calculateChunkHash`：SHA-256 哈希
- 分片大小优先读 `VITE_UPLOAD_CHUNK_SIZE`

---

## 6. 最常见问题（直接排查）

### Q1: MSW 没生效，请求打到真实后端
按顺序检查：
1. `VITE_MOCK_ENABLED` 是否为 `true`
2. 是否是 `npm run dev`（生产构建默认不启用）
3. `public/mockServiceWorker.js` 是否存在
4. 控制台是否有 `MSW 启动失败` 报错

### Q2: 断点续传不生效
按顺序检查：
1. 同一个文件是否生成同一个 `fileId`（由 `generateFileId(file)` 决定）
2. `fileChunks` 表是否已有对应 `fileId` 记录
3. 上传时是否命中 `uploadedChunkMap.has(index)` 跳过逻辑

### Q3: 想重置本地上传状态
可在浏览器控制台执行：

```js
indexedDB.deleteDatabase('QTransDB')
```

然后刷新页面重新上传。

---

## 7. 开发建议（避免踩坑）

- Mock 返回结构务必保持统一：`{ code, message, data }`
- 修改分片大小后，建议先清空一次 `QTransDB` 再回归测试
- 新增接口优先补到对应 handler，避免在组件里写临时分支
- 先确认 `MSW 正常拦截`，再排查业务逻辑
