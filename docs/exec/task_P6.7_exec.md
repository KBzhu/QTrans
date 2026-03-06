# task_P6.7 执行记录（待我下载）

## 目标

基于 Figma `4088_301` 新增“待我下载”菜单与列表页，支持下载人可见性过滤、下载状态筛选、文件下载操作。

## 执行清单

- [√] 基于 Figma 4088_301 完成页面结构设计（标题/筛选栏/表格/分页）
- [√] 新增 `useDownloadList.ts`（筛选、分页、下载状态聚合、下载动作）
- [√] 新增 `DownloadListView.vue` + `download-list.scss`
- [√] 路由接入 `/downloads/pending` 与侧边栏菜单入口
- [√] 新增单元测试 `useDownloadList.spec.ts`
- [√] 运行 `pnpm test:coverage` 并记录结果


## 产出文件

- `qtrans-frontend/src/composables/useDownloadList.ts`
- `qtrans-frontend/src/views/download/DownloadListView.vue`
- `qtrans-frontend/src/views/download/download-list.scss`
- `qtrans-frontend/src/composables/__tests__/useDownloadList.spec.ts`
- `qtrans-frontend/src/router/routes.ts`
- `qtrans-frontend/src/components/common/AppSidebar.vue`
- `qtrans-frontend/src/utils/constants.ts`
- `qtrans-frontend/src/components/business/__tests__/FileUpload.spec.ts`（补充 Pinia 初始化，修复全量覆盖率执行阻塞）


## 验收点

1. 菜单出现“待我下载”，可进入页面。
2. 仅当前登录用户被设为下载人的申请单出现在列表。
3. 支持“全部状态/下载状态/关键字”筛选。
4. 支持“查看详情/下载文件”操作。
5. 下载状态按文件维度聚合（未下载/部分下载/已下载）。

## 测试结果

- `pnpm --dir "d:\VibeCoding\QTrans-0302new\qtrans-frontend" exec -- vitest run src/composables/__tests__/useDownloadList.spec.ts --coverage`：4/4 通过。
- `pnpm --dir "d:\VibeCoding\QTrans-0302new\qtrans-frontend" test:coverage`：14 个测试文件、53 个用例全部通过。

