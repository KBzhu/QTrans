# TransWebService 模块技术文档

> 本文档详细梳理了 `qtrans-frontend/src/api/transWebService.ts` 及其关联组件的业务规则、方法职责、数据流和架构设计，供团队成员快速理解模块全貌。

---

## 1. 模块概览

### 1.1 定位

`transWebService.ts` 是数传平台前端的 **文件传输核心 API 层**，封装了与后端 TransWebService 服务（基于 FineUploader 协议）的全部 HTTP 交互逻辑，涵盖：

- 上传初始化 / 下载初始化
- 分片上传（含断点续传、哈希校验）
- 文件列表浏览
- 文件下载（含文件夹打包检查）
- 暂停 / 继续 / 取消 / 重试
- 存储空间校验

### 1.2 架构设计原则

| 原则 | 说明 |
|---|---|
| **直连传输服务器** | 通过 `updateTransClientBaseURL()` 解析后端返回的 `uploadUrl`，将 `transClient` 的 baseURL 动态切换为传输服务器的 origin，**绕过 nginx 代理**，避免大文件传输时 nginx 成为性能瓶颈 |
| **双 Token 认证** | `token`（Cookie/Header）用于业务系统鉴权；`Authorization`（SessionStorage 中的 transToken）用于传输服务鉴权 |
| **对齐老代码** | 所有核心逻辑均标注了对齐老代码 FineUploader 的钩子函数名（如 `onUpload`、`onSubmit`、`onValidate`、`onError`、`onCancel`），方便回溯验证 |
| **分片 + 哈希校验** | 大文件按 4MB 分片上传，上传完成后客户端和服务端各自计算 SHA-256 哈希，通过双端比对确保数据完整性 |

### 1.3 文件依赖关系

```
transWebService.ts (API 层)
├── useTransUpload.ts      (上传 Composable)
├── useTransDownload.ts    (下载 Composable)
├── useFileDownload.ts     (申请单详情页下载 Composable)
├── useApplicationForm.ts  (申请单表单 Composable)
├── upload-validator.ts    (文件名/路径校验工具)
├── upload-error.ts        (上传错误分类类型)
├── upload-db.ts           (IndexedDB 断点续传持久化)
└── path.ts                (basePath 工具函数)
```

---

## 2. HTTP 客户端设计

### 2.1 transClient 实例

```typescript
const transClient = axios.create({
  baseURL: assetPath('/transWeb'),  // 支持 multi-tenant base path
  timeout: 60000,
})
```

### 2.2 请求拦截器

| 行为 | 说明 |
|---|---|
| 同步 auth token 到 Cookie | `syncAuthTokenCookie(authToken)` — 每次请求自动将 authStore.token 写入 Cookie `token` 字段，解决跨域请求携带认证信息问题 |
| 设置 Header `token` | 业务系统鉴权令牌 |
| 设置 Header `Authorization` | 传输服务令牌（从 `sessionStorage` 的 `trans_token` 读取） |

### 2.3 响应拦截器

| 行为 | 说明 |
|---|---|
| 登录过期检测 | 当 `data.success === false` 且 error 包含"当前登录信息已过期"时，清除 transToken 并派发 `trans-token-expired` 自定义事件 |

### 2.4 动态 baseURL 切换

```typescript
export function updateTransClientBaseURL(uploadUrl: string)
```

**核心机制**：
1. 从后端创建申请单后获取 `uploadUrl`（如 `http://canpxjqtra00003-wb.qtrans.qiyunfang.com:10110/transWeb/valid?params=...`）
2. 解析 URL 的 origin（协议 + 域名 + 端口）
3. 设置 `transClient.defaults.baseURL = ${origin}/transWeb`
4. 此后所有请求直连传输服务器，不再经过 nginx

**注意事项**：
- 协议跟随后端返回值，不做前端升级/降级
- 测试环境返回 `http://`，页面必须用 HTTP 访问（否则 Mixed Content 被拦截）
- 如遇浏览器自动 HTTP→HTTPS 升级，需清除 HSTS 缓存

