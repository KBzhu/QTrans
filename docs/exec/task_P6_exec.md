# Task P6 执行记录

## 执行范围
本次仅执行 P6.1（选择传输类型页面），其余子任务后续分批执行。

## P6.1 选择传输类型页面

### 子任务进度

- [√] 同步 Figma 3971_812 SVG 资源到 `public/figma/3971_812/`
- [√] 创建 `src/views/application/select-type.scss` 样式文件
- [√] 创建 `src/views/application/SelectTypeView.vue` 页面组件
- [√] 更新路由配置，添加 `/application/select-type` 路由
- [√] 构建验证通过（vue-tsc + vite build）
- [√] 生成 P6_Figma_Doc_Diff.md 差异记录
- [√] 更新 CHANGELOG

### 验收结果

| 验收项 | 状态 | 备注 |
|--------|------|------|
| 传输类型卡片正常显示 | ✅ | 9 种类型 + 2 种例行，按 Tab 分组 |
| Tab 切换功能正常 | ✅ | 5 个 Tab，activeTab 响应式切换 |
| 卡片 hover 效果（阴影加深、上浮） | ✅ | translateY(-4px) + box-shadow 加深 |
| 点击卡片跳转携带 type 参数 | ✅ | router.push `/application/create?type=xxx` |
| 响应式布局（5列→3列→2列→1列） | ✅ | 1400px / 1200px / 768px 断点 |
| 审批层级标签正确显示 | ✅ | 免审绿/一级黄/二级红/三级紫 |
| 绿区传出含 5 种类型 | ✅ | 绿→绿、绿→黄、绿→外网、绿→红、绿→海思红区 |
| 构建无报错 | ✅ | vite build 通过 |

### 产出文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `public/figma/3971_812/*.svg` | 新增 | Figma 资源同步 |
| `src/views/application/SelectTypeView.vue` | 新增 | 选择传输类型页面 |
| `src/views/application/select-type.scss` | 新增 | 页面样式 |
| `src/router/routes.ts` | 修改 | 添加路由 |
| `docs/diff/P6_Figma_Doc_Diff.md` | 新增 | Figma/文档差异 |
| `CHANGELOG` | 修改 | 变更记录 |

## 2026-03-05 P6.3 申请单列表页面问题修复

### 问题-修复说明

1. **控制台报错导致列表中断渲染**
   - 问题：`TypeError: record.sourceCity.join is not a function`（`sourceCity/targetCity/downloaderAccounts` 在历史草稿数据中可能为 string 或其他结构）。
   - 修复：在 `useApplicationList.ts` 增加 `normalizeStringArray` + `normalizeApplication`，统一将相关字段归一化为 `string[]`，并在列表合并后统一规范数据。

2. **申请原因/下载人名称部分行为空或异常**
   - 问题：历史数据存在空值或非数组结构，模板直接渲染导致显示异常。
   - 修复：在 `ApplicationListView.vue` 增加 `formatApplyReason`、`formatArrayField`，对空值显示 `-`，对异常结构做兜底转换。

3. **操作列与 Figma 不一致（文字按钮而非图标）**
   - 问题：操作列最初使用文字按钮（查看/编辑/删除/撤回），与 Figma 图标交互不一致。
   - 修复：操作列改为图标按钮，接入 `public/figma/3961_3234` 资源（查看/编辑/删除/撤回），并补充 `.table-action-btn/.table-action-icon` 样式对齐。

### 校验结果

- [√] `ApplicationListView.vue` lint 通过
- [√] `useApplicationList.ts` lint 通过
- [√] `application-list.scss` lint 通过
- [√] `npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run build` 通过

### 本次修复涉及文件

- `qtrans-frontend/src/composables/useApplicationList.ts`
- `qtrans-frontend/src/views/application/ApplicationListView.vue`
- `qtrans-frontend/src/views/application/application-list.scss`
- `docs/exec/task_P6_exec.md`

