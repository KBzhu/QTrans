# 审批层级联动功能执行文档

## 需求概述
"文件最高密级"有值后，联动查询"审批层级"接口，根据响应渲染审批人字段：
- 直接主管（人员搜索框）
- 二层审批人/三层审批人/四层审批人（人员下拉框）

## 接口信息
- **URL**: `GET /workflowService/services/frontendService/frontend/approvalRoute/page/{pageSize}/{pageNum}`
- **参数**: `procTypeId`, `fromRegionTypeId`, `toRegionTypeId`, `securityLevelId`, `isCustomerData`, `isUrgent`, `deptId`, `isContainLargeModel`
- **响应关键字段**:
  - `isManagerApproval` → 直接主管
  - `isManager2Approval` → 二层审批人
  - `isManager3Approval` → 三层审批人
  - `isManager4Approval` → 四层审批人

## 字段映射（来自 payloadConverter.ts）
| 前端字段 | 后端字段 | 说明 |
|---------|---------|------|
| `directSupervisor` | `managerW3Account` | 直接主管 W3 账号 |
| `approverLevel2` | `manager2W3Account` | 二层审批人 W3 账号 |
| `approverLevel3` | `manager3W3Account` | 三层审批人 W3 账号 |
| `approverLevel4` | `manager4W3Account` | 四层审批人 W3 账号 |

---

## 执行步骤

### 1. API 层 - 添加审批层级查询接口
- [√] 在 `src/api/application.ts` 中添加 `findApprovalRoute` 接口
- [√] 定义 `ApprovalRouteItem` 类型

### 2. 类型层 - 扩展表单数据结构
- [√] 在 `src/composables/useApplicationForm.ts` 的 `ApplicationFormData` 中添加审批人字段
- [√] 更新 `defaultFormData` 函数初始化审批人字段

### 3. 组件层 - 审批层级联动逻辑
- [√] 在 `StepOneBasicInfo.vue` 中添加审批层级查询函数 `fetchApprovalRoute`
- [√] 添加审批层级配置状态 `approvalRouteConfig`
- [√] 监听 `securityLevel` 变化触发查询
- [√] 添加 Mock 人员数据（接口暂未提供）

### 4. 组件层 - 审批人选择器 UI
- [√] 添加"直接主管"搜索框（带搜索功能）
- [√] 添加"二/三/四层审批人"下拉框（条件渲染）
- [√] 处理数据双向绑定和变更事件

### 5. 数据转换层 - 更新 payloadConverter
- [√] 将审批人字段映射到后端请求体

### 6. 测试验证
- [ ] 选择"文件最高密级"后触发审批层级查询
- [ ] 根据响应正确显示/隐藏审批人字段
- [ ] 表单数据正确绑定

---

## Mock 数据

```ts
// 模拟人员列表（接口未提供时使用）
const mockApproverOptions = [
  { label: '张三 / zhangsan / 研发部', value: 'zhangsan' },
  { label: '李四 / lisi / 测试部', value: 'lisi' },
  { label: '王五 / wangwu / 产品部', value: 'wangwu' },
  { label: '赵六 / zhaoliu / 运维部', value: 'zhaoliu' },
  { label: '陈七 / chenqi / 架构部', value: 'chenqi' },
]
```

---

## 执行日志

### 执行时间: 2026-03-22

**修改文件清单：**
1. `src/api/application.ts` - 添加 `findApprovalRoute` 接口和类型定义
2. `src/composables/useApplicationForm.ts` - 扩展 `ApplicationFormData` 接口
3. `src/views/application/components/StepOneBasicInfo.vue` - 添加审批层级联动逻辑和 UI
4. `src/utils/payloadConverter.ts` - 映射审批人字段到后端请求体

**注意事项：**
- 审批人数据目前使用 Mock 数据，待接口提供后替换
- 预先存在的类型错误（`SecurityArea` vs `Application.sourceArea` 类型）未在本任务中修复

