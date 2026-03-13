# P11 TransWebService 文件上传下载 Quick Start

> 本文档覆盖 P11 TransWebService 外部文件上传下载功能，支持从申请详情页跳转独立上传/下载页面。

## 1. 模块概述

本轮已落地以下能力：

### 文件上传页面（/trans/upload）
- 从申请详情页跳转，携带加密 params 参数初始化
- 拖拽/点击上传文件
- 分片上传（4MB/片），支持大文件
- 客户端 SHA-256 哈希计算（Web Crypto API）
- 服务端哈希轮询校验
- 暂停/继续/取消上传
- 已上传文件管理（查看、删除）
- 确认上传完成

### 文件下载页面（/trans/download）
- 从申请详情页跳转，携带加密 params 参数初始化
- 文件列表展示（文件名、大小、修改时间）
- 目录导航（进入/返回）
- 单文件下载（支持进度显示）
- 文件夹下载（自动打包）
- 批量选择下载
- 全选/取消全选

## 2. 关键文件

### API 服务层
| 文件 | 说明 |
|------|------|
| `src/api/transWebService.ts` | TransWebService API 封装（初始化、上传、下载、哈希计算） |

### Composables
| 文件 | 说明 |
|------|------|
| `src/composables/useTransUpload.ts` | 上传状态管理与操作逻辑 |
| `src/composables/useTransDownload.ts` | 下载状态管理与操作逻辑 |

### 页面视图
| 文件 | 说明 |
|------|------|
| `src/views/trans/TransUploadView.vue` | 上传页面视图 |
| `src/views/trans/trans-upload.scss` | 上传页面样式 |
| `src/views/trans/TransDownloadView.vue` | 下载页面视图 |
| `src/views/trans/trans-download.scss` | 下载页面样式 |

### 路由配置
| 文件 | 说明 |
|------|------|
| `src/router/routes.ts` | 新增 `/trans/upload` 和 `/trans/download` 路由 |

## 3. 开发侧使用说明

### 3.1 页面入口

#### 上传页面
- 路由：`/trans/upload?params=xxx&lang=zh_CN`
- 权限：通过 params 参数验证（无需登录态）
- 跳转来源：申请详情页

#### 下载页面
- 路由：`/trans/download?params=xxx&lang=zh_CN`
- 权限：通过 params 参数验证（无需登录态）
- 跳转来源：申请详情页

### 3.2 上传 Composable 使用

```ts
import { useTransUpload } from '@/composables/useTransUpload'

const {
  // 状态
  uploading,
  initLoading,
  initData,
  fileListData,
  uploadFileList,

  // 方法
  initialize,
  loadFileList,
  uploadFile,
  uploadFiles,
  confirmUpload,
  removeFiles,
  pauseUpload,
  cancelUpload,
  retryUpload,
  clearCompleted,

  // 工具函数
  formatSpeed,
  generateFileId,
} = useTransUpload()

// 初始化页面
await initialize(params, 'zh_CN')

// 上传单个文件
await uploadFile(file, params, relativeDir, (item) => {
  console.log(`进度: ${item.progress}%`)
})

// 上传多个文件
await uploadFiles(files, params, relativeDir, onProgress)

// 确认上传完成
await confirmUpload(params)

// 暂停/取消/重试
pauseUpload(fileId)
cancelUpload(fileId)
await retryUpload(fileId, params, onProgress)
```

**上传状态说明**：
- `pending`：等待上传
- `uploading`：上传中
- `hashing`：计算客户端哈希
- `verifying`：服务端哈希校验中
- `completed`：上传完成
- `error`：上传失败
- `paused`：已暂停

### 3.3 下载 Composable 使用

