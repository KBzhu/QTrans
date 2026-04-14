# SelectType 传输类型选择组件 - 业务逻辑分析

> 临时文档：整理 SelectType 组件和区域定义的完整业务逻辑

## 1. 整体架构

### 1.1 核心组件关系

```
┌─────────────────────────────────────────────────────────────────┐
│                        SelectTypeView.vue                        │
│  - 传输类型选择页面                                              │
│  - 显示 Tab 栏 + 卡片网格                                        │
│  - 点击卡片跳转到申请页面                                        │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    useTransferConfig.ts                          │
│  - 调用后端接口获取配置                                          │
│  - 数据转换（后端 → UI 格式）                                    │
└─────────────────────────────────────────────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌─────────────────────────────────────────────────────┐
│uiConfig │ │                     constants/                       │
│   .ts   │ │   - region.ts: 区域常量定义、ID映射、解析函数         │
│  API    │ │   - icons.ts: 图标路径配置、区域-图标映射             │
└─────────┘ └─────────────────────────────────────────────────────┘
```

### 1.2 数据流向

```
后端接口返回原始数据
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  transmission_scenario (Tab 配置)                            │
│  transmission_scenario_child_item (卡片配置)                  │
│                                                             │
│  - itemAttr1: 包含 URL 参数，如:                             │
│    "Create.aspx?action=create&fromAreaID=0&ToAreaID=15"    │
│  - itemCode: 传输类型编码                                     │
│  - itemName: 显示名称                                        │
│  - parentItem.itemCode: 所属 Tab 组                          │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  useTransferConfig.ts 解析转换                               │
│                                                             │
│  parseAreaFromAttr(itemAttr1, 'from') → 'green'            │
│  parseAreaFromAttr(itemAttr1, 'to')   → 'yellow'           │
│  getTransferIcons('green', 'yellow') → 图标路径             │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  SelectTypeView.vue 渲染                                     │
│                                                             │
│  <Tab> 切换过滤                      <Card> 显示            │
│  ┌─────────┐                        ┌─────────────┐         │
│  │ 绿区传出 │                        │ [绿]→[黄]  │         │
│  │ 黄区传出 │  ──── filteredTypes ──→ │ 卡片标题   │         │
│  │ 例行申请 │                        │ 卡片描述   │         │
│  └─────────┘                        └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  跳转到 /application/create                                  │
│  query: { type, from, to }                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 区域系统 (Region)

### 2.1 区域类型定义

```typescript
// src/constants/region.ts
type SecurityArea = 'green' | 'yellow' | 'red' | 'external'
```

**区域枚举**：
| 英文名 | 中文标签 | 后端 ID |
|--------|----------|---------|
| green | 绿区 | 1 |
| yellow | 黄区 | 0 |
| red | 红区 | 4 |
| external | 外网 | 2 |

### 2.2 ID 映射（双向）

```typescript
// 英文名 → 后端 ID
AREA_ID_MAP: { green: 1, yellow: 0, red: 4, external: 2 }

// 后端 ID → 英文名
ID_TO_AREA: { 1: 'green', 0: 'yellow', 4: 'red', 2: 'external' }
```

### 2.3 核心解析函数

#### parseAreaIdFromAttr(attr, key)
从 `itemAttr1` URL 参数中提取区域 ID：

```typescript
// 输入: "Create.aspx?action=create&fromAreaID=0&ToAreaID=15"
// parseAreaIdFromAttr(attr, 'from') → 0
// parseAreaIdFromAttr(attr, 'to') → 15
```

#### parseAreaFromAttr(attr, key)
从 `itemAttr1` URL 参数中提取区域英文名：

```typescript
// 输入: "Create.aspx?...&fromAreaID=0&ToAreaID=15"
// parseAreaFromAttr(attr, 'from') → 'yellow' (因为 0 → yellow)
// parseAreaFromAttr(attr, 'to') → 'green' (默认)
```

---

## 3. 图标系统 (Icons)

### 3.1 图标配置

```typescript
// src/config/icons.ts
TRANSFER_ICONS = {
  GREEN: '/icons/green.svg',
  YELLOW: '/icons/yellow.svg',
  RED: '/icons/red.svg',
  EXTERNAL: '/icons/external.svg',
  GREEN_ARROW: '/icons/arrow-green.svg',
  YELLOW_ARROW: '/icons/arrow-yellow.svg',
  RED_ARROW: '/icons/arrow-red.svg',
}
```

### 3.2 图标映射表

```typescript
TRANSFER_ICON_MAP = {
  'green-green': { fromIcon: GREEN, toIcon: GREEN, arrowIcon: GREEN_ARROW },
  'green-yellow': { fromIcon: GREEN, toIcon: YELLOW, arrowIcon: GREEN_ARROW },
  'green-red': { fromIcon: GREEN, toIcon: RED, arrowIcon: GREEN_ARROW },
  // ... 其他组合
}
```

### 3.3 获取图标函数

```typescript
getTransferIcons(fromZone, toZone)
// 输入: 'green', 'yellow'
// 返回: { fromIcon: '/icons/green.svg', toIcon: '/icons/yellow.svg', arrowIcon: '/icons/arrow-green.svg' }
```

---

## 4. 数据转换 (Transform)

### 4.1 Tab 数据转换

```typescript
// 后端: TransmissionScenarioItem[] → UI: UITransferTabConfigItem[]
transformTabs(data) {
  return data
    .filter(item => item.status === 1)  // 只取启用状态
    .map(item => ({
      id: String(item.itemId),
      key: item.itemCode,       // 作为 Tab 的唯一标识
      label: item.itemName,     // Tab 显示名称
      order: item.itemIndex,    // 排序
    }))
    .sort((a, b) => a.order - b.order)
}
```

### 4.2 卡片数据转换

```typescript
// 后端: TransmissionScenarioChildItem[] → UI: UITransferTypeConfigItem[]
transformTypes(data) {
  return data.map(item => {
    // 关键：从 URL 参数解析源区域和目标区域
    const fromZone = parseAreaFromAttr(item.itemAttr1, 'from')
    const toZone = parseAreaFromAttr(item.itemAttr1, 'to')
    const icons = getTransferIcons(fromZone, toZone)

    return {
      id: String(item.itemId),
      key: item.itemCode,
      title: item.itemName,
      desc: item.itemDesc || '',
      fromZone,        // 用于路由参数
      toZone,          // 用于路由参数
      fromIcon: icons.fromIcon,
      toIcon: icons.toIcon,
      arrowIcon: icons.arrowIcon,
      tabGroup: item.parentItem?.itemCode || '',  // 属于哪个 Tab
      order: item.itemIndex,
    }
  })
}
```

---

## 5. UI 类型定义

### 5.1 Tab 配置项

```typescript
interface UITransferTabConfigItem {
  id: string       // itemId 字符串
  key: string      // itemCode，作为唯一标识
  label: string    // itemName，Tab 显示名称
  order: number    // 排序
  status: StatusEnum
}
```

### 5.2 卡片配置项

```typescript
interface UITransferTypeConfigItem {
  id: string
  key: string                    // 传输类型编码
  title: string                  // 卡片标题
  desc: string                   // 卡片描述
  fromZone: SecurityArea          // 源区域
  toZone: SecurityArea            // 目标区域
  fromIcon: string               // 源区域图标路径
  toIcon: string                 // 目标区域图标路径
  arrowIcon: string              // 箭头图标路径
  tabGroup: string               // 所属 Tab 组
  order: number
  status: StatusEnum
}
```

---

## 6. 页面交互逻辑

### 6.1 Tab 切换

```typescript
const activeTab = ref('')

