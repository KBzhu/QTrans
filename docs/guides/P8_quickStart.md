# P8 审批模块快速上手

## 目录
- [模块概述](#模块概述)
- [核心功能](#核心功能)
- [页面入口](#页面入口)
- [代码结构](#代码结构)
- [关键功能实现](#关键功能实现)
- [QA回归测试](#qa回归测试)

---

## 模块概述

审批模块提供完整的审批流程管理功能，包括待审批列表、审批详情、审批操作（通过/驳回/免审）和审批时间线展示。支持多级审批流程，最后一级审批通过后自动开始传输。

**技术栈：** Vue 3 + TypeScript + Arco Design + Pinia + MSW Mock

---

## 核心功能

### P8.1 待审批列表页面
- **Tab 切换**：待我审批 / 我已审批 / 全部审批
- **筛选功能**：申请单号、传输类型、申请人、申请时间范围
- **数据表格**：展示申请单号、传输类型、申请人、部门、申请时间、当前审批层级
- **审批层级标签**：一级审批（橙红色）、二级审批（红色）、三级审批（紫色）
- **操作按钮**：
  - 待我审批：显示"审批"按钮，跳转审批详情
  - 我已审批：显示"查看"按钮，查看审批记录
- **分页功能**：支持翻页和每页条数切换

### P8.2 审批详情页面
- **页面标题**：申请单号 + 当前审批层级标签
- **顶部操作栏**（仅待审批状态显示）：
  - 通过按钮（主按钮）
  - 驳回按钮（危险状态）
  - 免审按钮（仅管理员可见）
- **信息展示区域**：
  - 基本信息：申请人、申请单号、审批层级、状态、时间
  - 申请信息：部门、传输类型、区域、国家城市、下载人、抄送人、原因等
  - 文件列表：支持单个/批量下载
- **审批时间线**：展示申请提交 → 各级审批 → 审批完成/驳回的完整流程
- **审批意见区域**（待审批状态）：
  - 审批意见输入框（选填，最多500字，驳回时必填）
  - 通过/驳回/免审按钮

### P8.3 审批操作
- **审批通过**：
  - 确认弹窗：「确认通过该申请单？」
  - 审批层级判断：
    - 非最后一级：状态保持 `pending_approval`，`currentApprovalLevel + 1`，提示"已通知下一级审批人"
    - 最后一级：状态改为 `approved`，提示"已自动开始传输"
  - 1.5秒后自动跳转回审批列表
- **审批驳回**：
  - 必填审批意见，否则提示错误
  - 确认弹窗：「确认驳回该申请单？驳回后申请人需重新提交」
  - 状态改为 `rejected`，提示"申请已驳回"
  - 1.5秒后自动跳转回审批列表
- **免审**（管理员）：
  - 确认弹窗：「确认免审该申请单？将跳过所有审批流程」
  - 状态直接改为 `approved`，跳过所有审批层级
  - 提示"已自动开始传输"
  - 1.5秒后自动跳转回审批列表

### P8.4 审批时间线组件
- **时间线节点**：
  - 节点1：申请提交（申请人、提交时间）
  - 节点2-N：各级审批（审批人、审批时间、审批意见、审批结果）
  - 最后节点：审批完成/驳回/免审
- **节点状态**：
  - 已完成：绿色圆点
  - 进行中：蓝色圆点（带动画）
  - 未开始：灰色圆点
- **审批结果标签**：
  - 通过：绿色标签「已通过」
  - 驳回：红色标签「已驳回」
  - 免审：橙色标签「已免审」
- **审批意见展示**：超过3行支持展开/收起

---

## 页面入口

### 开发环境访问
```bash
# 启动开发服务器
cd qtrans-frontend
npm run dev

# 访问审批列表页
http://localhost:5173/approvals

# 访问审批详情页（示例ID：app_001）
http://localhost:5173/approvals/app_001
```

### 路由配置
```typescript
// src/router/routes.ts
{
  path: '/approvals',
  component: () => import('@/views/approvals/ApprovalListView.vue'),
  meta: { title: '待审批列表', requiresAuth: true }
},
{
  path: '/approvals/:id',
  component: () => import('@/views/approvals/ApprovalDetailView.vue'),
  meta: { title: '审批详情', requiresAuth: true }
}
```

---

## 代码结构

### 文件组织
```
src/
├── views/approvals/
│   ├── ApprovalListView.vue          # 审批列表页面
│   ├── approval-list.scss            # 列表样式
│   ├── ApprovalDetailView.vue        # 审批详情页面
│   └── approval-detail.scss          # 详情样式
├── composables/
│   ├── useApprovalList.ts            # 列表逻辑 composable
│   └── useApprovalDetail.ts          # 详情逻辑 composable
├── components/business/approval/
│   ├── ApprovalTimeline.vue          # 审批时间线组件
│   └── approval-timeline.scss        # 时间线样式
├── stores/
│   └── approval.ts                   # 审批 Store
├── api/
│   └── approval.ts                   # 审批 API
└── mocks/handlers/
    └── approval.ts                   # 审批 Mock 接口
```

### 核心 Composables

#### useApprovalList.ts
```typescript
export function useApprovalList() {
  const activeTab = ref<'pending' | 'approved' | 'all'>('pending')
  const listData = computed(() => {
    // 根据 activeTab 过滤数据
  })
  
  function handleTabChange(tab: string) { /* ... */ }
  function handleSearch() { /* ... */ }
  function handleReset() { /* ... */ }
  
  return {
    activeTab,
    listData,
    handleTabChange,
    handleSearch,
    // ...
  }
}
```

#### useApprovalDetail.ts
```typescript
export function useApprovalDetail() {
  const detailData = ref<Application | null>(null)
  const approvalOpinion = ref('')
  
  // 审批层级判断
  function isLastLevel(transferType: TransferType, currentLevel: number): boolean {
    const requiredLevels = approvalLevelMap[transferType]
    return currentLevel >= requiredLevels
  }
  
  async function handleApprove() {
    const isLast = isLastLevel(detailData.value.transferType, currentApprovalLevel.value)
    await approvalStore.approve(detailData.value.id, approvalOpinion.value)
    
    if (isLast) {
      Message.success('审批通过，已自动开始传输')
    } else {
      Message.success('审批通过，已通知下一级审批人')
    }
    
    setTimeout(() => router.push('/approvals'), 1500)
  }
  
  return {
    detailData,
    approvalOpinion,
    handleApprove,
    handleReject,
    handleExempt,
    // ...
  }
}
```

---

## 关键功能实现

### 1. 审批层级判断逻辑

**审批层级映射**（根据传输类型确定需要的审批层级）：
```typescript
const approvalLevelMap: Record<TransferType, number> = {
  'green-to-green': 0,      // 免审
  'green-to-yellow': 1,     // 一级审批
  'green-to-red': 2,        // 二级审批
  'yellow-to-yellow': 1,    // 一级审批
  'yellow-to-red': 2,       // 二级审批
  'red-to-red': 2,          // 二级审批
  'cross-country': 3        // 三级审批
}
```

**判断是否为最后一级审批**：
```typescript
function isLastLevel(transferType: TransferType, currentLevel: number): boolean {
  const requiredLevels = approvalLevelMap[transferType]
  return currentLevel >= requiredLevels
}
```

### 2. 审批操作流程

**审批通过流程**：
```typescript
async function handleApprove() {
  if (!detailData.value) return
  
  // 1. 判断是否为最后一级
  const isLast = isLastLevel(detailData.value.transferType, currentApprovalLevel.value)
  
  // 2. 调用 Store 执行审批
  const updated = await approvalStore.approve(
    detailData.value.id,
    approvalOpinion.value.trim() || '审批通过'
  )
  
  // 3. 更新本地状态
  detailData.value = updated
  approvalOpinion.value = ''
  await fetchApprovalHistory(updated.id)
  
  // 4. 根据是否最后一级展示不同提示
  if (isLast) {
    Message.success('审批通过，已自动开始传输')
  } else {
    Message.success('审批通过，已通知下一级审批人')
  }
  
  // 5. 1.5秒后自动跳转回列表
  setTimeout(() => {
    router.push('/approvals')
  }, 1500)
}
```

**MSW Handler 中的层级判断**：
```typescript
http.post('/api/approvals/:id/approve', async ({ params, request }) => {
  const id = String(params.id)
  const payload = await request.json() as { opinion?: string }
  const app = state.applications.find(item => item.id === id)
  
  if (!app) return failed('申请单不存在', 404)
  
  const requiredLevels = getRequiredApprovalLevels(app.transferType)
  const currentLevel = app.currentApprovalLevel || 1
  
  // 记录审批记录
  state.approvals.unshift(buildRecord(id, 'approve', payload.opinion || '审批通过'))
  
  // 判断是否为最后一级审批
  if (currentLevel >= requiredLevels) {
    // 最后一级：状态改为 approved，自动开始传输
    app.status = 'approved'
    app.currentApprovalLevel = 0
  } else {
    // 非最后一级：增加审批层级，继续待审批
    app.currentApprovalLevel = (currentLevel + 1) as ApprovalLevel
    app.status = 'pending_approval'
  }
  
  app.updatedAt = new Date().toISOString()
  
  return success(app, '审批通过')
})
```

### 3. Tab 切换与筛选

**Tab 切换逻辑**：
```typescript
const activeTab = ref<'pending' | 'approved' | 'all'>('pending')

const filteredList = computed(() => {
  let result = [...approvalStore.pendingApprovals]
  
  // 根据 Tab 过滤
  if (activeTab.value === 'pending') {
    result = result.filter(item => item.status === 'pending_approval')
  } else if (activeTab.value === 'approved') {
    result = result.filter(item => 
      item.status === 'approved' || item.status === 'rejected'
    )
  }
  
  // 应用其他筛选条件
  if (filters.keyword) {
    result = result.filter(item => 
      item.applicationNo.includes(filters.keyword)
    )
  }
  
  // 时间范围筛选
  if (filters.dateRange?.length === 2) {
    const [start, end] = filters.dateRange
    if (start && end) {
      result = result.filter(item => {
        const createdAt = dayjs(item.createdAt).format('YYYY-MM-DD')
        return createdAt >= start && createdAt <= end
      })
    }
  }
  
  return result
})
```

### 4. 审批时间线实现

**时间线节点生成**：
```typescript
const timelineItems = computed(() => {
  const items: TimelineItem[] = []
  
  // 节点1：申请提交
  items.push({
    type: 'submit',
    label: '申请提交',
    user: props.applicantName,
    time: props.submittedAt,
    status: 'finish'
  })
  
  // 节点2-N：各级审批
  for (let level = 1; level <= props.totalLevels; level++) {
    const record = props.approvalRecords.find(r => r.level === level)
    
    if (record) {
      // 已审批
      items.push({
        type: 'approval',
        level,
        label: `${levelMap[level]}审批`,
        user: record.approverName,
        time: record.createdAt,
        opinion: record.opinion,
        action: record.action,
        status: 'finish'
      })
    } else if (level === props.currentLevel) {
      // 当前审批中
      items.push({
        type: 'approval',
        level,
        label: `${levelMap[level]}审批`,
        status: 'process'
      })
    } else {
      // 未开始
      items.push({
        type: 'approval',
        level,
        label: `${levelMap[level]}审批`,
        status: 'wait'
      })
    }
  }
  
  // 最后节点：审批完成/驳回
  if (props.status === 'approved' || props.status === 'rejected') {
    items.push({
      type: 'end',
      label: props.status === 'approved' ? '审批完成' : '审批驳回',
      status: 'finish'
    })
  }
  
  return items
})
```

---

## QA 回归测试

### 测试准备
1. 启动开发服务器：`npm run dev`
2. 确保 MSW Mock 已启用（`.env.development` 中 `VITE_MOCK_ENABLED=true`）
3. 登录系统，切换到"审批人"角色

### 功能测试用例

#### 用例1：待审批列表页面
| 测试步骤 | 预期结果 |
|---------|---------|
| 1. 访问 `/approvals` | 默认展示"待我审批" Tab，列表加载待审批数据 |
| 2. 切换到"我已审批" Tab | 列表展示已审批的申请单 |
| 3. 切换到"全部审批" Tab | 列表展示所有审批相关的申请单 |
| 4. 输入申请单号搜索 | 筛选结果仅包含匹配的申请单 |
| 5. 选择传输类型筛选 | 筛选结果仅包含对应类型的申请单 |
| 6. 选择申请时间范围 | 筛选结果仅包含时间范围内的申请单 |
| 7. 点击"重置"按钮 | 清空所有筛选条件，恢复默认列表 |
| 8. 点击待审批记录的"审批"按钮 | 跳转到审批详情页 `/approvals/:id` |
| 9. 点击已审批记录的"查看"按钮 | 跳转到审批详情页（仅查看模式） |
| 10. 翻页操作 | 分页器正常工作，列表数据更新 |

#### 用例2：审批详情页面
| 测试步骤 | 预期结果 |
|---------|---------|
| 1. 访问 `/approvals/:id`（待审批状态） | 页面正常加载，显示顶部操作栏与审批意见区域 |
| 2. 查看基本信息 | 申请人、申请单号、审批层级、状态、时间等信息正确展示 |
| 3. 查看申请信息 | 部门、传输类型、区域、国家城市等信息正确展示 |
| 4. 切换到"文件列表" Tab | 文件列表正确展示，支持下载 |
| 5. 查看审批时间线 | 时间线正确展示申请提交、各级审批节点、当前进度 |
| 6. 访问已审批申请单详情 | 不显示顶部操作栏与审批意见区域，仅查看模式 |

#### 用例3：审批通过操作（非最后一级）
| 测试步骤 | 预期结果 |
|---------|---------|
| 1. 访问一个"一级审批"状态的申请单详情 | 当前审批层级显示"一级审批" |
| 2. 填写审批意见（选填） | 审批意见输入框正常输入 |
| 3. 点击"通过"按钮 | 弹出确认弹窗"确认通过该申请单？" |
| 4. 点击"确认通过" | 提示"审批通过，已通知下一级审批人" |
| 5. 等待1.5秒 | 自动跳转回审批列表 `/approvals` |
| 6. 再次访问该申请单详情 | 审批层级变为"二级审批"，状态仍为"待审批" |
| 7. 查看审批时间线 | 一级审批节点显示为已完成，二级审批节点显示为进行中 |

#### 用例4：审批通过操作（最后一级）
| 测试步骤 | 预期结果 |
|---------|---------|
| 1. 访问一个"三级审批"状态的"跨国传输"申请单详情 | 当前审批层级显示"三级审批"（最后一级） |
| 2. 点击"通过"按钮并确认 | 提示"审批通过，已自动开始传输" |
| 3. 等待1.5秒 | 自动跳转回审批列表 |
| 4. 再次访问该申请单详情 | 状态变为"已批准"，不显示操作按钮 |
| 5. 查看审批时间线 | 所有审批节点显示为已完成，最后节点显示"审批完成" |

#### 用例5：审批驳回操作
| 测试步骤 | 预期结果 |
|---------|---------|
| 1. 访问待审批申请单详情 | 页面正常加载 |
| 2. 点击"驳回"按钮（未填写审批意见） | 提示错误"请先填写驳回原因" |
| 3. 填写驳回原因 | 审批意见输入框正常输入 |
| 4. 点击"驳回"按钮 | 弹出警告弹窗"确认驳回该申请单？驳回后申请人需重新提交" |
| 5. 点击"确认驳回" | 提示"申请已驳回" |
| 6. 等待1.5秒 | 自动跳转回审批列表 |
| 7. 再次访问该申请单详情 | 状态变为"已驳回"，不显示操作按钮 |
| 8. 查看审批时间线 | 最后节点显示"审批驳回"，审批意见正确展示 |

#### 用例6：免审操作（管理员）
| 测试步骤 | 预期结果 |
|---------|---------|
| 1. 切换到"管理员"角色 | 角色切换成功 |
| 2. 访问待审批申请单详情 | 显示"免审"按钮（仅管理员可见） |
| 3. 点击"免审"按钮 | 弹出确认弹窗"确认免审该申请单？将跳过所有审批流程" |
| 4. 点击"确认免审" | 提示"申请已免审通过，已自动开始传输" |
| 5. 等待1.5秒 | 自动跳转回审批列表 |
| 6. 再次访问该申请单详情 | 状态变为"已批准"，审批时间线显示"已免审" |

#### 用例7：审批时间线展示
| 测试步骤 | 预期结果 |
|---------|---------|
| 1. 访问一个"二级审批"状态的申请单详情 | 审批时间线正确展示 |
| 2. 查看节点1（申请提交） | 绿色圆点，显示申请人和提交时间 |
| 3. 查看节点2（一级审批） | 绿色圆点，显示审批人、审批时间、审批意见、"已通过"标签 |
| 4. 查看节点3（二级审批） | 蓝色圆点（带动画），显示"二级审批"，表示当前进行中 |
| 5. 查看节点4（三级审批） | 灰色圆点，显示"三级审批"，表示未开始 |
| 6. 审批意见超过3行 | 显示"展开/收起"按钮，点击可切换 |

### 边界测试

| 测试场景 | 预期结果 |
|---------|---------|
| 列表为空时 | 显示"暂无待审批申请单"空状态 |
| 审批意见输入超过500字 | 输入框限制500字，显示字数统计 |
| 网络请求失败 | 显示错误提示，不影响页面渲染 |
| 申请单ID不存在 | 跳转404页面或显示"申请单不存在" |
| 非管理员访问免审按钮 | 免审按钮不显示 |

### 性能测试

| 测试场景 | 性能指标 |
|---------|---------|
| 列表页首次加载 | < 300ms |
| 详情页首次加载 | < 400ms |
| 审批操作响应 | < 500ms |
| 时间线渲染 | < 100ms |

---

## 扩展与维护

### 添加新的审批类型
1. 更新 `approvalLevelMap` 映射表
2. 更新 `TransferType` 类型定义
3. 更新 Mock 数据生成逻辑

### 自定义审批流程
修改 `useApprovalDetail.ts` 中的 `isLastLevel` 方法，根据业务规则调整层级判断逻辑。

### 接入真实后端
1. 替换 Mock API 为真实接口
2. 更新 `src/api/approval.ts` 中的接口定义
3. 调整 `approvalStore` 中的状态管理逻辑

---

## 常见问题

**Q: 审批通过后为什么还是显示"待审批"状态？**  
A: 如果不是最后一级审批，状态会保持 `pending_approval`，但 `currentApprovalLevel` 会增加。只有最后一级审批通过后，状态才会变为 `approved`。

**Q: 如何判断是否为最后一级审批？**  
A: 根据 `transferType` 查找 `approvalLevelMap` 获取需要的审批层级数，然后与 `currentApprovalLevel` 比较。

**Q: 免审操作是否需要审批意见？**  
A: 审批意见为选填，未填写时默认为"免审通过"。

**Q: 审批操作后为什么需要等待1.5秒才跳转？**  
A: 为了让用户看到成功提示信息，提升用户体验。

---

## 相关文档

- [P8.1 待审批列表页面执行记录](../exec/task_P8.1.md)
- [P8.2 审批详情页面执行记录](../exec/task_P8.2.md)
- [P8.3 审批操作执行记录](../exec/task_P8.3.md)
- [P8 任务定义](../tasks/task_P8.md)
- [P8 执行记录](../exec/task_P8_exec.md)
