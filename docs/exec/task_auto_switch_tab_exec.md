# 审批详情页自动切换 Tab - 执行记录

## 执行时间
2026-04-03

## 问题分析

### 用户痛点

**现象**: 审批人进入审批详情页时，默认显示"申请单信息" Tab，如果有资产检测结果需要确认，审批人看不到审批意见栏目，会不知所措。

**影响**:
- 用户体验差，审批人不知道需要先确认资产
- 可能导致审批人忽略资产确认步骤
- 降低审批效率

### 期望行为

**场景1**: 有资产检测结果 + 未确认
- ✅ 自动切换到"资产检测结果" Tab
- ✅ 审批人立即看到需要确认的内容
- ✅ 确认后审批按钮才会出现

**场景2**: 无资产检测结果
- ✅ 保持默认显示"申请单信息" Tab
- ✅ 正常显示审批按钮和审批意见栏

**场景3**: 已完成资产确认
- ✅ 不再自动切换
- ✅ 用户可以自由切换 Tab

## 解决方案

### 技术实现

使用 Vue 的 `watch` API 监听资产检测状态，自动切换 Tab：

```typescript
// 监听资产检测结果：如果有检测结果且未全部确认，自动切换到资产检测 Tab
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

### 状态判断逻辑

#### 1. hasDetectionResult
- **来源**: `useAssetDetection` composable
- **含义**: 是否有资产检测结果
- **计算**: `countData.value?.count && countData.value.count > 0`

#### 2. canOperateAsset
- **来源**: `useAssetDetection` composable
- **含义**: 是否可以操作（资产已全部确认）
- **计算逻辑**:
  ```typescript
  const canOperate = computed(() => {
    if (!hasDetectionResult.value) return true  // 无检测结果，可操作
    if (!allFilesConfirmed.value) return false  // 文件未全部确认
    if (hasKeyAssets.value && !allKeyAssetsConfirmed.value) return false  // 关键资产未确认
    return true  // 已全部确认
  })
  ```

#### 3. canOperateBase
- **来源**: `useApprovalDetail` composable
- **含义**: 基础审批权限（不含资产确认检查）
- **计算逻辑**:
  ```typescript
  const canOperateBase = computed(() => {
    if (!detailData.value) return false
    const isNeedApproval = detailData.value.appBaseApprovalRoute?.isNeedApproval === 1
    return isNeedApproval && canHandleCurrentLevel.value
  })
  ```

### 自动切换触发条件

只有同时满足以下三个条件才会自动切换：

1. **hasDetectionResult = true**
   - 有资产检测结果

2. **canOperateAsset = false**
   - 资产未全部确认（需要用户确认）

3. **canOperateBase = true**
   - 当前用户有审批权限（避免非审批人看到自动切换）

### 用户体验流程

```
审批人进入审批详情页
    ↓
检查是否有资产检测结果
    ↓
    ├─ 无检测结果 → 显示"申请单信息" Tab（默认）
    │              ↓
    │              显示审批按钮和审批意见栏
    │              ↓
    │              审批人可直接操作
    │
    └─ 有检测结果 → 检查是否已确认
                    ↓
                    ├─ 已确认 → 显示"申请单信息" Tab（默认）
                    │          ↓
                    │          显示审批按钮和审批意见栏
                    │
                    └─ 未确认 → 自动切换到"资产检测结果" Tab
                               ↓
                               审批按钮置灰，提示需要确认
                               ↓
                               审批人确认资产
                               ↓
                               切换到其他 Tab 查看信息
                               ↓
                               显示审批按钮和审批意见栏
                               ↓
                               审批人可操作
