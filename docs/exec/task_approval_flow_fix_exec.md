# 审批链路与权限隔离修复执行记录（专项）

## 目标
修复以下业务问题：
1. “我的申请单”按提交人隔离（谁提交谁可见）。
2. 审批详情“文件列表”展示真实上传文件，移除固定 `审批附件汇总.zip` 假数据。
3. 绿区传红区（二级审批）在一级通过后正确流转到二级，不得直接进入传输。
4. “我已审批 / 全部审批”按当前审批人隔离，不再所有审批人看到同一批测试单。

## 本次执行范围
- `qtrans-frontend/src/composables/useApplicationList.ts`
- `qtrans-frontend/src/composables/useApplicationForm.ts`
- `qtrans-frontend/src/composables/useApprovalDetail.ts`
- `qtrans-frontend/src/composables/useApprovalList.ts`
- `qtrans-frontend/src/mocks/handlers/approval.ts`
- `qtrans-frontend/src/api/approval.ts`
- `qtrans-frontend/src/composables/__tests__/useApplicationList.spec.ts`
- `qtrans-frontend/src/composables/__tests__/useApprovalDetail.spec.ts`

## 执行过程
- [√] 定位“我的申请单”跨账号可见根因：列表合并了全量 `applications + drafts`，未按当前用户过滤。
- [√] 修复“我的申请单”隔离：`useApplicationList` 按 `authStore.currentUser.id === applicantId` 过滤。
- [√] 定位二级审批流转异常根因：`useApplicationForm` 提交时把 `currentApprovalLevel` 赋成“总审批级数”，导致首审就落到最终级。
- [√] 修复审批起始级：提交时统一从一级开始（无审批类型为 0 级）。
- [√] 定位审批详情文件异常根因：`useApprovalDetail` 使用固定 mock 文件构造函数。
- [√] 修复审批文件展示：改为读取 `fileStore.getFilesByApplicationId` 的真实上传文件。
- [√] 定位“我已审批/全部审批”异常根因：审批接口和前端列表未按当前登录审批人做作用域过滤。
- [√] 修复审批作用域：
  - 新增接口 `GET /approvals/processed`、`GET /approvals/all`
  - `pending/approve/reject/skip` 增加基于 token 的用户识别与审批层级权限校验
  - “我已审批”改为当前用户已处理单据，“全部审批”为当前用户待办+已办并集
- [√] 回归验证：专项测试 19 用例通过；全量覆盖率仍受历史 `useSystemConfig.spec.ts` 存量失败影响（已登记 `failedLog.md`）。

## 验证记录
### 通过
- `npm --prefix D:\VibeCoding\QTrans-0302new\qtrans-frontend run test -- src/composables/__tests__/useApplicationList.spec.ts src/composables/__tests__/useApprovalDetail.spec.ts src/composables/__tests__/useApprovalList.spec.ts`
- 结果：`3` 个测试文件、`19` 个用例全部通过。

### 失败（存量）
- `npm --prefix D:\VibeCoding\QTrans-0302new\qtrans-frontend run test:coverage`
- 失败点：`src/composables/__tests__/useSystemConfig.spec.ts`
  1. `expected ... to have a length of 3 but got 11`
  2. `TypeError: composable.loadConfig is not a function`
- 结论：非本次修复引入，已记录到 `failedLog.md`。

## AI工时统计
| task_id | 模块 | 基线工时 | AI工时 | 节省率 | 备注 |
|---|---|---:|---:|---:|---|
| approval_flow_fix | 审批链路与权限隔离专项修复 | 4h | 1.9h | 52.5% | 含问题定位、修复、专项回归与执行记录 |