---

## 3. 类型定义详解

### 3.1 核心业务类型

| 类型 | 用途 | 关键字段 |
|---|---|---|
| `FileEntity` | 文件信息 | `fileName`, `fileSize`, `relativeDir`, `hashCode`, `clientFileHashCode`, `fileId` |
| `DirectoryEntity` | 目录信息 | `name`, `relativeDir`, `filePath`, `lastModify` |
| `FileListData` | 文件列表响应 | `directoryList`, `fileList`, `currentRelativeDir`, `totalFileSize`, `totalFileCount` |
| `UploadInitResponse` | 上传初始化响应 | `token`, `applicationId`, `applicationSize`, `hashType`, `blackList`, `maxLength4Name`, `maxLength4Path` |
| `DownloadInitResponse` | 下载初始化响应 | `token`, `applicationId`, `hashType`, `blackList`, `fromRegionModCode`, `vendorName` |
| `UploadResponse` | 上传操作响应 | `success`, `error`, `elapsedTime`, `timeLeft` |
| `HashResponse` | 哈希查询响应 | `success`, `error`（error 字段复用为哈希值载体，格式为 `文件名%2C服务端哈希`） |

### 3.2 断点续传类型

| 类型 | 用途 | 关键字段 |
|---|---|---|
| `ChunkStatusInfo` | 服务端分片状态 | `index`, `hash`（"partial" 表示不完整）, `size` |
| `UploadedChunksResponse` | 已上传分片查询响应 | `totalChunks`, `fileSize`, `chunkSize`, `chunks[]` |

---

## 4. API 方法详解

### 4.1 初始化类

#### `initUpload(params, lang)`

- **接口**：`GET /api/upload/init?params=xxx&lang=zh_CN`
- **业务规则**：
  1. `params` 为加密参数字符串，从申请单创建后的 `uploadUrl` 中提取
  2. 成功后自动将返回的 `token` 存入 `sessionStorage` 的 `trans_token`
  3. 返回的 `blackList` 为 base64 编码，解码后为文件名禁用字符（如 `/\:*?"<>|`）
  4. `applicationSize` 为申请单允许的最大文件大小（单位 GB）
- **调用方**：`useTransUpload.initialize()`

#### `initDownload(params, lang)`

- **接口**：`GET /api/download/init?params=xxx&lang=zh_CN`
- **业务规则**：同上传初始化，Token 存储方式一致
- **调用方**：`useTransDownload.initialize()`、`useFileDownload.downloadFile()`

### 4.2 文件列表类

#### `getFileList(relativeDir, params)`

- **接口**：`POST /Handler/FileListHandler`
- **业务规则**：
  1. `relativeDir` 会被 `encodeURIComponent` 编码
  2. 响应的 `data` 字段为 JSON 字符串，需 `JSON.parse` 解析
  3. 返回当前目录下的文件夹列表和文件列表
  4. 文件的 `hashCode` 字段可能为字符串 `"null"`（后端还在计算中）
- **调用方**：`useTransUpload.loadFileList()`、`useTransDownload.loadFileList()`

### 4.3 上传操作类

#### `uploadChunk(formData, params, onProgress?)`

- **接口**：`POST /Handler/UploadHandler?params=xxx`
- **业务规则**：
  1. Content-Type 为 `multipart/form-data`
  2. FormData 必须包含字段：`file`, `qquuid`, `qqpartindex`, `qqtotalparts`, `qqfilename`, `qqtotalfilesize`, `qqchunksize`, `qqpartbyteoffset`, `act=add`, `name`, `qqhashcode`
  3. `qqhashcode` 为前端计算的 SHA-256 分片哈希
  4. `act=add` 为固定值，表示新增分片
  5. 支持上传进度回调
- **调用方**：`useTransUpload.uploadSingleChunk()`

#### `deleteFiles(files, params)`

