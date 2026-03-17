# 创建申请单接口对接执行记录

## 执行概要

| 项目 | 内容 |
|------|------|
| 任务名称 | 创建申请单接口对接 |
| 关联设计 | `docs/design/P_create_api_design.md` |
| 关联差异 | `docs/diff/P_create_api_diff.md` |
| 开始时间 | 2026-03-14 |
| 完成时间 | 2026-03-14 |

## 执行步骤

### 阶段一: 基础设施

#### 1. vite.config.ts 代理配置
- [x] 已完成
- 新增 `/workflowService` 代理指向 `http://127.0.0.1:8109`

#### 2. 创建 payloadConverter.ts 转换器
- [x] 已完成
- 文件路径: `src/utils/payloadConverter.ts`
- 实现前端表单数据到后端接口请求体的转换

### 阶段二: API 层

#### 3. 修改 api/application.ts
- [x] 已完成
- 新增 `createReal` 方法，调用真实后端接口

### 阶段三: 数据层

#### 4. 修改 types/application.ts
- [x] 已完成
- 移除字段: `storageSize`, `uploadExpireTime`, `downloadExpireTime`, `customerAuthFile`
- 新增字段: `departmentId`, `sourceCityId`, `targetCityId`

#### 5. 修改 useApplicationForm.ts
- [x] 已完成
- 更新 `ApplicationFormData` 接口
- 移除废弃字段的默认值和验证规则
- 移除 `setCustomerAuthFile` 方法
- 新增 `handleSubmitReal` 方法调用真实接口

### 阶段四: 组件层

#### 6. 修改 DepartmentSelector.vue
- [x] 已完成
- 返回 `{ deptId, deptName }` 格式
- `deptName` 为完整路径格式，如 `"研发部/平台研发组"`

#### 7. 修改 CitySelector.vue
- [x] 已完成
- 返回 `{ province, city, cityId }` 格式
- 更新 `CityItem` 接口添加 `id` 字段

#### 8. 修改 StepOneBasicInfo.vue
- [x] 已完成
- 移除废弃字段展示（存储空间大小、上传/下载有效期）
- 移除客户授权文件相关代码
- 适配新的 change 事件格式

#### 9. 修改 CreateApplicationView.vue
- [x] 已完成
- 移除 `setCustomerAuthFile` 相关引用
- 更新提交逻辑使用 `handleSubmitReal`

### 阶段五: 集成测试

#### 10. 验证完整创建流程
- [ ] 待验证
- 需要后端服务运行状态

---

## 产出文件清单

| 文件路径 | 操作类型 | 说明 |
|---------|---------|------|
| `qtrans-frontend/vite.config.ts` | 修改 | 新增代理配置 |
| `qtrans-frontend/src/utils/payloadConverter.ts` | 新增 | 请求体转换器 |
| `qtrans-frontend/src/api/application.ts` | 修改 | 新增 createReal 方法 |
| `qtrans-frontend/src/types/application.ts` | 修改 | 更新接口定义 |
| `qtrans-frontend/src/composables/useApplicationForm.ts` | 修改 | 更新表单逻辑 |
| `qtrans-frontend/src/components/business/DepartmentSelector.vue` | 修改 | 返回完整路径 |
| `qtrans-frontend/src/components/business/CitySelector.vue` | 修改 | 返回城市ID |
| `qtrans-frontend/src/mocks/data/cities.ts` | 修改 | 添加城市ID |
| `qtrans-frontend/src/views/application/components/StepOneBasicInfo.vue` | 修改 | 移除废弃字段 |
| `qtrans-frontend/src/views/application/CreateApplicationView.vue` | 修改 | 更新提交逻辑 |

---

## 验收结果

### Lint 检查
- [x] 所有修改文件无 Lint 错误

### 功能验证
- [ ] 需要启动后端服务验证接口调用

---

*执行完成时间: 2026-03-14*
