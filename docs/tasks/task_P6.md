# task_P6 - 申请单模块

## 任务目标

实现申请单的完整生命周期管理，包括选择传输类型、创建申请单、列表查询、详情查看、草稿保存恢复，以及部门/城市/用户选择器组件。

## 前置依赖

- P2.2 Mock 数据准备已完成
- P3.2 Application Store 已完成
- P4.3 布局组件已完成

---

## 子任务清单

### P6.1 选择传输类型页面（2h）

- [√] 创建 `src/views/application/SelectTypeView.vue`
  - 页面标题：「选择传输类型」
  - 7种传输类型卡片网格布局（3列，响应式）
    1. 绿区传到绿区（免审批）
    2. 绿区传到黄区（一级审批）
    3. 绿区传到红区（二级审批）
    4. 黄区传到黄区（一级审批）
    5. 黄区传到红区（二级审批）
    6. 红区传到红区（二级审批）
    7. 跨国传输（三级审批）
  - 每个卡片包含：
    - 图标（安全域色块组合）
    - 传输类型名称
    - 审批层级标签（免审/一级/二级/三级）
    - 简短说明（1-2句话）
    - 点击后跳转到创建申请单页面，携带 `type` query 参数
  - 卡片 hover 效果：阴影加深、轻微上浮
- [√] 样式文件 `src/views/application/select-type.scss`
  - 卡片间距、圆角、阴影
  - 安全域色块样式（绿/黄/红）

### P6.2 创建申请单页面（6h）

- [√] 创建 `src/views/application/CreateApplicationView.vue`

  - 页面标题：「创建申请单」+ 传输类型标签
  - 使用 `a-form` + `a-steps` 分步表单（3步）
    - Step 1：基本信息
    - Step 2：上传文件
    - Step 3：确认提交
  - **Step 1 基本信息表单字段**：
    - 传输类型（只读，从 query 参数获取）
    - 所属部门（DepartmentSelector，必填）
    - 源安全域（a-select，自动填充，可修改）
    - 目标安全域（a-select，必填）
    - 源国家/城市（CitySelector，必填）
    - 目标国家/城市（CitySelector，必填）
    - 下载人账号（UserSelector，多选，必填）
    - 包含客户网络数据（a-radio-group：是/否）
    - **条件字段**（当"包含客户网络数据"为"是"时显示）：
      - 客户授权文件（a-upload，必填）
      - SR单号（a-input，必填）
      - 最小部门主管（a-input，自动带出，只读）
    - 申请原因（a-textarea，必填，最多500字）
    - 申请人通知选项（a-checkbox-group：邮件/短信/站内信）
    - 下载人通知选项（a-checkbox-group：邮件/短信/站内信）
    - 存储大小（a-input-number，单位GB，默认50GB）
    - 上传有效期（a-date-picker，默认7天）
    - 下载有效期（a-date-picker，默认30天）
  - **Step 2 上传文件**：
    - 引入 `FileUpload` 组件（P7.1）
    - 显示已上传文件列表
    - 支持断点续传
  - **Step 3 确认提交**：
  - 表单校验规则：所有必填字段、文件大小不超过50GB
  - 自动保存草稿：每30秒自动保存到 LocalStorage
  - 页面离开提示：未提交时弹窗确认
- [ ] 创建 `src/composables/useApplicationForm.ts`
  - `formData` - 响应式表单数据
  - `currentStep` - 当前步骤（0/1/2）
  - `formRules` - 表单校验规则
  - `handleNext()` - 下一步（校验当前步骤）
  - `handlePrev()` - 上一步
  - `handleSaveDraft()` - 保存草稿到 Store
  - `handleSubmit()` - 提交申请单
  - `autoSaveDraft()` - 自动保存草稿（30秒定时器）
  - `loadDraft(draftId)` - 加载草稿数据
  - `watchCustomerDataField()` - 监听"包含客户网络数据"字段，动态显示/隐藏条件字段
- [√] 样式文件 `src/views/application/create-application.scss`


### P6.3 申请单列表页面（4h）

- [√] 创建 `src/views/application/ApplicationListView.vue`
  - 页面标题：「我的申请单」
  - 顶部操作栏：
  - 筛选区域（a-form inline）：
    - 申请单号或申请类型（a-input）
    - 状态（a-select：全部/草稿/待上传/待审批/已通过/已驳回/传输中/已完成）
    - 高级搜索点击下拉展开：
    - 创建时间范围（a-range-picker）
    - 查询按钮 + 重置按钮
  - 数据表格（a-table）：
    - 列：序号，申请单号，文件数，状态、申请原因，下载人名称、源城市、目标城市、创建时间、操作
    - 状态列：使用 `a-tag` 展示不同颜色（draft灰色/pending橙色/approved绿色/rejected红色/transferring蓝色/completed绿色）
    - 操作列：查看详情、继续编辑（仅草稿）、删除（仅草稿），撤回申请（仅待审批）
  - 分页器（a-pagination）
  - 空状态：无数据时显示空状态插图 + 引导创建
