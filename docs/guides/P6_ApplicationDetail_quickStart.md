# P6.4 申请单详情页面快速上手

> 目标：5~10 分钟跑通申请单详情页，完成信息查看、文件下载与操作按钮验证，并为后续审批详情复用提供开发入口。

## 1. 入口与运行

- 页面路由：`/application/:id`
- 路由配置：`qtrans-frontend/src/router/routes.ts`
- 页面文件：`qtrans-frontend/src/views/application/ApplicationDetailView.vue`

本地启动：

```bash
npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run dev
```

示例访问：`http://localhost:5173/application/app_001`

---

## 2. 页面结构

1. 头部信息：申请单号、状态标签、返回按钮
2. 双 Tab：
   - `申请单信息`：展示基础信息、申请信息等分组字段
   - `文件列表`：展示文件名、大小、SHA256、上传时间、操作
3. 底部操作区：根据状态展示编辑/删除/撤回/继续上传等动作

---

## 3. 可复用抽象（后续审批详情直接复用）

1. `src/components/business/detail/DetailInfoSection.vue`
   - 通用信息分组组件
   - 输入：section 标题 + 字段列表

2. `src/components/business/detail/DetailFileTable.vue`
   - 通用文件列表组件
   - 支持：单个下载、批量下载、列展示复用

3. `src/composables/useApplicationDetail.ts`
   - 收敛详情数据请求、状态映射、Tab 状态、页面动作
   - 后续审批详情可复用同一数据组织方式

---

## 4. 给开发看的验收清单

- [ ] 从列表页点击“查看”可跳转 `/application/:id`
- [ ] 双 Tab 可切换且内容正确
- [ ] 文件列表可展示 SHA256 和文件大小
- [ ] 单个下载、批量下载按钮可触发
- [ ] 状态操作按钮随申请状态变化
- [ ] 复用组件在详情页可独立渲染

---

## 5. 给测试看的回归用例（QA）

### 5.1 测试前置

- 开启 Mock：`VITE_MOCK_ENABLED=true`
- 准备可访问的申请单 ID（如 `app_001`）

### 5.2 功能回归路径

1. 页面进入
   - 操作：访问 `/application/app_001`
   - 预期：页面正常渲染，无白屏/报错

2. Tab 切换
   - 操作：切换「申请单信息」与「文件列表」
   - 预期：内容区域跟随切换，状态保留正常

3. 文件下载
   - 操作：在文件列表点击单个下载，再执行批量下载
   - 预期：均有成功提示，下载动作触发

4. 状态操作
   - 操作：在不同状态记录中验证编辑/删除/撤回/继续上传按钮
   - 预期：按钮可见性与状态匹配，点击后有反馈

5. 列表联动
   - 操作：从 `/applications` 点击“查看”进入详情
   - 预期：跳转到对应 ID 的详情页

### 5.3 边界验证

- 无文件数据：文件列表为空时页面无报错
- 非法 ID：进入不存在的 ID 时有错误提示或空态兜底
- 连续切换 Tab + 返回：页面状态不异常
