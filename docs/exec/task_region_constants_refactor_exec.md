# 区域常量统一重构 - 执行记录

## 任务概述

将散落在各处的区域映射代码统一到 `src/constants/` 目录，解决霰弹式修改问题，同时修复 SelectType 跳转时参数传递问题。

## 执行步骤

- [x] 1. 创建 `src/constants/region.ts` 统一常量文件
- [x] 2. 创建 `src/constants/transferType.ts` 传输类型常量文件
- [x] 3. 创建 `src/constants/index.ts` 统一导出
- [x] 4. 重构 `useApplicationForm.ts` 使用统一常量
- [x] 5. 重构 `useTransferConfig.ts` 使用统一常量
- [x] 6. 重构 `views/application/components/constants.ts` 使用统一常量
- [x] 7. 重构 `payloadConverter.ts` 使用统一常量
- [x] 8. 重构 `ApprovalListView.vue` 使用统一常量
- [x] 9. 重构 `TransferManageView.vue` 使用统一常量
- [x] 10. 修复 SelectType 跳转参数传递问题
- [x] 11. 更新 `Application` 类型定义，添加 `SecurityArea`

## 产出文件清单

| 文件 | 操作 |
|------|------|
| `src/constants/region.ts` | 新增 |
| `src/constants/transferType.ts` | 新增 |
| `src/constants/index.ts` | 新增 |
| `src/types/application.ts` | 修改 - 添加 SecurityArea 类型 |
| `src/composables/useApplicationForm.ts` | 修改 - 使用统一常量 |
| `src/composables/useTransferConfig.ts` | 修改 - 使用统一常量 |
| `src/views/application/components/constants.ts` | 修改 - 从统一常量重新导出 |
| `src/utils/payloadConverter.ts` | 修改 - 使用 areaToId 函数 |
| `src/views/approvals/ApprovalListView.vue` | 修改 - 使用统一常量 |
| `src/views/transfer/TransferManageView.vue` | 修改 - 使用统一常量 |
| `src/views/application/SelectTypeView.vue` | 修改 - 跳转携带 from/to 参数 |
| `src/views/application/CreateApplicationView.vue` | 修改 - 接收 from/to 参数 |

---

## QuickStart - 如何使用统一常量

### 1. 导入方式

```typescript
// 方式一：从 constants 目录导入（推荐）
import { 
  SecurityArea,           // 类型
  AREA_ID_MAP,            // 区域名 → ID 映射
  ID_TO_AREA,             // ID → 区域名映射
  AREA_LABEL_MAP,         // 区域名 → 中文标签
  AREA_OPTIONS,           // 下拉选项数组
  areaToId,               // 工具函数
  idToArea,
  parseAreaFromAttr,
} from '@/constants'

// 方式二：从旧位置导入（向后兼容，会重导出）
import { AREA_OPTIONS } from '@/views/application/components/constants'
```

### 2. 常用场景

#### 2.1 区域下拉选项

```vue
<template>
  <a-select v-model="formData.sourceArea" :options="AREA_OPTIONS" />
</template>

<script setup>
import { AREA_OPTIONS } from '@/constants'
</script>
```

#### 2.2 后端 ID 转 前端区域名

```typescript
import { ID_TO_AREA, idToArea } from '@/constants'

// 方式一：直接查表
const area = ID_TO_AREA[regionTypeId] || 'green'

// 方式二：使用工具函数
const area = idToArea(regionTypeId)  // 默认返回 'green'
```

#### 2.3 前端区域名转后端 ID

```typescript
import { AREA_ID_MAP, areaToId } from '@/constants'

// 方式一：直接查表
const id = AREA_ID_MAP[sourceArea]

// 方式二：使用工具函数
const id = areaToId('green')  // 返回 1
```

#### 2.4 解析 itemAttr1 中的区域

```typescript
import { parseAreaFromAttr } from '@/constants'

const itemAttr1 = "Create.aspx?action=create&hm=2&wfid=43&transType=0&fromAreaID=0&ToAreaID=15"

const fromZone = parseAreaFromAttr(itemAttr1, 'from')  // 'yellow'
const toZone = parseAreaFromAttr(itemAttr1, 'to')      // 'green'
```

#### 2.5 获取区域中文标签

```typescript
import { AREA_LABEL_MAP, areaIdToLabel } from '@/constants'

// 方式一：通过区域名
const label = AREA_LABEL_MAP['green']  // '绿区'

// 方式二：通过后端 ID
const label = areaIdToLabel(1)  // '绿区'
```

### 3. 传输类型常量

```typescript
import { 
  TRANSFER_TYPE_LABEL_MAP,        // 类型 → 中文标签
  TRANSFER_TYPE_OPTIONS,          // 下拉选项（不含"全部"）
  TRANSFER_TYPE_OPTIONS_WITH_ALL, // 下拉选项（含"全部"）
  getTransferTypeLabel,           // 工具函数
  isValidTransferType,
} from '@/constants'

// 使用示例
const label = getTransferTypeLabel('green-to-green')  // '绿区传到绿区'
const isValid = isValidTransferType('unknown-type')   // false
```

### 4. 创建申请单时区域参数传递

```typescript
// SelectTypeView.vue - 跳转时携带区域参数
router.push({
  path: '/application/create',
  query: {
    type: item.key,
    from: item.fromZone,  // 已解析好的区域
    to: item.toZone,
  },
})

// CreateApplicationView.vue - 接收参数
const fromZone = route.query.from as string | undefined
const toZone = route.query.to as string | undefined
useApplicationForm(typeFromQuery, fromZone, toZone)
```

---

## 映射关系速查

### 区域 ID 映射表

| 后端 ID | 英文名 | 中文标签 |
|---------|--------|----------|
| 1 | green | 绿区 |
| 0 | yellow | 黄区 |
| 4 | red | 红区 |
| 2 | external | 外网 |

### 传输类型映射表

| 传输类型 | 中文标签 |
|----------|----------|
| green-to-green | 绿区传到绿区 |
| green-to-yellow | 绿区传到黄区 |
| green-to-red | 绿区传到红区 |
| yellow-to-yellow | 黄区传到黄区 |
| yellow-to-red | 黄区传到红区 |
| red-to-red | 红区传到红区 |
| cross-country | 跨国传输 |

---

## 验收结果

- [x] 所有文件 lint 检查通过
- [x] 统一常量文件可正常导入使用
- [x] SelectType 跳转正确携带 from/to 参数
- [x] CreateApplicationView 正确接收并使用参数
- [x] 向后兼容：旧导入路径仍然可用

## 注意事项

1. **新增区域**：只需修改 `src/constants/region.ts` 文件
2. **新增传输类型**：只需修改 `src/constants/transferType.ts` 文件
3. **向后兼容**：`views/application/components/constants.ts` 已从统一常量重新导出，旧代码无需修改
4. **类型安全**：`SecurityArea` 类型已导出，可用于类型注解