- [√] 创建 `src/composables/useApplicationList.ts`
  - `listData` - 列表数据
  - `loading` - 加载状态
  - `pagination` - 分页参数
  - `filters` - 筛选条件
  - `fetchList()` - 获取列表数据
  - `handleSearch()` - 搜索
  - `handleReset()` - 重置筛选
  - `handlePageChange()` - 翻页
  - `handleDelete(id)` - 删除草稿
- [√] 样式文件 `src/views/application/application-list.scss`


### P6.4 申请单详情页面（4h）

- [ ] 创建 `src/views/application/ApplicationDetailView.vue`
  - 页面标题：申请单号 + 状态标签
  - 底部操作栏（根据状态显示不同按钮）：
    - 草稿状态：继续编辑、删除
    - 待上传状态：上传文件
    - 待审批状态：撤回申请
    - 已通过状态：查看传输进度
    - 传输中状态：查看传输进度
    - 已完成状态：下载文件
  - 信息展示区域（a-des       criptions）：
    - 基本信息：申请人、传输类型、所属部门、存储大小、上传有效期、下载有效期
    - 申请信息：申请时间、申请原因，下载人账号列表，源/目标安全域、源/目标城市，
    - 客户数据信息（如有）：客户授权文件、SR单号、最小部门主管
    - 通知配置：申请人通知选项、下载人通知选项
  - 文件列表区域（a-table）：
    - 列：文件名、大小、上传时间、SHA256
    - 操作：下载（已批准状态）
    - 
  - 审批记录区域（仅需审 批的申请单，至于页面底部）：
    - 使用 `ApprovalTimeline` 组件（P8.4）
  - 传输进度区域（传输中/已完成状态）：
    - 使用 `TransferProgress` 组件（P9.1）
- [ ] 创建 `src/composables/useApplicationDetail.ts`
  - `detailData` - 详情数据
  - `loading` - 加载状态
  - `fetchDetail(id)` - 获取详情
  - `handleEdit()` - 编辑（跳转创建页面，携带 id）
  - `handleDelete()` - 删除
  - `handleWithdraw()` - 撤回申请
  - `handleUploadFile()` - 跳转上传文件页面
- [ ] 样式文件 `src/views/application/application-detail.scss`

### P6.5 草稿管理（2h）

- [ ] 创建 `src/views/application/DraftListView.vue`
  - 页面标题：「草稿箱」
  - 数据表格（a-table）：
    - 列：传输类型、创建时间、最后修改时间、操作
    - 操作：继续编辑、删除
  - 批量操作：批量删除
  - 草稿过期提示：超过30天的草稿标记为「即将过期」
- [ ] 在 Application Store 中实现草稿管理方法：
  - `saveDraft(draft)` - 保存草稿到 LocalStorage
  - `loadDraft(id)` - 加载草稿
  - `deleteDraft(id)` - 删除草稿
  - `getDraftList()` - 获取草稿列表
  - `clearExpiredDrafts()` - 清理过期草稿（30天）
- [ ] 草稿数据结构：
  ```typescript
  interface Draft {
    id: string
    formData: ApplicationFormData
    createTime: string
    updateTime: string
    expiresAt: string // 30天后
  }
  ```

### P6.6 选择器组件（4h）

#### P6.6.1 部门选择器

- [ ] 创建 `src/components/business/DepartmentSelector.vue`
  - 使用 `a-tree-select` 展示部门树
  - 支持搜索、清空
  - Props：`modelValue`（v-model 绑定）
  - Emits：`update:modelValue`, `change`
  - 从 Mock 数据加载部门树（`departmentApi.getTree()`）
  - 递归查找选中部门信息

#### P6.6.2 城市选择器

- [ ] 创建 `src/components/business/CitySelector.vue`
  - 使用 `a-cascader` 展示国家/城市级联
  - 支持搜索、清空
  - Props：`modelValue`（v-model 绑定，数组格式 `[countryId, cityId]`）
  - Emits：`update:modelValue`, `change`
  - 从 Mock 数据加载城市列表（`cityApi.getList()`）
  - 数据格式：
    ```typescript
    [
      {
        id: 'CN',
        name: '中国',
        cities: [
          { id: 'cn-beijing', name: '北京' },
          { id: 'cn-shanghai', name: '上海' }
        ]
      }
    ]
    ```

#### P6.6.3 用户选择器

- [ ] 创建 `src/components/business/UserSelector.vue`
  - 使用 `a-select` 多选模式
  - 支持搜索（远程搜索）、清空
  - Props：`modelValue`（v-model 绑定，数组格式 `string[]`）、`multiple`（是否多选，默认 true）
  - Emits：`update:modelValue`, `change`
  - 从 Mock 数据加载用户列表（`userApi.search(keyword)`）
  - 选项展示：用户名 + 姓名 + 部门

### P6.7 待我下载页面（4h）

