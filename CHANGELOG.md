# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed - 2026-05-07

#### 批量删除文件参数超长优化

- `useTransUpload.ts` `batchDeleteUploaded`：新增分批删除逻辑（每批最多 50 个文件），支持外部传入文件列表，避免文件过多时 URL 参数超长
- `TransUploadView.vue` `handleDeleteSelectedUploaded`：改用 `batchDeleteUploaded` 替代直接调 `removeFiles`，获得分批删除能力
- `StepTwoUploadFile.vue` `handleDeleteSelectedUploaded`：同上

### Fixed - 2026-05-07

#### LOGIN_USER_TYPE 页面刷新后重置为默认值

- `api/auth.ts` `LOGIN_USER_TYPE` 初始化值从硬编码 `2` 改为 `Number(localStorage.getItem('LOGIN_TYPE')) || 2`，页面刷新时优先从 localStorage 读取已保存的值
- `setLoginUserType` 新增 `localStorage.setItem('LOGIN_TYPE', String(value))`，设置时同步持久化，保证下次刷新能取到正确值

#### 详情页"当前处理人"在流程结束后隐藏

- `useApplicationDetail.ts` `basicInfoRows`：`applicationStatusId >= 81` 时不再显示"当前处理人"行
- `useApprovalDetail.ts` `basicInfoRows`：同上，逻辑一致

### Changed - 2026-05-07

#### "最近传输选择"对接真实后端接口

- 新增 `api/application.ts` 类型：`RecentApplicationItem`、`RecentDownloadUser`、`RecentApplicationParams`
- 新增 `api/application.ts` 方法：`getMyRecentApplication` — POST `/workflowService/services/frontendService/frontend/myRecentApplication`
- 新增 `useRecentApplication.ts` composable：根据源/目标区域 ID 自动请求最近传输列表，区域变化时自动重新请求
- `StepOneBasicInfo.vue`：
  - 移除 mock 的 `recentTransferTemplates` computed（来自 `useApplicationConfig`），改用 `useRecentApplication` 获取真实数据
  - 列表展示格式改为 `申请单号 | 下载人账号 | 状态 | 备注`
  - emit 从 `copyTemplate(text: string)` 改为 `copyTemplate(item: RecentApplicationItem)`
  - 增加 loading spin 和空状态提示
- `CreateApplicationView.vue`：
  - `onCopyRecentTemplate` 接收完整 `RecentApplicationItem` 对象
  - 回填逻辑：`reason` → `applyReason`，`downloadUsers[].w3Account` → `downloaderAccounts`
  - 不回填传输路由、直接主管等不可修改字段

### Fixed - 2026-05-06

#### 已上传文件列表全选功能修复

- `TransFileTable.vue`：`toggle-select-all-uploaded` 事件改为只传递元信息 `{ selected, searchKeyword }`，不再传递 `files` 数组，避免 Vite HMR 缓存导致 emit 参数丢失
- `StepTwoUploadFile.vue`：全选 handler 基于接收到的 `searchKeyword` 在本地过滤 `fileListData`，实现筛选后全选；修复 `:selected-uploaded-files` 多余 `.value` 导致传入 RefImpl 而非数组的问题
- `TransUploadView.vue`：同步适配新的 emit 载荷格式

### Added - 2026-04-27

#### 申请列表“驳回重提”与查询布局优化

- `ApplicationListView.vue` 当前流程列：`currentStatus === '创建申请单'` 时显示为"驳回重提"
- 去掉高级搜索区域，将"查询"/"重置"按钮移至搜索框同一行

#### 详情页“继续上传文件”隔离 canOperate 状态

- `ApplicationDetailView.vue` 移除底部"继续上传文件"按钮对 `canOperate` 的 `disabled` 绑定
  - `canOperate` 为资产检测 Tab 内部状态，不应跨 Tab 控制上传操作按钮

#### 驳回重提完整交互流程

- `useApplicationDetail.ts` `handleContinueUpload` 区分流程状态：
  - `applicationStatus === '创建申请单'`（驳回重提）：跳转 `/application/create?applicationId=xxx&step=1`
  - `applicationStatus === '文件上传'`（继续上传）：保持跳转 `/application/create?applicationId=xxx&step=2`
- `CreateApplicationView.vue` `onMounted` 识别 `step=1` 为驳回重提模式，调用 `loadApplicationById(applicationId, true)`
- `useApplicationForm.ts` 支持驳回重提模式：
  - 新增 `resubmitApplicationId` ref
  - `loadApplicationById` 增加 `isResubmit` 参数：为 true 时回填表单、设置 `resubmitApplicationId`、回到第一步
  - `handleNextWithSubmit`：当 `resubmitApplicationId` 存在时，即使 `isApplicationCreated` 为 true 也强制重新调用 `createReal`
- `CreateApplicationView.vue` 向 `StepOneBasicInfo` 传入 `resubmit-mode`，`readonly` 在驳回重提时降为 `false`，使大部分字段可编辑
- `StepOneBasicInfo.vue` 增加 `resubmitMode` prop，直接主管字段在驳回重提模式下仍保持 `:disabled="readonly || resubmitMode"`；源区域/目标区域本身为 readonly 输入，不受此影响
- `payloadConverter.ts` `buildCreatePayload` 增加可选 `applicationId` 参数，传入后写入 `appBaseInfo.applicationId`，后端据此更新原申请单

#### 申请列表跳转文件列表 Tab

- `ApplicationListView.vue` `onFileList` 完善 TODO：点击"文件列表"时跳转到申请详情页并默认选中"文件列表" Tab
  - 路由跳转改为 `router.push({ path, query: { tab: 'files' } })`
  - `useApplicationDetail.ts` `activeTab` 初始值从 `route.query.tab` 读取，支持 `info` / `files` / `detection`

### Fixed - 2026-04-27

#### 上传总量超限拦截修复

- 修复 `StepTwoUploadFile.vue` `handleFiles` 中仅校验单个文件大小、未校验已上传总量的场景
  - 新增 `applicationSize` 总量校验：已上传文件总大小 + 新上传文件总大小超过 `applicationSize` 时拦截上传
  - 错误提示展示当前总大小和最大限制，示例：`上传后总大小 6.00GB 超过最大限制 5.00GB`

