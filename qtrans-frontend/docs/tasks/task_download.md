# 文件下载功能对接

## 目标
在"待我下载"和"审批管理"的详情页文件列表中增加下载功能，"我的申请单"详情不增加下载。

## 方案
复用现有详情页，通过路由 query 参数 `showDownload=true` 控制下载按钮显示。

## 子任务

- [x] 3.1 创建 `useFileDownload` composable（下载流程：extractParams → initDownload → downloadAndSave）
- [x] 3.2 修改 `DetailFileTable.vue` 支持下载按钮列（通过 prop 控制）
- [x] 3.3 修改 `ApplicationDetailView.vue` 读取 `route.query.showDownload` 并传递给子组件
- [x] 3.4 修改 `ApprovalDetailView.vue` 始终显示下载按钮
- [x] 3.5 修改 `DownloadListView.vue` 跳转详情时带上 `?showDownload=true`
- [x] 3.6 `useApprovalDetail.ts` 对接 `getApplicationDetail` 真实接口
- [ ] 3.7 构建验证 + CHANGELOG 更新（待环境修复）
