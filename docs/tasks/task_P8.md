# task_P8 - 审批模块

## 任务目标

实现审批流程的完整功能，包括待审批列表、审批详情、审批操作（通过/驳回/免审）和审批时间线组件。

## 前置依赖

- P3.4 Approval Store 已完成
- P4.3 布局组件已完成
- P6.4 申请单详情页面已完成

---

## 子任务清单

### P8.1 待审批列表页面（3h）

- [√] 创建 `src/views/approvals/ApprovalListView.vue`
  - 页面标题：「待审批列表」+ 待审批数量徽标
  - Tab 切换：待我审批 / 我已审批 / 全部审批
  - 筛选区域（a-form inline）：
    - 申请单号（a-input）
    - 传输类型（a-select）
    - 申请人（a-input）
    - 申请时间范围（a-range-picker）
    - 查询按钮 + 重置按钮
  - 数据表格（a-table）：
    - 列：申请单号、传输类型、申请人、申请部门、申请时间、当前审批层级、操作
    - 当前审批层级列：展示「一级审批」/「二级审批」/「三级审批」标签
    - 操作列：
      - 待我审批：审批按钮（跳转审批详情）
      - 我已审批：查看详情
  - 分页器（a-pagination）
  - 空状态：无待审批时展示「暂无待审批申请单」
- [√] 创建 `src/composables/useApprovalList.ts`
  - `activeTab` - 当前 Tab（pending/approved/all）
  - `listData` - 列表数据
  - `loading` - 加载状态
  - `pagination` - 分页参数
  - `filters` - 筛选条件
  - `fetchList()` - 获取列表数据（根据 activeTab 调用不同 API）
  - `handleTabChange(tab)` - 切换 Tab
  - `handleSearch()` - 搜索
  - `handleReset()` - 重置筛选
  - `handlePageChange()` - 翻页
- [√] 样式文件 `src/views/approvals/approval-list.scss`


### P8.2 审批详情页面（4h）

- [√] 创建 `src/views/approvals/ApprovalDetailView.vue`

  - 页面标题：申请单号 + 当前审批层级标签
  - 顶部操作栏（仅待审批状态显示）：
    - 通过按钮（a-button type="primary"）
    - 驳回按钮（a-button type="outline" status="danger"）
    - 免审按钮（a-button type="outline"，仅管理员可见）
  - 申请单信息区域（复用 `ApplicationDetailView` 的信息展示部分）：
    - 基本信息
    - 申请信息
    - 文件列表
  - 审批记录区域：
    - 使用 `ApprovalTimeline` 组件（P8.4）
  - 审批操作区域（待审批状态）：
    - 审批意见输入框（a-textarea，选填，最多500字）
    - 通过/驳回按钮（与顶部操作栏同步）
- [√] 创建 `src/composables/useApprovalDetail.ts`

  - `detailData` - 详情数据
  - `loading` - 加载状态
  - `approvalOpinion` - 审批意见
  - `fetchDetail(id)` - 获取详情
  - `handleApprove()` - 审批通过
  - `handleReject()` - 审批驳回
  - `handleExempt()` - 免审（管理员）
- [√] 样式文件 `src/views/approvals/approval-detail.scss`


### P8.3 审批操作（3h）

- [√] 在 Approval Store 中实现审批操作方法：
  - `approve(applicationId, opinion)` - 审批通过
    1. 调用 `approvalApi.approve({ applicationId, opinion })`
    2. 更新申请单状态：
       - 如果是最后一级审批，状态改为 `'approved'`，自动开始传输
       - 否则，`currentApprovalLevel++`，通知下一级审批人
    3. 记录审批记录（approver, level, action, opinion, time）
    4. 发送通知给申请人和下一级审批人
  - `reject(applicationId, opinion)` - 审批驳回
    1. 调用 `approvalApi.reject({ applicationId, opinion })`
    2. 更新申请单状态为 `'rejected'`
    3. 记录审批记录
    4. 发送通知给申请人
  - `exempt(applicationId, opinion)` - 免审（管理员）
    1. 调用 `approvalApi.exempt({ applicationId, opinion })`
    2. 更新申请单状态为 `'approved'`，跳过所有审批层级
    3. 记录审批记录（action: 'exempt'）
    4. 自动开始传输
    5. 发送通知给申请人
