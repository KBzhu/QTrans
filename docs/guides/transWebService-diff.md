# 老代码 vs 新实现：功能差异对比报告

> 基于老代码 `TransWebService/src/main/resources/web/js/UploadPage.js` + `UploadPage.html` 与新代码仓 `qtrans-frontend` 的逐项对比。

---

## 1. 总览

| 维度 | 老代码 | 新实现 |
|---|---|---|
| 技术栈 | jQuery + Vue 2 + Element UI + FineUploader | Vue 3 + Arco Design + 自研 Composable |
| 哈希库 | CryptoJS (同步阻塞) | Web Crypto API (异步非阻塞) |
| 上传引擎 | FineUploader（黑盒封装） | 自研分片上传（白盒可控） |
| 持久化 | 无（刷新丢状态） | IndexedDB (Dexie.js) 支持跨会话断点续传 |
| 并发控制 | FineUploader maxConnections=1 | 自研并发控制 MAX_CONCURRENT_UPLOADS=3 |
| 国际化 | 后端模板变量 `${xxx}` + hidden input | 前端 i18n（预留） |

---

## 2. 功能差异详解

### 2.1 ✅ 已实现且行为一致

| # | 功能 | 老代码钩子/函数 | 新实现对应 | 差异说明 |
|---|---|---|---|---|
| 1 | 分片上传 (4MB) | `chunking.partSize = 4194304` | `CHUNK_SIZE = 4 * 1024 * 1024` | ✅ 完全一致 |
| 2 | 分片哈希计算 | `onUploadChunk → calcClientHash` | `uploadSingleChunk → calculateChunkHash` | ✅ 新实现用 Web Crypto API 替代 CryptoJS，性能更优 |
| 3 | 小文件预计算哈希 | `onUpload: if (!isChunk) calcClientHash` | `uploadFile: if (file.size <= SMALL_FILE_THRESHOLD)` | ✅ 逻辑一致，阈值同为 4MB |
| 4 | 文件名黑名单校验 | `onSubmit: fileRegx.test(name)` | `validateFileNames(files, blackList, ...)` | ✅ 逻辑一致，都支持 base64 编码的 blackList 解码 |
| 5 | 文件名/路径长度校验 | `onSubmit: name.length > maxLength4Name` | `validateFileName / validateFilePath` | ✅ 逻辑一致 |
| 6 | 存储空间校验 | `onValidate: totalFileSizes + data.size > totalSizeLimit` | `checkStorageSpace(params, fileSize)` | ✅ 新实现调接口获取，老代码前端累加 |
| 7 | 取消上传通知后端 | `onCancel: act=cancel` | `cancelUploadApi: act=cancel` | ✅ 逻辑一致 |
| 8 | 暂停上传 | `taskPauseRequest: act=pause` | `pauseUpload: act=pause` | ✅ 逻辑一致 |
| 9 | 自动重试 | `retry: { enableAuto: true, autoAttempts: 3 }` | `MAX_AUTO_RETRY=3, AUTO_RETRY_DELAY=2000` | ⚠️ 重试间隔不同：老代码 3 秒，新代码 2 秒 |
| 10 | 错误分类处理 | `onError` 关键词匹配 | `classifyUploadError` 枚举 | ✅ 新实现更结构化，但关键词覆盖一致 |
| 11 | 登录过期处理 | `LoginExpired()` 跳转页面 | `dispatchEvent('trans-token-expired')` | ✅ 新实现用事件机制，更解耦 |
| 12 | 客户端哈希写入后端 | `updateClientHashToDB: PUT /client/fileInfo/updateClientFileHashCode` | `updateClientHash` | ✅ 接口一致 |
| 13 | 服务端哈希轮询 | `getServerHashTimer: setInterval 3000ms` | `while(true) + setTimeout 3000ms` | ✅ 逻辑一致 |
| 14 | 双端哈希比对 | `validHashTimer: serverFileHashCode === clientFileHashCode` | `serverHashValue === clientHash.toUpperCase()` | ✅ 逻辑一致，都要求 64 位有效哈希 |
| 15 | 确认上传完成 | `CompleteSubmit: act=complete` | `completeUpload: act=complete` | ✅ 逻辑一致 |
| 16 | 文件列表浏览 | `refresh: FileListHandler` | `getFileList: FileListHandler` | ✅ 逻辑一致 |
| 17 | 删除已上传文件 | `deleteFileList: act=delete` | `deleteFiles: act=delete` | ✅ 逻辑一致 |
| 18 | 自动提交 | `AutoConfirm: setInterval 5000ms` | `watchDeep + confirmUpload` | ✅ 新实现用 Vue 响应式，更优雅 |
| 19 | 重复文件检测 | `onSubmit: transTaskData.find(name match)` | `handleFiles: calculateSHA256 + fileListData.find(hash+name match)` | ⚠️ 新实现更精确（哈希+文件名双重判断），老代码仅文件名+目录匹配 |

