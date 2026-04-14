# 区域配置化重构方案 - 最终版

> 更新日期：2026-04-14

---

## 一、核心思路

**前端不再维护任何区域映射硬编码**，所有区域信息从后端接口获取。

---

## 二、后端接口改动

### 2.1 首页卡片配置接口增强

```typescript
// GET /commonService/services/jalor/lookup/itemquery/listbycodes/transmission_scenario_child_item/zh_CN
{
  "transmission_scenario_child_item": [
    {
      "itemId": 101,
      "itemCode": "green_to_yellow",
      "itemName": "绿区→黄区",
      "itemDesc": "从绿区传到黄区",
      "itemAttr1": "Create.aspx?fromAreaID=1&ToAreaID=0",  // 数字 ID
      "itemAttr2": "icon-green-zone.svg",                           // form图标名
      "itemAttr3": "icon-yellow-zone.svg",                  // to区域图标名
      "itemAttr4": "background: linear-gradient(...);",      // CSS 样式
      "itemAttr5": "fromCode:green,fromName:绿区,fromId:1,toCode:yellow,toName:黄区,toId:0",  // 🆕 完整区域元数据
      "parentItem": { "itemCode": "green_out" }
    }
  ]
}
```

---

## 三、前端改动清单

### 3.1 新建区域元数据 Store

```typescript
// src/stores/regionMetadata.ts
interface RegionMetadata {
  fromRegion: RegionConfig
  toRegion: RegionConfig
}

interface RegionConfig {
  code: string        // 'green', 'yellow', 'red', 'external'
  name: string        // '绿区', '黄区', '红区', '外网'
  id: number          // 1, 0, 4, 2
  iconName: string    // 图标文件名（从 itemAttr3）
  cssStyle: string    // CSS 样式（从 itemAttr4）
}
```

### 3.2 SelectTypeView 改动

- [ ] 解析 itemAttr2 获取 from 区域图标路径
- [ ] 解析 itemAttr3 获取 to 区域图标路径
- [ ] 解析 itemAttr4 获取卡片样式代码
- [ ] 解析 itemAttr5 获取区域元数据（fromCode, fromName, fromId, toCode, toName, toId）
- [ ] 调用 store 保存区域元数据
- [ ] 图标直接使用后端返回的路径
- [ ] URL 参数保持 code（如 `?from=green&to=yellow`）

### 3.3 useApplicationForm 改动

- [ ] 从 store 读取区域元数据
- [ ] 调用接口时使用 store 中的 `id`（数字）
- [ ] 移除 `AREA_ID_MAP`、`ID_TO_AREA` 依赖

### 3.4 useSecurityLevel 改动

- [ ] 从 store 读取区域 ID
- [ ] 移除 `HIGH_TO_LOW_PAIRS` 预判逻辑
- [ ] 根据 `isDisplaySecretLevelControl` 控制 UI

### 3.5 useCitySelection 改动

- [ ] 从 store 读取区域 ID
- [ ] 移除 `AREA_ID_MAP` 依赖

### 3.6 useApprovalRoute 改动

- [ ] 从 store 读取区域 ID
- [ ] 移除 `HIGH_TO_LOW_PAIRS`、`AREA_ID_MAP` 依赖

### 3.7 常量文件清理

- [ ] `src/config/icons.ts` - **删除整个文件**
- [ ] `constants/region.ts` - 移除或降级（仅保留最基础的类型定义）
- [ ] `constants/transferType.ts` - 移除 `APPROVAL_LEVEL_MAP`
- [ ] `components/constants.ts` - 移除 `HIGH_TO_LOW_PAIRS`

### 3.8 图标相关

- [ ] `src/config/icons.ts` - **删除整个文件**（不再需要映射表）
- [ ] `public/icons/` - **保留**（图标文件由后端通过 itemAttr2/itemAttr3 配置路径）
- [ ] SelectTypeView 直接使用后端返回的图标路径（itemAttr2/itemAttr3）
- [ ] 箭头使用后端返回的路径（itemAttr2）

---

## 四、数据流

```
┌─────────────────────────────────────────────────────────────────┐
│  SelectTypeView                                                  │
│  - 解析 itemAttr5: { fromCode, fromName, fromId, ... }         │
│  - 存入 regionMetadataStore                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  URL: ?from=green&to=yellow&fromId=1&toId=0                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CreateApplicationView                                          │
│  - 从 store 读取区域元数据                                       │
│  - 填充表单默认区域（用 code）                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  useSecurityLevel / useCitySelection / useApprovalRoute          │
│  - 从 store 读取数字 ID                                         │
│  - 调用后端接口                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 五、待后端配合

| 字段 | 用途 | 状态 |
|------|------|:----:|
| itemAttr1 | 保留（数字 ID） | ✅ |
| itemAttr2 | 箭头样式 | ✅ |
| itemAttr3 | 图标名 | 🆕 |
| itemAttr4 | CSS 样式 | 🆕 |
| itemAttr5 | 完整区域元数据 | 🆕 |

---

*文档生成时间：2026-04-14*