- [√] 创建 `src/views/download/DownloadListView.vue`

  - 页面标题：「待我下载」
  - 页面布局按 Figma `4088_301`：
    - 顶部筛选区（搜索框 + 状态筛选 + 下载状态筛选）
    - 列表区（表格）
    - 底部分页与记录统计
  - 表格列：序号、申请单号、申请类型、文件数、状态、申请人、申请原因、创建时间、结束时间、操作
  - 操作列：查看详情、下载文件
  - 空状态：无记录时展示空态引导

- [√] 创建 `src/composables/useDownloadList.ts`

  - `listData` - 待我下载列表数据
  - `loading` - 加载状态
  - `filters` - 搜索条件（keyword/status/downloadStatus）
  - `pagination` - 分页参数
  - `fetchList()` - 获取列表数据
  - `handleSearch()` - 搜索
  - `handleReset()` - 重置筛选
  - `handlePageChange()` - 翻页
  - `handleDownload(applicationId)` - 触发下载行为

- [√] 路由与菜单接入

  - 新增路由：`/downloads/pending`
  - 侧边栏「个人工作台」下新增菜单「待我下载」
  - 菜单可见性：仅对“被选为下载人”的用户显示对应数据

- [√] 数据权限与筛选规则（详细设计）

  - 数据来源：申请单数据 + 文件元数据
  - 可见性规则：`application.downloaders` 包含当前登录用户时，该申请单出现在“待我下载”
  - 状态筛选：审批状态（全部状态/已批准/传输中/已完成等）
  - 下载状态筛选：全部下载状态/未下载/部分下载/已下载
  - 列表默认按 `createdAt` 倒序

- [√] 下载状态模型设计（前端 Mock 阶段）

  - 在下载侧建立 `downloadRecords`（可放 Pinia + localStorage/IndexedDB）
  - 记录维度：`applicationId + fileId + userId`
  - 状态定义：
    - `not_started`：未下载
    - `partial`：部分下载（多文件时）
    - `completed`：已下载
  - 聚合规则：
    - 0/总数 => 未下载
    - (0, 总数) => 部分下载
    - 总数/总数 => 已下载

- [√] 样式文件 `src/views/download/download-list.scss`

  - 卡片容器、筛选栏、表格、分页区样式
  - 与现有列表页视觉规范保持一致（玻璃态 + 圆角 + 轻阴影）

---


## 技术要点

### 条件字段显示逻辑
```typescript
const showCustomerDataFields = computed(() => {
  return formData.containsCustomerData === 'yes'
})

watch(() => formData.containsCustomerData, (newVal) => {
  if (newVal === 'no') {
    // 清空条件字段
    formData.customerAuthFile = null
    formData.srNumber = ''
    formData.minDeptSupervisor = ''
  } else {
    // 自动带出最小部门主管
    formData.minDeptSupervisor = getMinDeptSupervisor(formData.department)
  }
})
```

### 自动保存草稿
```typescript
let autoSaveTimer: number | null = null

onMounted(() => {
  autoSaveTimer = setInterval(() => {
    if (hasUnsavedChanges.value) {
      applicationStore.saveDraft({
        id: draftId.value || generateId(),
        formData: toRaw(formData),
        updateTime: new Date().toISOString()
      })
    }
  }, 30000) // 30秒
})

onUnmounted(() => {
  if (autoSaveTimer) clearInterval(autoSaveTimer)
})
```

### 页面离开提示
```typescript
onBeforeRouteLeave((to, from, next) => {
  if (hasUnsavedChanges.value) {
    Modal.confirm({
      title: '确认离开？',
      content: '您有未保存的更改，是否保存为草稿？',
      okText: '保存草稿',
      cancelText: '直接离开',
      onOk: () => {
        handleSaveDraft()
        next()
      },
      onCancel: () => {
        next()
      }
    })
  } else {
    next()
  }
})
```

---

## 验收标准

1. 选择传输类型页面：7种类型卡片正常显示，点击跳转携带正确参数
2. 创建申请单页面：
   - 3步表单流程正常
   - 所有字段校验生效
   - "包含客户网络数据"条件字段动态显示/隐藏
   - 自动保存草稿每30秒触发
   - 页面离开提示正常
3. 申请单列表页面：
   - 列表数据正常加载
   - 筛选、分页功能正常
   - 状态标签颜色正确
4. 申请单详情页面：
   - 所有信息正确展示
   - 不同状态显示对应操作按钮
5. 草稿管理：
   - 草稿保存/加载/删除正常
   - 过期草稿标记正确
6. 选择器组件：
   - 部门树、城市级联、用户搜索均正常
   - v-model 双向绑定正常
7. 待我下载页面：
   - 仅展示当前用户为下载人的申请单
   - 支持关键词、审批状态、下载状态筛选
   - 支持查看详情与下载操作

---

## 单元测试要求

- `useApplicationForm.ts`：测试表单校验、步骤切换、草稿保存
- `useApplicationList.ts`：测试列表加载、筛选、分页
- `useDownloadList.ts`：测试下载人可见性过滤、下载状态聚合、筛选与分页
- `DepartmentSelector.vue`：测试部门树加载、选择
- `CitySelector.vue`：测试城市级联加载、选择
- `UserSelector.vue`：测试用户搜索、多选

