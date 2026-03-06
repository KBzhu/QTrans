# task_P8.1 - 待审批列表页面

## 任务目标

实现审批管理列表页面，支持 Tab 切换（待我审批/我已审批/全部审批）、筛选、表格展示、分页功能。

## 子任务进度

- [√] 创建 `src/views/approvals/ApprovalListView.vue` 审批列表页面
- [√] 创建 `src/composables/useApprovalList.ts` 列表逻辑 composable
- [√] 创建 `src/views/approvals/approval-list.scss` 独立样式文件
- [√] 实现 Tab 切换（待我审批/我已审批/全部审批）
- [√] 实现筛选区域（申请单号、传输类型、申请人、申请时间）
- [√] 实现数据表格（序号、申请单号、传输类型、申请人、申请部门、申请时间、当前审批层级、操作）
- [√] 实现分页功能
- [√] 实现空状态展示
- [√] 更新路由配置，替换占位页面
- [√] 删除旧占位文件（`index.vue` / `approval-index.scss`）
- [√] 自检（lint / 构建通过）

## 验收结果

| 验收项 | 状态 | 备注 |
|--------|------|------|
| Tab 切换功能正常 | ✅ | 待我审批/我已审批/全部审批 |
| 筛选功能可用 | ✅ | 申请单号、传输类型、申请人、时间范围 |
| 表格正确展示审批信息 | ✅ | 含审批层级标签（一级/二级/三级） |
| 操作列按 Tab 显示不同按钮 | ✅ | 待我审批显示"审批"，已审批显示"查看" |
| 分页功能正常 | ✅ | 支持翻页与每页条数切换 |
| 空状态正确展示 | ✅ | 无数据时显示对应提示 |
| 路由可访问 | ✅ | `/approvals` 可正常进入 |
| 构建无报错 | ✅ | `npm run build` 通过 |

## 产出文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `src/views/approvals/ApprovalListView.vue` | 新增 | 审批列表页面 |
| `src/composables/useApprovalList.ts` | 新增 | 列表逻辑 composable |
| `src/views/approvals/approval-list.scss` | 新增 | 独立样式文件 |
| `src/router/routes.ts` | 修改 | 更新审批列表路由指向 |
| `src/views/approvals/index.vue` | 删除 | 旧占位页面 |
| `src/views/approvals/approval-index.scss` | 删除 | 旧占位样式 |
| `docs/tasks/task_P8.md` | 修改 | 勾选 P8.1 已完成项 |
| `docs/exec/task_P8.1.md` | 新增 | 本执行记录 |

## 技术要点

- 复用申请单列表页架构模式（`useApplicationList` 参考）
- Tab 切换通过 `activeTab` ref 控制数据源过滤
- 审批层级标签使用 `a-tag` 并按层级映射颜色（一级橙红、二级红、三级紫）
- 操作列根据 `activeTab` 动态显示"审批"或"查看"按钮
- 筛选与分页逻辑通过 `computed` 实时计算
- 样式复用申请单列表的玻璃拟态卡片与表格样式

## AI工时统计（SSD口径）

> 口径：AI工时 = Prompt + 等待 + Review + 改写 + 测试 + 返工。
> 项目累计实际投入：3天（按 8h/天折算 24h）。

| task_id | 模块/页面 | SSD阶段 | 复杂度(1-5) | 基线工时(h) | AI工时(h) | AI交互轮次 | 人工介入时长(h) | 返工次数 | 缺陷数 | 覆盖率(前/后) | 节省小时 | 节省率 | 单位复杂度节省 | 备注 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---|
| P8.1 | 待审批列表页面 | Requirements/Design/TaskList/执行 | 待补录 | 待补录 | 待补录（累计24h口径） | 待补录 | 待补录 | 待补录 | 待补录 | 待补录 | 待补录 | 待补录 | 待补录 | 历史任务，待回填 |