#### 提交前 hash pending 拦截与组件卸载后报错气泡修复

- 修复 `validateBeforeSubmit` 未拦截服务端 hash 未返回（"等待服务端结果"/"未校验"）的场景
  - 新增第 3 道检查：已上传文件中 `clientFileHashCode` 有效但 `hashCode` 无效时，禁止提交并提示用户等待
- 修复组件卸载后 `refreshFileListWithRetry` 递归链与 `fileListPolling` 请求仍继续执行导致的报错气泡
  - `StepTwoUploadFile.vue` / `TransUploadView.vue` 引入 `isMountedRef`，`refreshFileListWithRetry` 在每次 `loadFileList` / `setTimeout` 前后检查存活状态
  - `onUnmounted` 中增加 `abortFileListRequest()` 和 `cancelDebouncedLoadFileList()`，取消 pending 请求与 debounce timer
  - `useTransUpload.ts` `loadFileList` 增加 `AbortController`，新请求自动 abort 上一次 pending 请求
  - `useTransUpload.ts` 将 `debouncedLoadFileList` 从 `useDebounceFn` 改为自定义防抖实现，暴露 `cancelDebouncedLoadFileList`（VueUse 14 的 `useDebounceFn` 不返回 `cancel`）
  - `transWebService.ts` `getFileList` 增加 `signal` 参数透传至 axios
  - `TransUploadView.vue` `handleManualConfirmSubmit` 同步增加完整的提交前校验（active 文件 / hash mismatched / hash pending）

### Fixed - 2026-04-22

#### 大文件上传 Hash 计算内存溢出修复

- 修复上传大文件（5GB+）时 `calculateSHA256(file)` 因 `file.arrayBuffer()` 一次性读取全文件导致 `NotReadableError` 的问题
  - `transWebService.ts` `calculateSHA256` 改为基于 `hash-wasm` 的流式实现，分片读取文件，内存占用恒定
  - 新增 `calculateChunkHashFromBuffer` 辅助函数，避免分片 hash 计算中重复读取 ArrayBuffer
- 修复大文件上传完成后二次读取全文件计算 hash 的性能问题
  - `useTransUpload.ts` 大文件上传时创建流式 hasher，在 `uploadSingleChunk` 中边上传边累积 hash
  - 上传完成后直接取 `hasher.digest()`，50GB 文件无需额外读取
  - 重试逻辑同步改造，避免重试完成后再次全量读取
- 优化上传前重复文件检测对大文件的处理
  - `TransUploadView.vue` / `StepTwoUploadFile.vue` 对大于 100MB 的文件跳过上传前全量 hash 计算
  - 防止大文件在上传前就因 hash 计算导致页面卡死或报错

### Fixed - 2026-04-21

#### 下载功能 BUG 修复

- 修复下载文件内容为 HTML 的问题：`useApplicationDetail.fetchDetail` 中 `updateTransClientBaseURL` 使用的是 `uploadUrl`，导致 `transClient.baseURL` 指向上传服务器；下载时请求到达上传服务器返回 SPA 首页 HTML，而非真实文件
  - `useFileDownload.downloadFile/batchDownload` 在下载前调用 `updateTransClientBaseURL(downloadUrl)` 指向下载服务器
  - `useTransDownload.initialize` 在初始化时用当前页面 URL 更新 `transClient.baseURL`
- 修复下载成功提示先于浏览器下载弹窗的问题：`downloadAndSave` 在触发 `link.click()` 后延迟 300ms 再 resolve，给浏览器处理下载对话框的时间
- 新增 `validateDownloadBlob` 校验：当服务端返回 HTML 而非文件时（如认证过期被重定向），检测 Blob 内容并抛出明确错误，避免静默保存无效文件

### Fixed - 2026-04-18

#### 上传暂停 BUG 修复

- 修复暂停上传只能生效一次的问题：`resumeUpload` → `uploadFile` 时 `generateFileUUID` 因含 `Date.now()` 会生成新 UUID，导致 `abortControllers` Map 中的 key 与列表 `item.id` 不一致，第二次暂停找不到 AbortController
- 修复暂停后继续上传进度从 0 重新开始的问题：新 UUID 导致 `checkChunkStatus` 查不到服务端已上传分片，全部分片重新上传
- 修复 `checkChunkStatus` 将 `hash=partial` 误判为分片不完整的问题：`partial` 仅表示服务端哈希未算完，不代表数据不完整；改为按 `size` 判断数据完整性（非最后分片 `size >= CHUNK_SIZE`、最后分片 `size > 0` 即为完整）
- `uploadFile` 增加可选参数 `existingFileUUID`，resume/retry 场景复用已有 UUID
- 同步修复 `retryUpload` 也会生成新 UUID 导致列表重复的问题

### Docs - 2026-04-18

#### 资产检测模块 quickStart 文档

- 新增 `docs/guides/quickstart-asset-detection.md` — 资产检测确认功能开发&测试指南
  - 架构总览（View / Component / Composable / API 四层结构图）
  - 核心类型定义与关键字段说明
  - 两级串行确认流程详解（文件确认 → 关键资产确认）
  - 组件通信方式（Props / Emits / 事件桥接完整映射表）
  - 筛选与分页规则
  - 开发指南（新增使用场景、ref(new Set()) 响应式注意事项）
  - QA 回归测试用例（21 条，覆盖数据加载、文件确认、关键资产确认、完整流程、筛选分页、密级显示）

### Changed - 2026-04-16

#### 对接统一登录系统 (SSO)

- 移除自建登录表单，改为重定向到统一登录系统 (`https://10.90.37.157/usercenter/login`)
- 未登录时自动重定向到统一登录系统，带上 `redirectUrl` 参数
- SSO 回调通过 URL `token` 参数完成登录，自动换取用户信息
- `/login` 路由保留为 SSO 回调中转页，不再展示登录表单
- `authApi.login()` 适配新响应格式，从 `userDO` 提取用户信息
- 新增 `authApi.fetchUserByToken()` 用于 SSO token 换取用户信息
- `authStore.logout()` 改为重定向到统一登录系统
- 移除 token 定时刷新逻辑（由统一登录系统管理 token 生命周期）
- 401 拦截器改为重定向到统一登录系统