- **接口**：`POST /Handler/UploadHandler?act=delete`
- **业务规则**：
  1. `files` 参数为 JSON 字符串，包含 `fileName` 和 `relativeDir`
  2. 整个 files 参数会被 `encodeURIComponent` 编码
- **调用方**：`useTransUpload.removeFiles()`

#### `completeUpload(params)`

- **接口**：`POST /Handler/UploadHandler?act=complete`
- **业务规则**：通知后端所有文件上传完成，触发审批流程
- **调用方**：`useTransUpload.confirmUpload()`、`useApplicationForm.handleSubmitReal()`

#### `getServerHash(relativeFileName, params)`

- **接口**：`POST /Handler/UploadHandler?act=HASH`
- **业务规则**：
  1. `relativeFileName` 需经过 `escapeUnicode()` 编码（对齐老代码 JS `escape()` 行为），非 ASCII 字符编码为 `%uXXXX` 格式
  2. 后端返回的 `error` 字段被复用为哈希值载体，格式为 `文件名%2C服务端哈希`
  3. 有效哈希值长度为 64 位（SHA-256 hex）
  4. 如果哈希尚未计算完成，需轮询等待
- **调用方**：`useTransUpload.uploadFile()`（哈希校验阶段）

#### `updateClientHash(fileName, relativeDir, hashCode)`

- **接口**：`PUT /client/fileInfo/updateClientFileHashCode`
- **业务规则**：
  1. `fileName` 会被 `encodeURIComponent` 编码
  2. 将客户端计算的哈希值写入后端，用于双端比对
- **调用方**：`useTransUpload.uploadFile()`（哈希校验阶段）

### 4.4 下载操作类

#### `downloadFile(fileName, relativeDir, params, onProgress?)`

- **接口**：`GET /api/file/download`
- **业务规则**：
  1. `responseType` 为 `blob`
  2. 支持下载进度回调
  3. 错误时从 `error.response.statusText` 提取错误信息
- **调用方**：`useTransDownload.downloadFile()`

#### `downloadAndSave(fileName, relativeDir, params, onProgress?)`

- **接口**：内部调用 `downloadFile()`，然后创建临时 `<a>` 元素触发浏览器下载
- **业务规则**：
  1. 使用 `URL.createObjectURL(blob)` 创建下载链接
  2. 下载完成后调用 `URL.revokeObjectURL()` 释放内存
- **调用方**：`useTransDownload`、`useFileDownload`

#### `checkPackageStatus(relativeDir, params)`

- **接口**：`GET /HJWeb/isPackage`
- **业务规则**：
  1. 检查文件夹是否正在打包中
  2. `result === true` 表示正在打包，需等待
- **调用方**：`useTransDownload.downloadDirectory()`

### 4.5 断点续传类

#### `getUploadedChunks(fileUUID, fileName, relativeDir, params)`

- **接口**：`GET /Handler/UploadHandler?act=chunks`
- **业务规则**：
  1. 查询服务端已接收的分片信息
  2. 返回每个分片的 `index`、`hash`、`size`
  3. `hash = "partial"` 表示服务端哈希尚未算完，但 **不代表数据不完整**
  4. 数据完整性判断规则：非最后分片 `size >= CHUNK_SIZE`；最后分片 `size > 0`
- **调用方**：`useTransUpload.checkChunkStatus()`

#### `pauseUpload(fileName, qqpath, params)`

- **接口**：`POST /Handler/UploadHandler?act=pause`
- **调用方**：`useTransUpload.pauseUpload()`

#### `cancelUploadApi(fileName, qqpath, params)`

- **接口**：`POST /Handler/UploadHandler?act=cancel`
- **业务规则**：通知后端清理临时分片文件，否则后端会残留临时文件
- **调用方**：`useTransUpload.cancelUpload()`

### 4.6 存储空间类

#### `getStorageInfo(params)`

- **接口**：`GET /Handler/UploadHandler?act=storage`
- **业务规则**：
  1. 返回 `usedSize` 和 `totalSize`
  2. 用于上传前校验剩余空间是否充足
- **调用方**：`useTransUpload.checkStorageSpace()`

