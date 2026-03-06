# DetailFileTable 文件链路修复执行记录（专项）

## 目标
修复申请详情页 `DetailFileTable.vue` 相关文件链路问题，确保：
1. 文件列表显示真实上传文件（非固定测试文件）
2. 文件下载优先下载真实二进制内容（非几十字节 mock 文本）
3. 我的申请单列表“文件数”显示真实数量

## 本次执行范围
- `qtrans-frontend/src/composables/useApplicationDetail.ts`
- `qtrans-frontend/src/composables/useApplicationForm.ts`
- `qtrans-frontend/src/components/business/FileUpload.vue`
- `qtrans-frontend/src/views/application/ApplicationListView.vue`
- `qtrans-frontend/src/types/file.ts`

## 执行过程（按问题链路）
- [√] 定位详情页文件列表固定为测试数据原因：`useApplicationDetail.ts` 存在 mock 回退分支，且上游申请提交流程未稳定绑定真实文件数据。
- [√] 修复申请提交时文件绑定：在 `useApplicationForm.ts` 提交后将 `uploadedFiles` 按 `applicationId` 写入 `fileStore`。
- [√] 修复上传组件写入：`FileUpload.vue` 上传成功后向 `fileStore` 写入文件元信息与原始 `Blob/File`。
- [√] 扩展文件类型定义：`FileInfo` 增加 `fileBlob?: Blob`，承载真实下载内容。
- [√] 修复详情下载：`useApplicationDetail.ts` 下载逻辑改为优先从 `fileStore.files` 取 `fileBlob` 下载；无二进制时才回退 mock。
- [√] 修复下载稳定性：下载触发改为 DOM anchor + 延迟 `URL.revokeObjectURL`，避免浏览器写盘未完成时过早释放 URL。
- [√] 修复申请列表文件数：`ApplicationListView.vue` 文件数由估算逻辑改为 `fileStore.getFilesByApplicationId(record.id).length`。

## 关键结论
1. 当前项目（Mock 阶段）可下载“本次会话中已写入 `fileBlob` 的真实文件内容”。
2. 历史记录若缺少 `fileBlob`，会走 mock 回退下载。
3. `.crdownload` 为浏览器下载中的临时文件；若过早释放 URL 可能导致残留，已在代码中通过延迟释放规避。

## 验收建议
1. 新建申请，上传多个文件并提交。
2. 在“我的申请单”核对“文件数”是否与上传数一致。
3. 进入详情逐个下载：检查名称、后缀、体积与源文件一致。
4. 批量下载：检查均能落盘并可正常打开。

## 当前边界
- 受限于当前 Mock 架构，文件数据来源于前端存储，不是后端持久化文件服务。
- 对于历史旧申请（未保存 `fileBlob`）无法保证真实下载，需要后续补“按 IndexedDB 分片重组下载”能力。