##### 变更文件

- **types/user.ts**: 新增 `SsoUserDO`、`SsoLoginResponse` 类型
- **api/auth.ts**: 新增 `SSO_LOGIN_URL`、`buildSsoRedirectUrl()`、`fetchUserByToken()`；`login()` 适配新响应格式
- **stores/auth.ts**: 新增 `loginByToken()`、`redirectToSso()`；移除 `useIntervalFn` 定时刷新；`logout()` 重定向到 SSO
- **composables/useLogin.ts**: 重构为 SSO 回调处理，移除登录表单逻辑和 demo 账号
- **utils/request.ts**: 401 拦截器改为 `authStore.redirectToSso()`
- **router/guards.ts**: 未登录时改为重定向到统一登录系统
- **views/auth/LoginView.vue**: 改为 SSO 回调中转页

### Added - 2026-04-16

#### 下载人邮箱自动填充

- 选择下载人账号时，自动从 suggestUser 接口返回的 email 字段带出邮箱地址
- 多个下载人的 email 用分号（;）分隔传给后端 `appBaseUploadDownloadInfo.downloadEmail`
- 外网场景手动输入的 `downloadEmail` 作为 fallback

##### 变更文件

- **components/business/UserSuggestSelect.vue**: `change` 事件新增第二个参数 `selectedItems: UserSuggestOption[]`，传出选中项完整信息
- **composables/useApplicationForm.ts**: `ApplicationFormData` 新增 `downloaderEmails: string[]` 字段，`defaultFormData`/`cloneFormData`/`loadDraft`/`loadApplicationById` 同步更新
- **views/application/components/StepOneBasicInfo.vue**: `onDownloaderAccountsChange` 接收 `selectedItems`，按账号顺序收集 email
- **utils/payloadConverter.ts**: `downloadEmail` 改为从 `downloaderEmails` 拼接（分号分隔），无邮箱时 fallback 到手动输入

### Fixed - 2026-04-16

#### 资产检测结果 BUG 修复：文件不显示 + 确认按钮无反应 + 审批输入框未出现

**根因**：接口3 (`findKiaResultList`) 实际响应为 `{ pageVO, result }` 结构，但类型定义和解析逻辑期望 `{ list, total, pages }`，导致 `res.list` 为 `undefined`，文件列表始终为空。

##### 修复

- **types/assetDetection.ts**: `KiaResultListResponse` 适配后端实际结构 `pageVO + result`，新增 `KiaResultPageVO` 类型
- **composables/useAssetDetection.ts**:
  - `fetchKiaResultList`: 数据解析从 `res.list` → `res.result`，分页从 `res.total` → `res.pageVO.totalRows`
  - `allFilesConfirmed`: 改为基于 `confirmedFiles.size >= pagination.total` 判断，覆盖分页场景
- **AssetDetectionTab.vue**:
  - 文件确认操作栏条件从 `!allFilesConfirmed` 改为 `!fileConfirmationCompleted`，修复"完成文件确认"按钮永远不显示的 BUG
  - `keyAssetColumns` 浅拷贝改为 `map` 创建新对象，避免污染 `fileColumns` 缓存
- **3个 View 页面** (ApplicationDetailView/ApprovalDetailView/AdminApplicationDetailModal): 补充解构 `fileConfirmationCompleted` 并传递 prop

### Added - 2026-04-16

#### 填单页面"外网传xx"场景增加上传方信息字段

**需求**：当源区域为外网（fromId=2，即"外网传xx"场景）时，在"下载人账号"上方增加"上传方名称"和"上传方邮箱地址"两个必填输入框。

##### 新增/修改

- **types/ApplicationFormData**: 新增 `uploaderEmail` 字段（映射到 `appBaseUploadDownloadInfo.uploaderEmail`），`vendorName` / `downloadEmail` 注释更新为外网通用字段说明
- **StepOneBasicInfo.vue**:
  - 新增 `isSourceExternal` 计算属性（源区域=外网判断）
  - 新增 `onUploaderEmailChange` 事件处理
  - 模板中"下载人账号"上方增加 `v-if="isSourceExternal"` 条件区块，含"上传方名称（单位/人）"和"上传方邮箱地址"两个必填输入框
  - `vendorName` 字段复用：目标=外网时标签为"下载方名称"，源=外网时标签为"上传方名称"（两种场景互斥）
- **useApplicationForm.ts**:
  - `formRules` 新增 `sourceArea === 'external'` 条件分支，校验 `vendorName` 和 `uploaderEmail` 必填 + 邮箱格式
  - `defaultFormData` 增加 `uploaderEmail: ''` 初始值
  - `loadApplicationById` 解构 `appBaseExternalInfo`，回填 `vendorName` / `downloadEmail` / `uploaderEmail`
  - `loadDraft` 回填 `vendorName` / `downloadEmail` / `uploaderEmail`
- **payloadConverter.ts**: 注释更新（`vendorName` 说明改为"外网方名称"）

### Changed - 2026-04-16

#### 区域配置动态化：消除硬编码映射 + 移除红区

**核心改动**：新增 `regionConfig` Store 从后端动态获取区域元数据（`region_type` 接口），替代所有前端硬编码映射（`AREA_ID_MAP`、`ID_TO_AREA`、`AREA_LABEL_MAP` 等）。同时全面移除已废弃的"红区"(red)，区域只保留 `green`/`yellow`/`external` 三种。

##### 新增

- **stores/regionConfig.ts**: 新增全局 Store，请求后端 `region_type` 接口，构建动态映射（`idToCode`/`codeToId`/`codeToName`/`nameToCode`），提供工具方法（`getIdByCode()`/`getCodeById()`/`getNameById()`/`formatTransferTypeLabel()`/`formatTransWayLabel()`），含 fallback 降级
- **App.vue**: 在 `onMounted` 中初始化 `regionConfigStore.fetchRegionConfig()`，确保全局可用