// 默认选中第一个 Tab
watch(tabs, (newTabs) => {
  if (newTabs.length > 0 && !activeTab.value) {
    activeTab.value = newTabs[0].key
  }
}, { immediate: true })

// 按 Tab 过滤卡片
const filteredTypes = computed(() => {
  return transferTypes.value.filter(t => t.tabGroup === activeTab.value)
})
```

### 6.2 卡片点击跳转

```typescript
function handleCardClick(item: UITransferTypeConfigItem) {
  router.push({
    path: '/application/create',
    query: {
      type: item.key,           // 传输类型
      from: item.fromZone,     // 源区域
      to: item.toZone,         // 目标区域
    },
  })
}
```

---

## 7. 后端接口

### 7.1 接口列表

| 接口 | 方法 | 说明 |
|------|------|------|
| `/commonService/services/jalor/lookup/itemquery/listbycodes/transmission_scenario/zh_CN` | GET | 获取 Tab 配置 |
| `/commonService/services/jalor/lookup/itemquery/listbycodes/transmission_scenario_child_item/zh_CN` | GET | 获取卡片配置 |

### 7.2 响应数据结构

**Tab 配置 (transmission_scenario)**:
```json
{
  "transmission_scenario": [
    {
      "itemId": 1,
      "itemCode": "green_out",
      "itemName": "绿区传出",
      "itemIndex": 0,
      "status": 1
    }
  ]
}
```

**卡片配置 (transmission_scenario_child_item)**:
```json
{
  "transmission_scenario_child_item": [
    {
      "itemId": 101,
      "itemCode": "green_to_yellow",
      "itemName": "绿区→黄区",
      "itemDesc": "从绿区传到黄区",
      "itemAttr1": "Create.aspx?fromAreaID=1&ToAreaID=0",
      "parentItem": { "itemCode": "green_out" },
      "itemIndex": 0,
      "status": 1
    }
  ]
}
```

---

## 8. 关键文件清单

| 文件路径 | 说明 |
|----------|------|
| `src/views/application/SelectTypeView.vue` | 传输类型选择页面 |
| `src/views/application/select-type.scss` | 页面样式 |
| `src/composables/useTransferConfig.ts` | 配置获取与转换逻辑 |
| `src/constants/region.ts` | 区域常量定义 |
| `src/config/icons.ts` | 图标配置 |
| `src/types/uiConfig.ts` | UI 类型定义 |
| `src/api/uiConfig.ts` | API 定义 |

---

## 9. 总结

1. **区域系统**：通过 `parseAreaFromAttr()` 从 URL 参数解析源/目标区域
2. **图标系统**：根据源/目标区域组合，从 `TRANSFER_ICON_MAP` 获取对应图标
3. **数据分层**：后端返回原始配置 → composable 转换 → 组件渲染
4. **Tab 过滤**：通过 `tabGroup` 字段关联卡片与 Tab
5. **路由参数**：点击卡片传递 `type`、`from`、`to` 到申请页面

---

*文档生成时间：2026-04-13*
