# 表单校验 BUG 修复执行文档

## 任务概述
修复 `StepOneBasicInfo.vue` 组件中的表单校验 BUG：下拉框首次选择值后，表单校验错误提示不消失，需要第二次操作才消失。

## 问题定位

### BUG 表现
1. 下拉框初始状态为空
2. 用户首次选择一个值后，表单校验仍然提示"请选择..."
3. 用户第二次更改下拉框的值，校验错误提示才消失

### 根本原因
**Arco Design Form 表单校验时机问题**：

1. **首次触发校验**：当下拉框为空时（如 `securityLevel` 为 `undefined`），表单的验证规则在手动触发校验时（如点击"下一步"）执行
2. **首次选择值**：虽然值已更新到 `formData`，但此时 Form 组件还没有为该字段注册 `change` 事件的校验监听，因此不会自动清除错误提示
3. **第二次更改值**：此时 Form 组件已完成事件绑定，`change` 事件会触发自动校验，错误提示消失

## 解决方案

### 实施策略
在表单字段值变更时，**手动调用 `formRef.clearValidate(fieldName)`** 清除该字段的校验错误。

### 修改内容

#### 1. 更新 formRef 类型定义（32-35 行）
```typescript
const formRef = ref<{ 
  validate: () => Promise<undefined | Record<string, any>>
  clearValidate?: (field?: string | string[]) => void
} | null>(null)
```

#### 2. 新增事件处理函数（140-187 行）
```typescript
function onSourceAreaChange(val: any) {
  emit('update:formData', { ...props.formData, sourceArea: val })
  formRef.value?.clearValidate?.('sourceArea')
}

function onTargetAreaChange(val: any) {
  emit('update:formData', { ...props.formData, targetArea: val })
  formRef.value?.clearValidate?.('targetArea')
}

function onDownloaderAccountsChange(val: any) {
  emit('update:formData', { ...props.formData, downloaderAccounts: val })
  formRef.value?.clearValidate?.('downloaderAccounts')
}

function onCcAccountsChange(val: any) {
  emit('update:formData', { ...props.formData, ccAccounts: val })
  formRef.value?.clearValidate?.('ccAccounts')
}

function onSecurityLevelChange(val: any) {
  emit('update:formData', { ...props.formData, securityLevel: val })
  formRef.value?.clearValidate?.('securityLevel')
}
```

#### 3. 修改已有函数，增加校验清除（133-157 行）
```typescript
function onDepartmentChange(value: { deptId: string, deptName: string }) {
  emit('update:formData', {
    ...props.formData,
    department: value.deptName,
    departmentId: value.deptId,
  })
  formRef.value?.clearValidate?.('department')
}

function onSourceCityChange(value: { province: string, city: string, cityId: number }) {
  emit('update:formData', {
    ...props.formData,
    sourceCity: [value.province, value.city],
    sourceCityId: value.cityId,
  })
  formRef.value?.clearValidate?.('sourceCity')
}

function onTargetCityChange(value: { province: string, city: string, cityId: number }) {
  emit('update:formData', {
    ...props.formData,
    targetCity: [value.province, value.city],
    targetCityId: value.cityId,
  })
  formRef.value?.clearValidate?.('targetCity')
}
```

#### 4. 更新模板中的事件绑定
将所有下拉框的内联事件处理器改为函数引用：
```vue
<!-- 之前 -->
@change="(val: any) => emit('update:formData', { ...formData, sourceArea: val })"

<!-- 之后 -->
@change="onSourceAreaChange"
```

涉及字段：
- sourceArea
- targetArea
- downloaderAccounts
- ccAccounts
- securityLevel

## 验收标准

### 功能验证
- [x] 下拉框首次选择值后，校验错误提示立即消失
- [x] 所有涉及的表单字段（部门、区域、城市、下载人、抄送人、密级）均正常工作
- [x] TypeScript 类型检查无错误

### 代码质量
- [x] Lint 检查无错误
- [x] 代码结构清晰，事件处理函数职责单一
- [x] 类型定义完整

## 产出文件清单
- `qtrans-frontend/src/views/application/components/StepOneBasicInfo.vue`（修改）

## 技术要点总结

### Arco Design Form 校验机制
1. **自动校验**：字段值变更时自动触发（需要 Form 已建立事件监听）
2. **手动校验**：调用 `validate()` 方法
3. **清除校验**：调用 `clearValidate(field)` 方法

### 最佳实践
- 在表单字段值变更时，主动调用 `clearValidate` 清除错误提示
- 使用命名函数而非内联箭头函数，便于类型检查和代码维护
- 为 ref 对象添加完整的类型定义，包括可选方法

## 完成时间
2026-03-21
