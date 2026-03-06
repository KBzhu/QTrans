# P6.3 申请单列表页面快速上手

> 目标：5~10 分钟内跑通「我的申请单」页面，并能完成筛选、分页、导出、草稿删除、待审批撤回等核心操作。

## 1. 入口与运行

- 页面路由：`/applications`
- 路由配置：`qtrans-frontend/src/router/routes.ts`
- 页面文件：`qtrans-frontend/src/views/application/ApplicationListView.vue`

本地启动：

```bash
npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run dev
```

打开浏览器访问：`http://localhost:5173/applications`

---

## 2. 你会看到什么

1. 页面标题：`我的申请单`
2. 顶部筛选区：
   - 关键字搜索（申请单号 / 申请类型 / 申请原因 / 下载人）
   - 状态筛选（全部、草稿、待上传、待审批、已通过、已驳回、传输中、已完成）
   - 高级搜索（创建时间范围）
3. 表格区：
   - 序号、申请单号、文件数、状态、申请原因、下载人、源/目标城市、创建时间、操作
4. 操作区：
   - 导出 CSV（默认导出当前筛选结果；若勾选行则只导出勾选行）
   - 草稿：支持`编辑/删除`
   - 待审批：支持`撤回`（撤回后转草稿）
5. 分页：支持页码切换、每页条数切换

---

## 3. 代码结构（最常改的 3 个文件）

1. 视图层：`src/views/application/ApplicationListView.vue`
   - 负责筛选 UI、表格列、按钮事件、导出入口

2. 业务逻辑：`src/composables/useApplicationList.ts`
   - 负责列表加载、筛选计算、分页切片、删除草稿、撤回申请

3. 样式层：`src/views/application/application-list.scss`
   - 负责页面布局、状态标签颜色、表格与分页视觉

---

## 4. 关键行为说明

### 4.1 数据来源

- 使用 `useApplicationStore()` 聚合：
  - `applications`（申请单）
  - `drafts`（草稿）
- 合并后按 `createdAt` 倒序展示。

### 4.2 筛选逻辑

- 关键字：对以下字段做包含匹配（不区分大小写）
  - `applicationNo`
  - `applyReason`
  - 申请类型中文标签
  - `downloaderAccounts`
- 状态：`all` 或具体状态
- 日期：命中创建时间范围（按日区间）

### 4.3 分页逻辑

- 前端分页切片：`filteredList.slice(start, end)`
- 监听 `filteredList` 自动更新 `pagination.total`

### 4.4 操作逻辑

- 删除草稿：同时兼容 `applications` 与 `drafts` 两侧数据清理
- 撤回申请：将状态更新为 `draft`，再刷新列表

---

## 5. Figma 资源

- 资源目录：`qtrans-frontend/public/figma/3961_3234/`
- 当前页面使用该目录 SVG 做搜索/高级筛选/导出等图标展示

---

## 6. 常见改动入口

1. 新增筛选项：
   - 先改 `ApplicationListFilters`（`useApplicationList.ts`）
   - 再改页面表单（`ApplicationListView.vue`）

2. 新增状态颜色：
   - 先改状态枚举映射（`ApplicationListView.vue`）
   - 再补 `.application-status-tag--xxx`（`application-list.scss`）

3. 接入后端真实分页：
   - 将 `fetchList()` 从固定 `pageSize: 200` 改为按 `pagination.current/pageSize` 请求
   - 列表改用接口返回 `records + total`

---

## 7. 给开发看的验收清单

- [ ] 进入 `/applications` 页面正常渲染
- [ ] 关键字 + 状态 + 时间范围筛选生效
- [ ] 分页与每页条数切换生效
- [ ] 导出 CSV 可下载且内容正确
- [ ] 草稿可删除，待审批可撤回

---

## 8. 给测试看的回归用例（QA）

### 8.1 测试前置

- 使用开发环境并开启 Mock：`VITE_MOCK_ENABLED=true`
- 保证当前账号可访问 `/applications`

### 8.2 功能回归路径

1. 页面进入
   - 操作：访问 `/applications`
   - 预期：标题「我的申请单」可见，表格正常渲染，不报错

2. 关键字搜索
   - 操作：输入存在的申请单号关键字后回车
   - 预期：结果集被过滤，且包含关键字对应记录

3. 状态筛选
   - 操作：状态选择「草稿」
   - 预期：列表仅显示草稿数据；操作列包含「编辑」「删除」

4. 高级搜索（时间范围）
   - 操作：展开高级搜索，选择创建时间区间，点击「查询」
   - 预期：仅显示区间内数据；点击「重置」后恢复全量

5. 撤回申请
   - 操作：筛选到「待审批」后，点击「撤回」并确认
   - 预期：提示成功；该记录状态变更为「草稿」

6. 删除草稿
   - 操作：对草稿点击「删除」并确认
   - 预期：提示成功；该草稿从列表移除

7. 导出
   - 操作：不勾选行点击「导出」；再勾选 1~2 行点击「导出」
   - 预期：两次均可下载 CSV；第二次仅包含勾选记录

8. 分页
   - 操作：切换页码、切换每页条数（10/20/50）
   - 预期：列表条目与底部统计文案同步变化

### 8.3 边界验证

- 无数据场景：显示空状态与「去创建申请单」按钮
- 关键字输入不存在内容：结果为空但页面无报错
- 连续执行筛选 + 重置 + 分页：状态保持一致，不出现错页或总数异常

