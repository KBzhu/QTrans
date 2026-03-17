# P6.6.3 申请单配置动态化

## 需求描述

将 `StepOneBasicInfo.vue` 中的以下硬编码配置项改为可通过"界面配置"页面动态配置：

1. `applicantNotifyOptions` - 申请人通知选项
2. `downloaderNotifyOptions` - 下载人通知选项  
3. `recentTransferTemplates` - 最近传输选择（模板文本）
4. `noticeItems` - 注意事项

## 技术方案

1. 扩展 `UIConfigTab` 类型，新增 `application` 配置类型
2. 新增类型定义 `UIApplicationConfigItem`
3. 扩展 `uiConfigApi` 新增 API 方法
4. 扩展 `useUIConfig` composable
5. 扩展 `UIConfigView.vue` 新增"申请单配置" Tab
6. 新增 Mock handlers
7. 修改 `StepOneBasicInfo.vue` 从配置中读取数据

## 子任务清单

- [√] 扩展类型定义 `src/types/uiConfig.ts`
  - [√] UIConfigTab 新增 'application'
  - [√] 新增 UIApplicationConfigItem 接口
  - [√] 新增 UIApplicationConfigType 类型
- [√] 扩展 API `src/api/uiConfig.ts`
  - [√] getApplicationConfig
  - [√] updateApplicationConfig
  - [√] createApplicationConfig
  - [√] deleteApplicationConfig
  - [√] sortApplicationConfig
  - [√] updateApplicationStatus
- [√] 扩展 Mock handlers `src/mocks/handlers/uiConfig.ts`
  - [√] 新增申请单配置数据
  - [√] 新增 get/post/put/delete handlers
- [√] 扩展 composable `src/composables/useUIConfig.ts`
  - [√] fetchApplicationConfig
  - [√] handleSaveApplicationConfig
  - [√] handleApplicationSort
  - [√] handleCreateApplication/Edit/Delete
  - [√] handleToggleApplicationStatus
- [√] 扩展界面配置页面 `src/views/admin/UIConfigView.vue`
  - [√] 新增"申请单配置" Tab
  - [√] 新增配置项编辑表格
  - [√] 支持新增/编辑/删除/排序
- [√] 创建 useApplicationConfig composable
  - [√] fetchConfig
  - [√] getOptionsByType
  - [√] getItemsByType
- [√] 修改 `StepOneBasicInfo.vue`
  - [√] 从配置中读取 applicantNotifyOptions
  - [√] 从配置中读取 downloaderNotifyOptions
  - [√] 从配置中读取 recentTransferTemplates
  - [√] 从配置中读取 noticeItems

## 验收标准

1. 界面配置页面新增"申请单配置"Tab，支持配置四种选项
2. StepOneBasicInfo.vue 使用配置数据，而非硬编码
3. 配置变更后，申请单页面实时生效
4. Mock 数据完整，支持 CRUD 操作
