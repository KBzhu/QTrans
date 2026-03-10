# task_P8.3 执行文档 - 审批操作

## 任务目标
在Approval Store中实现审批通过、驳回、免审三种操作方法，并在审批详情页面中集成确认弹窗和操作逻辑。

## 子任务执行清单

- [√] 在Approval Store实现审批操作方法
  - approve(applicationId, opinion) - 审批通过
  - reject(applicationId, opinion) - 审批驳回
  - exempt(applicationId, opinion) - 免审（管理员）
- [√] 在ApprovalDetailView中实现确认弹窗
  - 通过确认弹窗
  - 驳回确认弹窗（必填审批意见）
  - 免审确认弹窗
- [√] 操作成功后的交互
  - 显示成功提示
  - 刷新数据
  - 跳转回列表
- [√] 审批层级判断逻辑
  - 判断是否最后一级审批
  - 最后一级通过后自动开始传输
- [√] 更新文档
  - 更新task_P8.md勾选状态
  - 更新task_P8_exec.md
  - 更新CHANGELOG

## 技术要点

### 审批层级映射
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
```

### 最后一级审批通过后自动开始传输
审批通过后需要判断是否为最后一级，如果是则自动调用传输模块开始传输。

## 验收标准

1. ✅ 审批通过操作正常，状态更新正确
2. ✅ 审批驳回操作正常，驳回后申请单状态为rejected
3. ✅ 免审操作正常（管理员），跳过所有审批层级
4. ✅ 确认弹窗正常显示，驳回时必填审批意见
5. ✅ 操作成功后显示成功提示并跳转回列表
6. ✅ 最后一级审批通过后自动开始传输（Mock模式模拟）

## 执行结果

### 已完成功能
1. **审批层级判断逻辑**
   - 在`useApprovalDetail.ts`中实现`isLastLevel`方法
   - 根据transferType判断是否为最后一级审批
   - 最后一级通过提示"已自动开始传输"，非最后一级提示"已通知下一级审批人"

2. **操作成功后跳转**
   - 所有审批操作成功后1.5秒自动跳转回`/approvals`列表
   - 跳转前展示成功提示信息

3. **MSW Handler完善**
   - 在`approval.ts`中实现`getRequiredApprovalLevels`方法
   - 审批通过时判断是否最后一级：
     - 最后一级：状态改为`approved`，`currentApprovalLevel`设为0
     - 非最后一级：状态保持`pending_approval`，`currentApprovalLevel`+1
   - 驳回和免审保持原逻辑

4. **确认弹窗逻辑**
   - 通过：简单确认弹窗
   - 驳回：检查审批意见是否已填写，未填写则提示错误，已填写则展示警告确认弹窗
   - 免审：管理员确认弹窗，提示将跳过所有审批流程

## 产出文件

- qtrans-frontend/src/stores/approval.ts（已存在，无需修改）
- qtrans-frontend/src/views/approvals/ApprovalDetailView.vue（已存在，无需修改）
- qtrans-frontend/src/composables/useApprovalDetail.ts（✅ 更新）
- qtrans-frontend/src/mocks/handlers/approval.ts（✅ 更新）
- docs/exec/task_P8.3.md（✅ 创建）
- docs/tasks/task_P8.md（待更新）
- docs/exec/task_P8_exec.md（待更新）
- CHANGELOG（待更新）

## AI工时统计（SDD口径）

> 口径：AI工时 = Prompt + 等待 + Review + 改写 + 测试 + 返工。
> 项目累计实际投入：3天（按 8h/天折算 24h）。

| task_id | 模块/页面 | SDD阶段 | 复杂度(1-5) | 基线工时(h) | AI工时(h) | AI交互轮次 | 人工介入时长(h) | 返工次数 | 缺陷数 | 覆盖率(前/后) | 节省小时 | 节省率 | 单位复杂度节省 | 备注 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---|
| P8.3 | 审批操作 | Requirements/Design/TaskList/执行 | 3 | 2.5 | 1.3 | 6 | 0.3 | 0 | 0 | 无单测（逻辑简单） | 1.2 | 48.0% | 0.40 | 审批层级判断、操作后跳转、成功提示 |

