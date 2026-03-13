# task_P6.6.1 - 部门选择器组件

## 任务目标

实现部门选择器组件 DepartmentSelector.vue，使用 a-tree-select 展示部门树，替换 StepOneBasicInfo.vue 中的部门选择 modal。

## 子任务清单

- [√] 创建 `src/components/business/DepartmentSelector.vue`
  - [√] 使用 a-tree-select 组件
  - [√] 支持搜索、清空
  - [√] Props：modelValue（v-model 绑定）
  - [√] Emits：update:modelValue, change
  - [√] 从 Mock 数据加载部门树
  - [√] 递归查找选中部门信息
- [√] 创建独立样式文件 `src/components/business/DepartmentSelector.scss`
- [√] 替换 StepOneBasicInfo.vue 中的部门选择逻辑
  - [√] 移除 departmentDialogVisible、departmentSelectedKey 等状态
  - [√] 移除 openDepartmentDialog、onDepartmentSelect、onConfirmDepartment 方法
  - [√] 移除 a-modal 相关代码
  - [√] 引入 DepartmentSelector 组件
- [√] 单元测试（跳过）

## 验收标准

1. a-tree-select 正常展示部门树
2. 搜索功能正常
3. 清空功能正常
4. v-model 双向绑定正常
5. StepOneBasicInfo.vue 中部门选择功能正常
