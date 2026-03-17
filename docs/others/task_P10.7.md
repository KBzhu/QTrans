# task_P10.7 - 区域管理（管理员）

## 任务目标

实现区域管理页面，包含：城市与安全域映射（Tab1）和可选安全域配置（Tab2），支持完整 CRUD 操作。

## 执行进度

- [√] 创建 `src/types/regionManage.ts` 类型定义
- [√] 创建 `src/api/regionManage.ts` API 层
- [√] 创建 `src/mocks/handlers/regionManage.ts` Mock 数据
- [√] 创建 `src/composables/useRegionManage.ts` Composable
- [√] 创建 `src/views/admin/RegionManageModal.vue` 弹窗组件
- [√] 创建 `src/views/admin/region-manage.scss` 样式文件
- [√] 创建 `src/views/admin/RegionManageView.vue` 主视图
- [√] 更新聚合文件（api/index.ts、mocks/handlers/index.ts、types/index.ts）
- [√] 创建并运行单元测试 `src/composables/__tests__/useRegionManage.spec.ts`（16 个用例全通过）
- [√] 更新 `docs/tasks/task_P10.md` 勾选 P10.7

## 产出文件清单

| 文件 | 说明 |
|------|------|
| `src/types/regionManage.ts` | CityDomainMapping、SecurityDomain 类型 |
| `src/api/regionManage.ts` | CRUD 接口定义 |
| `src/mocks/handlers/regionManage.ts` | 城市/安全域 Mock CRUD |
| `src/composables/useRegionManage.ts` | 状态管理与操作逻辑 |
| `src/views/admin/RegionManageModal.vue` | 新增/编辑弹窗 |
| `src/views/admin/region-manage.scss` | 页面样式 |
| `src/views/admin/RegionManageView.vue` | 主页面（双 Tab） |
| `src/composables/__tests__/useRegionManage.spec.ts` | 单元测试 |

## 功能说明

### Tab1：城市与安全域映射
- 表格列：城市名称、国家、安全域（a-tag 色彩）、状态、操作（编辑/删除）
- 顶部操作栏：新增映射按钮
- 分页器

### Tab2：可选安全域配置
- 表格列：安全域名称、安全域代码、颜色标识、描述、启用状态（a-switch）、操作（编辑/删除）
- 顶部操作栏：新增安全域按钮

### 弹窗（RegionManageModal）
- 城市映射表单：城市名称（必填）、国家（必填）、安全域（下拉选择，必填）
- 安全域配置表单：名称（必填）、代码（必填）、颜色（颜色选择）、描述、启用状态

## 工时统计

| 口径 | 工时 |
|------|------|
| 基线工时 | 3h |
| AI 工时 | ~1.2h |
| 节省率 | ~60% |
