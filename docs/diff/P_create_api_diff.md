# 创建申请单接口差异分析

## 一、接口基本信息

| 项目 | 前端现有 | 后端真实接口 |
|------|---------|-------------|
| 接口路径 | `POST /applications` | `POST /workflowService/services/frontendService/frontend/application/create` |
| 认证方式 | Mock（无认证） | Header: `token: xxx` |
| 目标地址 | Mock 数据 | `http://127.0.0.1:8109` |

## 二、请求体结构对比

### 后端接口结构（嵌套对象）

```json
{
  "appBaseApprovalRoute": { /* 审批路由信息 */ },
  "appBaseCountryCityRegionRelation": { /* 城市/区域信息 */ },
  "appBaseInfo": { /* 申请基本信息 */ },
  "appBaseUploadDownloadInfo": { /* 上传下载信息 */ },
  "appBpmWorkFlow": { /* 工作流信息 */ },
  "appBaseExternalInfo": { /* 外部信息 */ },
  "appTransInfo": { /* 传输信息 */ },
  "appCustomerNetworkFiles": null,
  "edsInfo": {}
}
```

### 前端现有结构（扁平对象）

```typescript
interface ApplicationFormData {
  transferType: TransferType
  department: string
  sourceArea: SecurityArea      // 'green' | 'yellow' | 'red'
  targetArea: SecurityArea
  sourceCity: string[]
  targetCity: string[]
  downloaderAccounts: string[]
  ccAccounts: string[]
  containsCustomerData: 'yes' | 'no'
  customerAuthFile?: string
  srNumber: string
  minDeptSupervisor: string
  applyReason: string
  applicantNotifyOptions: NotifyChannel[]
  downloaderNotifyOptions: NotifyChannel[]
  storageSize: number           // 后端无对应字段 → 移除
  uploadExpireTime: string      // 后端无对应字段 → 移除
  downloadExpireTime: string    // 后端无对应字段 → 移除
}
```

## 三、字段映射详情

### 3.1 部门信息

| 前端字段 | 后端字段 | 转换说明 | 状态 |
|---------|---------|---------|------|
| `department` | `appBaseApprovalRoute.selectedDeptName` | **完整路径格式**，如 `"华为技术/2012实验室/星光工程部/星光项目办公室"` | ✅ 需调整格式 |
| - | `appBaseApprovalRoute.userDeptId` | 部门ID | ⚠️ 需补充 |

### 3.2 区域信息

| 前端字段 | 后端字段 | 转换说明 | 状态 |
|---------|---------|---------|------|
| `sourceArea` | `appBaseCountryCityRegionRelation.fromRegionTypeId` | green→"1", yellow→"2", red→"3" | ✅ 需转换 |
| `targetArea` | `appBaseCountryCityRegionRelation.toRegionTypeId` | 同上 | ✅ 需转换 |
| - | `appBaseCountryCityRegionRelation.fromRegionId` | **固定值 6**（城市-安全域通道ID） | ✅ 写死 |
| - | `appBaseCountryCityRegionRelation.toRegionId` | **固定值 6** | ✅ 写死 |

### 3.3 城市信息

| 前端字段 | 后端字段 | 转换说明 | 状态 |
|---------|---------|---------|------|
| `sourceCity` | `appBaseCountryCityRegionRelation.fromCityName` | **中文城市名**，如 `"深圳"` | ✅ |
| `targetCity` | `appBaseCountryCityRegionRelation.toCityName` | **中文城市名**，如 `"西安"` | ✅ |
| - | `appBaseCountryCityRegionRelation.fromCityId` | 城市ID | ⚠️ 需补充 |
| - | `appBaseCountryCityRegionRelation.toCityId` | 城市ID | ⚠️ 需补充 |

### 3.4 下载人/抄送人

| 前端字段 | 后端字段 | 转换说明 | 状态 |
|---------|---------|---------|------|
| `downloaderAccounts` | `appBaseUploadDownloadInfo.downloadW3Account` | **多账号逗号拼接**，如 `"zwx1444795,ywx1420846"` | ✅ 需转换 |
| `ccAccounts` | `appBaseApprovalRoute.managerCopyW3Account` | **多账号逗号拼接**，如 `"zwx1444795,ywx1420846"` | ✅ 需转换 |

### 3.5 客户数据相关

| 前端字段 | 后端字段 | 转换说明 | 状态 |
|---------|---------|---------|------|
| `containsCustomerData` | `appBaseApprovalRoute.isCustomerData` | yes→1, no→0 | ✅ 需转换 |
| `srNumber` | `appBaseInfo.externalCode` | SR单号 | ✅ |
| `minDeptSupervisor` | `appBaseApprovalRoute.managerMinW3Account` | W3账号格式 | ✅ |

### 3.6 申请原因与通知

| 前端字段 | 后端字段 | 转换说明 | 状态 |
|---------|---------|---------|------|
| `applyReason` | `appBaseInfo.reason` | 直接映射 | ✅ |
| `applicantNotifyOptions` | `appBaseInfo.uploadNotification` | `['in_app','email']` → `"[1,2]"` | ✅ 需转换 |
| `downloaderNotifyOptions` | `appBaseInfo.downloadNotification` | 同上 | ✅ 需转换 |

### 3.7 流程类型（procType）

| 值 | 含义 | 说明 |
|----|------|------|
| `"0"` | 正常传输 | 默认值 |
| `"1"` | 例行通道 | - |
| `"5"` | 紧急传输 | - |

