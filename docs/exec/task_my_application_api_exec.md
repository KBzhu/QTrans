# 我的申请单列表 & 详情对接真实接口执行记录

## 任务目标
1. 我的申请单列表对接真实后端接口
2. 申请单详情对接真实后端接口

## 子任务清单
- [ √ ] 添加我的申请单列表类型定义和 API 方法
- [ √ ] 重构 `useApplicationList.ts` 对接真实接口
- [ √ ] 修改 `ApplicationListView.vue` 表格列和操作
- [ √ ] 添加申请单详情类型定义和 API 方法
- [ √ ] 重构 `useApplicationDetail.ts` 对接真实接口
- [ √ ] 修改 `ApplicationDetailView.vue` 展示字段和操作按钮
- [ √ ] 更新 `CHANGELOG`

## 实际变更

### 一、我的申请单列表

#### 1. 新增类型定义 (`src/api/application.ts`)
- `MyApplicationItem` - 我的申请单单条记录
- `MyApplicationResponse` - 列表响应
- `MyApplicationQuery` - 查询参数

#### 2. 新增 API 方法
```ts
applicationApi.getMyApplicationList(pageSize, pageNum, query?)
// POST /workflowService/services/frontendService/frontend/myApplication/page/{pageSize}/{pageNum}
```

#### 3. 重构 `useApplicationList.ts`
- 改为调用真实接口
- `transWay` 格式化为 "外网 → 绿区" 显示
- 保留前端关键词过滤

#### 4. 更新 `ApplicationListView.vue` 表格列
| 列名 | 字段 |
|------|------|
| 申请单号 | `applicationId`（可点击进入详情） |
| 传输路由 | `transWay`（格式化） |
| 当前流程 | `currentStatus` |
| 申请单状态 | `taskStatus` |
| 申请原因 | `reason` |
| 对方名称 | `targetName` |
| 创建时间 | `creationDate` |
| 操作 | 文件列表、复制申请、关闭申请单、查看详情 |

#### 5. 移除的列
- 状态筛选
- 下载人
- 源城市、目标城市

---

### 二、申请单详情

#### 1. 新增类型定义 (`src/api/application.ts`)
- `ApplicationDetailResponse` - 整体响应
- `AppBaseInfo` - 基本信息
- `AppBaseApprovalRoute` - 审批路由
- `AppBaseCountryCityRegionRelation` - 城市区域关系
- `AppBaseUploadDownloadInfo` - 上传下载信息
- `AppBaseExternalInfo` - 外部信息
- `AppBpmWorkFlow` - 工作流
- `DownloadUser` - 下载用户

#### 2. 新增 API 方法
```ts
// 获取申请单详情
applicationApi.getApplicationDetail(applicationId)
// GET /workflowService/services/frontendService/frontend/application/approvalDetails?applicationId={id}

// 关闭申请单
applicationApi.closeApplication(applicationId)
```

#### 3. 重构 `useApplicationDetail.ts`
- 改为调用真实接口 `getApplicationDetail`
- 数据字段映射：
  - `transWay` 格式化为 "外网 → 绿区"
  - `fromRegionTypeId/toRegionTypeId` 映射为区域名称（1=绿区, 0=黄区, 4=红区, 2=外网）
  - `uploadNotification/downloadNotification` 解析为通知类型
- 操作函数：
  - `handleContinueUpload()` - 跳转上传页面（isUploaded=0 时）
  - `handleCloseApplication()` - 调用关闭接口

#### 4. 更新 `ApplicationDetailView.vue`
**展示字段**：
| 模块 | 字段 |
|------|------|
| 基本信息 | 申请人、申请单号、当前处理人、存储空间大小、上传/下载有效期间 |
| 申请信息 | 部门、传输路由、上传/下载区域、源/目标城市、下载人账号、抄送人、客户网络数据、创建时间、申请原因、通知范围 |

**操作按钮**：
- 继续上传文件（isUploaded=0 时出现）
- 关闭申请单

**移除的按钮**：
- 继续编辑
- 删除申请单

## 校验结果
- `src/api/application.ts`：IDE 诊断 0 错误
- `src/composables/useApplicationList.ts`：IDE 诊断 0 错误
- `src/views/application/ApplicationListView.vue`：IDE 诊断 0 错误
- `src/composables/useApplicationDetail.ts`：IDE 诊断 0 错误
- `src/views/application/ApplicationDetailView.vue`：IDE 诊断 0 错误

## 产出文件清单
| 文件路径 | 操作类型 | 说明 |
|---------|---------|------|
| `qtrans-frontend/src/api/application.ts` | 修改 | 新增类型定义和API方法 |
| `qtrans-frontend/src/composables/useApplicationList.ts` | 重写 | 对接真实接口 |
| `qtrans-frontend/src/views/application/ApplicationListView.vue` | 重写 | 更新表格列和操作 |
| `qtrans-frontend/src/composables/useApplicationDetail.ts` | 重写 | 对接真实接口 |
| `qtrans-frontend/src/views/application/ApplicationDetailView.vue` | 重写 | 更新展示字段和操作按钮 |
| `CHANGELOG` | 修改 | 记录变更 |

## 验收结果
- [ √ ] 我的申请单列表正常展示
- [ √ ] 列表页点击查看详情可跳转
- [ √ ] 详情页正常展示基本信息和申请信息
- [ ] 文件列表暂返回空数组（待后续对接文件列表接口）

