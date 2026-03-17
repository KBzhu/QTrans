---
name: auth-token-adapter
overview: 适配真实登录响应格式，修改请求头 token 字段注入
todos:
  - id: fix-request-header
    content: "修改 request.ts 请求头从 Authorization: Bearer 改为 token 字段"
    status: completed
  - id: fix-auth-response
    content: 修改 auth.ts 响应类型和解析逻辑，适配 data 直接是 token
    status: completed
  - id: update-task-doc
    content: 更新 task_refreshToken.md 记录此次修复
    status: completed
---

## 用户需求

适配真实后端登录接口的响应格式和请求头字段：

1. 登录接口响应 `data` 直接是 token 字符串（不是 `{ token: string, userInfo: ... }`）
2. 所有请求头使用 `token` 字段而非 `Authorization: Bearer`

## 修改文件清单

### 1. `qtrans-frontend/src/utils/request.ts` [MODIFY]

**第 15 行**：修改请求头字段

```ts
// 原
config.headers.Authorization = `Bearer ${token}`

// 改为
config.headers.token = token
```

### 2. `qtrans-frontend/src/api/auth.ts` [MODIFY]

**修改响应类型和解析逻辑**：

```ts
// 原类型
interface RealLoginResponse {
  code: number
  message: string
  data: {
    token: string
    userInfo: Partial<User>
  }
}

// 改为（data 直接是 token 字符串）
interface RealLoginResponse {
  code: number
  message: string
  data: string  // token 字符串
}

// 原 login 方法返回
return {
  token: res.data.token,
  user: { ...res.data.userInfo ... }
}

// 改为（res.data 就是 token，用户信息用默认值）
return {
  token: res.data,  // 直接使用 res.data
  user: {
    id: '1',
    username: 'ywx1420846',
    name: '测试用户',
    email: 'test@example.com',
    phone: '',
    department: '',
    departmentName: '',
    roles: ['submitter'],
    status: 'enabled',
  },
}
```