### 2.2 ⚠️ 已实现但有差异

| # | 功能 | 差异说明 |
|---|---|---|
| 1 | **并发上传数** | 老代码 `maxConnections=1`（单线程），新代码 `MAX_CONCURRENT_UPLOADS=3`（3 并发）。新实现性能更优，但需确认后端是否支持并发写入 |
| 2 | **重试间隔** | 老代码 `autoAttemptDelay: 3`（3 秒），新代码 `AUTO_RETRY_DELAY=2000`（2 秒） |
| 3 | **哈希计算方式** | 老代码使用 CryptoJS（同步，大文件分 1MB 块增量计算并显示进度），新代码使用 Web Crypto API（异步，一次性读取 ArrayBuffer）。**老代码在哈希阶段有分块进度显示，新代码没有** |
| 4 | **continue（继续）接口** | 老代码 `retryTask()` 调用 `act=continue` 通知后端继续上传；新代码 `resumeUpload()` 未调用 continue 接口，而是直接走 `uploadFile` + 断点续传逻辑 |
| 5 | **eds 错误处理** | 老代码 `onError` 中特殊处理了 `errorReason.indexOf("eds") > -1`（存储系统错误）；新代码 `upload-error.ts` 中未包含 "eds" 关键词映射 |
| 6 | **文件路径特殊字符校验** | 老代码 `onSubmit` 中对 `qqpath`（文件夹路径）也做了黑名单校验：`if (folderNames && fileRegx.test(folderNames))`；新代码 `validateFileNames` 只校验文件名和路径长度，**未对文件夹路径做黑名单字符校验** |
| 7 | **确认提交重试** | 老代码 `CompleteSubmit` 失败后会重试最多 3 次（`tryCount <= 3`）；新代码 `confirmUpload` 无重试机制 |
| 8 | **提交成功后行为** | 老代码提交成功后显示倒计时 5 秒自动关闭窗口（`closeWindowTab`）；新代码仅显示成功提示 |
| 9 | **确认提交前的二次确认弹窗** | 老代码有 `dialogConfirmVisible` 弹窗确认 + "不再提示" 选项（`disableConfirmComplete`）；新代码直接调用 `completeUpload`，无二次确认 |
| 10 | **哈希不匹配文件弹窗** | 老代码有专门的 `dialogTableVisible` 弹窗展示哈希不匹配文件的详细对比（客户端哈希 vs 服务端哈希）；新代码仅在列表中显示 `mismatched` 标签 |
| 11 | **文件列表刷新逻辑** | 老代码 `refresh()` 是增量更新（只添加不存在的文件/目录，更新已有文件的哈希）；新代码 `loadFileList()` 是全量替换。老代码有 `isAllowRefresh` 防抖，新代码无防抖 |
| 12 | **服务端哈希轮询（文件列表）** | 老代码有 `CheckServerFileHashFormDB()` 机制，当文件列表中有 `hashCode=null` 的文件时，自动 3 秒轮询刷新；新代码 `refreshFileListWithRetry` 仅在上传完成后触发 3 次重试 |
| 13 | **escapeUnicode vs escape** | 老代码使用 JS 原生 `escape()` 函数编码文件名；新代码使用自实现的 `escapeUnicode()` 模拟 `escape()` 行为。**注意：原生 `escape()` 已被废弃**，新实现的做法更正确 |