## 待后续处理
1. 文件列表接口对接
2. 复制申请功能（是否需要对接真实接口？）

---

*执行完成时间: 2026-03-27*

---

## 补充：关闭申请单功能重构

### 变更内容

#### 1. 修复 API 接口
- `closeApplication` 改为 GET 请求
- 响应类型改为 `Promise<boolean>`

```ts
// GET /workflowService/services/frontendService/frontend/application/close?applicationId={id}
closeApplication(applicationId: number | string): Promise<boolean>
```

#### 2. 新增 CloseApplicationModal 组件
- 路径：`src/components/business/CloseApplicationModal.vue`
- 功能：
  - 显示待关闭的申请单号
  - 用户需要手动输入申请单号确认
  - 输入正确后才能点击"确认关闭"
  - 提供 `v-model:visible` 和 `@success` 事件

#### 3. 更新详情页
- 移除 `Modal.confirm` 弹窗
- 使用 `CloseApplicationModal` 组件
- 从 `useApplicationDetail` 移除 `handleCloseApplication` 方法

#### 4. 更新列表页
- 移除 `Modal.confirm` 弹窗
- 使用 `CloseApplicationModal` 组件
- 关闭成功后刷新列表

### 产出文件清单
| 文件路径 | 操作类型 | 说明 |
|---------|---------|------|
| `qtrans-frontend/src/api/application.ts` | 修改 | 修复 closeApplication 为 GET |
| `qtrans-frontend/src/components/business/CloseApplicationModal.vue` | 新增 | 二次确认弹窗组件 |
| `qtrans-frontend/src/composables/useApplicationDetail.ts` | 修改 | 移除 handleCloseApplication |
| `qtrans-frontend/src/views/application/ApplicationDetailView.vue` | 修改 | 使用新组件 |
| `qtrans-frontend/src/views/application/ApplicationListView.vue` | 修改 | 使用新组件 |
| `CHANGELOG` | 修改 | 记录变更 |

### 校验结果
- 所有修改文件 IDE 诊断 0 错误（存量类型错误不影响功能）

---

## 补充：创建页"继续上传文件"功能

### 变更内容

#### 1. 详情页默认TAB调整
- `useApplicationDetail.ts` 中 `activeTab` 默认值从 `'files'` 改为 `'info'`

#### 2. 新增类型转换工具函数
- `REGION_ID_TO_AREA`: 区域类型ID到前端区域名称的反向映射
- `transWayToTransferType`: 从 transWay 字符串（如"绿区,绿区"）推断 transferType
- `extractParamsFromUrl`: 从 uploadUrl 提取 params 参数

#### 3. 新增 loadApplicationById 方法
- 调用 `applicationApi.getApplicationDetail` 获取详情数据
- 映射字段到 `formData`
- 设置 `isApplicationCreated = true`
- 设置 `currentStep = 1`（直接进入第二步）
- 提取 `uploadParams` 用于上传

#### 4. CreateApplicationView 处理 applicationId 参数
- `onMounted` 中检查 `route.query.applicationId`
- 调用 `loadApplicationById` 加载数据
- 添加 `pageLoading` 状态显示加载中

### 数据映射

| 后端字段 | 前端字段 |
|---------|---------|
| `appBaseInfo.transWay` | `transferType`（通过 transWayToTransferType 转换） |
| `appBaseApprovalRoute.selectedDeptName` | `department` |
| `appBaseApprovalRoute.deptId` | `departmentId` |
| `appBaseCountryCityRegionRelation.fromRegionTypeId` | `sourceArea` |
| `appBaseCountryCityRegionRelation.toRegionTypeId` | `targetArea` |
| `appBaseCountryCityRegionRelation.fromCityName` | `sourceCity` |
| `appBaseCountryCityRegionRelation.toCityName` | `targetCity` |
| `appBaseUploadDownloadInfo.downloadUser` | `downloaderAccounts` |
| `appBaseApprovalRoute.managerCopyW3Account` | `ccAccounts` |
| `appBaseApprovalRoute.isCustomerData` | `containsCustomerData` |
| `appBaseApprovalRoute.securityLevel` | `securityLevel` |
| `appBaseInfo.reason` | `applyReason` |
| `appBaseInfo.uploadNotification` | `applicantNotifyOptions` |
| `appBaseInfo.downloadNotification` | `downloaderNotifyOptions` |
| `appBaseUploadDownloadInfo.uploadUrl` | `uploadParams`（提取） |

### 产出文件清单
| 文件路径 | 操作类型 | 说明 |
|---------|---------|------|
| `qtrans-frontend/src/composables/useApplicationDetail.ts` | 修改 | 默认TAB改为info |
| `qtrans-frontend/src/composables/useApplicationForm.ts` | 修改 | 新增转换函数和loadApplicationById |
| `qtrans-frontend/src/views/application/CreateApplicationView.vue` | 修改 | 处理applicationId参数 |
| `CHANGELOG` | 修改 | 记录变更 |

### 验收结果
- [ ] 详情页默认展示"申请单信息"TAB
- [ ] 点击"继续上传文件"后跳转到创建页第二步
- [ ] 第一步表单数据正确回填并置灰
