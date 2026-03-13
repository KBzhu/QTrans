# P11 文件上传下载页面改造

## 任务目标
根据 task_Trans_Web.md 文档要求，改造文件上传下载页面，对接后端新接口规范。

## 接口变更对照

| 功能 | 旧接口 | 新接口 |
|------|--------|--------|
| 初始化 | 无 | GET /api/upload/init?params=xxx |
| 上传分片 | POST /files/upload/chunk | POST /Handler/UploadHandler?act=add |
| 删除文件 | DELETE /files/{fileId} | POST /Handler/UploadHandler?act=delete |
| 完成上传 | 无 | POST /Handler/UploadHandler?act=complete |
| 文件列表 | GET /files/list/{applicationId} | POST /Handler/FileListHandler |
| 下载文件 | 模拟下载 | GET /api/file/download |

## 子任务清单

- [√] 1. 创建新的API服务层 (src/api/transWebService.ts)
- [√] 2. 实现Token管理工具 (sessionStorage)
- [√] 3. 实现params参数处理（从路由获取）
- [√] 4. 创建上传页面视图 (TransUploadView.vue)
- [√] 5. 实现哈希校验（前端Mock）
- [√] 6. 创建下载页面视图 (TransDownloadView.vue)
- [√] 7. 更新路由配置
- [√] 8. 验证构建通过

## 执行记录

### 开始时间
2026-03-13

### 执行进度
- [√] 1. 创建 `src/api/transWebService.ts` - 完整的 TransWebService API 封装
- [√] 2. Token 管理 - sessionStorage 存储，请求拦截器自动携带
- [√] 3. params 参数处理 - 从路由 query 获取
- [√] 4. 创建 `src/views/trans/TransUploadView.vue` - 上传页面
- [√] 5. 哈希校验 - Web Crypto API SHA-256 计算（前端 Mock）
- [√] 6. 创建 `src/views/trans/TransDownloadView.vue` - 下载页面
- [√] 7. 更新 `src/router/routes.ts` - 新增 /trans/upload 和 /trans/download 路由
- [√] 8. 类型检查通过 - `npx vue-tsc --noEmit` 成功

### 产出文件清单
- `src/api/transWebService.ts` - API 服务层
- `src/composables/useTransUpload.ts` - 上传 composable
- `src/composables/useTransDownload.ts` - 下载 composable
- `src/views/trans/TransUploadView.vue` - 上传页面视图
- `src/views/trans/trans-upload.scss` - 上传页面样式
- `src/views/trans/TransDownloadView.vue` - 下载页面视图
- `src/views/trans/trans-download.scss` - 下载页面样式
- `src/router/routes.ts` - 路由配置（已更新）
- `src/api/index.ts` - API 导出（已更新）
- `docs/guides/P11_TransWebService_quickStart.md` - Quick Start 文档
