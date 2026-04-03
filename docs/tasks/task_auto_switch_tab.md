# 任务：审批详情页自动切换到资产检测 Tab

## 任务背景

用户反馈：在审批详情页，如果有资产检测结果且需要主管确认，用户默认进入"审批详情"页面时应该自动切换到第三个 Tab（资产检测结果），而不是停留在第一个 Tab。这样审批人能立即看到需要确认的内容，体验更友好，避免审批人看不到审批意见栏目而不知所措。

## 任务目标

优化审批详情页的用户体验：
1. 当有资产检测结果且需要确认时，自动切换到资产检测 Tab
2. 确认完成后，用户可以手动切换回其他 Tab 查看信息
3. 不影响正常的审批流程

## 子任务

- [√] 1. 分析业务逻辑
  - [√] 确认触发条件：有资产检测结果 + 需要确认（canOperateAsset 为 false）
  - [√] 确认不影响其他场景：无资产检测结果或已完成确认时，保持默认行为

- [√] 2. 实现自动切换逻辑
  - [√] 添加 watch 监听 hasDetectionResult 和 canOperateAsset
  - [√] 当条件满足时设置 activeTab 为 'detection'
  - [√] 确保只在需要确认时触发（canOperateBase 为 true）

- [ ] 3. 测试验证
  - [ ] 测试有资产检测结果且未确认时，是否自动切换
  - [ ] 测试无资产检测结果时，是否保持默认 Tab
  - [ ] 测试已确认后，是否不再自动切换

## 技术方案

### 实现方式

使用 Vue 的 watch API 监听资产检测状态：

```typescript
watch(
  [hasDetectionResult, canOperateAsset],
  ([hasResult, canOperate]) => {
    // 只有在有检测结果且需要确认时才自动切换
    if (hasResult && !canOperate && canOperateBase.value) {
      activeTab.value = 'detection'
    }
  },
  { immediate: true },
)
```

### 触发条件

自动切换到资产检测 Tab 的条件：
1. `hasDetectionResult` 为 true（有资产检测结果）
2. `canOperateAsset` 为 false（资产未全部确认）
3. `canOperateBase` 为 true（当前用户有审批权限）

### 注意事项

1. **immediate: true**: 确保页面加载时立即执行检查
2. **不阻止手动切换**: 用户确认后可以手动切换到其他 Tab
3. **不影响其他场景**: 无资产检测结果时保持默认行为

## 产出文件

### 修改文件
1. `src/views/approvals/ApprovalDetailView.vue`
   - 添加资产检测状态监听
   - 实现自动切换逻辑

2. `docs/tasks/task_auto_switch_tab.md` (本文件)
   - 任务定义文档

## 验收标准

1. ✅ 有资产检测结果且未确认时，页面加载后自动显示资产检测 Tab
2. ✅ 无资产检测结果时，页面保持默认显示"申请单信息" Tab
3. ✅ 资产确认完成后，不再自动切换
4. ✅ 用户可以手动切换到其他 Tab
5. ✅ 不影响正常的审批流程

## 实施结果

详见 `docs/exec/task_auto_switch_tab_exec.md`
