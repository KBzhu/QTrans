# 帮助文档 & 重要公告对接真实接口 - 执行记录

## 任务目标
参考 SelectTypeView 组件，对接首页"帮助文档"和"重要公告"真实后端接口，替换硬编码假数据。

---

## Part 1: 帮助文档

### API 信息
- **接口**: GET `/commonService/services/jalor/lookup/itemquery/listbycodes/help_doc_link/zh_CN`
- **响应格式**: `{ help_doc_link: HelpDocItem[] }`

### 执行步骤

### [√] 1. 在 `uiConfig.ts` 中添加帮助文档 API 定义
- [√] 添加 `getHelpDocs` 方法
- [√] 添加 `HelpDocItem` 接口定义

### [√] 2. 创建 `useHelpDocs` composable
- [√] 参考 `useTransferConfig` 实现
- [√] 数据转换函数（formatDateTime 格式化时间）
- [√] 加载状态管理
- [√] openDocLink 打开链接方法

### [√] 3. 修改 `dashboard/index.vue`
- [√] 替换硬编码 `helpDocs` 为响应式数据
- [√] 使用 `useHelpDocs` 获取数据
- [√] 点击文档打开链接（window.open）
- [√] 空状态显示"暂无帮助文档"

### [√] 4. 验证与测试
- [√] lint 检查通过

---

## Part 2: 重要公告

### API 信息
- **接口**: GET `/commonService/services/jalor/lookup/itemquery/listbycodes/top_affiche/zh_CN`
- **响应格式**: `{ top_affiche: TopAfficheItem[] }`

### 用户确认
1. 使用 itemAttr1 作为标题（为空则用固定标题"系统公告"）
2. 链接从 itemAttr3 获取
3. 图标取 itemAttr2 字段
4. 时间和内容同一行显示在最右侧（lastUpdateDate），格式同帮助文档

### 执行步骤

### [√] 1. 在 `uiConfig.ts` 中添加公告 API 定义
- [√] 添加 `getTopAffiches` 方法
- [√] 添加 `TopAfficheItem` 接口定义

### [√] 2. 创建 `useTopAffiches` composable
- [√] 参考 `useTransferConfig` 实现
- [√] 数据转换函数（formatDateTime 格式化时间）
- [√] 标题降级处理（itemAttr1 为空时用固定标题"系统公告"）
- [√] 链接从 itemAttr3 获取
- [√] openAfficheLink 打开链接方法

### [√] 3. 修改 `dashboard/index.vue`
- [√] 替换硬编码 `notices` 为响应式数据 `affiches`
- [√] 使用 `useTopAffiches` 获取数据
- [√] 时间和内容同一行显示（.notice-content）
- [√] 添加链接（.affiche-link）
- [√] 空状态显示"暂无公告"

### [√] 4. 验证与测试
- [√] lint 检查通过

---

## 产出文件清单
- `qtrans-frontend/src/api/uiConfig.ts` - 新增 HelpDocItem、TopAfficheItem 接口和 getHelpDocs、getTopAffiches API
- `qtrans-frontend/src/composables/useHelpDocs.ts` - 新增 composable
- `qtrans-frontend/src/composables/useTopAffiches.ts` - 新增 composable
- `qtrans-frontend/src/views/dashboard/index.vue` - 修改

## 验收结果
- [√] API 定义正确
- [√] 数据转换逻辑正确
- [√] 模板渲染正常
- [√] 点击跳转链接正常
- [√] 空状态处理正常
- [√] lint 检查通过
