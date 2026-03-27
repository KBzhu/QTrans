# 创建页离开确认交互重构执行记录

## 任务目标
重构创建申请单页面的离开确认交互逻辑，移除草稿保存能力，改为按步骤差异化提示。

## 背景
真实后端没有提供草稿保存接口，前端模拟的草稿保存能力需要移除。

## 子任务清单
- [ √ ] 修改 `CreateApplicationView.vue` 的 `onBeforeRouteLeave` 交互逻辑
- [ √ ] 移除 `useApplicationForm.ts` 中自动保存草稿相关代码
- [ √ ] 移除未使用的 `handleSaveDraft` 导入
- [ √ ] 更新 `CHANGELOG`

## 实际变更

### 1. CreateApplicationView.vue - onBeforeRouteLeave 交互逻辑
**修改前**：
- 有未保存变更时弹窗询问是否保存草稿

**修改后**：
- 第3步：直接离开，无拦截
- 第2步：无论有无变更都弹窗确认，提示"离开后需要重新上传文件，您可在「我的申请单」中找到状态为「待上传」的流程单继续操作"
- 第1步：无变更直接离开，有变更弹窗确认，提示"离开后当前填写内容将丢失，下次进入需要重新填写"

### 2. useApplicationForm.ts - 移除自动保存
- 移除 `autoSaveTimer` 变量
- 移除 `autoSaveDraft()` 函数
- 移除 `stopAutoSaveDraft()` 函数
- 移除 `onMounted` 中的自动保存调用
- 移除 return 导出中的 `autoSaveDraft`
- 保留 `lastSavedSnapshot` 和 `updateSnapshot`（仍用于 `hasUnsavedChanges` 计算）

### 3. CreateApplicationView.vue - 移除未使用导入
- 从解构中移除 `handleSaveDraft`

## 校验结果
- `CreateApplicationView.vue`：IDE 诊断 0 错误
- `useApplicationForm.ts`：IDE 诊断 0 错误（存量类型错误不影响）

## 产出文件清单
| 文件路径 | 操作类型 | 说明 |
|---------|---------|------|
| `qtrans-frontend/src/views/application/CreateApplicationView.vue` | 修改 | 重构离开确认逻辑 |
| `qtrans-frontend/src/composables/useApplicationForm.ts` | 修改 | 移除自动保存草稿 |
| `CHANGELOG` | 修改 | 记录变更 |

## 验收结果
- [ √ ] 第1步不填任何内容点返回 → 直接离开
- [ √ ] 第1步填写后点返回 → 弹窗确认
- [ √ ] 第2步点返回 → 弹窗确认
- [ √ ] 第3步点返回 → 直接离开

---

*执行完成时间: 2026-03-27*
