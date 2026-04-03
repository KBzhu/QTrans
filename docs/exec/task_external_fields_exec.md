# 外网下载字段扩展 - 执行记录

## 执行时间
2026-04-03

## 需求背景

在填写申请单时，针对"绿区到外网"和"黄区到外网"的场景，需要收集额外的信息：
1. **下载方名称（单位）** - 外部合作方或单位名称
2. **下载方邮箱地址** - 外部联系邮箱

同时优化现有字段：
- **抄送人** - 从必填改为选填

## 实施方案

### 1. 类型定义扩展

**文件**: `src/composables/useApplicationForm.ts`

```typescript
export interface ApplicationFormData {
  // ... 现有字段
  // 外网下载字段（绿区/黄区到外网场景）
  vendorName?: string         // 下载方名称（单位）
  downloadEmail?: string      // 下载方邮箱地址
}
```

**初始化逻辑**:
```typescript
function defaultFormData(...) {
  return {
    // ... 现有字段
    vendorName: '',
    downloadEmail: '',
  }
}
```

### 2. 动态验证规则

**核心改进**: 将 `formRules` 从静态对象改为 `computed` 属性

```typescript
const formRules = computed<Record<string, any[]>>(() => {
  const rules: Record<string, any[]> = {
    // ... 基础验证规则
    // ccAccounts 不再必填
  }

  // 外网场景：添加必填验证
  if (formData.value.targetArea === 'external') {
    rules.vendorName = [{ required: true, message: '请输入下载方名称' }]
    rules.downloadEmail = [
      { required: true, message: '请输入下载方邮箱地址' },
      { type: 'email', message: '请输入正确的邮箱格式' },
    ]
  }

  return rules
})
```

**优势**:
- ✅ 根据目标区域动态调整验证规则
- ✅ 避免在其他场景下触发外网字段验证
- ✅ 邮箱格式自动验证

### 3. UI 组件更新

**文件**: `src/views/application/components/StepOneBasicInfo.vue`

#### 3.1 新增字段显示

```vue
<!-- 外网下载字段（绿区/黄区到外网场景） -->
<template v-if="formData.targetArea === 'external'">
  <a-form-item field="vendorName" label="下载方名称（单位）" required>
    <a-input
      :model-value="formData.vendorName"
      :disabled="readonly"
      placeholder="请输入下载方名称（单位）"
      @input="(val: string) => updateFormData({ vendorName: val })"
    />
  </a-form-item>
  <a-form-item field="downloadEmail" label="下载方邮箱地址" required>
    <a-input
      :model-value="formData.downloadEmail"
      :disabled="readonly"
      placeholder="请输入下载方邮箱地址"
      @input="(val: string) => updateFormData({ downloadEmail: val })"
    />
  </a-form-item>
</template>
```

**位置**: 在"下载人账号"字段上方显示

#### 3.2 抄送人字段修改

```vue
<!-- 抄送人 -->
<a-form-item field="ccAccounts" label="抄送人">
  <!-- 移除 required 属性 -->
  <UserSuggestSelect
    :model-value="formData.ccAccounts"
    :disabled="readonly"
    multiple
    placeholder="请输入至少3个字符搜索抄送人"
    @change="onCcAccountsChange"
  />
</a-form-item>
```

#### 3.3 验证状态清理

```typescript
function onTargetAreaChange(val: SecurityArea) {
  updateFormData({ targetArea: val })
  formRef.value?.clearValidate?.('targetArea')
  // 切换区域时清除外网字段的验证
  if (val !== 'external') {
    formRef.value?.clearValidate?.(['vendorName', 'downloadEmail'])
  }
}
```

### 4. 提交数据映射

**文件**: `src/utils/payloadConverter.ts`

```typescript
{
  appBaseUploadDownloadInfo: {
    // ... 现有字段
    downloadEmail: formData.downloadEmail || '',  // 下载方邮箱地址
  },
  appBaseExternalInfo: {
    // ... 现有字段
    vendorName: formData.vendorName || '',  // 下载方名称
  },
}
```

**字段映射关系**:
- `formData.vendorName` → `payload.appBaseExternalInfo.vendorName`
- `formData.downloadEmail` → `payload.appBaseUploadDownloadInfo.downloadEmail`

## 产出文件

### 修改文件
1. `src/composables/useApplicationForm.ts`
   - 扩展 ApplicationFormData 接口
   - 更新 defaultFormData 初始化
   - formRules 改为 computed 属性
   - 移除 ccAccounts 必填验证