### 4.7 哈希计算工具

| 方法 | 说明 |
|---|---|
| `calculateSHA256(file)` | 使用 Web Crypto API 计算文件 SHA-256 哈希（整个文件） |
| `calculateChunkHash(chunk)` | 计算分片 Blob 的 SHA-256 哈希 |

### 4.8 辅助函数

| 方法 | 说明 |
|---|---|
| `formatFileSize(bytes)` | 格式化文件大小（B/KB/MB/GB） |
| `getChunkSize()` | 返回分片大小常量 4MB |
| `getTransToken()` | 从 sessionStorage 获取传输 Token |
| `clearTransToken()` | 清除传输 Token |

---

## 5. Composable 层业务规则

### 5.1 useTransUpload — 上传 Composable

#### 上传流程状态机

```
pending → uploading → hashing → verifying → completed
                      ↓                     ↓
                   error ←──────────── mismatched (哈希不一致)
                   paused (用户暂停)
```

#### 核心常量

| 常量 | 值 | 说明 |
|---|---|---|
| `CHUNK_SIZE` | 4MB | 分片大小 |
| `MAX_CONCURRENT_UPLOADS` | 3 | 最大并发上传数 |
| `MAX_AUTO_RETRY` | 3 | 自动重试最大次数 |
| `AUTO_RETRY_DELAY` | 2000ms | 自动重试间隔 |
| `SMALL_FILE_THRESHOLD` | 4MB | 小文件阈值，低于此值上传前预计算哈希 |

#### 关键业务规则

**P0-1 错误分类与重试**（对齐 `onError`）：
- 登录过期 → 触发 `trans-token-expired` 全局事件
- 文件已存在 / 文件正在上传 → 取消，不重试
- 网络错误 / 服务端 5xx → 自动重试，最多 3 次
- 重试时走断点续传逻辑，自动跳过已上传分片

**P0-2 取消上传清理**（对齐 `onCancel`）：
- 前端：中止 AbortController + 删除 IndexedDB 记录和分片数据
- 后端：调用 `cancelUploadApi` 通知清理临时分片

**P0-3 文件名校验**（对齐 `onSubmit`）：
- `blackList`（base64 编码）解码后为禁用字符
- 默认拦截 `\:*?"<>|`
- 文件名长度 ≤ `maxLength4Name`，路径长度 ≤ `maxLength4Path`

**P1-4 分片哈希附到请求**（对齐 `onUploadChunk`）：
- 每个分片上传时计算 SHA-256 哈希，通过 `qqhashcode` 参数传递给后端

**P1-5 存储空间校验**（对齐 `onValidate`）：
- 上传前调用 `getStorageInfo` 检查剩余空间
- 空间不足时拦截并提示

**P1-6 可重试错误自动重试**（对齐 `retry.enableAuto`）：
- 网络错误 / 服务端错误自动重试
- 重试间隔 2 秒，最多 3 次

**P2-7 小文件预计算哈希**（对齐 `onUpload`）：
- 文件大小 ≤ 4MB 时，上传前预计算 SHA-256
- 后续哈希校验阶段直接复用，避免重复计算

**P2-9 速率估算**：
- 使用服务端返回的 `timeLeft`（预估剩余时间）估算上传速率
- `speed = 剩余字节数 / timeLeft(秒)`

#### 进度计算规则

```
上传阶段：progress = uploadedChunkCount / totalChunks * 99（上限 99%）
校验完成：progress = 100%
```

#### 哈希校验流程

1. 所有分片上传完成 → 客户端计算文件 SHA-256
2. 调用 `updateClientHash()` 将客户端哈希写入后端
3. 轮询调用 `getServerHash()` 获取服务端哈希（3 秒间隔）
4. 解析返回值：`error` 字段格式为 `文件名%2C服务端哈希`
5. 有效哈希判断：长度 === 64 且全部大写比对
6. 双端哈希一致 → `matched`；不一致 → `mismatched`

#### 重复文件拦截

