# 创建申请单接口对接设计文档

## 一、概述

将前端创建申请单功能从 Mock 数据对接到真实后端接口 `POST /workflowService/services/frontendService/frontend/application/create`。

## 二、技术方案

### 2.1 代理配置

**文件**: `vite.config.ts`

```typescript
'/workflowService': {
  target: 'http://127.0.0.1:8109',
  changeOrigin: true,
  secure: false,
},
```

**状态**: ✅ 已完成

### 2.2 请求体转换器

**新建文件**: `src/utils/payloadConverter.ts`

```typescript
/**
 * 前端表单数据 → 后端接口请求体 转换器
 */

import type { ApplicationFormData } from '@/composables/useApplicationForm'
import { useAuthStore } from '@/stores'

// 区域类型映射: green/yellow/red → "1"/"2"/"3"
const REGION_TYPE_MAP: Record<string, string> = {
  green: '1',
  yellow: '2',
  red: '3',
}

// 通知渠道映射: 应用号/W3代办/邮件 → 1/2/3
const NOTIFY_CHANNEL_MAP: Record<string, number> = {
  in_app: 1,
  w3: 2,
  email: 3,
}

/**
 * 转换通知选项为数组数字字符串
 * ['in_app', 'email'] → "[1,3]"
 */
function convertNotifyOptions(channels: string[]): string {
  const numbers = channels
    .map(ch => NOTIFY_CHANNEL_MAP[ch])
    .filter(n => n !== undefined)
  return JSON.stringify(numbers)
}

/**
 * 构建后端接口请求体
 */
export function buildCreatePayload(formData: ApplicationFormData): Record<string, any> {
  const authStore = useAuthStore()
  const user = authStore.currentUser

  // 获取当前用户W3账号
  const currentW3Account = user?.username || ''

  // 区域类型转换
  const fromRegionTypeId = REGION_TYPE_MAP[formData.sourceArea] || '1'
  const toRegionTypeId = REGION_TYPE_MAP[formData.targetArea] || '1'

  // 城市名称（中文）
  const fromCityName = formData.sourceCity[1] || formData.sourceCity[0] || ''
  const toCityName = formData.targetCity[1] || formData.targetCity[0] || ''

  return {
    appBaseApprovalRoute: {
      isCustomerData: formData.containsCustomerData === 'yes' ? 1 : 0,
      isContainLargeModel: 0,
      selectedDeptName: formData.department,  // 完整路径: "华为技术/2012实验室/星光工程部"
      defaultSecretLevels99: true,
      securityLevel: 99,
      promiseLookupVO: {},
      isMinManagerApproval: 0,
      isManagerApproval: 0,
      isManager4Approval: 0,
      isManager3Approval: 0,
      isManager2Approval: 0,
      isChiefApproval: 0,
      isInfoManagerApproval: 0,
      isManagerCopyApproval: formData.ccAccounts.length > 0 ? 1 : 0,
      isGuarantorApproval: 0,
      isCopyInfoManagerApproval: 0,
      isAbcManagerApproval: false,
      managerMinW3Account: formData.minDeptSupervisor || '',
      manager2W3Account: '',
      manager3W3Account: '',
      manager4W3Account: '',
      managerInfoW3Account: '',
      managerChiefW3Account: '',
      managerW3Account: '',
      managerCopyW3Account: formData.ccAccounts.join(','),  // 多账号逗号拼接: "zwx1444795,ywx1420846"
      guarantorW3Account: '',
      managerInfoCopyW3Account: '',
      abcManagerW3Account: '',
      userDeptId: formData.departmentId || '',
      approvalRouteId: 6,
    },
    appBaseCountryCityRegionRelation: {
      toRegionTypeId,
      fromRegionTypeId,
      fromCityId: formData.sourceCityId || 0,
      fromRegionId: 6,  // 固定值：城市-安全域通道ID
      fromCityName,     // 中文城市名: "深圳"
      toCityId: formData.targetCityId || 0,
      toRegionId: 6,    // 固定值
      toCityName,       // 中文城市名: "西安"
    },
    appBaseInfo: {
      procType: '0',    // 流程类型: 0=正常传输, 1=例行通道, 5=紧急传输
      applicantW3Account: currentW3Account,
      isHttps: 0,
      applicationId: '',
      emailNotification: false,
      externalCode: formData.srNumber || '',
      uploadNotification: convertNotifyOptions(formData.applicantNotifyOptions),
      downloadNotification: convertNotifyOptions(formData.downloaderNotifyOptions),
      kiaConfirms: 0,
      policyed: false,
      reason: formData.applyReason,
      sendNotification: null,
    },
    appBaseUploadDownloadInfo: {
      uploadMode: 0,    // 上传模式: 0=WEB, 1=FTP
      downloadMode: 0,  // 下载模式: 0=WEB, 1=FTP
      downloadW3Account: formData.downloaderAccounts.join(','),  // 多账号逗号拼接: "zwx1444795,ywx1420846"
    },
    appBpmWorkFlow: {
      currentHandler: currentW3Account,
    },
    appBaseExternalInfo: {
      applicationType: 0,
      abc: false,
    },
    appTransInfo: {
      transferMode: 0,
    },
    appCustomerNetworkFiles: null,
    edsInfo: {},
  }
}
```

