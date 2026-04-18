# 资产检测模块 QuickStart

> 本文档面向**开发人员**和 **QA 测试人员**，涵盖资产检测确认功能的架构、数据流、开发指南及回归测试用例。

---

## 1. 架构总览

```
┌──────────────────────────────────────────────────────────────┐
│                       View 层                                │
│  ApprovalDetailView.vue (审批详情页)                          │
│    ├── 组合 useApprovalDetail + useAssetDetection             │
│    ├── 合并 canOperate（审批权限 ∧ 资产确认状态）               │
│    ├── 自动切换到 detection Tab（有未确认结果时）               │
│    └── AssetDetectionTab ← 透传数据/事件桥接                  │
├──────────────────────────────────────────────────────────────┤
│                    Component 层                              │
│  AssetDetectionTab.vue (资产检测Tab，纯展示+事件发射)          │
│    ├── 统计概览（总数/总大小/分类统计）                         │
│    ├── 子Tab切换（文件列表 / 关键资产）                        │
│    ├── AssetFilterBar (文件类型+文件名筛选)                    │
│    ├── 文件列表表格 (分页、逐条确认)                           │
│    ├── 关键资产表格 (无分页、逐条确认)                         │
│    └── 确认提示条 (warning/info/success)                      │
├──────────────────────────────────────────────────────────────┤
│                   Composable 层                              │
│  useAssetDetection.ts (核心状态管理+业务逻辑)                  │
│    ├── 数据加载：统计/文件列表/关键资产列表/密级枚举             │
│    ├── 两级确认：文件确认 → 关键资产确认（串行）                │
│    ├── 确认方式：逐条 / 当前页 / 全部                         │
│    └── canOperate 计算属性 → 控制审批按钮是否可用               │
├──────────────────────────────────────────────────────────────┤
│                      API 层                                  │
│  assetDetection.ts                                           │
│    ├── getKiaResultCount   → 检测结果统计                     │
│    ├── getKiaResultList    → 分页查询所有检测文件              │
│    ├── getKiaResultKeyList → 查询关键资产(fileType=4)         │
│    └── getSecretLevelList  → 密级枚举                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. 核心类型定义

> 文件位置：`src/types/assetDetection.ts`

| 类型 | 用途 | 关键字段 |
|------|------|----------|
| `KiaResultCountResponse` | 统计响应 | `count`（总数）, `fileSizeSum`（总大小）, `result[]`（分类统计） |
| `KiaFileItem` | 检测文件项 | `fileName`, `fileType`, `secretLevel`, `fileSizeUnit`, `unzipLevel`, `filePath` |
| `KiaKeyFileItem` | 关键资产项 | 同 `KiaFileItem`（fileType=4 的子集） |
| `KiaResultListRequest` | 分页查询请求 | `applicationId`, `pageNum`, `pageSize`, `fileType?`, `fileTypes?`, `fileName?` |
| `KiaResultListResponse` | 分页查询响应 | `result[]`（文件列表）, `pageVO`（分页信息） |
| `SecretLevelItem` | 密级枚举项 | `value`（编码）, `label`（展示名） |

---

## 3. 核心业务流程

### 3.1 数据初始化

```
页面挂载 → fetchDetail(id)
         ↓
watch(detailData.appBaseInfo.applicationId) → initAssetDetection(applicationId)
         ↓
  ┌────────────────────────────────────────────────┐
  │ 1. 重置所有状态（确认Set、分页、筛选等）          │
  │ 2. fetchKiaCount → 统计数据(countData)          │
  │ 3. count > 0 时并行:                            │
  │    ├── fetchKiaResultList → 文件列表(fileList)   │
  │    └── fetchKiaKeyList → 关键资产(keyFileList)   │
  └────────────────────────────────────────────────┘
```

### 3.2 两级串行确认流程

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────┐
│ 第一级：确认文件    │ ──→ │ 第二级：确认关键资产 │ ──→ │ 可以操作  │
│ (全部检测文件)      │     │ (fileType=4)      │     │ (通过按钮)│
└──────────────────┘     └──────────────────┘     └──────────┘
```

**确认方式**：

| 操作 | 方法 | 说明 |
|------|------|------|
| 逐条确认文件 | `confirmFile(fileName)` | 将文件名加入 `confirmedFiles` Set |
| 逐条取消确认 | `unconfirmFile(fileName)` | 从 Set 中移除 |
| 确认当前页 | `confirmAllCurrentPageFiles()` | 遍历当前页数据加入 Set |
| 确认全部文件 | `confirmAllFiles()` | 设置 `fileConfirmationCompleted = true` + 当前页加入 Set |
| 逐条确认关键资产 | `confirmKeyAsset(fileName)` | 加入 `confirmedKeyAssets` Set |
| 确认所有关键资产 | `confirmAllKeyAssets()` | 遍历 keyFileList 全部加入 Set |

