---
name: token-refresh-with-real-api
overview: 修改 login 调用真实后端接口 + 添加 vite 代理 + 实现 token 定时刷新
todos:
  - id: update-vite-proxy
    content: 更新 vite.config.ts 添加 userCenter 服务代理
    status: completed
  - id: update-auth-api
    content: 修改 auth.ts API 调用真实登录接口
    status: completed
    dependencies:
      - update-vite-proxy
  - id: add-refresh-logic
    content: 使用 [skill:vueuse-functions] 在 auth store 添加 useIntervalFn 刷新逻辑
    status: completed
  - id: write-task-md
    content: 生成 docs/task_refreshToken.md 记录实现过程
    status: completed
---

## 产品概述

实现 token 定时刷新机制，并连接真实后端登录接口

## 核心功能

1. **Token 定时刷新**：使用 VueUse 的 `useIntervalFn` 在 auth store 中实现全局自动刷新
2. **真实登录接口对接**：修改 login 方法调用真实后端 `http://127.0.0.1:8087/service/v1/userCenter/authentication/login`
3. **Vite 代理配置**：添加后端接口代理，解决跨域问题
4. **类型适配**：适配真实接口的请求/响应格式

## 技术栈

- Vue3 + TypeScript + Pinia
- VueUse (`useIntervalFn`) - 定时刷新
- Vite proxy - 代理配置

## 实现方案

### 真实接口格式

```
POST /service/v1/userCenter/authentication/login
Content-Type: application/json

{
    "model": {
        "account": "ywx1420846",
        "password": "Fjtgyxa_006^",
        "loginType": "2"
    }
}
```

### 架构设计

```
用户登录 → authApi.login() → Vite代理 → 真实后端
              ↓
         authStore.login()
              ↓
         useIntervalFn 启动定时刷新
              ↓
         定时调用 refreshToken()
```

### 目录结构

```
qtrans-frontend/
├── vite.config.ts              # [MODIFY] 添加 userCenter 代理
├── src/
│   ├── types/
│   │   └── user.ts             # [MODIFY] 适配真实接口请求格式
│   ├── api/
│   │   └── auth.ts             # [MODIFY] 调用真实登录接口
│   └── stores/
│       └── auth.ts             # [MODIFY] 添加 useIntervalFn 刷新逻辑
└── docs/
    └── task_refreshToken.md    # [NEW] 任务执行文档
```

## 实现细节

### 1. Vite 代理配置

添加 `/service` 代理到 `http://127.0.0.1:8087`

### 2. 类型适配

新增 `RealLoginRequest` 接口匹配真实接口格式

### 3. Token 刷新逻辑

- 刷新间隔：默认 15 分钟
- 仅在登录状态下刷新
- 登出时自动停止刷新
- 刷新失败时清除认证状态

## VueUse useIntervalFn 用法

```ts
const { pause, resume, isActive } = useIntervalFn(
  refreshCallback,
  15 * 60 * 1000, // 15分钟
  { immediate: false }
)
```

## Skill

- **vueuse-functions**
- Purpose: 使用 `useIntervalFn` 实现 token 定时刷新
- Expected outcome: 在 auth store 中实现可控的定时器，登录后自动启动，登出后自动停止
- **vue-best-practices**
- Purpose: 确保 Vue 代码符合最佳实践
- Expected outcome: Composition API + TypeScript 规范实现