### 2.3 ❌ 老代码有但新代码未实现

| # | 功能 | 老代码实现 | 影响 | 优先级 |
|---|---|---|---|---|
| 1 | **文件夹上传** | `extraButtons: { folders: true }` + `onUploadFolderClick` + `webkitRelativePath` 提取目录结构 | 用户无法上传整个文件夹 | P0 |
| 2 | **WebSocket 客户端上传** | `clientUploadButtonClick` → `sendUploadRequest` → WebSocket 通知本地客户端程序上传 | 本地客户端上传通道完全缺失 | P1 |
| 3 | **缓存刷新（sessionManage）** | `refreshCacheTime: setInterval 60s, act=cache` | 长时间停留页面可能 Session 过期 | P1 |
| 4 | **页面卸载清理** | `OnBrowserBeforeUnload` 取消上传 + `OnBrowserUnload` 通知后端 `act=unload` | 关闭/刷新页面时后端可能残留临时文件 | P1 |
| 5 | **清理缓存按钮** | `settingCacheClear: act=clearCache` | 用户无法手动清理服务端缓存 | P2 |
| 6 | **设置面板（并发数/缓冲区大小）** | `dialogSettingVisible` 弹窗，可调整 `maximumConcurrency` 和 `bufferSize` | 用户无法自定义上传参数 | P2 |
| 7 | **隐私政策弹窗** | `etrans-private-policy` iframe + 同意确认 | 合规性要求，缺省可能不满足 | P1 |
| 8 | **语言切换** | `languageChange()` 中英文切换 | 国际化切换功能缺失 | P2 |
| 9 | **关于弹窗** | `dialogAboutVisible` 版本信息 | 低优先级 | P3 |
| 10 | **总进度条** | `onTotalProgress(loaded, total)` 显示整体上传进度 | 用户无法看到总体上传进度 | P2 |
| 11 | **传输任务统计** | 底部显示：运行任务数、最大并发数、任务总数 | 用户无法看到全局统计 | P2 |
| 12 | **已上传文件列表的目录导航** | 文件夹行可点击进入子目录；有"返回上级"按钮 | 上传页面只展示根目录文件，无法浏览子目录 | P1 |
| 13 | **Token 自动刷新** | `setInterval("refreshToken()", 60 * 1000)` | Token 可能过期导致上传中断 | P1 |
| 14 | **popTip 提示** | 文件上传完成后弹出提示，可关闭且"不再提示" | UX 细节缺失 | P3 |
| 15 | **客户端版本检测** | `existsNewVersion()` + 下载链接 | 缺失 | P2 |

### 2.4 🆕 新代码有但老代码没有

| # | 功能 | 新实现 | 价值 |
|---|---|---|---|
| 1 | **断点续传（跨会话）** | IndexedDB 持久化分片状态 + `getUploadedChunks` 查询服务端已上传分片 | 用户刷新/关闭页面后可继续上传 |
| 2 | **直连传输服务器** | `updateTransClientBaseURL` 绕过 nginx | 大文件传输性能提升 |
| 3 | **并发上传（3 线程）** | `MAX_CONCURRENT_UPLOADS=3` | 上传速度提升 |
| 4 | **重复文件哈希检测** | 上传前计算 SHA-256 与已上传文件比对（hash+文件名） | 避免重复上传相同内容 |
| 5 | **结构化错误分类** | `UploadErrorType` 枚举 + `classifyUploadError` | 更清晰的错误处理逻辑 |
| 6 | **速率估算** | 基于 `timeLeft` 估算上传速度 | 用户体验提升 |
| 7 | **提交前哈希校验** | `validateBeforeSubmit()` 检查所有文件哈希状态 | 避免提交哈希不匹配的文件 |
| 8 | **Composable 架构** | 逻辑拆分为 `useTransUpload` / `useTransDownload` / `useFileDownload` | 代码复用性、可维护性提升 |

---

## 3. API 接口差异