### 2.3 API 层修改

**文件**: `src/api/application.ts`

```typescript
// 新增真实接口调用方法
createReal(payload: Record<string, any>): Promise<any> {
  return request.post<any>(
    '/workflowService/services/frontendService/frontend/application/create',
    payload
  )
},
```

### 2.4 表单数据结构调整

**文件**: `src/composables/useApplicationForm.ts`

**移除字段**:
- `storageSize`
- `uploadExpireTime`
- `downloadExpireTime`
- `customerAuthFile`

**新增字段**:
- `departmentId` (部门ID)
- `sourceCityId` (源城市ID)
- `targetCityId` (目标城市ID)

### 2.5 组件修改

#### DepartmentSelector.vue

**当前**: 返回 `string` (部门名称)
**修改为**: 返回完整路径格式 + 部门ID

```typescript
interface DepartmentValue {
  deptId: string
  deptName: string  // 完整路径: "华为技术/2012实验室/星光工程部/星光项目办公室"
}

emit('change', { 
  deptId: selectedDept.id, 
  deptName: fullDeptPath  // 拼接完整路径
})
```

#### CitySelector.vue

**当前**: 返回 `string[]` (省份、城市名称)
**修改为**: 返回城市ID + 中文名

```typescript
interface CityValue {
  province: string
  city: string      // 中文名: "深圳"
  cityId: number
}

emit('change', { province, city, cityId })
```

#### StepOneBasicInfo.vue

**移除字段展示**:
- 存储空间大小
- 上传有效期
- 下载有效期

## 三、枚举值定义

### 3.1 流程类型（procType）

| 值 | 含义 | 使用场景 |
|----|------|---------|
| `"0"` | 正常传输 | 默认，普通申请单 |
| `"1"` | 例行通道 | 例行传输场景 |
| `"5"` | 紧急传输 | 紧急加急场景 |

### 3.2 上传/下载模式（uploadMode/downloadMode）

| 值 | 含义 | 说明 |
|----|------|------|
| `0` | WEB | 默认，浏览器上传/下载 |
| `1` | FTP | 后续支持 FTP 方式 |

### 3.3 区域类型（RegionTypeId）

| 前端值 | 后端值 | 含义 |
|--------|--------|------|
| `green` | `"1"` | 绿区 |
| `yellow` | `"2"` | 黄区 |
| `red` | `"3"` | 红区 |

### 3.4 通知渠道（Notification）

| 前端值 | 后端值 | 含义 |
|--------|--------|------|
| `in_app` | `1` | 应用号 |
| `w3` | `2` | W3代办 |
| `email` | `3` | 邮件 |

## 四、执行步骤

### 阶段一: 基础设施
- [x] 1. vite.config.ts 代理配置
- [ ] 2. 创建 payloadConverter.ts 转换器

### 阶段二: API 层
- [ ] 3. 修改 api/application.ts 新增 createReal 方法

### 阶段三: 数据层
- [ ] 4. 修改 types/index.ts 更新类型定义
- [ ] 5. 修改 useApplicationForm.ts 移除废弃字段、更新 buildPayload

### 阶段四: 组件层
- [ ] 6. 修改 DepartmentSelector.vue 返回完整路径 + ID
- [ ] 7. 修改 CitySelector.vue 返回城市ID + 中文名
- [ ] 8. 修改 StepOneBasicInfo.vue 移除废弃字段展示

### 阶段五: 集成测试
- [ ] 9. 验证完整创建流程
- [ ] 10. 处理接口返回数据

## 五、注意事项

### 5.1 部门路径格式
后端要求完整路径格式，如：`"华为技术/2012实验室/星光工程部/星光项目办公室"`
- DepartmentSelector 需拼接层级路径

### 5.2 城市名称
后端要求中文城市名，如：`"深圳"`、`"西安"`
- CitySelector 已返回中文，可直接使用

### 5.3 区域ID
`fromRegionId` / `toRegionId` 含义为"城市-安全域通道ID"
- 当前方案：固定值 `6`
- 后续优化：根据选中城市+安全域动态获取

### 5.4 Token 传递
需确认后端如何获取 Token，可能需要在 request.ts 中添加拦截器

## 六、后续优化

1. **审批路由ID** (approvalRouteId) 应根据传输类型动态获取
2. **区域ID** (regionId) 应根据城市+安全域动态获取
3. **上传/下载模式** 页面增加选项支持 FTP
4. **流程类型** 根据业务场景动态设置

---

*设计版本: v1.1*
*更新时间: 2026-03-14*
