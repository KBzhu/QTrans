# 任务：修复审批接口响应处理问题

## 任务背景

用户发现审批接口（`userApproved`）的响应处理有问题：
1. 后端返回 `{"code":"200"}`（成功响应）
2. 代码中打断点发现后端响应完根本没走到断点
3. 整个页面没有反应，审批操作失败

## 问题分析

### 根本原因

在 `src/utils/request.ts` 中，`rawClient` 的响应拦截器对成功响应的判断有误：

```typescript
// 错误代码
if (data && typeof data.code === 'string' && data.code !== 'success' && data.code !== '0') {
  return Promise.reject(new Error(data.message || '请求失败'))
}
```

**问题**：
- 后端返回 `{"code":"200"}`
- 代码只检查了 `code !== 'success'` 和 `code !== '0'`
- 没有包含 `"200"` 作为成功状态码
- 导致成功响应被误判为错误，Promise 被 reject
- 所以 `handleApprove` 中的断点没走到，直接进入错误处理流程

### 错误流程

1. 用户点击"通过"按钮
2. 调用 `approvalApi.userApproved()`
3. 后端返回 `{"code":"200"}`
4. `rawClient` 响应拦截器判断：`"200" !== 'success'` ✅ 且 `"200" !== '0'` ✅
5. 误判为错误，`Promise.reject(new Error('请求失败'))`
6. `handleApprove` 中的 `await` 抛出异常
7. 代码没有 try-catch，异常被吞掉，页面无反应

## 解决方案

### 修复代码

在成功状态码列表中添加 `'200'`：

```typescript
// 修复后的代码
if (data && typeof data.code === 'string' && !['success', '0', '200'].includes(data.code)) {
  return Promise.reject(new Error(data.message || '请求失败'))
}
```

**改进**：
1. 使用数组 `includes` 方法，代码更清晰
2. 包含所有成功状态码：`'success'`, `'0'`, `'200'`
3. 确保后端返回 `{"code":"200"}` 时不会被误判为错误

### 为什么会出现这个问题

项目中使用了多种后端接口：
- Mock API 返回 `{ code: 200, data: {...} }`（code 是数字）
- 真实后端接口有的返回 `{ code: 'success' }`
- 真实后端接口有的返回 `{ code: '0' }`
- 审批接口返回 `{ code: '200' }`（code 是字符串）

之前的代码只考虑了前三种情况，遗漏了第四种。

## 子任务

- [√] 1. 分析问题根源
  - [√] 通过断点调试定位到 `rawClient` 响应拦截器
  - [√] 发现成功响应被误判为错误

- [√] 2. 修复响应拦截器
  - [√] 添加 `'200'` 为成功状态码
  - [√] 使用数组 `includes` 方法优化代码

- [ ] 3. 测试验证
  - [ ] 测试审批通过功能是否正常
  - [ ] 测试审批驳回功能是否正常
  - [ ] 测试其他使用 `request.raw` 的接口是否正常

## 产出文件

### 修改文件
1. `src/utils/request.ts`
   - 修复 `rawClient` 响应拦截器的成功状态码判断
   - 添加 `'200'` 为成功状态码

2. `docs/tasks/task_fix_approval_response.md` (本文件)
   - 任务定义文档

## 影响范围

此修复影响所有使用 `request.raw()` 的真实后端接口：
- ✅ 审批通过/驳回接口（`userApproved`）
- ✅ 其他可能返回 `{ code: '200' }` 的接口

## 验收标准

1. ✅ 审批通过时，后端返回 `{"code":"200"}`，前端正常处理，显示成功提示
2. ✅ 审批驳回时，后端返回 `{"code":"200"}`，前端正常处理，显示成功提示
3. ✅ 后端返回错误时，前端正确显示错误提示
4. ✅ 不影响其他接口的正常使用

## 经验总结

1. **统一响应格式**: 后端接口应该统一响应格式，避免多种成功状态码
2. **完善错误处理**: 业务代码应该使用 try-catch 包裹异步操作
3. **充分测试**: 涉及多个后端接口的项目，应该测试所有响应格式
4. **代码注释**: 在拦截器中明确说明所有支持的成功状态码

## 实施结果

详见 `docs/exec/task_fix_approval_response_exec.md`
