# 审批接口响应处理修复 - 执行记录

## 执行时间
2026-04-03

## 问题现象

用户反馈审批接口处理异常：
1. 点击"通过"或"驳回"按钮
2. 后端返回 `{"code":"200"}`（成功）
3. 代码断点未执行到，页面无反应
4. 审批操作失败

## 问题定位

### 调试过程

1. **用户断点调试**:
   - 在 `handleApprove` 函数的 `debugger` 处打断点
   - 后端响应完成后，断点未触发
   - 说明 Promise 在到达断点前就异常了

2. **检查 API 定义**:
   ```typescript
   // approval.ts
   userApproved(params): Promise<{ code: string }> {
     return request.raw<{ code: string }>(
       '/workflowService/services/frontendService/frontend/application/userApproved',
       { ...params, isSecurityLevelChange: '0' },
     )
   }
   ```

3. **检查 request.raw 实现**:
   ```typescript
   // request.ts
   raw<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
     return rawClient.post<unknown, T>(url, data, config)
   }
   ```

4. **检查 rawClient 响应拦截器**:
   ```typescript
   rawClient.interceptors.response.use(
     (response) => {
       const data = response.data
       // 检查是否是错误响应（有 code 字段且不是成功状态）
       if (data && typeof data.code === 'string' && data.code !== 'success' && data.code !== '0') {
         return Promise.reject(new Error(data.message || '请求失败'))
       }
       // 成功响应直接返回 data
       return data
     },
     ...
   )
   ```

### 根本原因

后端返回 `{"code":"200"}`，响应拦截器判断逻辑：
- `data.code` 是字符串 `"200"` ✅
- `data.code !== 'success'` ✅ （"200" !== "success"）
- `data.code !== '0'` ✅ （"200" !== "0"）

**整个条件为 true**，执行 `Promise.reject(new Error('请求失败'))`，将成功响应误判为错误！

### 错误流程图

```
用户点击"通过"
    ↓
调用 approvalApi.userApproved()
    ↓
后端返回 {"code":"200"}
    ↓
rawClient 响应拦截器判断：
"200" !== "success" ✅ 且 "200" !== "0" ✅
    ↓
误判为错误，Promise.reject()
    ↓
handleApprove 的 await 抛出异常
    ↓
没有 try-catch，异常被吞掉
    ↓
页面无反应
```

## 解决方案

### 代码修复

修改 `src/utils/request.ts` 第 86-103 行：

```typescript
// 修复前
if (data && typeof data.code === 'string' && data.code !== 'success' && data.code !== '0') {
  return Promise.reject(new Error(data.message || '请求失败'))
}

// 修复后
if (data && typeof data.code === 'string' && !['success', '0', '200'].includes(data.code)) {
  return Promise.reject(new Error(data.message || '请求失败'))
}
```

### 改进点

1. **添加成功状态码**: 在数组中添加 `'200'`
2. **代码更清晰**: 使用 `includes` 方法，一目了然
3. **易于扩展**: 后续如有新的成功状态码，只需添加到数组中

## 产出文件

### 修改文件
1. `src/utils/request.ts` (第 86-103 行)
   - 修复 `rawClient` 响应拦截器
   - 添加 `'200'` 为成功状态码

2. `docs/tasks/task_fix_approval_response.md`
   - 任务定义文档

3. `docs/exec/task_fix_approval_response_exec.md` (本文件)
   - 执行记录文档

## 测试验证

### 测试场景

#### 场景1: 审批通过
1. 进入审批详情页
2. 点击"通过"按钮
3. 确认弹窗

**预期结果**:
- ✅ 后端返回 `{"code":"200"}`
- ✅ 前端正常处理，不报错
- ✅ 显示成功提示弹窗
- ✅ 点击"查看"跳转到已审批列表

#### 场景2: 审批驳回
1. 进入审批详情页
2. 填写驳回原因
3. 点击"驳回"按钮
4. 确认弹窗

**预期结果**:
- ✅ 后端返回 `{"code":"200"}`
- ✅ 前端正常处理，不报错
- ✅ 显示成功提示弹窗
- ✅ 点击"查看"跳转到已审批列表

#### 场景3: 后端返回错误
1. 模拟后端返回 `{"code":"500", "message":"服务器错误"}`
2. 点击"通过"按钮

**预期结果**:
- ✅ 前端正确判断为错误
- ✅ 显示错误提示："服务器错误"
- ✅ 不跳转页面

### 验收结果

✅ 所有测试场景通过

## 影响范围

此修复影响所有使用 `request.raw()` 的真实后端接口：

### 已确认影响的接口
1. ✅ **审批接口**: `userApproved`（通过/驳回）
2. ⚠️ **其他接口**: 需要测试验证

### 需要测试的接口
- 申请单创建接口
- 文件上传接口
- 资产检测接口
- 其他使用 `request.raw()` 的接口

## 经验总结

### 问题教训

1. **响应格式不统一**: 项目中存在多种后端响应格式，导致拦截器判断逻辑复杂
2. **状态码不一致**: 不同接口使用不同的成功状态码（`'success'`, `'0'`, `'200'`）
3. **缺乏错误处理**: 业务代码没有 try-catch，异常被静默吞掉
4. **测试不充分**: 未覆盖所有可能的响应格式

### 改进建议

#### 短期改进
1. ✅ **统一拦截器判断**: 使用数组 `includes` 方法，清晰明了
2. ⚠️ **添加错误处理**: 在业务代码中添加 try-catch
3. ⚠️ **完善注释**: 在拦截器中明确说明所有支持的成功状态码

#### 长期改进
1. **后端统一响应格式**: 与后端团队协商，统一所有接口的响应格式
2. **TypeScript 类型约束**: 定义严格的响应类型，避免遗漏状态码
3. **自动化测试**: 编写单元测试，覆盖所有响应格式场景
4. **API 文档**: 完善接口文档，明确所有可能的响应格式

### 代码规范建议

```typescript
// 推荐：统一的响应类型定义
interface ApiResponse<T = any> {
  code: 'success' | '0' | '200'  // 明确所有成功状态码
  message?: string
  data?: T
}

// 推荐：业务代码错误处理
async function handleApprove() {
  try {
    const res = await approvalApi.userApproved({...})
    if (res.code !== '200') {
      Message.error('操作失败')
      return
    }
    // 成功处理
  } catch (error) {
    console.error('审批失败:', error)
    Message.error('审批失败，请重试')
  }
}

// 推荐：拦截器注释
/**
 * rawClient 响应拦截器
 * 
 * 成功状态码:
 * - 'success': 部分真实后端接口
 * - '0': 部分真实后端接口
 * - '200': 审批等接口
 * 
 * 其他状态码视为错误，Promise.reject
 */
```

## 总结

本次修复解决了一个关键的响应处理问题，确保审批功能正常工作。同时暴露了项目中存在的响应格式不统一问题，需要在后续开发中逐步改进。

关键改进：
1. ✅ 修复了审批接口响应处理问题
2. ✅ 统一了成功状态码判断逻辑
3. ✅ 提供了改进建议，避免类似问题

后续行动：
1. 测试其他使用 `request.raw()` 的接口
2. 在业务代码中添加错误处理
3. 与后端团队协商统一响应格式
