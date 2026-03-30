# 详情页文件列表对接真实接口执行记录

## 任务目标
1. 申请详情和审批管理详情页的文件列表对接真实后端接口
2. 添加分页支持
3. 移除上传时间列（后端暂不提供该字段）

## 真实接口
```
GET /workflowService/services/frontendService/frontend/myFileInfo/page/{pageSize}/{pageNum}?applicationId={id}
```

响应示例：
```json
{
  "pageVO": {
    "totalRows": 1,
    "curPage": 1,
    "pageSize": 10,
    "totalPages": 1
  },
  "result": [
    {
      "fileName": "same (1).xlsx",
      "fileSize": 45587,
      "folderName": "",
      "fileHashCode": "4533057ADF...",
      "clientFileHashCode": "4533057ADF...",
      "fileSizeUnit": "44.52(KB)",
      "relativeDir": null,
      "fileInfoId": null,
      "transferId": null,
      "fileDownloadUrl": null
    }
  ]
}
```

## 子任务清单
- [ √ ] 添加文件列表 API 类型定义和接口方法（application.ts）
- [ √ ] 更新 DetailFileItem 类型（types/detail.ts）
- [ √ ] 创建 useFileList 共享 composable
- [ √ ] 更新 DetailFileTable.vue：删除上传时间列、添加分页
- [ √ ] 更新 useApplicationDetail.ts 和 ApplicationDetailView.vue 对接文件列表
- [ √ ] 更新 useApprovalDetail.ts 和 ApprovalDetailView.vue 对接文件列表
- [ √ ] 更新 CHANGELOG

## 实际变更

### 1. 类型定义（`src/api/application.ts`）
- 新增 `MyFileInfoItem` - 文件信息列表项
- 新增 `MyFileInfoResponse` - 文件信息列表响应（复用 `RealPageVO`）
- 新增 `getMyFileInfoList` API 方法

### 2. DetailFileItem 类型更新（`src/types/detail.ts`）
- 移除 `uploadedAt` 字段
- 新增 `relativeDir`、`fileSizeUnit` 字段
- `id` 注释更新为"使用 fileHashCode"

### 3. 新增 `useFileList` composable（`src/composables/useFileList.ts`）
- 封装文件列表获取、分页、重置逻辑
- `fetchFiles(applicationId, page, pageSize)` - 获取文件列表
- `pagination` - Arco Design a-table 分页配置
- `totalFiles` - 文件总数
- `onPageChange` - 分页变更处理
- 供 `useApplicationDetail` 和 `useApprovalDetail` 共享复用

### 4. DetailFileTable.vue 更新
- 移除"上传时间"列及 `formatDateTime` 导入
- 新增 `pagination` prop（支持 `PaginationProps | false`）
- 新增 `@page-change` / `@page-size-change` 事件
- 数据或分页变更时自动清空选中项

### 5. useApplicationDetail.ts
- 移除本地 `DetailFileItem` 类型定义，改为从 `@/types/detail` 导入
- 移除空 `files` computed，改为使用 `useFileList`
- `fetchDetail` 中同时调用 `fetchFileList(id)` 获取文件列表
- 新增返回：`fileLoading`、`totalFiles`、`pagination`、`onFilePageChange`

### 6. ApplicationDetailView.vue
- 导入路径改为 `@/types/detail`
- 文件列表 tab 显示 `totalFiles`（而非当前页 `files.length`）
- `DetailFileTable` 传入 `:pagination`、`:loading="fileLoading"`、`@page-change`

### 7. useApprovalDetail.ts
- 移除 `fileInfoToDetailFileItem` 函数和 `fileStore` 依赖
- 改用 `useFileList` 获取文件列表
- `handleDownloadFile` / `handleBatchDownload` 改为提示"功能待对接"

### 8. ApprovalDetailView.vue
- 文件列表 tab 显示 `totalFiles`
- `DetailFileTable` 传入 `:pagination`、`:loading="fileLoading"`、`@page-change`

## 产出文件清单
| 文件路径 | 操作类型 | 说明 |
|---------|---------|------|
| `src/api/application.ts` | 修改 | 新增类型和API方法 |
| `src/types/detail.ts` | 修改 | 更新 DetailFileItem |
| `src/composables/useFileList.ts` | 新增 | 共享文件列表 composable |
| `src/composables/useApplicationDetail.ts` | 修改 | 对接真实文件列表 |
| `src/composables/useApprovalDetail.ts` | 修改 | 对接真实文件列表 |
| `src/components/business/detail/DetailFileTable.vue` | 修改 | 删除上传时间列、添加分页 |
| `src/views/application/ApplicationDetailView.vue` | 修改 | 传递分页和加载状态 |
| `src/views/approvals/ApprovalDetailView.vue` | 修改 | 传递分页和加载状态 |
| `CHANGELOG` | 修改 | 记录变更 |

## 校验结果
- `src/api/application.ts`：0 错误
- `src/types/detail.ts`：0 错误
- `src/composables/useFileList.ts`：0 错误
- `src/composables/useApplicationDetail.ts`：0 新增错误（存量模块解析错误不影响功能）
- `src/composables/useApprovalDetail.ts`：0 错误
- `src/components/business/detail/DetailFileTable.vue`：0 错误
- `src/views/application/ApplicationDetailView.vue`：0 错误
- `src/views/approvals/ApprovalDetailView.vue`：0 错误

## 待后续处理
1. 后端补充上传时间字段后，恢复"上传时间"列
2. 文件下载功能对接（参考 transWebService.ts 中的 downloadAndSave，需 initDownload 获取 token 后调用 downloadAndSave）

---

*执行完成时间: 2026-03-30*
