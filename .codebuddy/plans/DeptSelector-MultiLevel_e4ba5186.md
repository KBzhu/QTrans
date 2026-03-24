---
name: DeptSelector-MultiLevel
overview: 实现部门选择器多级联动：第1层固定为"公司"；用户展开下拉时加载该层选项；层级标签改为"公司/一级部门/二级部门/三级部门/四级部门"；最大5级；不添加mock（透传真实后端）。
todos:
  - id: add-api-interface
    content: 在 dept.ts 中添加 getSubDeptByCode 接口定义
    status: completed
  - id: implement-cascade-logic
    content: 修改 DepartmentSelector.vue 实现展开加载、选中清空、层级标签
    status: completed
    dependencies:
      - add-api-interface
  - id: update-exec-record
    content: 更新 task_DeptSelector_exec.md 执行记录
    status: completed
    dependencies:
      - implement-cascade-logic
---

## 产品概述

为部门选择器组件实现多级联动加载功能

## 核心功能

- **第1层固定"公司"**：从 `parentDept[0]` 取值，单选项，不调用接口
- **展开时加载**：用户**展开**第N层下拉框 → 调用 `getSubDeptByCode(上一层选中项的deptCode)` → 加载该层所有选项
- **选中后清空后续**：用户选中某选项 → 清空该层之后的所有层级选择
- **层级标签**：从"第1级、第2级"改为"公司-一级部门-二级部门-三级部门-四级部门"
- **层级限制**：最大5级（到四级部门）
- **无 Mock**：透传到真实后端

## 技术栈

- Vue 3 + TypeScript + Composition API
- Arco Design 组件库（a-select 的 @popup-visible-change 事件）
- 透传到真实后端，不添加 mock handler

## 实现方案

### 接口层

在 `src/api/dept.ts` 中新增 `getSubDeptByCode` 接口方法

### 组件层

修改 `DepartmentSelector.vue`：

1. 新增常量：`LEVEL_LABELS = ['公司', '一级部门', '二级部门', '三级部门', '四级部门']`
2. 新增状态：`levelLoading[]`、`levelLoaded[]`
3. 新增方法：`onDropdownVisibleChange` - 展开时加载
4. 修改方法：`onLevelChange` - 选中后清空后续层级
5. 第1层特殊处理：固定显示公司，下拉禁用

## 目录结构

```
qtrans-frontend/src/
├── api/
│   └── dept.ts                    # [MODIFY] 新增 getSubDeptByCode 接口
└── components/business/
    └── DepartmentSelector.vue     # [MODIFY] 实现联动逻辑

docs/exec/
└── task_DeptSelector_exec.md      # [MODIFY] 补充执行记录
```