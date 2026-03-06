# Task P8.2 执行记录

## 执行范围
本次执行 `P8.2 审批详情页面`，并同步落地 `P8.4 审批时间线组件`，复用已有详情信息与文件列表抽象。

## 子任务拆分
- [ √ ] 复用 `DetailInfoSection` 与 `DetailFileTable` 到审批详情页
- [ √ ] 新增 `src/views/approvals/ApprovalDetailView.vue`
- [ √ ] 新增 `src/views/approvals/approval-detail.scss`
- [ √ ] 新增 `src/composables/useApprovalDetail.ts`
- [ √ ] 新增 `src/components/business/approval/ApprovalTimeline.vue`
- [ √ ] 新增 `src/components/business/approval/approval-timeline.scss`
- [ √ ] 新增审批详情路由 `/approvals/:id`
- [ √ ] 增补审批历史接口（`approvalApi.getHistory` + mock `GET /approvals/:id/history`）
- [ √ ] 审批管理入口页补充详情示例跳转
- [ √ ] build 校验通过（`npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run build`）
