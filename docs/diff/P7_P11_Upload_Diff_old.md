# P7 与 P11 上传流程差异对比

> 本文档对比 P7 文件管理模块与 P11 TransWebService 上传模块的差异，帮助明确复用方案。

## 0. 重要发现：FileUpload.vue 未被使用！

**经确认**：`src/components/business/FileUpload.vue` **没有被任何业务页面使用**，仅在测试文件中引用。

**真正在使用的是**：`src/views/application/components/StepTwoUploadFile.vue`

| 文件 | 使用情况 | 说明 |
|------|----------|------|
| `FileUpload.vue` | ❌ 未使用 | 仅测试文件引用 |
| `StepTwoUploadFile.vue` | ✅ 实际使用 | 创建申请单流程第2步 |
| `useFileUpload.ts` | ✅ 使用 | 被 FileUpload.vue 和测试引用 |

---

## 1. 场景对比

| 维度 | P7 StepTwoUploadFile | P11 TransUpload |
|------|---------------------|-----------------|
| **使用场景** | 内部用户创建申请单 | 外部用户独立上传 |
| **入口位置** | `/application/create` 流程中 | `/trans/upload` 独立页面 |
| **用户身份** | 已登录（系统内用户） | 外部用户（通过 params 验证） |
| **身份验证** | Store 中的登录态 | params 加密参数 + Token |
| **触发条件** | 创建/编辑申请单时 | 从申请详情页跳转或邮件链接 |

---

## 2. 入口场景（已确认）

### 场景 A：首页 Dashboard 发起申请
```
Dashboard → 点击卡片 → /application/create
  → StepOneBasicInfo（填写申请信息）
  → 点击「下一步」→ 调用 create 接口 → 返回 params
  → StepTwoUploadFile（上传文件）
```

### 场景 B：我的申请单继续编辑
```
我的申请单 → 申请详情页 → 点击「继续编辑」
  → /application/create?draftId=xxx
  → StepTwoUploadFile（上传文件）
```

### 场景 C：外部邮件链接
```
邮件链接 → /trans/upload?params=xxx&lang=zh_CN
  → 初始化获取 Token
  → TransUploadView（独立上传页面）
```

---

## 3. 组件对比：StepTwoUploadFile vs FileUpload vs TransUploadView

### 3.1 组件类型

| 组件 | 类型 | 说明 |
|------|------|------|
| `StepTwoUploadFile.vue` | 展示组件 | 纯 UI，通过 Props 接收数据，通过 Emit 触发事件 |
| `FileUpload.vue` | 容器组件 | 内部管理状态，直接调用 API |
| `TransUploadView.vue` | 页面组件 | 完整页面，内部管理状态 |

### 3.2 数据流对比

#### StepTwoUploadFile（当前使用）
```vue
<!-- 纯展示组件，状态由父组件管理 -->
<script setup>
interface Props {
  uploadingFiles: UploadingFileState[]     // 上传中文件列表
  uploadedFiles: UploadedFileState[]       // 已上传文件列表
  selectedUploadingUids: string[]          // 选中的上传中文件
  selectedUploadedUids: string[]           // 选中的已上传文件
  autoSubmitAfterUpload: boolean           // 上传后自动提交
}

interface Emits {
  (e: 'selectUploadFiles'): void                    // 选择文件
  (e: 'pauseUploadFile', uid: string): void         // 暂停
  (e: 'resumeUploadFile', uid: string): void        // 继续
  (e: 'removeUploadingFile', uid: string): void     // 删除上传中
  (e: 'removeUploadFile', uid: string): void        // 删除已上传
  (e: 'batchPauseUploading'): void                  // 批量暂停
  (e: 'batchResumeUploading'): void                 // 批量继续
  (e: 'batchRemoveUploading'): void                 // 批量删除上传中
  (e: 'batchRemoveUploaded'): void                  // 批量删除已上传
  (e: 'refreshUploadedList'): void                  // 刷新已上传列表
}
</script>
```

#### FileUpload（未使用）
```vue
<!-- 容器组件，内部管理状态 -->
<script setup>
interface Props {
  applicationId?: string
  maxSize?: number
  maxCount?: number
  accept?: string
  disabled?: boolean
}

// 内部状态
const fileList = ref<UploadFileItem[]>([])

// 内部直接调用 API
const { uploadFile: uploadFileReal } = useFileUpload()
</script>
```