```ts
import { useTransDownload } from '@/composables/useTransDownload'

const {
  // 状态
  loading,
  initLoading,
  initData,
  fileListData,
  currentRelativeDir,
  selectedFiles,
  downloadProgress,
  downloading,

  // 方法
  initialize,
  loadFileList,
  enterDirectory,
  goBack,
  refreshCurrent,
  toggleSelectFile,
  toggleSelectAll,
  downloadFile,
  downloadDirectory,
  downloadSelected,

  // 工具函数
  formatFileSize,
  getFileIcon,
  isRootDirectory,
} = useTransDownload()

// 初始化页面
await initialize(params, 'zh_CN')

// 进入目录
await enterDirectory(directory, params)

// 返回上级
await goBack(params)

// 下载单个文件
await downloadFile(file, params, (progress) => {
  console.log(`下载进度: ${progress.progress}%`)
})

// 批量下载选中的文件
await downloadSelected(params)
```

### 3.4 API 直接调用

```ts
import { transApi, initUpload, initDownload, getFileList, uploadChunk, downloadFile } from '@/api/transWebService'

// 初始化上传页面
const uploadInit = await initUpload(params, 'zh_CN')
// uploadInit.token 自动存入 sessionStorage

// 初始化下载页面
const downloadInit = await initDownload(params, 'zh_CN')

// 获取文件列表
const fileList = await getFileList(relativeDir, params)

// 分片上传
const formData = new FormData()
formData.append('file', chunkBlob)
formData.append('qquuid', fileId)
formData.append('qqpartindex', String(chunkIndex))
formData.append('qqtotalparts', String(totalChunks))
formData.append('qqfilename', fileName)
formData.append('qqtotalfilesize', String(fileSize))
await uploadChunk(formData, params, onProgress)

// 下载文件
const blob = await downloadFile(fileName, relativeDir, params, onProgress)

// 计算文件哈希
const hash = await transApi.calculateSHA256(file)
```

### 3.5 接口规范

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/upload/init` | GET | 上传页面初始化，返回 token |
| `/api/download/init` | GET | 下载页面初始化，返回 token |
| `/Handler/FileListHandler` | POST | 获取文件列表 |
| `/Handler/UploadHandler?act=add` | POST | 分片上传 |
| `/Handler/UploadHandler?act=HASH` | POST | 获取服务端哈希 |
| `/Handler/UploadHandler?act=complete` | POST | 确认上传完成 |
| `/Handler/UploadHandler?act=delete` | POST | 删除文件 |
| `/api/file/download` | GET | 文件下载 |
| `/HJWeb/isPackage` | GET | 检查文件夹打包状态 |
| `/client/fileInfo/updateClientFileHashCode` | PUT | 更新客户端哈希 |

## 4. 当前限制

### 上传页面
- 分片上传当前为前端实现，断点续传依赖后端支持
- 哈希校验为前端 Mock 实现，使用 Web Crypto API SHA-256
- 服务端哈希轮询最多 30 次（每次 3 秒，共 90 秒）

### 下载页面
- 文件夹下载依赖后端打包功能
- 当前无真实后端，下载功能为 Mock 实现
- 无断点续传支持

### 通用限制
- Token 存储在 sessionStorage，页面关闭后失效
- params 参数需要从申请详情页携带，无法直接访问
- 无真实后端时，需要配合 Mock 数据使用

## 5. QA 回归步骤

### 上传页面回归

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 从申请详情页点击「上传文件」跳转到 `/trans/upload?params=xxx` | 页面正常加载，显示上传区域 |
| 2 | 拖拽文件到上传区域 | 文件开始上传，显示进度条 |
| 3 | 观察上传进度 | 进度从 0% 逐步增加到 100% |
| 4 | 上传完成后观察哈希校验状态 | 显示「正在计算哈希」->「正在校验」->「校验通过」 |
| 5 | 点击「暂停上传」 | 上传暂停，按钮变为「继续上传」 |
| 6 | 点击「继续上传」 | 上传从断点继续 |
| 7 | 点击「取消上传」 | 该文件从列表移除 |
| 8 | 上传多个文件 | 显示批量上传列表，每个文件独立进度 |
| 9 | 点击已上传文件的「删除」 | 文件被删除，列表更新 |
| 10 | 点击「确认上传完成」 | 显示成功提示 |
| 11 | 直接访问 `/trans/upload`（无 params） | 页面提示参数错误或无法初始化 |

### 下载页面回归

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 从申请详情页点击「下载文件」跳转到 `/trans/download?params=xxx` | 页面正常加载，显示文件列表 |
| 2 | 查看文件列表 | 显示文件名、大小、修改时间 |
| 3 | 双击文件夹进入子目录 | 进入该目录，显示子目录内容 |
| 4 | 点击「返回上级」 | 返回上级目录 |
| 5 | 勾选多个文件 | 显示选中数量 |
| 6 | 点击「全选」 | 所有文件/文件夹被选中 |
| 7 | 点击「取消全选」 | 清空选中 |
| 8 | 点击单个文件的「下载」 | 开始下载，显示进度 |
| 9 | 下载完成后检查文件 | 文件成功保存到本地 |
| 10 | 点击「批量下载」 | 选中的文件依次下载 |
| 11 | 直接访问 `/trans/download`（无 params） | 页面提示参数错误或无法初始化 |

### 哈希校验流程回归

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 上传一个文件 | 上传完成后进入哈希计算阶段 |
| 2 | 观察客户端哈希计算 | 显示「正在计算哈希」 |
| 3 | 等待客户端计算完成 | 显示「正在校验服务端哈希」 |
| 4 | 等待服务端校验完成 | 显示「校验通过」或「校验失败」 |
| 5 | 如校验通过 | 文件状态变为「已完成」 |
| 6 | 如校验失败 | 文件状态变为「失败」，显示错误信息 |

## 6. 本轮测试命令

```bash
# 类型检查
cd d:\VibeCoding\QTrans-0302new\qtrans-frontend
npx vue-tsc --noEmit

