# 任务：第一步点击"下一步"调用创建接口

## 需求说明
1. 第一步（StepOneBasicInfo）表单填写完成后，点击"下一步"调用 `createReal` 接口
2. 接口成功后进入第二步（上传文件）
3. 返回"上一步"时，表单变为只读不可编辑
4. 移除"保存草稿"按钮
5. 接口失败时停留在当前步骤，允许修改后重试

## 子任务

- [√] 1. 修改 `useApplicationForm.ts`：添加 `isApplicationCreated` 状态和 `handleNextWithSubmit` 方法
- [√] 2. 修改 `CreateApplicationView.vue`：更新按钮逻辑和传递 `readonly` 属性
- [√] 3. 修改 `StepOneBasicInfo.vue`：添加 `readonly` 属性支持，禁用所有表单控件
- [√] 4. 测试验证流程

## 修改文件清单

1. `qtrans-frontend/src/composables/useApplicationForm.ts`
   - 新增 `isApplicationCreated` ref 标记申请单是否已创建
   - 新增 `handleNextWithSubmit` 方法：验证表单后调用 `createReal` 接口
   - 修改 `handleNext` 方法：简化逻辑，仅处理第二步进入第三步
   - 导出新增状态和方法

2. `qtrans-frontend/src/views/application/CreateApplicationView.vue`
   - 导入 `isApplicationCreated` 和 `handleNextWithSubmit`
   - 移除 `handleSaveDraft` 导入和 `onClickSaveDraft` 函数
   - 修改 `onClickNext`：第一步调用 `handleNextWithSubmit`，第二步调用 `handleNext`
   - 给 `StepOneBasicInfo` 传递 `:readonly="isApplicationCreated"`
   - 移除"保存草稿"按钮，简化按钮逻辑

3. `qtrans-frontend/src/views/application/components/StepOneBasicInfo.vue`
   - Props 新增 `readonly?: boolean` 属性
   - 所有表单控件添加 `:disabled="readonly"` 属性

## 流程说明

**新流程**：
1. 用户在第一步填写表单
2. 点击"下一步"按钮
3. 系统验证表单有效性
4. 调用 `createReal` 接口创建申请单
5. 成功 → 进入第二步上传文件，`isApplicationCreated = true`
6. 失败 → 停留在当前步骤，显示错误信息，允许修改后重试
7. 从第二步返回"上一步"时，表单变为只读状态（所有控件 disabled）
