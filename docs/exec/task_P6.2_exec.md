# Task P6.2 执行记录

## 执行范围
本次执行 `P6.2 创建申请单页面`，包含页面、表单编排、步骤流转、草稿能力与样式。

## 子任务拆分
- [ √ ] 分析 P6.2 需求与 Figma 3960_2183 并制定实现映射

- [ √ ] 创建 `src/composables/useApplicationForm.ts`
- [ √ ] 创建 `src/views/application/CreateApplicationView.vue`
- [ √ ] 创建 `src/views/application/create-application.scss`
- [ √ ] 更新路由 `/application/create` 指向新页面

- [ √ ] 更新任务文档 `docs/tasks/task_P6.md` 的 P6.2 勾选状态
- [ √ ] 更新差异记录 `docs/diff/P6_Figma_Doc_Diff.md`
- [ √ ] 更新 `CHANGELOG`
- [ √ ] 构建与 lint 校验通过

## 2026-03-05 Figma 发起申请增量补充（3879_3344 / 3883_4645 / 3883_5466 / 3883_7020）

### 一、补充需求（基于高保真）
- [ √ ] 页面结构补充：发起申请页需拆分为「基本信息」+「申请信息」两个模块。
- [ √ ] 基本信息只读：申请人、申请单号、当前处理人、存储空间、上传有效期、下载有效期均为预配置值，前端仅展示不可编辑。
- [ √ ] 申请信息样式补充：输入控件统一为白底 + 细边框 + 8px 圆角，必填项带红色星标，符合 Figma 表单视觉。
- [ √ ] 申请信息字段补充：在原有字段基础上补充「抄送人」等未覆盖字段；通知选项文案按高保真补齐。
- [ √ ] 进度条状态补充：填写申请单时「发起申请」处于激活高亮状态（数字圆点与标题高亮）。
- [ √ ] 右侧信息区补充：新增「注意事项」「最近传输选择」模块；最近传输支持一键复制到申请原因。
- [ √ ] 兼容原流程：保留后续上传与提交步骤，确保整体 3 步流程不断裂。

### 二、补充设计（实现约束）
- [ √ ] 布局：主内容区采用左右两栏（左侧主表单 + 右侧信息面板），窄屏自动降级为单列。
- [ √ ] 样式拆分：样式继续放在 `create-application.scss`，组件内仅保留必要结构，复用现有 mixin。
- [ √ ] 只读字段：使用禁用态输入框或只读文本容器，背景使用浅灰底，避免误编辑。
- [ √ ] 右侧交互：最近传输条目支持「一键复制」并通过消息提示反馈结果。
- [ √ ] 文案优先级：优先对齐 Figma 文案；与原文档冲突处记录为“增量补充项”。

### 三、本次增量任务拆分
- [ √ ] T1：补充执行文档（需求/设计/差异/任务清单）
- [ √ ] T2：改造发起申请 Step1 结构（基本信息 + 申请信息 + 右侧面板）
- [ √ ] T3：补齐字段与交互（抄送人、最近传输一键复制、只读信息映射）
- [ √ ] T4：对齐样式（进度高亮、输入框视觉、双栏布局与响应式）
- [ √ ] T5：更新变更记录并完成校验

## 2026-03-05 填单页二次补充（部门数据联动 + 固定布局）

### 一、补充需求（基于反馈与 Figma）
- [ √ ] 部门选择器需接入 P2.2 的 `departments` Mock 树数据，确保下拉可见且可选。
- [ √ ] 顶栏与左侧菜单在桌面端保持固定，不随填单内容滚动。
- [ √ ] 发起申请页底部操作横栏（取消/上一步/保存草稿/下一步）保持固定，表单区域独立滚动。
- [ √ ] 底部操作横栏背景填充色需按高保真修正为实底浅色并带分隔线。

### 二、补充详细设计
- [ √ ] 部门树组件改造：`a-tree-select` 使用 Arco 标准树字段（`title`/`key`/`children`），数据源直接由 `src/mocks/data/departments.ts` 递归映射。
- [ √ ] 主布局固定策略：`DefaultLayout` 采用“固定头部 + 固定侧栏 + 内容区独立滚动”结构；内容区通过左侧偏移适配折叠态。
- [ √ ] 页面滚动策略：`PageContainer` 设置为纵向弹性布局，仅 `page-container__content` 允许滚动。
- [ √ ] 操作栏样式策略：`create-application.scss` 将操作栏改为 `sticky bottom`，统一实色背景、顶部分隔线和内边距。

### 三、本次增量任务拆分
- [ √ ] T1：更新执行文档（需求/详细设计/任务拆分）
- [ √ ] T2：修复部门下拉（接入 P2.2 Mock 树并可选择）
- [ √ ] T3：改造全局布局为固定头部与固定侧栏
- [ √ ] T4：改造申请页底部操作栏固定与配色
- [ √ ] T5：更新记录并完成校验

