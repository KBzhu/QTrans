# 传输类型配置功能任务

## 需求概述
将 `/dashboard` 菜单下的 tab、article（传输类型卡片）配置化，支持动态配置。

## 子任务清单

- [√] 1. 添加类型定义（src/types/uiConfig.ts）
  - [√] UITransferTabConfigItem - 传输类型页签配置
  - [√] UITransferTypeConfigItem - 传输类型卡片配置
  - [√] 更新 UIConfigTab 类型

- [√] 2. 添加 API 方法（src/api/uiConfig.ts）
  - [√] getTransferTabs / createTransferTab / updateTransferTab / deleteTransferTab / sortTransferTabs
  - [√] getTransferTypes / createTransferType / updateTransferType / deleteTransferType / sortTransferTypes

- [√] 3. 添加 composable 逻辑（src/composables/useUIConfig.ts）
  - [√] transferTabConfigData / transferTypeConfigData
  - [√] fetchTransferTabConfig / fetchTransferTypeConfig
  - [√] CRUD 操作方法

- [√] 4. 添加 Mock Handlers（src/mocks/handlers/uiConfig.ts）
  - [√] 初始化 tab 和 transferType 数据
  - [√] HTTP handlers

- [√] 5. 修改 UIConfigView.vue - 添加配置 UI
  - [√] 新增 "传输页签配置" Tab
  - [√] 新增 "传输类型配置" Tab
  - [√] 配置表格和弹窗表单

- [√] 6. 修改 SelectTypeView.vue - 使用配置数据
  - [√] 从配置 API 获取数据
  - [√] 替换硬编码数据

- [√] 7. 验证测试
  - [√] 配置功能正常
  - [√] 页面显示正常

## 产出文件清单

1. **类型定义** - `src/types/uiConfig.ts`
   - 新增 `UITransferTabConfigItem` 接口
   - 新增 `UITransferTypeConfigItem` 接口
   - 更新 `UIConfigTab` 类型

2. **API 层** - `src/api/uiConfig.ts`
   - 新增传输页签配置 API（CRUD + 排序 + 状态切换）
   - 新增传输类型配置 API（CRUD + 排序 + 状态切换）

3. **Composable 层**
   - `src/composables/useUIConfig.ts` - 扩展管理配置
   - `src/composables/useTransferConfig.ts` - 新增，供页面使用

4. **Mock 层** - `src/mocks/handlers/uiConfig.ts`
   - 初始化数据（tabs + transferTypes）
   - HTTP handlers（CRUD + 排序 + 状态切换）

5. **视图层**
   - `src/views/admin/UIConfigView.vue` - 新增两个配置 Tab
   - `src/views/application/SelectTypeView.vue` - 改用配置数据

## 配置结构说明

### 传输页签配置 (UITransferTabConfigItem)
```typescript
{
  id: string
  key: string        // 唯一标识，如 'green', 'yellow'
  label: string      // 显示名称，如 '绿区传出'
  order: number      // 排序
  status: 'enabled' | 'disabled'
}
```

### 传输类型配置 (UITransferTypeConfigItem)
```typescript
{
  id: string
  key: string        // 唯一标识，如 'green-to-yellow'
  title: string      // 标题
  desc: string       // 描述
  fromZone: 'green' | 'yellow' | 'red' | 'cross' | 'external' | 'hisilicon'
  toZone: 'green' | 'yellow' | 'red' | 'cross' | 'external' | 'hisilicon'
  fromIcon: string   // 源图标路径
  toIcon: string     // 目标图标路径
  arrowIcon: string  // 箭头图标路径
  level: 'free' | 'l1' | 'l2' | 'l3'
  levelText: string  // 审批级别文字
  tabGroup: string   // 所属 tab key
  order: number      // 排序
  status: 'enabled' | 'disabled'
}
```