### 3.3 关键计算属性

| 属性 | 逻辑 | 影响 |
|------|------|------|
| `hasDetectionResult` | `countData.count > 0` | 控制 detection Tab 是否显示 |
| `hasKeyAssets` | `keyFileList.length > 0` | 控制子Tab和关键资产确认区域 |
| `allFilesConfirmed` | `fileConfirmationCompleted` ∨ `confirmedFiles.size >= total` | 文件确认阶段是否完成 |
| `allKeyAssetsConfirmed` | 无关键资产时为 true，否则 keyFileList 每条都在 Set 中 | 关键资产确认是否完成 |
| `canOperate` | 无结果→true；未全确认→false；全确认→true | 控制"通过"按钮是否置灰 |

### 3.4 页面层合并逻辑（ApprovalDetailView）

```js
// 审批按钮是否可用 = 基础审批权限 ∧ 资产确认状态
const canOperate = computed(() => canOperateBase.value && canOperateAsset.value)

// 自动切换Tab：有检测结果且未全部确认时
watch([hasDetectionResult, canOperateAsset], ([hasResult, canOperate]) => {
  if (hasResult && !canOperate && canOperateBase.value) {
    activeTab.value = 'detection'
  }
})
```

---

## 4. 组件通信方式

### 4.1 Props（父 → 子）

```html
<AssetDetectionTab
  :application-id="..."
  :count-data="countData"
  :file-list="processedFileList"
  :key-file-list="processedKeyFileList"
  :category-stats="categoryStats"
  :loading="assetLoading"
  :pagination="assetPagination"
  :require-confirmation="canOperateBase"
  :all-files-confirmed="allFilesConfirmed"
  :confirmed-file-count="confirmedFileCount"
  :all-key-assets-confirmed="allKeyAssetsConfirmed"
  :has-key-assets="hasKeyAssets"
  :file-confirmation-completed="fileConfirmationCompleted"
/>
```

### 4.2 Emits（子 → 父）

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `confirm-file` | `(fileName, confirmed)` | 逐条确认/取消文件 |
| `confirm-key-asset` | `(fileName, confirmed)` | 逐条确认/取消关键资产 |
| `confirm-current-page` | 无 | 确认当前页所有文件 |
| `confirm-all-files` | 无 | 一次性确认全部文件 |
| `confirm-all-key-assets` | 无 | 确认所有关键资产 |
| `filter-change` | `{fileType?, fileName?}` | 筛选条件变化 |
| `page-change` | `(page)` | 分页变化 |
| `page-size-change` | `(size)` | 每页数量变化 |

### 4.3 事件桥接（ApprovalDetailView → composable）

| 模板事件 | 页面 handler | composable 方法 |
|----------|-------------|-----------------|
| `@confirm-file` | `handleConfirmFile(name, bool)` | `confirmFile` / `unconfirmFile` |
| `@confirm-key-asset` | `handleConfirmKeyAsset(name, bool)` | `confirmKeyAsset` / `unconfirmKeyAsset` |
| `@confirm-current-page` | 直接绑定 | `confirmAllCurrentPageFiles` |
| `@confirm-all-files` | 直接绑定 | `confirmAllFiles` |
| `@confirm-all-key-assets` | 直接绑定 | `confirmAllKeyAssets` |
| `@filter-change` | `handleFilterChange(filters)` | `updateFilters(appId, filters)` |
| `@page-change` | `handleAssetPageChange(page)` | `changePage(appId, page)` |
| `@page-size-change` | `handleAssetPageSizeChange(size)` | `changePageSize(appId, size)` |

> 注意：筛选、分页类事件需要 `applicationId` 参数，由页面 handler 从 `detailData` 中获取后传入 composable。

---

## 5. 筛选与分页规则

- **文件类型筛选**：有具体 `fileType` 时传 `fileType` 参数，无则传 `fileTypes`（全部 key 数组）
- **文件名搜索**：`fileName` 参数，模糊匹配
- **分页**：仅文件列表分页（默认 pageSize=10），关键资产列表不分页
- **密级枚举**：首次查询文件列表时自动加载，构建 `secretLevelMap` 用于展示

---

## 6. 开发指南

### 6.1 新增使用场景

若需在其他页面使用资产检测功能：

