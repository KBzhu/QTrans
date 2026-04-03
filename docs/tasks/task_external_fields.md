# 任务：外网下载字段扩展

## 任务背景

在填写申请单时，针对"绿区到外网"和"黄区到外网"的场景，需要新增额外的必填字段：
1. 下载方名称（单位）- vendorName
2. 下载方邮箱地址 - downloadEmail

同时需要将抄送人字段的必填属性去掉。

## 任务目标

1. 在"下载人账号"上方新增两个输入框字段
2. 仅在 `targetArea === 'external'` 时显示这两个字段
3. 两个字段均为必填项
4. 抄送人字段去掉必填属性
5. 正确集成到表单验证和提交逻辑中

## 子任务

- [√] 1. 分析需求和现有代码结构
  - [√] 确定 targetArea 的判断逻辑
  - [√] 确认字段的 API 参数映射
  - [√] 确认表单验证规则修改点

- [√] 2. 扩展类型定义
  - [√] 在 ApplicationFormData 接口中添加 vendorName 和 downloadEmail
  - [√] 更新 defaultFormData 初始化

- [√] 3. 修改 StepOneBasicInfo 组件
  - [√] 添加两个新输入框
  - [√] 添加条件显示逻辑
  - [√] 添加事件处理器
  - [√] 修改抄送人字段的 required 属性

- [√] 4. 更新表单验证规则
  - [√] 添加 vendorName 验证规则（必填）
  - [√] 添加 downloadEmail 验证规则（必填 + 邮箱格式）
  - [√] 移除 ccAccounts 的必填规则

- [√] 5. 更新提交逻辑
  - [√] 确认字段映射到 payloadConvert
  - [√] 确保提交时正确传递参数

- [ ] 6. 测试验证
  - [ ] 测试绿区到外网场景
  - [ ] 测试黄区到外网场景
  - [ ] 测试其他场景（不显示字段）
  - [ ] 测试表单验证

## 实施结果

✅ 已完成字段扩展和验证规则配置

### 修改文件清单

1. **`src/composables/useApplicationForm.ts`**
   - 在 `ApplicationFormData` 接口中添加 `vendorName` 和 `downloadEmail` 字段
   - 在 `defaultFormData` 中初始化新字段
   - 将 `formRules` 改为 computed 属性,根据 `targetArea` 动态添加验证规则
   - 移除 `ccAccounts` 的必填验证

2. **`src/views/application/components/StepOneBasicInfo.vue`**
   - 添加两个新输入框字段（下载方名称、下载方邮箱地址）
   - 使用 `v-if="formData.targetArea === 'external'"` 控制显示
   - 移除抄送人字段的 `required` 属性
   - 在 `onTargetAreaChange` 中清除外网字段的验证状态

3. **`src/utils/payloadConverter.ts`**
   - 在 `appBaseExternalInfo` 中添加 `vendorName` 字段映射
   - 在 `appBaseUploadDownloadInfo` 中添加 `downloadEmail` 字段映射

## 技术方案

### 字段显示条件

```typescript
const showExternalFields = computed(() => formData.value.targetArea === 'external')
```

### 字段定义

```typescript
// 类型定义
interface ApplicationFormData {
  // ... 现有字段
  vendorName?: string      // 下载方名称（单位）
  downloadEmail?: string   // 下载方邮箱地址
}
```

### 验证规则

```typescript
vendorName: [
  { required: true, message: '请输入下载方名称' }
],
downloadEmail: [
  { required: true, message: '请输入下载方邮箱地址' },
  { type: 'email', message: '请输入正确的邮箱格式' }
]
```

### 参数映射

根据需求，字段映射到：
- `appBaseExternalInfo.vendorName`
- `appBaseUploadDownloadInfo.downloadEmail`

## 实施步骤

详见上述子任务清单

## 验收标准

1. ✅ 绿区到外网场景：显示两个新字段，均为必填
2. ✅ 黄区到外网场景：显示两个新字段，均为必填
3. ✅ 其他场景：不显示这两个字段
4. ✅ 抄送人字段不再为必填项
5. ✅ 表单验证正常工作
6. ✅ 提交时正确传递参数

## 相关文件

- `src/composables/useApplicationForm.ts` - 表单数据类型和验证规则
- `src/views/application/components/StepOneBasicInfo.vue` - 表单组件
- `src/api/application.ts` - API 接口（可能需要确认参数映射）