##### 修改

- **constants/region.ts**: 移除 `red` 类型；删除硬编码映射表（`AREA_ID_MAP`/`ID_TO_AREA`/`AREA_LABEL_MAP`/`LABEL_TO_AREA`/`AREA_OPTIONS`），保留 `SecurityArea` 类型和 `@deprecated` fallback 函数
- **constants/transferType.ts**: 移除红区相关选项，`TRANSFER_TYPE_OPTIONS` 改为基于 `green`/`yellow`/`external` 三区域交叉生成
- **stores/regionMetadata.ts**: `setMetadataFromIds()` 改用 `regionConfigStore` 动态映射，删除对 `ID_TO_AREA`/`AREA_LABEL_MAP` 的硬编码 import；`RegionConfig.code` 类型改为 `SecurityArea`
- **composables/useApplicationForm.ts**: `transferTypeAlias` 移除 `external→red` 归一化，`green-to-hisilicon` 改为 `green-to-external`
- **composables/useApplicationDetail.ts**: 删除本地 `REGION_ID_TO_NAME`，改用 `regionConfigStore.getNameById()`
- **composables/useApprovalDetail.ts**: 同上
- **composables/useApplicationList.ts**: 删除本地 `formatTransWay` 硬编码映射，改用 `regionConfigStore.formatTransWayLabel()`
- **composables/useApprovalList.ts**: 删除 `AREA_ID_MAP` import，`getAreaIdsFromTransferType()` 改用 `regionConfigStore.getIdByCode()`
- **composables/useSystemConfig.ts**: `green-to-red`/`green-to-hisilicon-red`/`yellow-to-red`/`red-to-red` 改为 `green-to-external`/`yellow-to-external`/`external-to-external`
- **views/admin/UIConfigView.vue**: `zoneOptions` 移除红区和海思红区选项
- **views/application/CreateApplicationView.vue**: URL 参数初始化改用 `setMetadataFromIds`，确保 `name` 字段通过映射获取中文标签

##### Mock 数据清理

- **mocks/handlers/uiConfig.ts**: 红区 tab 改为外网；`green-to-red`/`green-to-hisilicon`/`yellow-to-red`/`red-to-red` 改为 `green-to-external`/`yellow-to-external`/`external-to-external`
- **mocks/handlers/systemConfig.ts**: 同步替换红区传输类型
- **mocks/handlers/regionManage.ts**: 红区安全域改为外网
- **mocks/handlers/approval.ts**: `approvalLevelMap` 红区 key 改为 external
- **mocks/handlers/application.ts**: `sourceArea`/`targetArea` 默认值 `'red'` 改为 `'external'`
- **mocks/data/applications.ts**: `targetArea: 'red'` 改为 `'external'`，`transferType: 'green-to-red'` 改为 `'green-to-external'`

### Changed - 2026-04-15

#### 传输类型硬编码移除（续）：下拉选项动态生成 + 默认值常量化

**核心改动**：继续移除上一轮遗留的硬编码，将 `TRANSFER_TYPE_OPTIONS` 改为基于 `AREA_OPTIONS` 动态交叉生成，`'green-to-green'` 等默认值统一为 `DEFAULT_TRANSFER_TYPE` 常量。

##### 修改

- **constants/transferType.ts**: 新增 `DEFAULT_TRANSFER_TYPE` 常量；`TRANSFER_TYPE_OPTIONS` 从硬编码 10 个选项改为基于 `AREA_OPTIONS` 交叉动态生成（排除 external，附加 "跨国传输"）；`TRANSFER_TYPE_OPTIONS_WITH_ALL` 同步改为动态
- **composables/useApplicationForm.ts**: `transWayToTransferType()`/`normalizeTransferType()` 中 `'green-to-green'` 默认值改用 `DEFAULT_TRANSFER_TYPE`；`transferTypeAlias` 中 `'routine-apply'` 默认值改用 `DEFAULT_TRANSFER_TYPE`
- **stores/application.ts**: `createDraft()` 默认值 `'green-to-green'` 改用 `DEFAULT_TRANSFER_TYPE`
- **views/application/CreateApplicationView.vue**: URL query 默认值 `'green-to-green'` 改用 `DEFAULT_TRANSFER_TYPE`

### Changed - 2026-04-14

#### 传输类型 label 硬编码移除：枚举映射改为动态生成

**核心改动**：将 `TRANSFER_TYPE_LABEL_MAP`、`transferTypeLabelMap` 等硬编码枚举映射统一替换为动态生成，消除前端对传输类型枚举的硬编码依赖。

##### 修改

- **constants/transferType.ts**: `TransferType` 类型从 10 个字面量联合放宽为 `string`；移除 `TRANSFER_TYPE_LABEL_MAP`、`getTransferTypeLabel()`、`isValidTransferType()`；保留 `TRANSFER_TYPE_OPTIONS`/`TRANSFER_TYPE_OPTIONS_WITH_ALL`（待后端提供动态接口后移除）
- **constants/region.ts**: 新增 `formatTransWayLabel(transWay)` 将后端 transWay 格式化为中文显示；新增 `formatTransferTypeKeyLabel(typeKey)` 从传输类型 key（如 `green-to-red`）动态生成中文标签
- **stores/regionMetadata.ts**: 新增 `getTransferTypeLabel()` 方法，基于 store 中区域元数据动态拼接 `"{源区域}传到{目标区域}"` 标签
- **composables/useApplicationForm.ts**: `transferTypeLabel` 改为 `regionMetadataStore.getTransferTypeLabel()` 动态生成；`transWayToTransferType()`/`normalizeTransferType()` 移除硬编码 `validTypes` 集合，改为格式校验；移除 `TRANSFER_TYPE_LABEL_MAP` 导入
- **composables/useTransferManage.ts**: 移除硬编码 `transferTypeLabelMap`，`getTransferTypeLabel()` 改用 `formatTransferTypeKeyLabel()`
- **views/approvals/ApprovalListView.vue**: 移除 `TRANSFER_TYPE_LABEL_MAP` 引用，表格列改用 `formatTransferTypeKeyLabel()`

