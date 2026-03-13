# P6.6.3 申请单配置动态化 - 执行记录

## 执行时间
2026-03-12

## 需求概述
将 `StepOneBasicInfo.vue` 中的硬编码配置项改为可通过"界面配置"页面动态配置：
- applicantNotifyOptions - 申请人通知选项
- downloaderNotifyOptions - 下载人通知选项
- recentTransferTemplates - 最近传输选择
- noticeItems - 注意事项

## 执行步骤

### 1. 类型定义扩展
- 文件：`src/types/uiConfig.ts`
- 新增 `application` 到 `UIConfigTab` 类型
- 新增 `UIApplicationConfigType` 类型
- 新增 `UIApplicationConfigItem` 接口

### 2. API 扩展
- 文件：`src/api/uiConfig.ts`
- 新增方法：
  - `getApplicationConfig()` - 获取配置列表
  - `createApplicationConfig()` - 创建配置
  - `updateApplicationConfig()` - 更新配置
  - `deleteApplicationConfig()` - 删除配置
  - `sortApplicationConfig()` - 排序配置
  - `updateApplicationStatus()` - 更新状态

### 3. Mock Handler 扩展
- 文件：`src/mocks/handlers/uiConfig.ts`
- 新增初始数据（11条配置项）：
  - 申请人通知选项：3条
  - 下载人通知选项：3条
  - 最近传输模板：2条
  - 注意事项：3条
- 新增完整 CRUD handlers

### 4. Composable 扩展
- 文件：`src/composables/useUIConfig.ts`
- 新增状态：applicationConfigData, applicationModalVisible, editingApplication
- 新增方法：fetchApplicationConfig, handleSaveApplicationConfig, handleApplicationSort 等

### 5. 新增 useApplicationConfig composable
- 文件：`src/composables/useApplicationConfig.ts`
- 提供 getOptionsByType / getItemsByType 方法
- 自动预加载配置数据

### 6. 界面配置页面扩展
- 文件：`src/views/admin/UIConfigView.vue`
- 新增"申请单配置" Tab
- 支持按类型筛选、新增、编辑、删除、排序、状态切换

### 7. StepOneBasicInfo.vue 改造
- 文件：`src/views/application/components/StepOneBasicInfo.vue`
- 移除硬编码配置项
- 使用 useApplicationConfig 获取动态配置
- 改为 computed 响应式数据

## 产出文件清单

| 文件路径 | 操作类型 |
|---------|---------|
| `src/types/uiConfig.ts` | 修改 |
| `src/api/uiConfig.ts` | 修改 |
| `src/mocks/handlers/uiConfig.ts` | 修改 |
| `src/composables/useUIConfig.ts` | 修改 |
| `src/composables/useApplicationConfig.ts` | 新增 |
| `src/views/admin/UIConfigView.vue` | 修改 |
| `src/views/application/components/StepOneBasicInfo.vue` | 修改 |

## 验收结果

- [√] 界面配置页面新增"申请单配置" Tab
- [√] 支持配置四种类型的选项项
- [√] StepOneBasicInfo.vue 使用配置数据
- [√] Mock 数据完整，支持 CRUD 操作
- [√] 无 Lint 错误

## 配置类型说明

| 配置类型 | 说明 | 用途 |
|---------|------|------|
| applicantNotifyOptions | 申请人通知选项 | checkbox-group 选项 |
| downloaderNotifyOptions | 下载人通知选项 | checkbox-group 选项 |
| recentTransferTemplates | 最近传输模板 | 侧边栏模板文本列表 |
| noticeItems | 注意事项 | 侧边栏注意事项列表 |