## 2026-03-05 填单页三次补充（进度高亮校正 + 部门弹窗 + 吸底填满）

### 一、补充需求（基于本轮反馈）
- [ √ ] 修正“发起申请高亮”实现，确保填写申请单时首个步骤的数字节点与标题必然高亮。
- [ √ ] 部门选择器改为“点击后弹出对话框”方式，且需接入 P2.2 部门 Mock 数据可正常选择。
- [ √ ] 底部操作栏在吸底固定时需填满底部与左侧空隙，不出现受 `PageContainer` 内边距影响的留白。

### 二、补充详细设计
- [ √ ] 进度条高亮：为步骤组件增加明确作用域类名，样式同时覆盖 `active/process` 两类状态选择器，避免仅命中单一状态导致失效。
- [ √ ] 部门弹窗选择：申请信息中的“部门”改为只读触发输入框 + 选择按钮；点击后打开 `a-modal`，使用 `a-tree` 展示部门树，确认后回填 `formData.department`。
- [ √ ] 吸底填满：操作栏保留 `sticky bottom`，通过负外边距抵消 `PageContainer` 的左右/底部 padding，使横栏在视觉上贴齐内容区边缘。

### 三、本次增量任务拆分
- [ √ ] T1：补充执行文档（需求/详细设计/任务拆分）
- [ √ ] T2：改造部门选择为弹窗树选择并完成回填
- [ √ ] T3：修复步骤条高亮命中逻辑
- [ √ ] T4：修复吸底操作栏左右/底部留白
- [ √ ] T5：更新记录并完成校验

## 2026-03-05 Step2 上传文件页重构（基于 Figma 3883_5466）

### 一、补充需求（基于 Figma 高保真）
- [ √ ] 移除原有拖拽上传区域与单一上传表格，改为双表格展示。
- [ √ ] 顶部新增「上传按钮」「上传完毕后自动提交」开关、隐私政策链接。
- [ √ ] 第一表格「传输任务」：展示正在上传的文件列表，包含实时进度条、批量暂停/继续/删除操作。
- [ √ ] 第二表格「已上传文件列表」：展示上传成功的文件，支持刷新/上层目录/删除操作。
- [ √ ] 表格列定义：传输任务表包含「文件名称/文件大小/失败次数/使用时间/剩余时间/操作」；已上传文件表包含「文件名称/文件大小/文件类型/最后修改时间/服务器sha256/操作」。
- [ √ ] 每行文件支持独立暂停/继续/删除操作，支持批量全选操作。
- [ √ ] 底部操作栏保持三按钮：取消/上一步/提交，其中提交为主按钮（蓝底白字）。

### 二、补充设计（实现约束）
- [ √ ] 数据结构：`useApplicationForm` 新增 `uploadingFiles`（传输任务）与 `uploadedFiles`（已上传文件）两个状态数组，每个文件对象包含 Figma 对应列所需字段。
- [ √ ] 上传交互：点击「上传」按钮打开文件选择器，选中文件后加入 `uploadingFiles` 并模拟进度条动画（Mock 环境）；上传完成后移入 `uploadedFiles`。
- [ √ ] Mock 进度模拟：使用 `setInterval` 每秒增加进度百分比，完成后自动转移到已上传列表。
- [ √ ] 批量操作：传输任务表提供全选 checkbox 并支持批量暂停/继续/删除；已上传文件表支持批量删除。
- [ √ ] 文件类型图标：根据文件扩展名（.doc/.xls/.zip/.pptx等）显示对应 SVG 图标（复用 Figma 资源目录中的图标）。
- [ √ ] 样式拆分：继续在 `create-application.scss` 中新增 Step2 相关样式类，表格采用白底半透明卡片，进度条使用渐变色（#155DFC -> #10B981）。
- [ √ ] 响应式：表格在窄屏时列宽自适应，操作列优先保持可见。

### 三、本次增量任务拆分
- [ √ ] T1：补充执行文档（需求/设计/任务拆分）
- [ √ ] T2：在 `useApplicationForm` 添加上传文件状态与 Mock 上传逻辑
- [ √ ] T3：重构 Step2 视图为双表格结构并实现批量操作
- [ √ ] T4：补充上传进度条动画与文件图标映射
- [ √ ] T5：对齐 Figma 样式（表格、按钮、进度条、背景渐变）
- [ √ ] T6：更新记录并完成校验

## 2026-03-05 CreateApplicationView 组件拆分重构