### Changed - 2026-04-14

#### 申请单页面区域硬编码统一重构

**核心改动**：`/application/create` 路径下的区域相关硬编码统一迁移到 `regionMetadataStore`，与首页/dashboard 已完成的重构保持一致。

##### 修改

- **regionMetadataStore.ts**: 新增 `setMetadataFromIds(fromId, toId)` 方法（ID→code/name 反查集中到 store）、`getFromName()`/`getToName()`/`getFromCode()`/`getToCode()` getter
- **StepOneBasicInfo.vue**: 区域字段从可编辑下拉框改为只读回显（`<a-input readonly>`），从 `regionMetadataStore` 读取中文名显示；移除 `AREA_OPTIONS` 导入、`onSourceAreaChange`/`onTargetAreaChange` 处理函数、`SecurityArea` 类型导入；外网判断改为 `isTargetExternal` 计算属性
- **useApplicationForm.ts**: 移除 `inferAreas()` 硬编码推断函数，回退逻辑改为从 `transferType` 字符串 `split('-to-')` 解析；`loadApplicationById` 中用 `regionMetadataStore.setMetadataFromIds()` 替代直接 `ID_TO_AREA` 引用；移除 `sourceArea`/`targetArea` 表单校验规则（只读字段无需校验）
- **components/constants.ts**: 移除 `AREA_OPTIONS` 重新导出

##### 不影响提交参数

`payloadConverter.ts` 已通过 `regionMetadataStore.getFromId()/getToId()` 获取区域 ID 构造提交参数，本次改动不影响最终提交。

### Changed - 2026-04-14

#### 部门自动初始化 - 进入页面自动查询回填

##### 修改

- **DepartmentSelector.vue**: 新增 `autoInit` prop（默认 false），当为 true 时组件挂载自动调用 `search-dept-by-account` 接口查询当前用户部门，回填到表单并触发 `change` 事件（联动后续审批人等字段），无需打开对话框；自动初始化期间显示 loading 状态（"正在获取部门信息..."）
- **DepartmentSelector.scss**: 新增 `__loading-text` 样式
- **StepOneBasicInfo.vue**: 传递 `:auto-init="true"` 给 DepartmentSelector

### Changed - 2026-04-14

#### useCitySelection & useApprovalRoute 区域配置化重构

**核心改动**：完成申请单流程最后两个 composable 的区域硬编码清理。

##### 修改

- **useCitySelection.ts**: 移除未使用的 `sourceArea/targetArea` 函数参数，简化签名为 `useCitySelection(onUpdateFormData)`
- **useApprovalRoute.ts**: 移除 `isHighToLow` 计算属性（硬编码 `highAreas/lowAreas` 列表），改由 `useSecurityLevel.displaySecretLevel` 控制 UI；移除 `sourceArea/targetArea` 函数参数
- **StepOneBasicInfo.vue**: 用 `displaySecretLevel`（后端 `isDisplaySecretLevelControl` 驱动）替代 `isHighToLow` 控制密级和审批人区域显示；更新 composable 调用签名
- **useSecurityLevel.ts**: 移除未使用的 `computed` 导入
- **components/constants.ts**: 恢复 `AREA_OPTIONS` 导出（区域下拉框仍需使用，待后端提供动态接口后移除）

##### 附带修复（预先存在的构建错误）

- **useApplicationForm.ts**: 移除未使用的 `useFileStore` 导入
- **dashboard/index.vue**: 移除未使用的 `openAfficheLink` 解构
- **auth.ts**: 修复 `login` 函数 `params` 参数隐式 `any` 类型
- **RoleSwitcher.vue / login/index.vue / auth.spec.ts**: 修复 `login` 调用参数（从两参数改为对象形式）
- **mocks/handlers/uiConfig.ts**: 为 mock 数据添加 `fromStyle/toStyle` 字段
- **UIConfigView.vue**: 为 `transferTypeForm` 添加 `fromStyle/toStyle` 字段

### Changed - 2026-04-14

#### 区域配置化重构 - 去除前端硬编码映射

**核心改动**：前端不再维护任何区域映射硬编码，所有区域信息从后端接口获取。

##### 新增

- **regionMetadata Store**: `src/stores/regionMetadata.ts` - 存储首页卡片配置的区域元数据
  - `useRegionMetadataStore` - 提供 `setMetadata`、`getFromId`、`getToId` 等方法
  - 数据来源：`itemAttr5`（格式：`fromCode:green,fromName:绿区,fromId:1,toCode:yellow,toName:黄区,toId:0`）

##### 修改

- **useTransferConfig.ts**: 解析 `itemAttr4`（from/to 各自样式，用 `|` 分隔）和 `itemAttr5`（区域元数据）
- **SelectTypeView.vue**: 两个子卡片分别应用 `itemAttr4` 中的 fromStyle 和 toStyle，URL 带上 `fromId`/`toId` 数字 ID
- **useSecurityLevel.ts**: 从 store 读取区域 ID，移除 `HIGH_TO_LOW_PAIRS` 预判逻辑，改用 `isDisplaySecretLevelControl` 控制 UI
- **useCitySelection.ts**: 从 store 读取区域 ID
- **useApprovalRoute.ts**: 从 store 读取区域 ID
- **payloadConverter.ts**: 从 store 读取区域 ID
- **types/uiConfig.ts**: `UITransferTypeConfigItem` 添加 `itemAttr5` 和 `cardStyle` 字段

##### 删除

- **src/config/icons.ts**: 删除整个文件（不再需要图标映射表）
- **constants/transferType.ts**: 删除 `APPROVAL_LEVEL_MAP`
- **components/constants.ts**: 删除 `HIGH_TO_LOW_PAIRS`
- **select-type.scss**: 删除 `.zone-*` 渐变色样式（不再需要）

##### 待后端配合

- `itemAttr2`: from 区域图标路径
- `itemAttr3`: to 区域图标路径
- `itemAttr4`: 卡片 CSS 样式（可选）
- `itemAttr5`: 区域元数据（`fromCode,fromName,fromId,toCode,toName,toId`）

