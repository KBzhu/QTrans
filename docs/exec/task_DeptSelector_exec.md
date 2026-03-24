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

## 执行步骤

- [√] 添加 /user-center 代理到 vite.config.ts
- [√] 新增 src/api/dept.ts 接口定义
- [√] 重构 DepartmentSelector.vue（弹窗+模糊搜索+多级联动）
- [√] 更新样式 DepartmentSelector.scss
- [√] 更新 CHANGELOG

## Bug 修复

- [√] 修复弹窗不弹出问题：`DepartmentSelector.vue` 的 `<template>` 原为两个根节点（Fragment：触发器 div + a-modal），Arco Design 的 `<a-form-item>` 对 Fragment 子组件的内部 VNode 处理不兼容，导致 Teleport 渲染中断。修复方式：用 `.dept-selector-root` div 包裹为单根节点。
- [√] 修复弹窗样式失效问题：`::global(.dept-selector-modal)` 语法在 Vue scoped CSS 中无效。修复方式：拆分样式为两个文件 —— `DepartmentSelector.scss`（scoped，触发器样式）和 `DepartmentSelectorModal.scss`（非 scoped，Modal 弹窗样式）。原因：`a-modal` 设置 `render-to-body` 后，弹窗 DOM 挂载到 `document.body`，脱离组件的 scoped DOM 树，故 modal 样式必须是全局的。