- 上传前逐文件计算 SHA-256
- 与已上传列表比对：**hash 相同且文件名相同** 才视为重复
- hash 相同但文件名不同 → 放行（允许同名不同内容的文件覆盖）

#### 自动提交

- 开启"上传完毕后自动提交"后，`watchDeep` 监听上传列表
- 条件：所有文件已完成且无活跃上传 + 所有哈希校验通过
- 满足条件后自动调用 `completeUpload()`

#### 文件列表刷新策略

上传完成后后端哈希可能尚未算完（`hashCode = null`），采用延迟重试策略：
1. 首次立即刷新
2. 如果仍有 `hashCode` 为 null 的文件，3 秒后重试
3. 最多重试 3 次

### 5.2 useTransDownload — 下载 Composable

#### 目录导航

| 方法 | 说明 |
|---|---|
| `enterDirectory(dir, params)` | 进入子目录 |
| `goBack(params)` | 返回上级目录 |
| `refreshCurrent(params)` | 刷新当前目录 |
| `isRootDirectory()` | 判断是否根目录 |

#### 下载流程

1. 初始化（`initDownload`）→ 加载文件列表
2. 选择文件/文件夹
3. 文件夹下载前先调用 `checkPackageStatus` 检查打包状态
4. 调用 `downloadAndSave` 下载并保存
5. 使用 Blob URL + `<a>` 标签触发浏览器下载

### 5.3 useFileDownload — 申请单详情页下载

- 用于申请单管理页面中的文件下载场景
- 从 `downloadUrl` 中提取 `params` 参数
- 串行逐个下载文件
- 批量下载时只初始化一次 Token

### 5.4 useApplicationForm — 申请单表单

- 在 `handleNextWithSubmit()` 中调用 `updateTransClientBaseURL(url)` 切换直连地址
- 在 `handleSubmitReal()` 中调用 `completeUpload()` 确认上传完成
- 从 `uploadUrl` 中提取 `params` 参数，供后续上传使用

---

## 6. 组件层说明

### 6.1 TransUploadView

- 外网独立上传页面，通过路由参数 `params` 和 `lang` 初始化
- 包含拖拽上传区域、上传列表、已上传文件列表
- 集成自动提交功能

### 6.2 StepTwoUploadFile

- 申请单流程中的第二步"上传文件"组件
- 通过 Props 接收 `params`
- 通过 `defineExpose` 暴露 `validateBeforeSubmit()` 方法，供父组件在提交前校验：
  - 上传队列中无未完成文件
  - 无哈希校验失败的文件

### 6.3 TransDownloadView

- 外网独立下载页面，通过路由参数初始化
- 支持目录导航、文件/文件夹选择下载

### 6.4 TransFileTable

- 通用文件表格组件，支持三种模式：
  - `upload`：上传列表（进度条、暂停/继续/重试/删除）
  - `uploaded`：已上传文件列表（哈希校验状态展示）
  - `download`：下载列表（目录导航、全选下载）

---

## 7. 辅助模块说明

### 7.1 upload-validator.ts — 文件名校验

| 方法 | 说明 |
|---|---|
| `decodeBlackList(encodedBlackList)` | 解码 base64 编码的黑名单字符 |
| `validateFileName(fileName, blackList, maxLength4Name)` | 校验单个文件名合法性 |
| `validateFilePath(relativeDir, fileName, maxLength4Path)` | 校验文件路径长度 |
| `validateFileNames(files, blackList, maxLength4Name, maxLength4Path, relativeDir)` | 批量校验 |

### 7.2 upload-error.ts — 错误分类

| 枚举值 | 是否可重试 | 是否取消上传 |
|---|---|---|
| `AUTH_EXPIRED` | ✗ | ✓ |
| `FILE_EXISTS` | ✗ | ✓ |
| `FILE_UPLOADING` | ✗ | ✓ |
| `FILENAME_TOO_LONG` | ✗ | ✓ |
| `ACCESS_DENIED` | ✗ | ✓ |
| `NETWORK_ERROR` | ✓ | ✗ |
| `SERVER_ERROR` | ✓ | ✗ |
| `UNKNOWN` | ✓ | ✗ |

