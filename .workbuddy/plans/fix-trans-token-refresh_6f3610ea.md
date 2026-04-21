---
name: fix-trans-token-refresh
overview: 修复 Task 8：在 transWebService 新增 refreshTransToken API（GET /client/refreshToken），在 useTransUpload 添加每 60 秒定时器刷新 trans token。
todos:
  - id: add-refresh-api
    content: 在 transWebService.ts 中新增 refreshTransToken API 函数并导出到 transApi
    status: completed
  - id: add-token-timer
    content: 在 useTransUpload.ts 中添加 60 秒 Trans Token 刷新定时器并集成到 initialize
    status: completed
    dependencies:
      - add-refresh-api
---

## 产品概述

修复 Task 8 Token 自动刷新功能：在数传平台独立的 `transClient` 基础上，新增 Trans Token 刷新机制。

## 核心功能

- 新增 `refreshTransToken()` API 方法：调用 `GET /client/refreshToken`，使用 `transClient` 请求，自动携带当前 trans token（Authorization header），成功后更新 sessionStorage 中的 trans_token
- 在 `useTransUpload` composable 中添加每 60 秒执行一次的定时器，与 Session 保活定时器并行运行

## 老代码对齐要点

- 接口端点：`/transWeb/client/refreshToken`（即 `transClient.get('/client/refreshToken', ...)`）
- 请求参数：`params` + `lang`
- 响应格式：`{ status: boolean, result: string(新token), message?: string }`
- 成功后将 `result` 写回 `sessionStorage['trans_token']`
- 定时频率：60 秒一次

## 技术栈

- **API 层**：axios 实例 `transClient`（已有请求拦截器自动注入 Authorization header）
- **Token 存储**：`sessionStorage.getItem/setItem('trans_token')`（已有 setTransToken 工具函数）
- **定时器**：原生 `setInterval/clearInterval`
- **框架**：Vue 3 Composition API

## 实现方案

### 文件修改清单

**1. `qtrans-frontend/src/api/transWebService.ts`**

- 在「辅助函数」区域（`clearTransToken` 之后）新增 `refreshTransToken(params, lang)`：
- 调用 `transClient.get('/client/refreshToken', { params: { params, lang } })`
- 解析响应 `{ status, result }`，status 为 true 且 result 非空时调用 `setTransToken(result)` 更新 token
- 返回 `{ success: boolean, newToken?: string }`
- 失败时仅 console.warn，不抛异常（对标老代码 error 回调只打日志）
- 在 `transApi` 导出对象中注册 `refreshTransToken`

**2. `qtrans-frontend/src/composables/useTransUpload.ts`**

- import 列表追加 `refreshTransToken`
- 新增常量 `TRANS_TOKEN_REFRESH_INTERVAL = 60_000`
- 新增 ref `transTokenRefreshTimer = ref<ReturnType<typeof setInterval> | null>(null)`
- 新增方法 `startTransTokenRefresh(params, lang)` / `stopTransTokenRefresh()`
- 在 `initialize()` 中调用 `startTransTokenRefresh(params, lang)`
- return 对象导出两个新方法

## 关键设计决策

- **与 auth store 的 refreshToken 完全独立**——这是 trans token 的刷新，走 transClient，不涉及 JWT
- **失败静默处理**——老代码的 error 回调只 console.log，不应中断上传流程
- **定时器生命周期**——initialize 时启动，组件销毁时应由外部调用 stop（或 composable 提供 cleanup 方法统一停止所有定时器）

## 架构影响

- 无破坏性变更，纯增量添加
- 与已有的 `startSessionKeepAlive`（25s cache 保活）并行运行，两个定时器互不干扰