# 区域系统扩展性分析 & 前后端职责边界

> 分析日期：2026-04-13

---

## 一、后端接口实际实现的功能

| 功能 | 是否实现 | 说明 |
|------|:--------:|------|
| 动态 Tab 配置 | ✅ | 返回不同的 Tab（itemCode, itemName） |
| Tab 下卡片关联 | ✅ | 通过 parentItem.itemCode 关联 |
| 卡片基础信息 | ✅ | 标题、描述、排序、状态 |
| 区域 ID 提取 | ✅ | 从 itemAttr1 URL 参数中提供 |

**结论**：后端接口只实现了"结构配置"（哪些 Tab、哪些卡片），并没有提供"业务语义配置"（区域名称、图标、审批级别等）。

---

## 二、写死在前端的东西（扩展性瓶颈）

### 2.1 区域映射（4处硬编码）

| 文件 | 硬编码内容 |
|------|-----------|
| `constants/region.ts` | `ID_TO_AREA = { 1: 'green', 0: 'yellow', 4: 'red', 2: 'external' }` |
| `constants/region.ts` | `AREA_LABEL_MAP = { green: '绿区', yellow: '黄区', ... }` |
| `constants/region.ts` | `AREA_ID_MAP = { green: 1, yellow: 0, ... }` |
| `config/icons.ts` | `TRANSFER_ICONS = { GREEN: '/icons/green.svg', ... }` |

**问题**：如果后端新增一个区域（如 `hisilicon: 5`），前端必须修改 4+ 处代码。

### 2.2 图标映射（TRANSFER_ICON_MAP）

```typescript
// src/config/icons.ts
export const TRANSFER_ICON_MAP: Record<string, {...}> = {
  'green-green': { fromIcon: GREEN, toIcon: GREEN, arrowIcon: GREEN_ARROW },
  'green-yellow': { fromIcon: GREEN, toIcon: YELLOW, arrowIcon: GREEN_ARROW },
  'green-red': { fromIcon: GREEN, toIcon: RED, arrowIcon: GREEN_ARROW },
  // ... 需要枚举所有可能的组合
  'green-external': { ... },
  'yellow-external': { ... },
  // 如果新增 'hisilicon' 区域，需要补充大量组合
}
```

**问题**：N 个区域 = N×N 个组合，每个新增区域都要改这里。

### 2.3 卡片样式（渐变色）

```scss
// src/views/application/select-type.scss
.zone-green { background: linear-gradient(135deg, #00bba7 0%, #00c950 100%); }
.zone-yellow { background: linear-gradient(135deg, #f2b313 0%, #ee7214 100%); }
.zone-red { background: linear-gradient(135deg, #ff6900 0%, #fb2c36 100%); }
.zone-external { background: linear-gradient(135deg, #2b7fff 0%, #00bba7 100%); }
.zone-hisilicon { background: linear-gradient(135deg, #ad46ff 0%, #f6339a 100%); }
.zone-cross { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); }
```

**问题**：样式写在 CSS 里，新增区域要改 CSS。

### 2.4 审批级别映射

```typescript
// src/constants/index.ts 或 useApplicationForm.ts
const APPROVAL_LEVEL_MAP = {
  'green-to-green': 0,    // 免审
  'green-to-yellow': 1,   // 一级审批
  'yellow-to-red': 2,    // 二级审批
  // ...
}
```

**问题**：审批级别应该由后端配置，而不是前端硬编码。

### 2.5 区域别名/归一化

```typescript
// src/composables/useApplicationForm.ts
const transferTypeAlias: Record<string, TransferType> = {
  'green-to-external': 'green-to-red',  // 外网按红区处理
  'green-to-hisilicon': 'green-to-red',
  'routine-apply': 'green-to-green',
  'routine-channel': 'yellow-to-red',
}
```

**问题**：业务规则写死在代码里。

### 2.6 区域推断逻辑

```typescript
// src/composables/useApplicationForm.ts
function inferAreas(transferType: TransferType): { sourceArea, targetArea } {
  if (transferType === 'green-to-yellow')
    return { sourceArea: 'green', targetArea: 'yellow' }
  // ... 硬编码所有组合
}
```

**问题**：新增传输类型时，前端必须同步修改。

---

## 三、问题总结

```
当前架构：
┌─────────────────────────────────────────────────────────────┐
│ 后端接口                          前端（写死）              │
│ ─────────                         ──────────               │
│ - Tab 配置 ✓                      - 区域 ID→名称映射        │
│ - 卡片基础信息 ✓                  - 区域中文标签             │
│ - parentItem 关联 ✓               - 区域图标路径            │
│                                    - 图标-区域组合映射       │
│                                    - 卡片渐变样式            │
│                                    - 审批级别                │
│                                    - 区域别名/归一化         │
└─────────────────────────────────────────────────────────────┘

扩展性瓶颈：
❌ 新增区域 → 需要改 5+ 个文件
❌ 新增传输组合 → 需要改 3+ 个文件
❌ 修改审批级别 → 需要改前端代码
❌ 修改区域样式 → 需要改 CSS
```

---

## 四、理想方案：后端配置化

### 4.1 后端应返回完整的区域配置

```typescript
// 后端返回区域元数据
interface RegionConfig {
  id: number
  code: string           // 'green', 'yellow', 'red', 'external'
  name: string           // '绿区', '黄区', '红区', '外网'
  iconUrl: string        // '/icons/green.svg'
  gradientFrom: string   // '#00bba7'
  gradientTo: string     // '#00c950'
  approvalLevel: number  // 0=免审, 1=一级, 2=二级
}
```

### 4.2 卡片配置应包含完整语义

```typescript
// 后端返回
interface CardConfig {
  id: number
  title: string
  desc: string
  fromRegion: RegionConfig   // 完整的源区域配置
  toRegion: RegionConfig      // 完整的目标区域配置
  arrowColor: string          // 箭头颜色（可选）
  tabGroup: string
  order: number
  status: number
}
```

### 4.3 前端只需渲染

```vue
<template>
  <div class="type-card" :style="card.style">
    <img :src="card.fromRegion.iconUrl" />
    <span>{{ card.fromRegion.name }}</span>
    <span class="arrow" :style="{ color: card.arrowColor }">→</span>
    <img :src="card.toRegion.iconUrl" />
    <span>{{ card.toRegion.name }}</span>
  </div>
</template>

<script setup>
// 前端只需要存储后端返回的配置，不再有任何硬编码
const { cards } = await fetchCardConfig()
</script>
```

---

## 五、建议的改进方向

### 优先级 P0（必须）

1. **区域元数据接口**：后端新增 `/commonService/regions` 接口，返回所有区域的完整配置
2. **移除硬编码映射**：前端从 `constants/region.ts` 改为从后端获取配置

### 优先级 P1（重要）

3. **卡片配置增强**：后端返回 `transmission_scenario_child_item` 时直接包含 `fromRegion` 和 `toRegion` 的完整对象
4. **审批级别配置化**：后端返回区域时附带审批级别

### 优先级 P2（优化）

5. **样式配置化**：后端返回渐变色值，前端动态应用
6. **图标 URL 配置化**：后端返回图标 URL，前端直接使用

---

## 六、当前可行的过渡方案

如果后端暂时无法改接口，可以：

1. 在前端维护一份"区域配置中心"（而不是散落在各处）
2. 从后端接口获取 region ID 列表后，与本地配置合并校验
3. 对于未知 ID，显示为"未知区域({{ id }})"而不是直接崩溃

---

*文档生成时间：2026-04-13*