```

## 产出文件

### 修改文件
1. **`src/views/approvals/ApprovalDetailView.vue`**
   - 新增 watch 监听资产检测状态
   - 实现自动切换逻辑
   - 代码量：+9 行

### 新增文档
1. **`docs/tasks/task_auto_switch_tab.md`**
   - 任务定义文档

2. **`docs/exec/task_auto_switch_tab_exec.md`** (本文件)
   - 执行记录文档

## 验收测试

### 测试步骤

#### 测试1: 有资产检测结果且未确认
1. 创建一个有待审批的申请单
2. 该申请单有资产检测结果
3. 使用审批人账号登录
4. 进入审批详情页

**预期结果**:
- ✅ 页面加载后自动显示"资产检测结果" Tab
- ✅ 顶部和底部的审批按钮都置灰
- ✅ 显示提示："请逐条确认以下文件，未确认 X 项"

#### 测试2: 无资产检测结果
1. 创建一个有待审批的申请单
2. 该申请单无资产检测结果
3. 使用审批人账号登录
4. 进入审批详情页

**预期结果**:
- ✅ 页面加载后显示"申请单信息" Tab（默认）
- ✅ 顶部和底部的审批按钮都可用
- ✅ 显示审批意见输入框

#### 测试3: 已完成资产确认
1. 在测试1的基础上，确认所有文件和关键资产
2. 刷新页面

**预期结果**:
- ✅ 页面加载后不再自动切换 Tab
- ✅ 审批按钮变为可用状态
- ✅ 用户可以手动切换到资产检测 Tab 查看已确认的结果

#### 测试4: 手动切换 Tab
1. 在测试1的基础上（自动切换到资产检测 Tab）
2. 点击"申请单信息" Tab
3. 点击"文件列表" Tab

**预期结果**:
- ✅ 用户可以自由切换 Tab
- ✅ 切换后审批按钮状态保持一致
- ✅ 不影响资产确认进度

#### 测试5: 非审批人访问
1. 使用非当前审批人账号登录
2. 访问某个有资产检测结果的申请单详情

**预期结果**:
- ✅ 页面保持默认 Tab（不自动切换）
- ✅ 不显示审批按钮和审批意见栏
- ✅ 可以查看信息但不能操作

## 技术要点

### watch 的 immediate 选项

**作用**: 确保监听器在组件创建时立即执行一次

**为什么需要**:
- 资产检测数据通过 `initAssetDetection` 异步加载
- 页面首次渲染时数据可能还未返回
- `immediate: true` 确保数据加载完成后立即检查状态

**代码示例**:
```typescript
watch(
  [hasDetectionResult, canOperateAsset],
  ([hasResult, canOperate]) => {
    if (hasResult && !canOperate && canOperateBase.value) {
      activeTab.value = 'detection'
    }
  },
  { immediate: true },  // 关键！
)
```

### 多个状态的组合判断

**为什么要监听多个状态**:
- `hasDetectionResult`: 判断是否有检测结果
- `canOperateAsset`: 判断是否需要确认

**组合逻辑**:
```typescript
if (hasResult && !canOperate && canOperateBase.value) {
  // hasResult: true - 有检测结果
  // !canOperate: true - 需要确认（未全部确认）
  // canOperateBase: true - 当前用户有审批权限
  activeTab.value = 'detection'
}
```

### 与现有逻辑的兼容

**不影响的现有功能**:
1. ✅ Tab 手动切换功能
2. ✅ 资产确认流程
3. ✅ 审批按钮禁用逻辑
4. ✅ 非审批人的查看权限

**增强的功能**:
1. ✅ 自动引导审批人到需要确认的内容
2. ✅ 提升用户体验，避免不知所措
3. ✅ 减少审批人的操作步骤

## 后续优化建议

1. **记住用户选择**: 
   - 如果用户手动切换了 Tab，记住选择
   - 下次访问时恢复到用户选择的 Tab

2. **提示信息优化**:
   - 自动切换时显示 toast 提示："检测到资产结果需要确认，已自动切换"
   - 确认完成后显示 toast 提示："资产已确认，可进行审批"

3. **动画过渡**:
   - 添加 Tab 切换的过渡动画
   - 提升视觉流畅度

4. **埋点统计**:
   - 统计自动切换的触发次数
   - 分析用户行为，优化体验

## 总结

通过本次优化:
1. **提升了用户体验**: 审批人进入页面后立即看到需要确认的内容
2. **减少了操作步骤**: 自动引导，无需手动寻找
3. **避免了困惑**: 审批人不会因为看不到审批意见栏而不不知所措
4. **保持了兼容性**: 不影响现有功能和其他场景

优化后的审批流程更加流畅，符合用户预期，提升了审批效率。