### Changed - 2026-04-14

#### 清理模拟时期遗留代码

- **SelectTypeView.vue**: 删除未使用的 `getTransferIcons` 导入、`RoutineCard` 接口定义
- **useApplicationForm.ts**: 删除 `handleSubmit`（模拟时期创建申请）、`refreshUploadedList`（无实际功能）方法
- **createApplicationView.vue / CreateApplicationView.vue**: 删除 `draftApplicationNo`、`goBack`（`onCancel` 已替代）
- **StepOneBasicInfo.vue**: 同步删除 `draftApplicationNo` prop 及相关使用
- **types.ts**: 同步删除 `StepOneBasicInfoProps.draftApplicationNo`

### Added - 2026-04-13

#### 首页帮助文档 & 重要公告对接真实后端接口

- **新增 API**: `uiConfigApi.getHelpDocs()`、`uiConfigApi.getTopAffiches()` - 获取帮助文档和公告列表
- **新增类型**: `HelpDocItem`、`TopAfficheItem` 接口定义
- **新增 Composable**: `useHelpDocs`、`useTopAffiches` - 业务逻辑封装

##### 帮助文档功能
- 使用中文链接（itemAttr1）作为跳转目标
- 使用 lastUpdateDate 并格式化为 `YYYY-MM-DD HH:mm`
- 不做数据筛选，显示所有记录
- 无数据时显示"暂无帮助文档"
- 点击文档在新窗口打开链接

##### 重要公告功能
- 标题使用 itemAttr1（为空时用固定标题"系统公告"）
- 正文直接使用 itemDesc，链接从 itemAttr3 获取
- 图标使用 itemAttr2 字段
- 时间和内容同一行显示在最右侧
- 无数据时显示"暂无公告"

### Docs - 2026-04-13

- 新增 `docs/guides/Dashboard_Notices_HelpDocs_quickStart.md` - 首页公告与帮助文档功能开发&测试指南

### Fixed - 2026-04-10 (构建修复第二轮)

#### `pnpm run build:tenant` 零错误构建修复

- **vue 组件未使用变量**：移除 `AdminApplicationDetailModal.vue`（`onMounted/ref/downloading/downloadingFile/canOperate`）、`SystemConfigView.vue`（`PageContainer`）、`UserManageView.vue`（`modalTitle`）、`ApplicationDetailView.vue`（`isNotUploaded/downloading/downloadingFile`）、`ApprovalDetailView.vue`（`statusClass/handleExempt`）、`DownloadListView.vue`（3个未用函数）、`TransDownloadView.vue`（`loading/formatFileSize`）、`TransFileTableDemo.vue`（`computed`）中未使用变量/导入
- **UserManageModal.vue**：移除未使用的 `departmentTree` computed
- **ChannelServerModal.vue**：`moved` 变量加非空断言 `!` 修复可能 undefined
- **UIConfigView.vue**：3处 `[current]` 解构改为 `.splice()[0]!`；`@change` 回调参数 `val` 添加 `string` 类型注解
- **SelectTypeView.vue**：`routineCards` 初始对象加 `as const`，保留字面量类型，修复 `fromZone` 类型不匹配
- **stores/auth.ts**：`login()` 函数改为接受可选参数 `_username?`, `_password?`，修复 `login.vue` 和 `RoleSwitcher.vue` 传参报错
- **composables/useUserManage.ts**：`fetchList` 中显式构造 `params` 对象，确保 `status` 不传空字符串，修复类型不兼容
- **mocks/handlers/auditLog.ts**：预先声明 `detail: string` 和 `resource: string` 变量，修复对象字面量中可能 undefined 的类型错误
- **测试文件修复**：
  - 删除所有 spec.ts 中废弃的 `storageSize/uploadExpireTime/downloadExpireTime` 字段引用
  - `useApplicationList.spec.ts`：`filteredList` → `listData`
  - `useDownloadList.spec.ts`：`filteredList` → `listData`；注释掉不存在的 `markDownloaded` 调用
  - `useApprovalList.spec.ts`：删除 `filters.applicant` 引用
  - `useSystemConfig.spec.ts`：`loadConfig` → `fetchConfig`
  - `stores/__tests__/approval.spec.ts`：完全重写，对齐新 store API
  - `composables/__tests__/useApprovalDetail.spec.ts`：完全重写，对齐 `ApplicationDetailResponse` 接口
  - `DepartmentSelector.spec.ts`：数组访问加 `!` 断言，`element.value` 加 `HTMLInputElement` 类型转换



#### 构建类型错误修复

- **TransFileTableDemo.vue**: 将 mock 数据中 `fileId` 从 `string` 改为 `number`，匹配 `FileEntity.fileId: number` 类型定义
- **TransFileTableDemo.vue**: 补全 `FileEntity` mock 数据缺失的 `extension`、`hashCode`、`clientFileHashCode` 必填字段
- **TransFileTableDemo.vue**: 将 `hashState.localHash` 改为 `hashState.clientHash`，匹配 `HashVerifyState` 类型定义
- **TransFileTableDemo.vue**: 补全所有 `TransUploadFileItem` mock 数据缺失的 `relativeDir` 字段
- **TransFileTableDemo.vue**: 修复 `addTestFile()` 中 `name` 可能为 `undefined` 的类型问题（添加 `!` 断言）
- **TransferManageView.vue**: 移除未使用的 `TransferType` 类型导入

### Added - 2026-04-09

#### 老代码遗漏逻辑补充（按 P 级优先级）

- **P0-1 上传错误分类处理**: 新增 `src/types/upload-error.ts`，定义 `UploadErrorType` 枚举和 `classifyUploadError` 函数，对齐老代码 `onError` 中的错误分类（登录过期、文件已存在、文件正在上传、文件名超长、拒绝访问等），`useTransUpload.ts` 的 `catch` 块使用错误分类替代简单 `error.message`
- **P0-2 取消上传通知后端**: 新增 `cancelUploadApi` API（`UploadHandler?act=cancel`），`cancelUpload` 方法在取消上传时通知后端清理临时分片文件，对齐老代码 `onCancel` 逻辑
- **P0-3 文件名/路径合法性校验**: 新增 `src/utils/upload-validator.ts`，实现 `validateFileName` 和 `validateFilePath`，对齐老代码 `onSubmit` 校验（黑名单字符 `blackList`、文件名长度 `maxLength4Name`、路径长度 `maxLength4Path`），两个上传页面在上传前批量校验