**前端来源**: 根据 `transferType` 或业务场景判断

### 3.8 上传/下载模式（uploadMode/downloadMode）

| 值 | 含义 | 说明 |
|----|------|------|
| `0` | WEB | 默认值 |
| `1` | FTP | 后续支持 |

**前端状态**: 当前页面无选项，后续需添加，默认值为 `0`

### 3.9 需要移除的字段（后端无对应）

| 前端字段 | 说明 | 处理方式 |
|---------|------|---------|
| `storageSize` | 存储空间大小 | ❌ 移除 |
| `uploadExpireTime` | 上传有效期 | ❌ 移除 |
| `downloadExpireTime` | 下载有效期 | ❌ 移除 |
| `customerAuthFile` | 客户授权文件 | ❌ 移除 |

### 3.10 后端必填但前端缺失的字段

| 后端字段 | 示例值 | 说明 | 处理方式 |
|---------|-------|------|---------|
| `appBaseApprovalRoute.securityLevel` | 99 | 安全等级 | 固定默认值 |
| `appBaseApprovalRoute.defaultSecretLevels99` | true | 默认安全等级 | 固定默认值 |
| `appBaseApprovalRoute.approvalRouteId` | 6 | 审批路由ID | 固定默认值 |
| `appBaseApprovalRoute.isContainLargeModel` | 0 | 是否包含大模型 | 固定默认值 |
| `appBaseApprovalRoute.isManagerCopyApproval` | 0 | 是否主管抄送审批 | 动态判断 |
| `appBaseApprovalRoute.isAbcManagerApproval` | false | ABC经理审批 | 固定默认值 |
| `appBaseApprovalRoute.promiseLookupVO` | {} | 承诺查询 | 固定空对象 |
| `appBaseInfo.isHttps` | 0 | 是否HTTPS | 固定默认值 |
| `appBaseInfo.emailNotification` | false | 邮件通知 | 固定默认值 |
| `appBaseInfo.kiaConfirms` | 0 | KIA确认 | 固定默认值 |
| `appBaseInfo.policyed` | false | 是否已读策略 | 固定默认值 |
| `appBpmWorkFlow.currentHandler` | "yWX1420846" | 当前处理人 | 从当前用户获取 |
| `appBaseExternalInfo.applicationType` | 0 | 申请类型 | 固定默认值 |
| `appBaseExternalInfo.abc` | false | ABC标识 | 固定默认值 |
| `appTransInfo.transferMode` | 0 | 传输模式 | 固定默认值 |

## 四、类型转换规则

### 4.1 区域类型映射

```typescript
const REGION_TYPE_MAP = {
  green: '1',   // 绿区
  yellow: '2',  // 黄区
  red: '3',     // 红区
}
```

### 4.2 流程类型映射

```typescript
const PROC_TYPE_MAP = {
  normal: '0',      // 正常传输
  routine: '1',     // 例行通道
  emergency: '5',   // 紧急传输
}
```

### 4.3 上传/下载模式映射

```typescript
const TRANSFER_MODE_MAP = {
  web: 0,   // WEB
  ftp: 1,   // FTP
}
```

### 4.4 通知选项映射

```typescript
// 前端: ['in_app', 'email'] 
// 后端: "[1,2]"

const NOTIFY_CHANNEL_MAP = {
  in_app: 1,   // 应用号
  w3: 2,       // W3代办
  email: 3,    // 邮件
}
```

### 4.5 布尔值转换

```typescript
// 前端: 'yes' | 'no'
// 后端: 1 | 0

const convertYesNo = (value: 'yes' | 'no') => value === 'yes' ? 1 : 0
```

## 五、影响范围

### 5.1 需要修改的文件

| 文件路径 | 修改内容 |
|---------|---------|
| `vite.config.ts` | 新增代理配置 ✅ 已完成 |
| `src/api/application.ts` | 新增真实接口调用方法 |
| `src/composables/useApplicationForm.ts` | 移除废弃字段，新增 buildRealPayload |
| `src/types/index.ts` | 更新 ApplicationFormData 类型 |
| `src/views/application/components/StepOneBasicInfo.vue` | 移除废弃字段展示 |
| `src/components/business/DepartmentSelector.vue` | 返回完整部门路径 |
| `src/components/business/CitySelector.vue` | 同时返回 cityId 和 cityName |

### 5.2 需要新增的文件

| 文件路径 | 说明 |
|---------|------|
| `src/utils/payloadConverter.ts` | 请求体转换工具函数 |

## 六、关键业务规则

### 6.1 部门路径格式

后端要求完整路径格式：`"华为技术/2012实验室/星光工程部/星光项目办公室"`

- DepartmentSelector 组件需支持层级选择
- 返回值需拼接完整路径

### 6.2 城市名称

后端要求中文城市名：`"深圳"`、`"西安"`、`"北京"` 等

- CitySelector 组件已返回中文城市名，可直接使用

### 6.3 区域ID（fromRegionId/toRegionId）

- 实际含义：城市-安全域的通道ID
- 当前方案：**固定值 6**
- 后续优化：根据城市+安全域动态获取

## 七、风险评估

1. **数据丢失风险**: 移除 storageSize、有效期字段后，现有功能可能受影响
2. **兼容性风险**: DepartmentSelector、CitySelector 返回结构变化需评估影响范围
3. **认证风险**: Token 传递机制需要确认

---

*更新时间: 2026-03-14*
*版本: v1.1*