- [√] 审批操作确认弹窗：
  - 通过：`a-modal` 确认弹窗，「确认通过该申请单？」
  - 驳回：`a-modal` 确认弹窗，「确认驳回该申请单？驳回后申请人需重新提交」，必填审批意见
  - 免审：`a-modal` 确认弹窗，「确认免审该申请单？将跳过所有审批流程」
- [√] 操作成功后：
  - 显示成功提示（a-message.success）
  - 刷新列表数据
  - 跳转回待审批列表

### P8.4 审批时间线组件（2h）

- [√] 创建 `src/components/business/approval/ApprovalTimeline.vue`

  - 使用 `a-timeline` 展示审批流程
  - Props：
    - `applicationId: string` - 申请单 ID
    - `approvalRecords: ApprovalRecord[]` - 审批记录列表
    - `currentLevel: number` - 当前审批层级
    - `totalLevels: number` - 总审批层级
  - 时间线节点：
    - 节点1：申请提交（申请人、提交时间）
    - 节点2-N：各级审批（审批人、审批时间、审批意见、审批结果）
    - 最后节点：审批完成/驳回/免审
  - 节点状态：
    - 已完成：绿色圆点
    - 进行中：蓝色圆点（带动画）
    - 未开始：灰色圆点
  - 审批结果标签：
    - 通过：绿色 `a-tag` 「已通过」
    - 驳回：红色 `a-tag` 「已驳回」
    - 免审：橙色 `a-tag` 「已免审」
  - 审批意见展示：使用 `a-typography-paragraph` 展示，支持展开/收起（超过3行）
- [√] 样式文件 `src/components/business/approval/approval-timeline.scss`

  - 时间线节点样式
  - 审批意见区域样式

---

## 技术要点

### 审批记录数据结构
```typescript
interface ApprovalRecord {
  id: string
  applicationId: string
  level: number // 审批层级（1/2/3）
  approverId: string
  approverName: string
  action: 'approve' | 'reject' | 'exempt'
  opinion: string
  createTime: string
}
```

### 审批层级判断逻辑
```typescript
const getRequiredApprovalLevels = (transferType: string): number => {
  const levelMap = {
    'green-to-green': 0,      // 免审
    'green-to-yellow': 1,     // 一级
    'green-to-red': 2,        // 二级
    'yellow-to-yellow': 1,    // 一级
    'yellow-to-red': 2,       // 二级
    'red-to-red': 2,          // 二级
    'cross-country': 3        // 三级
  }
  return levelMap[transferType] || 0
}

const isLastLevel = (currentLevel: number, transferType: string): boolean => {
  return currentLevel >= getRequiredApprovalLevels(transferType)
}
```

### 审批通过后自动开始传输
```typescript
const handleApprove = async () => {
  await approvalStore.approve(applicationId, approvalOpinion.value)

  // 判断是否最后一级
  if (isLastLevel(detailData.value.currentApprovalLevel, detailData.value.transferType)) {
    // 自动开始传输
    await transferStore.startTransfer(applicationId)
    Message.success('审批通过，已自动开始传输')
  } else {
    Message.success('审批通过，已通知下一级审批人')
  }

  router.push('/approvals')
}
```

---

## 验收标准

1. 待审批列表页面：
   - 三个 Tab 切换正常
   - 列表数据正确加载
   - 筛选、分页功能正常
2. 审批详情页面：
   - 申请单信息完整展示
   - 审批时间线正确展示
   - 待审批状态显示操作按钮
3. 审批操作：
   - 通过/驳回/免审操作正常
   - 确认弹窗正常显示
   - 操作成功后状态更新正确
   - 最后一级审批通过后自动开始传输
4. 审批时间线组件：
   - 时间线节点状态正确（已完成/进行中/未开始）
   - 审批意见展示正常
   - 审批结果标签颜色正确

---

## 单元测试要求

- `useApprovalList.ts`：测试列表加载、Tab 切换、筛选
- `useApprovalDetail.ts`：测试详情加载、审批操作
- `ApprovalTimeline.vue`：测试时间线渲染、节点状态
- Approval Store：测试审批操作方法、状态更新