- **P1-4 分片哈希传后端**: `uploadSingleChunk` 将 `qqhashcode` 附到 FormData，对齐老代码 `onUploadChunk` 将分片哈希传给后端
- **P1-5 存储空间上限校验**: 新增 `getStorageInfo` API（`UploadHandler?act=storage`），`useTransUpload` 新增 `checkStorageSpace` 方法，两个上传页面在上传前检查总空间是否超限，对齐老代码 `onValidate`
- **P1-6 自动重试机制**: `useTransUpload.ts` 的 `catch` 块中，对可重试错误（网络错误、服务端 5xx）自动重试最多 3 次（`MAX_AUTO_RETRY`），每次间隔 2 秒，对齐老代码 `retry.enableAuto: true, autoAttempts: 3`

- **P2-7 小文件预计算哈希**: 对 ≤4MB 的文件，在分片上传前预计算 SHA256 哈希（`preCalculatedHash`），避免上传后再计算，对齐老代码 `onUpload` 中小文件先算 hash 的逻辑
- **P2-9 服务端耗时/剩余时间展示**: `HashVerifyState` 新增 `elapsedTime`/`timeLeft` 字段，从分片上传响应中解析，`TransFileTable.vue` 在校验中和校验通过时展示耗时/剩余时间信息

#### API 变更

- `transWebService.ts`: 新增 `cancelUploadApi`、`getStorageInfo`，`UploadResponse` 已有 `elapsedTime`/`timeLeft` 字段（补充注释）
- `useTransUpload.ts`: `cancelUpload` 签名改为 `(fileId: string, params?: string)`，`batchCancel` 签名改为 `(params?: string)`

### Fixed - 2026-04-09

#### 进度条宽度溢出修复（核心 bug）

- **Arco Design `a-progress` 的 `percent` 属性期望 0-1 小数**: 组件内部 `barStyle.width = percent * 100 + '%'`，传入整数（如 50）导致宽度变为 5000%，进度条溢出。`TransFileTable.vue` 中 `:percent="item.progress"` 改为 `:percent="item.progress / 100"`
- **composable 内部改用响应式引用更新进度**: `useTransUpload.ts` 的 `uploadFile` 函数中，push 后获取 `ri = uploadFileList.value[last]`（Vue Proxy 引用），后续所有属性修改通过 `ri` 进行，直接触发 Proxy setter，不再依赖外部 `onProgress` 回调同步
- **`StepTwoUploadFile.vue` 补充缺失的 `updateUploadProgress` 函数**: 该文件之前引用了 `updateUploadProgress` 但未定义，导致进度更新回调无法执行
- **`TransUploadView.vue` 简化 `updateUploadProgress`**: composable 内部已通过响应式引用直接更新，外部回调仅处理完成后从上传列表移除并刷新已上传列表

#### 上传进度条重构

- **进度计算改用分片计数法**: `useTransUpload.ts` 删除 `calcProgressFromServerTime`，改用 `calcChunkProgress(uploadedChunkCount, totalChunks)` 计算，`progress = 已上传分片数 / 总分片数 * 99`，上传阶段上限99%，校验通过后设100%
- **速率估算仅依赖 timeLeft**: 删除 `estimateSpeed`，改用 `estimateSpeedFromFile(fileSize, uploadedChunkCount, chunkSize, timeLeftSec)`，`speed = 剩余字节数 / timeLeft(秒)`
- **分片上传期间不更新进度/速率**: 去掉 `onUploadProgress` 回调中的进度和速率更新，仅在分片完成后统一更新
- **elapsedTime/timeLeft 格式解析修复**: 服务端返回 `"HH:MM:SS"` 格式，新增 `parseServerTime` 函数转为秒数
- **TransUploadFileItem 字段精简**: 删除 `uploadedBytes`/`uploadedChunks`/`lastElapsedTime`，新增 `uploadedChunkCount`（已上传分片数）、`lastTimeLeft`（服务端剩余时间秒数）
- **上传阶段隐藏哈希校验区域**: `TransFileTable.vue` 的哈希校验状态区域增加状态判断，上传中（uploading/pending）不展示
- **blackList base64 解码**: `upload-validator.ts` 新增 `decodeBlackList` 函数

#### 哈希校验逻辑对齐老项目

- **哈希校验改为无限轮询**: `useTransUpload.ts` 去掉30次重试上限，对齐老代码 `getServerHashTimer` 逻辑，服务端大文件算哈希可能很慢，需无限轮询直到 `serverFileHashCode.length === 64`
- **双端哈希都有效才比对**: 对齐老代码 `validHashTimer` 逻辑，`clientFileHashCode` 和 `serverFileHashCode` 都有有效值后才进行比对
- **去掉 `skipped` 状态**: 哈希校验不再有超时跳过的场景，状态只保留 `matched` / `mismatched` / `pending`
- **`getHashVerifyStatus` 增加长度校验**: `clientFileHashCode` 需长度为64才视为有效，与老代码 `clientFileHashCode.length === 64` 一致
- **自动提交逻辑适配**: 去掉 `skipped` 判断，只有 `matched` 才视为校验通过

#### 重复上传拦截优化

- **提示文案优化**: 从"以下文件已上传，已跳过"改为"XX文件在服务器上已存在，请勿重复上传"
- **比对逻辑增强**: 同时检查 `clientFileHashCode` 和 `hashCode`，任一有效且匹配即视为已存在
- 涉及文件: `StepTwoUploadFile.vue`, `TransUploadView.vue`

#### 重复上传拦截增加文件名校验

