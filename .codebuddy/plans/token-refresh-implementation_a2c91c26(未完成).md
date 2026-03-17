---
name: token-refresh-implementation
overview: 在 auth store 中使用 VueUse 的 useIntervalFn 实现全局定时 token 刷新机制
todos:
  - id: add-refresh-logic
    content: 在 auth.ts store 中使用 [skill:vueuse-functions] 的 useIntervalFn 实现 token 定时刷新
    status: pending
  - id: update-login-logout
    content: 修改 login 和 logout 方法，自动启停刷新定时器
    status: pending
    dependencies:
      - add-refresh-logic
  - id: write-task-md
    content: 生成 task_refreshToken.md 任务文档记录实现过程
    status: pending
---

## 产品概述

在 auth store 中使用 VueUse 的 `useIntervalFn` 实现 token 定时自动刷新功能，使 `refreshToken` 方法被实际调用。

## 核心功能

- 登录成功后启动 token 定时刷新机制
- 登出时停止刷新定时器
- 刷新成功后更新本地存储的 token
- 刷新失败时自动登出用户
- 提供手动启动/停止刷新的控制能力

## 技术栈

- Vue3 + TypeScript + Pinia
- VueUse `useIntervalFn` 定时器控制
- 已安装依赖：`@vueuse/core: ^14.2.1`

## 实现方案

使用 VueUse 的 `useIntervalFn` 在 auth store 中实现定时刷新机制：

- **刷新间隔**：默认 5 分钟（可配置）
- **生命周期**：登录成功启动，登出时停止
- **错误处理**：刷新失败触发登出流程
- **状态暴露**：`isRefreshing` 状态供外部查询

## 实现要点

1. 在 store 外部定义 `useIntervalFn` 实例（Pinia setup 语法限制）
2. 使用 `watchEffect` 监听 `isLoggedIn` 状态自动启停刷新
3. 刷新成功后调用 `persistAuthState()` 持久化新 token

## 目录结构

```
qtrans-frontend/src/
└── stores/
    └── auth.ts    # [MODIFY] 添加 token 刷新逻辑
```

## 代码结构

```ts
// 核心实现结构
const REFRESH_INTERVAL = 5 * 60 * 1000 // 5分钟

export const useAuthStore = defineStore('auth', () => {
  // 现有状态...
  
  // 新增：刷新定时器
  const { pause: pauseRefresh, resume: resumeRefresh, isActive: isRefreshing } 
    = useIntervalFn(refreshToken, REFRESH_INTERVAL, { immediate: false })
  
  async function refreshToken() {
    if (!token.value) return
    try {
      const result = await authApi.refreshToken()
      token.value = result.token
      persistAuthState()
    } catch {
      await logout()
    }
  }
  
  // 修改 login：登录成功后启动刷新
  // 修改 logout：登出时停止刷新
})
```

## Skills

- **vueuse-functions**
- Purpose: 使用 `useIntervalFn` 实现定时 token 刷新
- Expected outcome: 遵循 VueUse 最佳实践，实现可控的定时器功能
- **pinia**
- Purpose: 确保在 Pinia store 中正确使用 VueUse 组合式函数
- Expected outcome: 符合 Pinia setup store 模式的状态管理