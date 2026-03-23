# 传输类型选择页适配真实后端接口执行文档

## 需求概述
将 `SelectTypeView.vue` 页面的 TAB 和卡片配置从 mock 接口适配到真实后端接口。

## 接口信息

### 接口1：获取 TAB 配置
- **URL**: `GET /commonService/services/jalor/lookup/itemquery/listbycodes/transmission_scenario/zh_CN`
- **用途**: 渲染顶部 Tab 栏
- **关键字段**: `itemCode`, `itemName`, `itemDesc`, `itemIndex`

### 接口2：获取卡片配置
- **URL**: `GET /commonService/services/jalor/lookup/itemquery/listbycodes/transmission_scenario_child_item/zh_CN`
- **用途**: 渲染每个 Tab 下的卡片列表
- **关键字段**: `itemCode`, `itemName`, `itemDesc`, `parentItem.itemCode`, `itemIndex`
- **图标**: 根据 `itemAttr1` 中的 `fromAreaID` + `toAreaID` 组合确定

---

## 执行步骤

### 1. API 层 - 添加真实接口
- [√] 在 `src/api/uiConfig.ts` 中添加 `getTransmissionScenario` 接口（获取 TAB）
- [√] 添加 `getTransmissionScenarioChildItems` 接口（获取卡片）
- [√] 定义响应类型 `TransmissionScenarioItem` 和 `TransmissionScenarioChildItem`

### 2. 类型层 - 更新类型定义
- [√] 移除 `UITransferTypeConfigItem` 中的 `level` 和 `levelText` 字段
- [√] 添加新的接口响应类型

### 3. Composable 层 - 更新 useTransferConfig
- [√] 修改 `fetchConfig` 函数调用真实接口
- [√] 添加数据转换逻辑，将后端数据映射为前端所需格式
- [√] 添加 `parseAreaParams` 函数解析区域参数
- [√] 添加图标映射逻辑

### 4. 组件层 - 更新 SelectTypeView
- [√] 删除审批级别相关 UI（`level-tag`）
- [√] 确保数据绑定正确

---

## 字段映射

### TAB 映射
| 后端字段 | 前端字段 |
|---------|---------|
| `itemCode` | `key` |
| `itemName` | `label` |
| `itemIndex` | `order` |

### 卡片映射
| 后端字段 | 前端字段 |
|---------|---------|
| `itemCode` | `key` |
| `itemName` | `title` |
| `itemDesc` | `desc` |
| `parentItem.itemCode` | `tabGroup` |
| `itemIndex` | `order` |

---

## 待办事项

### [ ] 图标映射规则
根据 `fromAreaID` + `toAreaID` 组合确定图标：
- 已实现基础映射逻辑
- 需要确认区域 ID 与实际区域的对应关系

**待确认**: 区域 ID 映射关系（已预设，待验证）
| fromAreaID | 对应区域（预设）|
|-----------|---------|
| 0 | 黄区 (yellow) |
| 1 | 绿区 (green) |
| 2 | 外网 (external) |
| 4 | 红区 (red) |

### [ ] 展示顺序
接口1返回的 itemIndex 字段是否用于 Tab 排序？还是用 itemAttr1？



---

## 执行日志

### 执行时间: 2026-03-22

**修改文件清单：**
1. `src/api/uiConfig.ts` - 添加真实后端接口和类型定义
2. `src/types/uiConfig.ts` - 移除 `level` 和 `levelText` 字段
3. `src/composables/useTransferConfig.ts` - 完整重写，适配真实接口
4. `src/views/application/SelectTypeView.vue` - 删除审批级别 UI

