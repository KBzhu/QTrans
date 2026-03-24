# 部门选择器重构执行记录

## 任务目标
重构 `DepartmentSelector.vue`，对接真实接口，实现弹窗形式 + 模糊搜索 + 多级联动下拉。

## 确认的设计决策
- 弹窗形式（点击输入框后弹出 Modal）
- 多级下拉：初始用当前登录用户接口的 parentDept 构建路径，下层联动待「根据部门Code查询下层部门」接口就绪后再实现
- 模糊搜索选中后：自动根据 parentDept 回填所有层级下拉，路径展示在底部
- `/user-center` 代理 target: `http://127.0.0.1:8087`
- account 来源：authStore.currentUser.username，usertype 来源：auth.ts 中 loginType（Number 格式）

## 产出文件
- `qtrans-frontend/vite.config.ts` - 新增 /user-center 代理
- `qtrans-frontend/src/api/dept.ts` - 部门相关 API（新增）
- `qtrans-frontend/src/components/business/DepartmentSelector.vue` - 重构
- `qtrans-frontend/src/components/business/DepartmentSelector.scss` - 样式更新
- `qtrans-frontend/src/components/business/DepartmentSelectorModal.scss` - Modal 弹窗样式（非 scoped）

## 执行步骤

- [√] 添加 /user-center 代理到 vite.config.ts
- [√] 新增 src/api/dept.ts 接口定义
- [√] 重构 DepartmentSelector.vue（弹窗+模糊搜索+多级联动）
- [√] 更新样式 DepartmentSelector.scss
- [√] 更新 CHANGELOG

## Bug 修复

- [√] 修复弹窗不弹出问题：`DepartmentSelector.vue` 的 `<template>` 原为两个根节点（Fragment：触发器 div + a-modal），Arco Design 的 `<a-form-item>` 对 Fragment 子组件的内部 VNode 处理不兼容，导致 Teleport 渲染中断。修复方式：用 `.dept-selector-root` div 包裹为单根节点。
- [√] 修复弹窗样式失效问题：`::global(.dept-selector-modal)` 语法在 Vue scoped CSS 中无效。修复方式：拆分样式为两个文件 —— `DepartmentSelector.scss`（scoped，触发器样式）和 `DepartmentSelectorModal.scss`（非 scoped，Modal 弹窗样式）。原因：`a-modal` 设置 `render-to-body` 后，弹窗 DOM 挂载到 `document.body`，脱离组件的 scoped DOM 树，故 modal 样式必须是全局的。

---

## 阶段二：多级联动实现（2024-03-24）

### 需求说明
实现部门选择器的多级联动加载功能：
1. 第1层固定为"公司"单选项，不调用接口
2. 用户展开下拉框时加载该层选项
3. 用户选中某选项后，清空后续层级并立即加载下一层选项
4. 层级标签从"第1级、第2级"改为"公司-一级部门-二级部门-三级部门-四级部门"
5. 最大层级限制：5级（到四级部门）

### 接口对接
- 新增接口：`getSubDeptByCode(deptCode)` - POST /workflowService/services/frontendService/frontend/getSubDeptByCode
- 透传到真实后端，不添加 mock handler

### 执行步骤

- [√] 在 `dept.ts` 中添加 `getSubDeptByCode` 接口定义和响应类型 `GetSubDeptByCodeResponse`
- [√] 修改 `DepartmentSelector.vue`：
  - 新增常量 `LEVEL_LABELS` 和 `MAX_LEVEL`
  - 新增状态 `levelLoading[]`、`levelLoaded[]`
  - 新增方法 `loadSubDept()` - 加载下层部门
  - 新增方法 `onDropdownVisibleChange()` - 展开时加载选项
  - 修改方法 `onLevelChange()` - 选中后清空后续并立即加载下一层
  - 第1层（index=0）下拉禁用，固定显示"公司"
- [√] 更新执行记录

### 业务流程
1. 打开弹窗 → `searchDeptByAccount` 获取用户部门路径 → 构建初始层级
2. 第1层固定显示"公司"（从 parentDept[0] 取值，下拉禁用）
3. 用户展开第N层下拉框 → 调用 `getSubDeptByCode(上一层选中项的deptCode)` → 加载该层选项
4. 用户选中第N层某选项 → 清空后续层级选中值和选项 → 立即加载第N+1层选项
5. 最大层级限制：第5层（四级部门）不再加载子部门

### Bug 修复（2024-03-24 续）

- [√] **修复模糊搜索选中后未联动加载下一级**：`onSelectSearchResult` 函数原只调用 `buildLevelsFromPath` 回填层级，未触发加载下一级。修复：在回填后调用 `loadSubDept(lastIndex)` 加载下一级选项。
- [√] **修复模糊搜索无数据时下拉框闪现即消失**：原模板条件 `v-if="searchResults.length > 0 || searchLoading"` 不包含"搜索完成但无结果"状态。修复：
  - 新增 `searchLoaded` 状态标记搜索已完成
  - 修改条件为 `v-if="searchKeyword.trim() && (searchResults.length > 0 || searchLoading || searchLoaded)"`
  - 新增 `<div v-else-if="searchResults.length === 0">暂无数据</div>` 显示空状态
  - 添加 `.dept-search__empty` 样式