#### TransUploadView（P11 新建）
```vue
<!-- 页面组件，内部管理状态 -->
<script setup>
// 内部使用 composable 管理状态
const {
  uploading,
  initData,
  uploadFileList,
  initialize,
  uploadFile,
  confirmUpload,
  // ...
} = useTransUpload()

// 从路由获取 params
const params = route.query.params as string
</script>
```

### 3.3 功能对比

| 功能 | StepTwoUploadFile | FileUpload | TransUploadView | 备注 |
|------|-------------------|------------|-----------------|------|
| **组件类型** | 展示组件 | 容器组件 | 页面组件 | - |
| **拖拽上传** | ❌ | ✅ | ✅ | StepTwo 缺失 |
| **点击上传** | ✅ (emit) | ✅ | ✅ | - |
| **上传中列表** | ✅ 表格 | ✅ 列表 | ✅ 列表 | - |
| **已上传列表** | ✅ 表格 | ❌ | ✅ 列表 | FileUpload 缺失 |
| **进度条** | ✅ | ✅ | ✅ | - |
| **速度显示** | ❌ | ✅ | ✅ | StepTwo 缺失 |
| **剩余时间** | ✅ | ❌ | ❌ | StepTwo 独有 |
| **失败次数** | ✅ | ❌ | ❌ | StepTwo 独有 |
| **暂停/继续** | ✅ | ✅ | ✅ | - |
| **批量操作** | ✅ | ✅ | ❌ | TransUpload 缺失 |
| **哈希校验** | ✅ (sha256 列) | ❌ | ✅ | FileUpload 缺失 |
| **确认完成** | ❌ | ❌ | ✅ | TransUpload 独有 |
| **自动提交** | ✅ | ❌ | ❌ | StepTwo 独有 |
| **隐私政策** | ✅ | ❌ | ❌ | StepTwo 独有 |

---

## 4. 关键文件清单

### P7 实际使用的文件
| 文件 | 说明 | 是否使用 |
|------|------|----------|
| `src/views/application/components/StepTwoUploadFile.vue` | 上传步骤组件 | ✅ 使用中 |
| `src/composables/useFileUpload.ts` | 上传逻辑 | ⚠️ 未被 StepTwo 使用 |
| `src/components/business/FileUpload.vue` | 上传组件 | ❌ 未使用 |
| `src/api/file.ts` | 文件 API | ⚠️ Mock 用 |

### P11 新建的文件
| 文件 | 说明 |
|------|------|
| `src/views/trans/TransUploadView.vue` | 上传页面视图 |
| `src/composables/useTransUpload.ts` | 上传逻辑 |
| `src/api/transWebService.ts` | API 封装 |

---

## 5. 复用建议

### 可复用的 UI 部分
1. **表格结构**：StepTwo 的双表格布局（传输任务 + 已上传文件）设计合理
2. **文件图标函数**：`getFileIcon(fileName)` - 三个组件都有类似实现
3. **进度条样式**：进度条在表格行内的展示方式

### 需要补充的功能
| 组件 | 需补充 |
|------|--------|
| StepTwoUploadFile | 拖拽上传、速度显示 |
| FileUpload | 已上传列表、哈希校验 |
| TransUploadView | 批量操作、速度显示优化 |

### 建议的组件架构
```
┌─────────────────────────────────────────────────────────────┐
│                    通用上传组件（新建）                        │
│  src/components/business/TransFileTable.vue                 │
│  ──────────────────────────────────────────────────────────│
│  Props:                                                     │
│    - uploadingFiles: UploadingFileState[]                   │
│    - uploadedFiles: UploadedFileState[]                     │
│    - mode: 'create' | 'trans-web' | 'download'              │
│    - showHash: boolean                                      │
│    - showBatchActions: boolean                              │
│  Emits:                                                     │
│    - selectFiles, pause, resume, remove, batch*             │
└─────────────────────────────────────────────────────────────┘
          ↑                    ↑                    ↑
          │                    │                    │
  StepTwoUploadFile    TransUploadView    TransDownloadView
  (简化为布局容器)      (使用 composable)   (使用 composable)
```

---

## 6. 下一步行动

- [ ] 确认是否删除未使用的 `FileUpload.vue`
- [ ] 确认 `StepTwoUploadFile.vue` 是否需要改造支持拖拽上传
- [ ] 确认是否抽取通用表格组件 `TransFileTable.vue`
- [ ] 确认 `useFileUpload.ts` composable 的归属（P7 专用 or 通用）