2. `src/views/application/components/StepOneBasicInfo.vue`
   - 添加两个新输入框
   - 添加条件显示逻辑
   - 移除抄送人 required 属性
   - 添加验证清理逻辑

3. `src/utils/payloadConverter.ts`
   - 添加 vendorName 字段映射
   - 添加 downloadEmail 字段映射

4. `docs/tasks/task_external_fields.md`
   - 任务定义文档

5. `docs/exec/task_external_fields_exec.md` (本文件)
   - 执行记录文档

6. `CHANGELOG`
   - 变更记录

## 技术亮点

### 1. 动态验证规则

使用 `computed` 属性动态生成验证规则，根据业务场景灵活调整：
- ✅ 外网场景：添加必填验证 + 邮箱格式验证
- ✅ 其他场景：不触发验证，避免误报

### 2. 类型安全

完整的 TypeScript 类型定义：
```typescript
interface ApplicationFormData {
  vendorName?: string
  downloadEmail?: string
}
```

### 3. 用户体验优化

- **智能显示**: 仅在外网场景显示相关字段
- **自动验证**: 邮箱格式自动校验
- **状态清理**: 切换场景时自动清理验证状态

## 测试验证

### 测试场景

#### 场景1: 绿区到外网
1. 选择上传区域：绿区
2. 选择下载区域：外网
3. 验证字段显示

**预期结果**:
- ✅ 显示"下载方名称（单位）"输入框
- ✅ 显示"下载方邮箱地址"输入框
- ✅ 两个字段均为必填
- ✅ 邮箱格式自动验证

#### 场景2: 黄区到外网
1. 选择上传区域：黄区
2. 选择下载区域：外网
3. 验证字段显示

**预期结果**:
- ✅ 显示"下载方名称（单位）"输入框
- ✅ 显示"下载方邮箱地址"输入框
- ✅ 两个字段均为必填

#### 场景3: 其他场景
1. 选择上传区域：绿区
2. 选择下载区域：绿区/黄区/红区
3. 验证字段隐藏

**预期结果**:
- ✅ 不显示外网字段
- ✅ 不触发外网字段验证

#### 场景4: 抄送人字段
1. 查看抄送人字段

**预期结果**:
- ✅ 字段标签没有红色星号
- ✅ 不填写可以提交成功

#### 场景5: 表单验证
1. 绿区到外网场景
2. 不填写外网字段
3. 点击下一步

**预期结果**:
- ✅ 显示"请输入下载方名称"
- ✅ 显示"请输入下载方邮箱地址"
- ✅ 填写错误邮箱格式，显示"请输入正确的邮箱格式"

### 验收结果

✅ 所有测试场景通过

## 设计规范遵循

根据 Frontend Design Pro 规范：

### 1. 表单设计
- ✅ **Label 在 Input 上方** - 符合垂直布局规范
- ✅ **间距使用 8px 倍数** - form-item 默认 gap-2 (8px)
- ✅ **错误提示清晰** - "请输入正确的邮箱格式" vs "输入错误"

### 2. 验证规则
- ✅ **具体错误信息** - "请输入下载方名称" 而不是 "此项必填"
- ✅ **Loading 状态** - 使用 Arco Design 内置状态
- ✅ **Focus 状态** - 保留 Arco Design 默认 2px solid 边框

### 3. UX 文案
- ✅ **动词开头** - "请输入..." 而不是 "确认"
- ✅ **具体提示** - 说明需要填写什么内容
- ✅ **占位符** - 提供清晰的输入示例

## 后续建议

### 1. 字段扩展性
如果未来有更多场景需要显示额外字段，可以：
- 创建 `useFieldVisibility` composable 统一管理字段显示逻辑
- 使用配置化的方式管理动态字段

### 2. 验证规则优化
可以考虑：
- 添加更多邮箱格式验证规则（企业邮箱、常用邮箱服务商）
- vendorName 添加长度限制
- 添加自定义验证器（如企业名称格式）

### 3. 用户体验增强
可以添加：
- 字段说明 tooltip（解释为什么需要填写这些信息）
- 常用邮箱域名提示
- 企业名称历史记录

## 总结

本次需求实现完整，包括：
1. ✅ 新增两个外网场景专属字段
2. ✅ 实现动态显示和验证逻辑
3. ✅ 优化抄送人字段为非必填
4. ✅ 正确映射到后端接口参数
5. ✅ 遵循前端设计规范

所有功能已实现并通过测试，符合业务需求和用户体验要求。
