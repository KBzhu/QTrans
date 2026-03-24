---
name: DeptSelector-MultiLevel
overview: 为 DepartmentSelector 组件实现多级联动：用户切换某层级选择时，调用 getSubDeptByCode 加载下一层子部门；层级标签改为"公司/一级部门/二级部门/三级部门/四级部门"；限制最大5级。
todos:
  - id: add-api-interface
    content: 在 dept.ts 中添加 getSubDeptByCode 接口定义
    status: pending
  - id: add-mock-handler
    content: 在 department.ts 中添加 getSubDeptByCode mock handler
    status: pending
    dependencies:
      - add-api-interface
  - id: implement-cascade-logic
    content: 修改 DepartmentSelector.vue 实现联动加载、层级标签、最大层级限制
    status: pending
    dependencies:
      - add-mock-handler
  - id: update-exec-record
    content: 更新 task_DeptSelector_exec.md 执行记录
    status: pending
    dependencies:
      - implement-cascade-logic
---

## 需求概述

为部门选择器组件实现联动加载功能：当用户选择某层级部门后，自动调用接口获取该部门下的子部门，填充到下一层级下拉选项中。

## 核心功能

- **联动加载**：用户切换某层级选择 → 调用 `getSubDeptByCode(deptCode)` 获取子部门 → 填充到下一层下拉选项
- **层级标签**：从"第1级、第2级"改为"公司-一级部门-二级部门-三级部门-四级部门"
- **层级限制**：最大5级（到四级部门），超过则不再加载子部门
- **初始化保持不变**：打开弹窗时仍用 `searchDeptByAccount` 获取用户部门路径，每层只有一个选项

## 业务流程

1. 打开弹窗 → `searchDeptByAccount` 获取用户部门 + parentDept → 构建初始层级
2. 用户切换第N层选择 → `getSubDeptByCode(deptCode)` → 填充第N+1层选项
3. 若第N层已是第5级（索引4），则不再加载子部门

## 技术栈

- Vue 3 + TypeScript + Composition API
- Arco Design 组件库
- MSW (Mock Service Worker) 用于模拟接口

## 实现方案

### 接口层

在 `src/api/dept.ts` 中新增 `getSubDeptByCode` 接口方法，遵循现有接口定义模式。

### Mock 层

在 `src/mocks/handlers/department.ts` 中添加 mock handler，返回模拟的子部门数据。

### 组件层

修改 `DepartmentSelector.vue`：

1. 新增层级标签常量 `LEVEL_LABELS = ['公司', '一级部门', '二级部门', '三级部门', '四级部门']`
2. 修改 `onLevelChange` 方法：调用 `getSubDeptByCode` 获取子部门并填充到 `levelOptions`
3. 添加加载状态 `subDeptLoading`
4. 模板中层级标签从 `第 {{ idx + 1 }} 级` 改为 `LEVEL_LABELS[idx]`
5. 添加最大层级判断（索引4时不再加载子部门）

### 数据流

```
用户选择第N层部门
  ↓
onLevelChange(idx, deptCode)
  ↓
判断 idx < 4 (最大层级限制)
  ↓
set subDeptLoading = true
  ↓
getSubDeptByCode(deptCode)
  ↓
levelOptions[idx + 1] = result
levelSelected[idx + 1] = '' (清空下一层选择)
  ↓
set subDeptLoading = false
```

## 目录结构

```
qtrans-frontend/src/
├── api/
│   └── dept.ts                    # [MODIFY] 新增 getSubDeptByCode 接口
├── components/business/
│   └── DepartmentSelector.vue     # [MODIFY] 实现联动逻辑、层级标签、最大层级限制
└── mocks/handlers/
    └── department.ts              # [MODIFY] 新增 getSubDeptByCode mock handler

docs/exec/
└── task_DeptSelector_exec.md      # [MODIFY] 补充执行记录
```