### 一、补充需求（基于代码可维护性）
- [ √ ] 拆分 `CreateApplicationView.vue` 单文件组件（768 行），将三个步骤独立为子组件。
- [ √ ] 抽取 Step1（发起申请/基本信息）为 `StepOneBasicInfo.vue`。
- [ √ ] 抽取 Step2（上传文件）为 `StepTwoUploadFile.vue`。
- [ √ ] 抽取 Step3（提交成功）为 `StepThreeSubmitSuccess.vue`。
- [ √ ] 修复 Figma 3883_5466 SVG 图标路径问题（图标未正确渲染）。

### 二、补充设计（实现约束）
- [ √ ] 组件拆分遵循单一职责原则，每个子组件仅负责一个步骤的展示与交互。
- [ √ ] 子组件通过 Props 接收状态，通过 Emits 向父组件传递事件。
- [ √ ] 样式继承：所有子组件样式继续复用 `create-application.scss`，避免样式重复。
- [ √ ] 图标路径修复：从 `assets/CodeBubbyAssets/3883_5466/` 复制 SVG 文件到 `public/figma/3883_5466/`。
- [ √ ] 主组件职责：仅负责步骤流转、路由守卫、数据协调，不包含具体业务表单逻辑。

### 三、本次增量任务拆分
- [ √ ] T1：复制 Figma SVG 图标到 public 目录（修复图标渲染问题）
- [ √ ] T2：创建 `StepOneBasicInfo.vue` 组件（基本信息 + 申请信息 + 右侧面板）
- [ √ ] T3：创建 `StepTwoUploadFile.vue` 组件（双表格 + 批量操作 + 进度条）
- [ √ ] T4：创建 `StepThreeSubmitSuccess.vue` 组件（成功提示 + 申请详情）
- [ √ ] T5：重构 `CreateApplicationView.vue` 使用子组件并修复类型错误
- [ √ ] T6：更新执行文档和 CHANGELOG

## 执行产出清单
- `src/views/application/components/StepOneBasicInfo.vue`（新增）
- `src/views/application/components/StepTwoUploadFile.vue`（新增）
- `src/views/application/components/StepThreeSubmitSuccess.vue`（新增）
- `src/views/application/CreateApplicationView.vue`（重构，从 768 行精简至 231 行）
- `public/figma/3883_5466/*.svg`（新增 47 个图标文件）
- `docs/exec/task_P6.2.md`（更新）
- `CHANGELOG`（更新）

## 2026-03-05 Step1 样式回归修复（重构后）

### 一、问题
- [ √ ] `CreateApplicationView.vue` 重构后保留了 `<style scoped>`，导致 `create-application.scss` 的 Step1 样式无法作用于子组件 `StepOneBasicInfo.vue`，页面出现“仅结构无样式”问题。

### 二、修复
- [ √ ] 将 `CreateApplicationView.vue` 的样式引入从 `scoped` 改为非 `scoped`，恢复 `create-application.scss` 对拆分后子组件的样式覆盖。
- [ √ ] 保持现有组件拆分结构不变，仅修复作用域策略，避免大范围回滚。

### 三、校验
- [ √ ] Step1 页面视觉恢复（布局、间距、卡片、表单样式与 Figma 3883_4645 对齐）。
- [ √ ] 相关文件 lint 校验通过。

## 2026-03-05 Step1 细节样式修复（标题/选框/底栏）

### 一、问题
- [ √ ] 「基本信息」「申请信息」标题字体表现不一致。
- [ √ ] 申请信息表单内的选择类控件底色非白色，与 Figma 不一致。
- [ √ ] 底部操作栏按钮整体右对齐，与 Figma 左对齐不一致。

### 二、修复
- [ √ ] 统一 `.module-card__title` 字体族、字号、行高与字重，消除标题视觉差异。
- [ √ ] 为 `a-input/a-select/a-cascader/a-textarea` 及 checkbox/radio 图标补充白底样式，确保默认态为白色。
- [ √ ] 移除 Step1 的 `a-radio-group type=\"button\"`，改为普通单选，贴合 Figma 样式。
- [ √ ] 将 `.create-application-page__actions` 从 `justify-content: flex-end` 调整为 `flex-start`，使按钮左对齐。

### 三、校验
- [ √ ] 相关 Vue/SCSS 文件 lint 通过。

## 2026-03-05 Step1 样式继承链路修复（样式未挂载）

### 一、问题
- [ √ ] 拆分后依赖父组件 `<style src>` 注入样式，页面运行中出现 Step1 样式未稳定挂载场景（DevTools 未命中标题/表单样式）。
- [ √ ] `create-application.scss` 中大量 `:deep(...)` 选择器在当前非 scoped 链路下不可用，导致表单/步骤条等样式命中异常。

### 二、修复
- [ √ ] 在 `CreateApplicationView.vue` 脚本中显式 `import './create-application.scss'`，移除底部 `<style src>`，确保样式稳定注入。
- [ √ ] 将 `create-application.scss` 中 Step1/Step2 相关 `:deep(...)` 改为普通后代选择器（`.arco-*`），恢复样式命中。
- [ √ ] 保留并生效标题字体统一、表单默认白底、底栏左对齐等前序修复。