- **同hash不同文件名放行**: hash 相同但文件名不同的文件不再被拦截，只有 hash + 文件名都匹配才视为重复
- 涉及文件: `StepTwoUploadFile.vue`, `TransUploadView.vue`

#### 已上传文件 hashCode 为 null 时延迟刷新

- **问题**: 上传完成后立即 `loadFileList` 刷新已上传列表，此时后端 `hashCode` 还没算完，FileListHandler 返回 null，导致显示"未校验"
- **修复**: 新增 `refreshFileListWithRetry` 函数，上传完成后延迟刷新文件列表（最多3次/3秒间隔），直到 `hashCode` 有值
- 涉及文件: `StepTwoUploadFile.vue`, `TransUploadView.vue`

#### 上传组件 Bug 修复

- **修复进度条立即打满问题**: 在 `useTransUpload.ts` 的 `uploadFile` 函数中，向 `uploadSingleChunk` 传入 `onProgress` 回调，利用 axios `onUploadProgress` 将单分片内的字节进度实时映射到整体进度，替代原有的分片计数式跳变更新
- **修复自动提交勾选未生效**: 在 `StepTwoUploadFile.vue` 中添加 `watch` 监听 `uploadFileList` 变化，当所有文件上传完毕且哈希校验通过后自动调用 `confirmUpload` 并 emit `confirmed` 事件
- **移除 `debugger` 语句**: 清理 `StepTwoUploadFile.vue` 中遗留的 `debugger`

### Added - 2026-04-08

#### 已上传文件列表增强

- **单行删除按钮**: 已上传文件列表每行末尾增加"删除"文字按钮，支持单文件快速删除
- **SHA256 校验状态展示**: 已上传文件列表展示截断的 SHA256 哈希值（前8位...后4位），并通过颜色标记和状态标签展示校验结果（通过/未通过/未校验）
- **新增 emit 事件**: `TransFileTable` 组件新增 `delete-uploaded-file` 事件

### Changed - 2026-04-08

- `TransFileTable.vue` 已上传列表项布局从水平排列改为上下排列，以容纳更多文件信息
- 隐式 `any` 类型修复：`TransFileTable.vue`、`StepTwoUploadFile.vue` 中所有回调参数添加显式类型注解
- 移除未使用的 `IconFile` import 和 `uploading` 变量
- 重构自动提交 watch：从 `vue` 的 `watch + deep: true` 改为 VueUse 的 `watchDeep`，更简洁且语义明确
- 新增 `@vueuse/core` 依赖（已在 `package.json` 声明，本次确认安装到 node_modules）

### Added - 2026-04-08 (第二轮)

#### 重复上传拦截

- **SHA256 重复检测**: 上传文件时自动计算 SHA256 哈希值，与已上传且校验通过的文件进行双重比对（`clientFileHashCode === hashCode === fileHash`），拦截重复上传
- **重复提示**: 被拦截的文件名以警告提示展示给用户，未重复的文件正常上传

#### TransUploadView 功能对齐

- **自动提交**: 新增 `autoSubmitAfterUpload` 勾选框 + `watchDeep` 监听，上传完毕自动 `confirmUpload`
- **重复上传拦截**: 与 StepTwoUploadFile 一致的 SHA256 双重比对逻辑
- **已上传文件单个删除**: 新增 `handleDeleteUploadedFile` 方法 + `@delete-uploaded-file` 事件绑定
- **已上传列表 show-hash-status**: 已上传文件列表新增 `:show-hash-status="true"` prop
- **移除调试日志**: 删除 `updateUploadProgress` 中的 `console.log`

### Fixed - 2026-04-09

#### 哈希校验判断逻辑修复

- **问题**: 后端 `FileListHandler` 返回的 `hashCode` 始终为字符串 `"null"`，导致 `getHashVerifyStatus` 比对 `hashCode === clientFileHashCode` 永远为 `mismatched`
- **问题**: `updateClientHash` 在 HASH 校验之前调用，导致 `clientFileHashCode` 有值仅代表"客户端算过"，不代表"校验通过"
- **修复**: `useTransUpload.ts` 将 `updateClientHash` 调用移到 `UploadHandler?act=HASH` 返回 `success:true` 之后，确保 `clientFileHashCode` 有值 = 后端确认校验通过
- **修复**: `TransFileTable.vue` 的 `getHashVerifyStatus` 改为仅判断 `clientFileHashCode` 是否有有效值（非空且非 `"null"`），不再依赖 `hashCode`
- **修复**: `StepTwoUploadFile.vue` 和 `TransUploadView.vue` 的重复上传拦截逻辑，改为仅比对 `clientFileHashCode === fileHash`

### Added - 2026-04-03

#### 申请单管理（管理员）功能

- **新增页面**: `/admin/applications` - 管理员申请单管理页面
- **新增类型**: `AdminApplicationRecord`, `AdminApplicationFilters` 等类型定义
- **新增API**: `getAdminApplicationByPage` - 获取管理员视角申请单列表
- **新增Composable**: `useAdminApplication` - 申请单管理业务逻辑
- **新增组件**: `AdminApplicationDetailModal` - 申请单详情全屏对话框

#### 功能特性

- 多条件筛选：申请单号、申请人、下载人、安全等级、源/目标区域、时间范围
- 响应式网格布局：3列 → 2列 → 1列 自适应
- 分页表格展示：支持排序、固定列、状态着色
- 详情查看：基本信息、文件列表、资产检测、流程进展

#### 样式优化

- 筛选区域：渐变背景、图标前缀、响应式布局
- 表格：状态标签着色、文本溢出省略
- 对话框：90%宽度、85vh高度、居中显示

### Fixed - 2026-04-03

- 修复对话框不显示问题：添加 `ref`、`IconEye` 导入及组件引用
- 修复筛选区域布局问题：改用固定列数网格布局
- 修复对话框尺寸过大问题：调整为 90% 宽度、85vh 高度

---

## 初始化版本

项目基础架构搭建完成，包含：

- Vue 3 + TypeScript + Vite 前端框架
- Arco Design Vue 组件库
- Pinia 状态管理
- Vue Router 路由管理
- Axios 请求封装
