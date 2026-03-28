# 任务执行记录：申请单流程进展组件

## 任务概述
在申请单详情页面添加流程进展组件，展示申请单的流程进度，并修改状态展示为后端返回的 applicationStatus。

## 执行步骤

- [x] 1. 添加 getProcessDetails API 接口和类型定义
- [x] 2. 创建 ProcessTimeline.vue 流程进展组件
- [x] 3. 修改 useApplicationDetail.ts 添加流程进展数据获取
- [x] 4. 修改 ApplicationDetailView.vue 展示流程进展和 applicationStatus
- [x] 5. 更新样式文件

## 详细实现

### 1. API 接口定义 (`src/api/application.ts`)

**新增类型：**
```typescript
// 流程进展步骤
export interface ProcessStepItem {
  status: string | null
  createdBy: string | null
  creationDate: string
  lastUpdatedBy: string | null
  lastUpdateDate: string | null
  applicationId: number
  isCross: string | null
  applicationStatus: number
  statusName: string
  usedTime: number // 秒
  totalTime: string // 如 "16:58:08"
}

// 流程进展响应
export interface ProcessDetailsResponse {
  applicationId: number
  taskStatus: string // 如 "用户关闭"
  applicationStatus: string // 如 "流程结束"
  applicationStatusId: number
  viewData: any | null
  nodeInfos: any | null
  listSteps: ProcessStepItem[]
}
```

**新增接口：**
```typescript
getProcessDetails(applicationId: number | string): Promise<ProcessDetailsResponse>
```
- 请求方式：GET
- 请求路径：`/workflowService/services/frontendService/frontend/application/getProcessDetails`
- 参数：`applicationId`

### 2. ProcessTimeline 组件 (`src/components/business/ProcessTimeline.vue`)

**Props：**
- `applicationId: string | number` - 申请单ID

**功能特性：**
- 自动调用 API 获取流程数据
- 按时间排序展示步骤列表
- 步骤状态判断：
  - `completed`：有 lastUpdateDate，显示绿色"已完成"标签
  - `in-progress`：最后一个步骤且无 lastUpdateDate，显示蓝色"进行中"标签
  - `pending`：其他情况，显示灰色
- 用时格式化：秒 -> "X分X秒" 或 "X小时X分"
- 样式参考 ApprovalTimeline 组件

### 3. useApplicationDetail composable 修改

**新增：**
- `processDetailData` ref 存储 ProcessDetailsResponse
- `fetchProcessDetail()` 方法获取流程数据
- `fetchDetail()` 中自动调用 `fetchProcessDetail()`

### 4. ApplicationDetailView.vue 修改

**修改点：**
1. 导入 ProcessTimeline 组件
2. 从 composable 解构 `processDetailData`
3. 修改 `currentStatus` 计算属性使用 `processDetailData.applicationStatus`
4. 模板中 status-tag 改用 `currentStatus`（原为 `currentHandler`）
5. 在详情卡片下方添加流程进展区块

### 5. 样式更新 (`application-detail.scss`)

新增 `.process-card` 样式：
```scss
.process-card {
  min-height: auto;
  margin-top: 20px;

  &__title {
    margin: 0 0 16px;
    color: #1e293b;
    font-size: 16px;
    font-weight: 600;
  }
}
```

## 后端接口响应示例

```json
{
  "applicationId": 802426313,
  "taskStatus": "用户关闭",
  "applicationStatus": "流程结束",
  "applicationStatusId": 85,
  "listSteps": [
    {
      "creationDate": "2026-03-26 21:09:03",
      "applicationStatus": 0,
      "statusName": "创建申请单",
      "usedTime": 1
    },
    {
      "creationDate": "2026-03-26 21:09:06",
      "applicationStatus": 1,
      "statusName": "文件上传",
      "usedTime": 8
    }
    // ...
  ]
}
```

## 验收结果

- [x] API 接口类型定义完整
- [x] ProcessTimeline 组件正确展示流程步骤
- [x] 申请单详情页正确展示 applicationStatus
- [x] 移除原有的 currentHandler 展示
- [x] 样式与现有 ApprovalTimeline 一致
- [x] 无 TypeScript 类型错误
- [x] 无 ESLint 错误

## 产出文件清单

| 文件路径 | 操作类型 |
|---------|---------|
| `src/api/application.ts` | 修改 |
| `src/components/business/ProcessTimeline.vue` | 新增 |
| `src/composables/useApplicationDetail.ts` | 修改 |
| `src/views/application/ApplicationDetailView.vue` | 修改 |
| `src/views/application/application-detail.scss` | 修改 |