### 三、校验
- [ √ ] `npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run build` 通过。
- [ √ ] 相关文件 lint 通过。

## 2026-03-05 Step1 表单状态回归修复（校验/选中态）

### 一、问题
- [ √ ] 数据传出/传入国家城市选择后，校验仍提示“请选择源国家/城市”。
- [ √ ] 「包含客户网络数据」单选有联动但未显示选中填充态。
- [ √ ] 「申请人通知选项」复选框勾选后未显示勾选态。

### 二、修复
- [ √ ] 为两个 `a-cascader` 启用 `path-mode`，并在 `@change` 中统一将值收敛为数组，确保与 `formRules` 的 `type: 'array'` 校验一致。
- [ √ ] 修正 `.apply-form` 中 radio/checkbox 的样式覆盖：保留默认白底未选中态，同时为 `.arco-radio-checked`、`.arco-checkbox-checked`、`.arco-checkbox-indeterminate` 显式恢复主色填充与边框。

### 三、校验
- [ √ ] `StepOneBasicInfo.vue` 与 `create-application.scss` lint 通过。
- [ √ ] `npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run build` 通过。

## 2026-03-05 Step1 国家/城市校验补充修复（值归一化）

### 一、问题
- [ √ ] 在部分交互路径下，`a-cascader` 的 `@change` 返回值不是数组，导致之前 `Array.isArray(val) ? val : []` 将有效选择误置空，提交时持续触发“请选择源国家/城市”。

### 二、修复
- [ √ ] 在 `StepOneBasicInfo.vue` 增加 `normalizeCityValue`，统一将 `string | number | array` 归一化为 `string[]`。
- [ √ ] `sourceCity/targetCity` 的 `@change` 改为使用 `normalizeCityValue(val)` 回填表单，确保规则 `type: 'array'` 稳定命中。

### 三、校验
- [ √ ] `StepOneBasicInfo.vue` lint 通过。
- [ √ ] `npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run build` 通过。

## 2026-03-05 Step2 按钮图标渲染修复（上传/操作列）

### 一、问题
- [ √ ] Step2 上传按钮与表格操作列按钮图标未渲染（页面显示空白图标位）。

### 二、修复
- [ √ ] 在 `StepTwoUploadFile.vue` 显式引入 `@arco-design/web-vue/es/icon` 的 `IconUpload/IconPauseCircle/IconPlayCircle/IconDelete/IconFile/IconRefresh/IconFolder`。
- [ √ ] 将模板中的 `icon-*` 标签统一替换为对应的 `Icon*` 组件，恢复上传按钮、批量操作按钮、表格操作列按钮图标渲染。

### 三、校验
- [ √ ] `StepTwoUploadFile.vue` lint 通过。
- [ √ ] `npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run build` 通过。

## 2026-03-05 Step3 视觉修复（成功图标/步骤条/按钮）

### 一、问题
- [ √ ] Step3 成功态绿色圆圈中缺少对号。
- [ √ ] 进入 Step3 后顶部步骤条第 3 步未处于激活态。
- [ √ ] 成功页底部按钮圆角与字体样式与 Figma 不一致。

### 二、修复
- [ √ ] `StepThreeSubmitSuccess.vue` 成功图标改为叠加 `3.svg + 4.svg`，补齐对号。
- [ √ ] `CreateApplicationView.vue` 中 `a-steps` 的 `current` 调整为 `currentStep + 1`，确保 Step3 激活。
- [ √ ] `create-application.scss` 补齐步骤条 `finish/process/active` 统一高亮与连线颜色，并调整成功页按钮高度、圆角、字体、色值与宽度。

### 三、校验
- [ √ ] `StepThreeSubmitSuccess.vue`、`CreateApplicationView.vue`、`create-application.scss` lint 通过。
- [ √ ] `npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run build` 通过。

## AI工时统计（SSD口径）

> 口径：AI工时 = Prompt + 等待 + Review + 改写 + 测试 + 返工。
> 项目累计实际投入：3天（按 8h/天折算 24h）。

| task_id | 模块/页面 | SSD阶段 | 复杂度(1-5) | 基线工时(h) | AI工时(h) | AI交互轮次 | 人工介入时长(h) | 返工次数 | 缺陷数 | 覆盖率(前/后) | 节省小时 | 节省率 | 单位复杂度节省 | 备注 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---|
| P6.2 | 创建申请单页面 | Requirements/Design/TaskList/执行 | 待补录 | 待补录 | 待补录（累计24h口径） | 待补录 | 待补录 | 待补录 | 待补录 | 待补录 | 待补录 | 待补录 | 待补录 | 多轮迭代，建议按日期分段回填 |



























