# 资产检测结果模块开发任务

## 需求概述

为"申请单详情"和"审批单详情"两个页面增加"资产检测结果"展示模块。

### 核心需求

#### 1. 资产检测结果展示
- **展示位置**：独立卡片，放在"申请单信息"和"流程进展"之间
- **展示条件**：接口1的 `count > 0` 时才展示
- **展示形态**：统计卡片 + 折叠的表格列表
  - 统计信息：关键资产数量、总大小
  - 可展开查看详细列表（文件名、文件类型、密级）

#### 2. 数据接口
- **接口1 - 统计查询**：`POST /workflowService/services/frontendService/frontend/kiaResult/findKiaResultCount`
- **接口2 - 列表查询**：`POST /workflowService/services/frontendService/frontend/kiaResult/findKiaResultKeyList`
- **密级枚举查询**：`GET /commonService/services/jalor/lookup/itemquery/listbycodes/KIA_TOOLS_SECURITY_LEVERL/{lang}`

#### 3. 审批详情特殊逻辑
- KeyList 表格每一行需要审批人点击确认
- 全部确认完毕后，审批按钮（通过/驳回/免审）才可点击

#### 4. 申请详情按钮状态控制
- "继续上传文件"按钮只在 `applicationStatus` 为：
  - 创建申请单（状态值待确认）
  - 文件上传（状态值待确认）
- 其他状态不展示该按钮
- 驳回后（状态为"创建申请单"）按钮置灰

---

## 任务分解

### 阶段1：类型定义与常量
- [ ] 1.1 创建 fileType 枚举映射文件 `src/constants/fileType.ts`
- [ ] 1.2 创建资产检测相关类型定义 `src/types/assetDetection.ts`

### 阶段2：API 层开发
- [ ] 2.1 创建资产检测 API 文件 `src/api/assetDetection.ts`
  - 查询关键资产统计接口
  - 查询关键资产列表接口
- [ ] 2.2 创建密级查询 API（集成到现有 lookup 或独立）
- [ ] 2.3 在 `src/api/index.ts` 中导出

### 阶段3：Composable 开发
- [ ] 3.1 创建 `src/composables/useAssetDetection.ts`
  - 封装统计查询逻辑
  - 封装列表查询逻辑
  - 封装密级枚举查询逻辑
  - 提供计算属性和状态管理

### 阶段4：组件开发
- [ ] 4.1 创建统计卡片组件 `src/components/business/AssetDetectionCard.vue`
- [ ] 4.2 创建关键资产列表表格组件 `src/components/business/AssetKeyFileTable.vue`
- [ ] 4.3 创建资产检测结果整体组件 `src/components/business/AssetDetectionResult.vue`
- [ ] 4.4 创建组件样式文件（独立的 .scss 文件）

### 阶段5：确认逻辑开发
- [ ] 5.1 在 `useApprovalDetail.ts` 中添加确认状态管理
- [ ] 5.2 实现全部确认后才能操作审批按钮的逻辑

### 阶段6：页面集成
- [ ] 6.1 修改 `ApplicationDetailView.vue` - 集成资产检测组件
- [ ] 6.2 修改 `ApprovalDetailView.vue` - 集成资产检测组件 + 确认逻辑
- [ ] 6.3 修改按钮展示逻辑（继续上传文件按钮）

### 阶段7：样式优化与测试
- [ ] 7.1 样式打磨，确保与现有页面风格一致
- [ ] 7.2 两个页面功能测试
- [ ] 7.3 边界情况测试（无数据、加载失败等）

---

## fileType 枚举映射

```typescript
const FILE_TYPE_MAP: Record<number, string> = {
  0: '检测通过',
  51: '设计文档关键字或者黑名单后缀',
  4: '关键资产',
  8: '压缩包解压失败，有原因',
  5: '源码',
  1: '真实后缀被修改过',
  57: '特种文件',
  3: '压缩包加密',
  15: '压缩包解压失败,原因未知',
  18: '检测失败',
  62: '华为源码',
  19: '断裂代码',
  66: '代码文件后缀',
  67: '疑似夹带',
  22: '员工个人照片',
  23: '不允许外出资产',
  24: '外非资产',
}
```

---

## applicationStatus 状态映射（参考）

根据现有代码：
```typescript
const STATUS_MAP = {
  0: '草稿',
  1: '待上传',
  2: '待审批',
  3: '已批准',
  4: '已驳回',
  5: '传输中',
  6: '已完成',
}
```

"继续上传文件"按钮展示状态：
- 状态 0（草稿）- 可能是"创建申请单"
- 状态 1（待上传）- 可能是"文件上传"

---

## 执行进度

### 开始时间
2026-04-02 17:30

### 完成时间
2026-04-02 17:50

### 当前进度
- [√] 任务启动，文档创建完成
- [√] 创建 fileType 枚举映射和类型定义
- [√] 创建资产检测 API 接口
- [√] 创建 useAssetDetection composable
- [√] 创建资产检测相关组件
- [√] 实现审批确认逻辑
- [√] 集成到两个详情页面
- [√] 修改按钮展示逻辑
- [√] 样式优化与测试

---

## 产出文件清单

### 新增文件
| 文件路径 | 说明 |
|---------|------|
| `src/constants/fileType.ts` | fileType 枚举映射 |
| `src/types/assetDetection.ts` | 资产检测类型定义 |
| `src/api/assetDetection.ts` | 资产检测 API |
| `src/composables/useAssetDetection.ts` | 资产检测 composable |
| `src/components/business/AssetDetectionResult.vue` | 资产检测结果组件 |
| `src/components/business/asset-detection.scss` | 资产检测样式文件 |
| `CHANGELOG.md` | 变更日志 |

### 修改文件
| 文件路径 | 修改内容 |
|---------|---------|
| `src/api/index.ts` | 导出 assetDetection API |
| `src/composables/useApprovalDetail.ts` | 添加资产确认状态管理 |
| `src/views/application/ApplicationDetailView.vue` | 集成资产检测、修改按钮逻辑 |
| `src/views/approvals/ApprovalDetailView.vue` | 集成资产检测、添加确认逻辑 |

---

## 验收要点

### 申请单详情
1. [ ] 资产检测结果模块作为独立卡片展示
2. [ ] 仅当 `count > 0` 时显示资产检测模块
3. [ ] "继续上传文件"按钮仅在"创建申请单"和"文件上传"状态展示
4. [ ] 驳回后按钮置灰

### 审批单详情
1. [ ] 资产检测结果模块作为独立卡片展示
2. [ ] 关键资产列表可逐条确认
3. [ ] 全部确认后审批按钮才可点击
4. [ ] 未全部确认时显示提示信息