### 7.3 upload-db.ts — IndexedDB 持久化

- 使用 Dexie.js 封装 IndexedDB
- 数据库名：`TransUploadDB`
- 两张表：
  - `chunks`：分片信息（`fileUUID + chunkIndex` 复合索引）
  - `uploads`：上传记录（`fileUUID`, `status`, `updatedAt` 索引）
- 自动清理策略：已完成记录保留 7 天，失败记录保留 30 天

---

## 8. Token 管理机制

| Token | 存储位置 | 传递方式 | 生命周期 |
|---|---|---|---|
| Auth Token | `authStore.token` | Cookie `token` + Header `token` | 跟随登录状态 |
| Trans Token | `sessionStorage.trans_token` | Header `Authorization` | 初始化时设置，过期时清除 |

**Token 过期处理流程**：
1. 响应拦截器检测到 `data.success === false` + "登录信息已过期"
2. 清除 `sessionStorage` 中的 trans_token
3. 派发 `window` 自定义事件 `trans-token-expired`
4. 应用层监听此事件，引导用户重新登录

---

## 9. 后端接口汇总

| 接口路径 | HTTP 方法 | act 参数 | 说明 |
|---|---|---|---|
| `/api/upload/init` | GET | - | 上传初始化 |
| `/api/download/init` | GET | - | 下载初始化 |
| `/Handler/FileListHandler` | POST | - | 获取文件列表 |
| `/Handler/UploadHandler` | POST | `add` | 分片上传 |
| `/Handler/UploadHandler` | POST | `delete` | 删除文件 |
| `/Handler/UploadHandler` | POST | `complete` | 确认上传完成 |
| `/Handler/UploadHandler` | POST | `HASH` | 获取服务端哈希 |
| `/Handler/UploadHandler` | GET | `chunks` | 查询已上传分片 |
| `/Handler/UploadHandler` | POST | `pause` | 暂停上传 |
| `/Handler/UploadHandler` | POST | `cancel` | 取消上传 |
| `/Handler/UploadHandler` | GET | `storage` | 查询存储空间 |
| `/api/file/download` | GET | - | 文件下载 |
| `/HJWeb/isPackage` | GET | - | 检查文件夹打包状态 |
| `/client/fileInfo/updateClientFileHashCode` | PUT | - | 更新客户端哈希 |

---

## 10. 开发注意事项

### 10.1 CORS 注意事项

- `transClient` 直连传输服务器时，需确保传输服务器已配置 CORS 允许前端域名
- `withCredentials` 不在 transClient 中全局设置，认证信息通过 Header 和 Cookie 手动携带

### 10.2 哈希校验的特殊处理

- `getServerHash()` 的返回值中 `error` 字段被复用为哈希值载体，需解析 `文件名%2C服务端哈希` 格式
- 后端 `hashCode` 可能返回字符串 `"null"`，需视为无效值
- 有效客户端哈希长度必须为 64 位

### 10.3 文件名编码

- `getServerHash()` 中使用 `escapeUnicode()` 对文件名编码（对齐老代码 `escape()`）
- `deleteFiles()` 中使用 `encodeURIComponent(JSON.stringify(files))`
- `updateClientHash()` 中对 `fileName` 使用 `encodeURIComponent`

### 10.4 断点续传判断

- 分片数据完整性由 `size` 判断，而非 `hash`
- `hash = "partial"` 仅表示服务端哈希未算完，**不代表数据不完整**
- 非最后分片：`size >= CHUNK_SIZE` 视为完整
- 最后分片：`size > 0` 视为完整

### 10.5 直连协议注意

- 后端返回的 `uploadUrl` 协议决定前端请求协议
- 测试环境返回 HTTP，页面也必须用 HTTP 访问
- 浏览器 HSTS 缓存可能导致 HTTP 被强制升级为 HTTPS，需清除