# 运行测试（如有）
pnpm test:coverage
```

## 7. 页面布局说明

### 上传页面布局
```
┌─────────────────────────────────────────────────────────────┐
│  标题区域                                                    │
│  「文件上传」申请单号: XXXXXX                                 │
├─────────────────────────────────────────────────────────────┤
│  拖拽上传区域                                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         📁 拖拽文件到此处或点击上传                      │  │
│  │         支持任意类型文件，单文件最大 50GB                │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  上传列表                                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 文件名  大小  进度  状态  哈希校验  操作                │  │
│  │ file1.txt  10MB  ████████░░ 80%  上传中  -  暂停       │  │
│  │ file2.pdf  5MB   ██████████ 100% 完成  ✓通过  删除     │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  已上传文件管理                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 文件名  大小  上传时间  操作                            │  │
│  │ old_file.zip  100MB  2026-03-13 10:00  删除           │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  底部操作栏                                                  │
│  [清空已完成] [确认上传完成]                                  │
└─────────────────────────────────────────────────────────────┘
```

### 下载页面布局
```
┌─────────────────────────────────────────────────────────────┐
│  标题区域                                                    │
│  「文件下载」申请单号: XXXXXX                                 │
├─────────────────────────────────────────────────────────────┤
│  工具栏                                                      │
│  [返回上级] [刷新] [全选] [批量下载]   路径: /folder1/       │
├─────────────────────────────────────────────────────────────┤
│  文件列表                                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [ ] 名称        类型  大小    修改时间                  │  │
│  │ [ ] 📁 folder1  文件夹  -     2026-03-13 10:00         │  │
│  │ [ ] 📄 file.txt 文件   10KB   2026-03-13 11:00         │  │
│  │ [ ] 📄 data.pdf 文件   5MB    2026-03-13 12:00         │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  下载进度（下载时显示）                                       │
│  正在下载: file.pdf  ████████░░ 80%  4MB/5MB                │
└─────────────────────────────────────────────────────────────┘
```

## 8. 跳转参数说明

### params 参数（由申请详情页生成）
params 是加密后的参数字符串，包含：
- 申请单 ID
- 用户身份信息
- 有效期时间戳
- 其他业务参数

### lang 参数（可选）
- `zh_CN`：中文（默认）
- `en_US`：英文

### 示例跳转 URL
```
/trans/upload?params=eyJhcHBsaWNhdGlvbklkIjoiMTIzIn0=&lang=zh_CN
/trans/download?params=eyJhcHBsaWNhdGlvbklkIjoiMTIzIn0=&lang=en_US
```
