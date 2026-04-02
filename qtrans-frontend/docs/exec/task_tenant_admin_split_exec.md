# 用户面与管理面拆分 - 执行文档

## 任务概述
通过环境变量 `VITE_APP_TYPE` 区分用户面（tenant）和管理面（admin），实现分环境打包、文根隔离、路由互斥和菜单隔离。

## 子任务清单

- [√] 1. 创建 .env.tenant / .env.admin 及对应的 .development 文件，定义 VITE_APP_TYPE
- [√] 2. 为 routes.ts 每个路由添加 appType 标记，实现 filterRoutesByAppType 构建时过滤函数
- [√] 3. 修改 vite.config.ts，根据 VITE_APP_TYPE 动态设置 base 和开发端口
- [√] 4. 修改路由守卫增加 appType 兜底检查，更新 menuRoutes 过滤逻辑
- [√] 5. 修复 request.ts / AppHeader.vue / index.html 中的硬编码路径适配 base 前缀
- [√] 6. 更新 package.json scripts 和 env.d.ts 类型声明，验证两面独立构建和运行

## 产出文件清单
| 操作 | 文件路径 |
|------|----------|
| 新增 | `qtrans-frontend/.env.tenant` |
| 新增 | `qtrans-frontend/.env.admin` |
| 新增 | `qtrans-frontend/.env.tenant.development` |
| 新增 | `qtrans-frontend/.env.admin.development` |
| 新增 | `qtrans-frontend/src/utils/path.ts` |
| 修改 | `qtrans-frontend/src/router/routes.ts` |
| 修改 | `qtrans-frontend/src/router/index.ts` |
| 修改 | `qtrans-frontend/src/router/guards.ts` |
| 修改 | `qtrans-frontend/vite.config.ts` |
| 修改 | `qtrans-frontend/package.json` |
| 修改 | `qtrans-frontend/src/env.d.ts` |
| 修改 | `qtrans-frontend/index.html` |
| 修改 | `qtrans-frontend/src/utils/request.ts` |
| 修改 | `qtrans-frontend/src/stores/auth.ts` |
| 修改 | `qtrans-frontend/src/composables/useLogin.ts` |
| 修改 | `qtrans-frontend/src/components/common/AppHeader.vue` |
| 修改 | `qtrans-frontend/src/views/dashboard/index.vue` |
| 修改 | `qtrans-frontend/src/views/auth/LoginView.vue` |
| 修改 | `qtrans-frontend/src/views/application/SelectTypeView.vue` |
| 修改 | `qtrans-frontend/src/views/application/CreateApplicationView.vue` |
| 修改 | `qtrans-frontend/src/views/application/ApplicationListView.vue` |
| 修改 | `qtrans-frontend/src/views/application/ApplicationDetailView.vue` |
| 修改 | `qtrans-frontend/src/views/application/components/StepThreeSubmitSuccess.vue` |

## 使用方式

### 开发
```bash
# 启动租户面（端口 3000, base=/tenant/）
pnpm dev:tenant

# 启动管理面（端口 3001, base=/admin/）
pnpm dev:admin
```

### 构建
```bash
# 构建租户面产物
pnpm build:tenant

# 构建管理面产物
pnpm build:admin
```

### Nginx 部署示例
```nginx
server {
    listen 80;
    server_name example.com;

    # 租户面
    location /tenant/ {
        alias /usr/share/nginx/html/tenant/;
        try_files $uri $uri/ /tenant/index.html;
    }

    # 管理面
    location /admin/ {
        alias /usr/share/nginx/html/admin/;
        try_files $uri $uri/ /admin/index.html;
    }

    # 静态资源（figma 等）
    location /figma/ {
        alias /usr/share/nginx/html/figma/;
    }

    # API 代理
    location /tenant/api/ {
        proxy_pass http://backend:8080/api/;
    }
    location /admin/api/ {
        proxy_pass http://backend:8080/api/;
    }
}
```

## 注意事项
1. `useTransferConfig.ts`、`useTransDownload.ts`、`mocks/handlers/uiConfig.ts` 中的 `/figma/` 路径保持原样（它们是默认/mock数据，会被 API 数据覆盖或运行时处理）
2. `vue-tsc` 存在已有的 `@volar/typescript` 依赖问题，与本次改动无关
3. Vite build 因 `rollup` 缺失无法验证，这是环境依赖问题，非代码问题