```vue
<script setup lang="ts">
import { useAssetDetection } from '@/composables/useAssetDetection'

const {
  countLoading, listLoading, countData,
  processedFileList, processedKeyFileList, categoryStats,
  pagination, hasKeyAssets, hasDetectionResult,
  allFilesConfirmed, confirmedFileCount, allKeyAssetsConfirmed,
  canOperate, fileConfirmationCompleted,
  initAssetDetection, confirmFile, unconfirmFile,
  confirmKeyAsset, unconfirmKeyAsset,
  confirmAllCurrentPageFiles, confirmAllFiles, confirmAllKeyAssets,
  updateFilters, changePage, changePageSize,
} = useAssetDetection()

// 在适当时机初始化
initAssetDetection(applicationId)
</script>
```

### 6.2 注意事项

1. **`ref(new Set())` 响应式**：Vue 3 的 `ref` 对 Set 的 `add/delete` 可以触发响应式更新，但如需整个替换 Set，应赋值新实例（`confirmedFiles.value = new Set([...])`），不要在原 Set 上 `.clear()` + `.add()`
2. **确认全部文件的特殊性**：`confirmAllFiles()` 通过 `fileConfirmationCompleted = true` 实现，不需要真的遍历所有分页数据。这影响 `allFilesConfirmed`、`processedFileList` 的 confirmed 字段、以及操作栏的显隐
3. **自动切换 Tab**：watch 会在有未确认结果时自动切到 detection Tab，确认完成后不再强制切回
4. **`requireConfirmation` prop**：控制是否显示确认操作列和操作按钮栏，审批详情传 `canOperateBase`，查看场景传 `false`

---

## 7. QA 回归测试用例

### 7.1 数据加载

| # | 步骤 | 预期结果 |
|---|------|----------|
| 1 | 进入有检测结果的审批详情页 | 自动切换到"资产检测结果"Tab，显示统计概览 |
| 2 | 进入无检测结果的审批详情页 | 不显示"资产检测结果"Tab |
| 3 | 刷新页面 | 数据重新加载，确认状态重置 |

### 7.2 文件确认

| # | 步骤 | 预期结果 |
|---|------|----------|
| 4 | 点击某文件的"确认"按钮 | 按钮变为"已确认"（绿色 outline），行样式变化 |
| 5 | 点击已确认文件的"已确认"按钮 | 取消确认，按钮恢复为"确认"（蓝色 primary） |
| 6 | 点击"确认当前页" | 当前页所有文件变为已确认状态 |
| 7 | 点击"确认全部文件" | 所有文件标记为已确认，提示变为"所有文件已确认"；若有关键资产，自动切换到关键资产子Tab |
| 8 | 未确认完所有文件时 | "通过"按钮置灰，确认提示显示"未确认 N 项" |

### 7.3 关键资产确认

| # | 步骤 | 预期结果 |
|---|------|----------|
| 9 | 文件确认完成后，存在关键资产 | 出现子Tab（文件列表/关键资产），提示"请继续确认关键资产" |
| 10 | 逐条确认关键资产 | 按钮状态切换，同文件确认 |
| 11 | 点击"确认所有关键资产" | 所有关键资产标记为已确认 |
| 12 | 无关键资产的申请单 | 不显示关键资产子Tab，文件确认完即可操作 |

### 7.4 完整确认流程

| # | 步骤 | 预期结果 |
|---|------|----------|
| 13 | 无检测结果时 | "通过"按钮可用 |
| 14 | 有检测结果，未确认完文件 | "通过"按钮置灰 |
| 15 | 有检测结果，文件确认完但关键资产未确认 | "通过"按钮置灰 |
| 16 | 有检测结果，文件和关键资产均确认完 | "通过"按钮可用，提示"可进行操作" |

### 7.5 筛选与分页

| # | 步骤 | 预期结果 |
|---|------|----------|
| 17 | 选择文件类型筛选 | 列表按类型过滤，分页重置到第1页 |
| 18 | 输入文件名搜索 | 列表按关键字过滤 |
| 19 | 切换分页页码 | 列表翻页，确认状态保持（逐条确认的跨页保留） |
| 20 | 切换每页数量 | 列表重新加载，分页重置到第1页 |

### 7.6 密级显示

| # | 步骤 | 预期结果 |
|---|------|----------|
| 21 | 查看文件列表密级列 | 显示密级中文名称（如"秘密"、"机密"等），非数字编码 |

---

## 8. 文件清单

| 文件路径 | 说明 |
|----------|------|
| `src/composables/useAssetDetection.ts` | 核心状态管理与业务逻辑 |
| `src/components/business/AssetDetectionTab.vue` | 资产检测Tab展示组件 |
| `src/components/business/AssetFilterBar.vue` | 筛选栏子组件 |
| `src/views/approvals/ApprovalDetailView.vue` | 审批详情页（消费方） |
| `src/api/assetDetection.ts` | API 接口封装 |
| `src/types/assetDetection.ts` | 类型定义 |
| `src/constants/fileType.ts` | 文件类型枚举与映射 |
| `src/styles/asset-detection.scss` | 资产检测样式 |