## 2026-03-05 P6.3 操作列可用性修复（Tooltip + 图标去重）

### 问题-修复说明

1. **操作列缺少悬浮提示，图标语义不清晰**
   - 问题：鼠标悬浮时无法识别按钮语义，操作可理解性不足。
   - 修复：为 `查看/编辑/删除/撤回` 按钮补充 `title` 提示，悬浮可直接显示操作名称。

2. **操作图标存在重复，不易区分**
   - 问题：现有图标中存在视觉重复，且高保真未明确提供全部操作图标。
   - 修复：改为 Arco Icon 对应语义图标：`IconEye`（查看）、`IconEdit`（编辑）、`IconDelete`（删除）、`IconUndo`（撤回），并统一操作按钮尺寸与圆角。

### 校验结果

- [√] `ApplicationListView.vue` lint 通过
- [√] `application-list.scss` lint 通过
- [√] `npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run build` 通过

### 本次修复涉及文件

- `qtrans-frontend/src/views/application/ApplicationListView.vue`
- `qtrans-frontend/src/views/application/application-list.scss`
- `docs/exec/task_P6_exec.md`

## 2026-03-05 P6.4 申请单详情页开发（可复用抽象）

### 子任务进度

- [√] 新增 `ApplicationDetailView.vue`，完成「申请单信息 / 文件列表」双 Tab 页面结构
- [√] 新增 `useApplicationDetail.ts`，收敛详情数据组装、状态映射与页面行为
- [√] 抽象通用组件 `DetailInfoSection.vue`、`DetailFileTable.vue` 以支持后续审批详情复用
- [√] 新增详情路由 `/application/:id`，并将列表页“查看”动作改为跳转详情
- [√] 同步 Figma 资源 `public/figma/3971_1904/`（9 个 SVG）
- [√] 完成 lint 自检（本次新增/修改文件均无报错）

### 验收结果

| 验收项 | 状态 | 备注 |
|--------|------|------|
| 详情页路由可访问 | ✅ | `/application/:id` 可正常进入 |
| 信息/文件双 Tab 切换可用 | ✅ | 支持按 Tab 展示不同区域 |
| 文件列表展示对齐截图 | ✅ | 含 SHA256、单个下载、批量下载 |
| 列表页查看入口已打通 | ✅ | 从 `/applications` 可跳转详情页 |
| 可复用抽象落地 | ✅ | 通用信息区与文件表格组件已沉淀 |

### 产出文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `qtrans-frontend/src/views/application/ApplicationDetailView.vue` | 新增 | 申请单详情页 |
| `qtrans-frontend/src/views/application/application-detail.scss` | 新增 | 申请单详情页样式 |
| `qtrans-frontend/src/composables/useApplicationDetail.ts` | 新增 | 详情页业务逻辑 composable |
| `qtrans-frontend/src/components/business/detail/DetailInfoSection.vue` | 新增 | 通用详情信息区组件 |
| `qtrans-frontend/src/components/business/detail/detail-info-section.scss` | 新增 | 信息区组件样式 |
| `qtrans-frontend/src/components/business/detail/DetailFileTable.vue` | 新增 | 通用文件列表组件 |
| `qtrans-frontend/src/components/business/detail/detail-file-table.scss` | 新增 | 文件列表组件样式 |
| `qtrans-frontend/src/types/detail.ts` | 新增 | 通用详情类型定义 |
| `qtrans-frontend/src/types/index.ts` | 修改 | 聚合导出 detail 类型 |
| `qtrans-frontend/src/router/routes.ts` | 修改 | 新增详情路由 |
| `qtrans-frontend/src/views/application/ApplicationListView.vue` | 修改 | 查看动作跳转详情 |
| `qtrans-frontend/public/figma/3971_1904/*.svg` | 新增 | Figma 资源同步 |
| `docs/exec/task_P6_exec.md` | 修改 | 执行记录补充 |




