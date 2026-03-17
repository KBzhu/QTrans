# Token 定时刷新功能实现

## 任务概述

在 auth store 中使用 VueUse 的 `useIntervalFn` 实现 token 定时刷新，并对接真实后端登录接口。

## 执行步骤

- [√] 1. 更新 vite.config.ts 添加 `/service` 代理
- [√] 2. 修改 auth.ts API 调用真实登录接口
- [√] 3. 在 auth store 中使用 useIntervalFn 实现定时刷新
- [√] 4. 修复类型错误

## 技术实现

### 1. Vite 代理配置

**文件**: `qtrans-frontend/vite.config.ts`

```ts
// UserCenter 代理 - 用户认证服务
'/service': {
  target: 'http://127.0.0.1:8087',
  changeOrigin: true,
  secure: false,
},
```

### 2. 真实后端接口对接

**文件**: `qtrans-frontend/src/api/auth.ts`

- 接口地址: `/service/v1/userCenter/authentication/login`
- 请求格式:
  ```json
  {
    "model": {
      "account": "ywx1420846",
      "password": "Fjtgyxa_006^",
      "loginType": "2"
    }
  }
  ```
- 响应适配: 将真实接口响应映射为前端 `LoginResponse` 类型

### 3. Token 定时刷新

**文件**: `qtrans-frontend/src/stores/auth.ts`

使用 VueUse `useIntervalFn` 实现：

```ts
import { useIntervalFn } from '@vueuse/core'

// 刷新间隔：15 分钟
const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000

// 在 store 中
const { pause: pauseRefresh, resume: resumeRefresh, isActive } = useIntervalFn(
  refreshToken,
  TOKEN_REFRESH_INTERVAL,
  { immediate: false },
)

// 监听登录状态，自动启停刷新定时器
watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    resumeRefresh()
  } else {
    pauseRefresh()
  }
}, { immediate: true })
```

### 4. 新增 API 方法

| 方法 | 说明 |
|------|------|
| `isRefreshing` | 是否正在刷新 token |
| `isTokenRefreshActive` | 刷新定时器是否激活 |
| `refreshToken()` | 手动刷新 token |
| `pauseRefresh()` | 暂停刷新定时器 |
| `resumeRefresh()` | 恢复刷新定时器 |

## 产出文件

| 文件路径 | 操作 |
|----------|------|
| `qtrans-frontend/vite.config.ts` | MODIFIED |
| `qtrans-frontend/src/api/auth.ts` | MODIFIED |
| `qtrans-frontend/src/stores/auth.ts` | MODIFIED |

## 注意事项

1. **参数写死**: 当前登录参数在 API 层写死，后续需要改为动态传入
2. **刷新失败处理**: 刷新失败会自动登出用户
3. **自动启停**: 登录成功后自动启动刷新定时器，登出后自动停止

## 后续优化建议

1. 从 JWT token 中解析过期时间，在接近过期时智能刷新
2. 在 request.ts 的 401 拦截器中增加刷新重试逻辑
3. 支持动态登录参数
