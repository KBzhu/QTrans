# task_P4 - 路由与布局

> 对应需求：设计文档 5. 路由与权限设计
> 前置依赖：P3.1（Auth Store）
> 预估工时：8h

---

## 任务目标

配置完整路由表、路由守卫和权限控制，实现带侧边栏的默认布局和空白布局，完成动态菜单渲染。

---

## 子任务清单

### P4.1 路由配置（2h）

- [√] 创建 `src/router/routes.ts` - 完整路由表（按 Design 5.1 章节实现）
  - 所有路由配置 `meta.requiresAuth`, `meta.roles`, `meta.title`, `meta.icon`
  - 所有页面组件使用 `() => import(...)` 懒加载
  - 覆盖全部页面：login / dashboard / transfer / applications / approvals / transfers / users / settings / logs / profile / notifications / 403 / 404
- [√] 创建 `src/router/index.ts` - 创建路由实例（history 模式）
- [√] 在 `src/main.ts` 中注册路由

**验收标准：** 访问 `/login` 渲染登录页，访问 `/dashboard` 渲染首页占位符

---

### P4.2 路由守卫（2h）

- [√] 创建 `src/router/guards.ts`
- [√] 实现全局前置守卫 `setupRouterGuards(router)`：
  - 未登录访问需认证路由 → 跳转 `/login?redirect=xxx`
  - 无角色权限 → 跳转 `/403`
  - 已登录访问 `/login` → 跳转 `/dashboard`
  - 动态设置 `document.title`
- [√] 实现全局后置钩子（记录页面访问日志到 Notification Store）
- [√] 在 `src/router/index.ts` 中调用 `setupRouterGuards`

**验收标准：** 未登录访问 `/dashboard` 自动跳转 `/login`；`submitter` 访问 `/users` 跳转 `/403`

---

### P4.3 布局组件（3h）

- [√] 创建 `src/layouts/BlankLayout.vue` - 仅渲染 `<router-view />`（登录页用）
- [√] 创建 `src/layouts/DefaultLayout.vue` - 左侧菜单 + 顶栏 + 内容区
- [√] 创建 `src/components/common/AppHeader.vue`
  - Logo + 系统名称
  - 通知铃铛（显示未读数角标）
  - 用户头像下拉（显示姓名、角色，点击个人中心/退出登录）
  - Demo 模式角色快速切换下拉
- [√] 创建 `src/components/common/AppSidebar.vue`
  - 根据当前用户角色动态渲染可见菜单项
  - 支持菜单折叠/展开
  - 高亮当前激活路由
- [√] 创建 `src/components/common/PageContainer.vue`
  - 面包屑导航（根据路由 meta 自动生成）
  - 主内容区域 `<slot />`
- [√] 在 `src/App.vue` 中根据路由 meta.layout 动态切换布局

**菜单权限规则：**
| 菜单项 | 可见角色 |
|--------|---------|
| 首页 | 所有 |
| 申请单管理 | 所有 |
| 审批管理 | approver_level1/2/3, admin |
| 传输管理 | admin |
| 用户管理 | admin |
| 系统配置 | admin |
| 日志审计 | admin |

**验收标准：** `submitter` 登录后只看到「首页」「申请单管理」；`admin` 可见全部菜单

---

### P4.4 权限指令（1h）

- [√] 创建 `src/directives/permission.ts`
  - `v-permission="'action:create_application'"` - 操作权限控制
  - `v-role="'admin'"` - 角色控制
  - 无权限时移除 DOM 节点
- [√] 在 `src/main.ts` 中全局注册 `v-permission`, `v-role` 指令

**验收标准：** `v-role="'admin'"` 在非 admin 账号下不渲染对应按钮

---

## 测试要求

```typescript
// src/router/__tests__/guards.spec.ts
describe('RouterGuards', () => {
  it('redirects to login when not authenticated', async () => {
    const router = createRouter(...)
    setupRouterGuards(router)
    // mock 未登录状态
    await router.push('/dashboard')
    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('redirects to 403 when role not allowed', async () => {
    // mock submitter 登录状态
    await router.push('/users')
    expect(router.currentRoute.value.name).toBe('Forbidden')
  })
})
```

---

## 完成标志

- [√] 所有子任务勾选完毕
- [√] 路由守卫测试通过
- [√] 不同角色登录后菜单渲染正确
- [√] 布局组件展示正常（有头部、侧边栏、内容区）