| 接口 | 老代码 | 新代码 | 差异 |
|---|---|---|---|
| `Handler/sessionManage?act=cache` | ✅ 每 60s 调用 | ❌ 未实现 | Session 保活 |
| `Handler/sessionManage?act=clearCache` | ✅ 设置面板调用 | ❌ 未实现 | 清理缓存 |
| `Handler/sessionManage?act=unload` | ✅ 页面卸载时调用 | ❌ 未实现 | 通知后端清理 |
| `Handler/UploadHandler?act=continue` | ✅ retryTask 调用 | ❌ 未实现 | 继续上传 |
| `agreedPrivacyStatement` | ✅ 隐私政策同意 | ❌ 未实现 | 合规 |
| `Handler/UploadHandler?act=chunks` | ❌ 无 | ✅ 断点续传查询 | 新增 |
| `Handler/UploadHandler?act=storage` | ❌ 无（前端累加） | ✅ 查询存储空间 | 新增 |
| WebSocket `ws://localhost:9800` | ✅ 客户端通信 | ❌ 未实现 | 本地客户端 |

---

## 4. 建议优先级排序

### P0 — 必须尽快补齐

1. **文件夹上传** — 核心功能缺失，用户无法上传文件夹结构
2. **act=continue 接口** — resume 时未通知后端，可能导致服务端状态不一致

### P1 — 应尽快补齐

3. **Session 保活（act=cache）** — 长时间上传 Session 过期风险
4. **页面卸载清理（act=unload）** — 关闭页面后端残留临时文件
5. **隐私政策弹窗** — 合规性要求
6. **Token 自动刷新** — `refreshToken()` 机制
7. **文件路径黑名单校验** — 目录路径中可能包含非法字符
8. **eds 错误处理** — 存储系统错误的特殊处理
9. **已上传文件列表的目录导航** — 上传页面的子目录浏览

### P2 — 建议后续迭代

10. **设置面板（并发数/缓冲区大小）**
11. **清理缓存按钮**
12. **总进度条**
13. **传输任务统计**
14. **语言切换**
15. **确认提交重试**
16. **确认提交前二次确认弹窗**
17. **哈希不匹配详情弹窗**
18. **文件列表增量更新 + 防抖**

### P3 — 可选

19. **关于弹窗**
20. **popTip 提示**
21. **提交成功倒计时关闭窗口**

---

## 5. 关键代码行为差异详解

### 5.1 continue vs pause 接口

老代码中恢复上传调用 `act=continue`：
```javascript
// 老代码 retryTask()
data: {
    act: 'continue',
    name: escape(transTask.fileName),
    qqpath: escape(transTask.relativeDir),
    ...
}
```

新代码中恢复上传直接走 `uploadFile` + `checkChunkStatus` 断点续传，**未调用 continue 接口**。

**风险**：后端可能依赖 `act=continue` 来恢复服务端的上传状态（如重新打开临时文件句柄），跳过此调用可能导致后续分片写入失败。

### 5.2 哈希计算进度显示

老代码分块增量计算哈希，有进度回调：
```javascript
// 老代码 calcClientHash（非 chunkData 场景）
const hashChunkSize = 1024 * 1024; // 1MB 增量
transTask.percent = getPercentage(index, totalChunks); // 显示哈希进度
```

新代码一次性读取整个文件计算：
```typescript
// 新代码 calculateSHA256
const arrayBuffer = await file.arrayBuffer() // 一次性读取
const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
```

**影响**：大文件哈希计算时，老代码有分块进度显示，新代码在哈希阶段用户看不到进度。建议后续改为分块增量计算。

### 5.3 文件列表增量 vs 全量

老代码增量更新：
```javascript
// 只添加不存在的文件
let currentIndex = myVue.fileListData.findIndex(item => item.fileName === fileInfo.fileName);
if (currentIndex === -1) {
    addFileInfo(fileInfo);
} else {
    // 更新已有文件的哈希
    myVue.fileListData[currentIndex].serverFileHashCode = fileInfo.hashCode;
}
```

新代码全量替换：
```typescript
fileListData.value = data // 直接赋值覆盖
```

**影响**：全量替换更简单但可能导致选中状态丢失、UI 闪烁。增量更新更平滑但逻辑更复杂。
