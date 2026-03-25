# task_4 执行记录

## 任务目标
按新数据流校正 `DepartmentSelector` 在 `StepOneBasicInfo.vue` 中的绑定契约与回显行为。

## 子任务清单
- [ √ ] 核对 `DepartmentSelector` 的 `modelValue/change` 实际契约
- [ √ ] 修正 `StepOneBasicInfo.vue` 的绑定字段与事件映射
- [ √ ] 补齐 `DepartmentSelector` 的外部回显支持
- [ √ ] 更新 `CHANGELOG`
- [ √ ] 完成校验并记录结果

## 实际变更
- `StepOneBasicInfo.vue`：部门选择器改为绑定 `formData.departmentId`，并通过 `display-value` 传入 `formData.department`；`change` 事件改按 `deptCode/deptName` 回写表单。
- `DepartmentSelector.vue`：新增 `displayValue` 属性，支持外部路径回显；触发器显示文本改为优先使用内部确认路径，缺失时退回外部展示值；清空和外部值切换时同步刷新显示。
- `CHANGELOG`：补充本次契约修复与回显修复记录。

## 回归修复
- 验证阶段发现创建页控制台报错：`Maximum recursive updates exceeded in component <CreateApplicationView>`。
- 修复内容：
  - `StepOneBasicInfo.vue` 的 `updateFormData` 增加差异比对，未变化时不再整体替换 `formData`。
  - `useSecurityLevel.ts`、`useApprovalRoute.ts`、`useCitySelection.ts` 的 `watch` 改为稳定 getter 数组源，避免因 getter 每次返回新数组而误触发。
  - `useApprovalRoute.ts` 的 `clearApprovers()` 增加空值保护，避免重复清空触发递归更新。

## 校验结果
- `StepOneBasicInfo.vue`：IDE 诊断 0 错误。
- `DepartmentSelector.vue`：IDE 诊断 0 错误。
- `useSecurityLevel.ts`：IDE 诊断 0 错误。
- `useApprovalRoute.ts`：IDE 诊断 0 错误。
- `useCitySelection.ts`：IDE 诊断 0 错误。

## 产出文件清单
- `qtrans-frontend/src/views/application/components/StepOneBasicInfo.vue`
- `qtrans-frontend/src/components/business/DepartmentSelector.vue`
- `CHANGELOG`

