# 文件夹上传实现指南

> 本文档描述如何在新代码仓中实现文件夹上传功能，对标老代码 `UploadPage.js` 中 FineUploader 的文件夹上传能力。

---

## 一、老代码实现分析

老代码通过 FineUploader 的 `validation.folder` + `extraButtons` 实现文件夹上传：

```javascript
// UploadPage.js 关键配置
extraButtons: [{
  element: document.getElementById('uploadFolderBtn'),
  folders: true    // 启用文件夹选择
}],

validation: {
  // ...
  acceptFiles: '*',  // 接受所有文件
},

// onSubmitted 回调中获取 webkitRelativePath
onSubmitted: function(id, name) {
  var path = uploader.getUuid(id);  // FineUploader 内部存储的路径
  // 实际路径来自 file.webkitRelativePath
}
```

核心机制：
1. **`<input webkitdirectory>`** — 浏览器弹出文件夹选择器
2. **`file.webkitRelativePath`** — 每个文件自带相对路径，如 `myFolder/subDir/file.txt`
3. **FineUploader** 自动将 `webkitRelativePath` 解析为 `qqpath`（相对目录）+ 文件名

---

## 二、需要修改的文件清单

### 2.1 API 层：`src/api/transWebService.ts`

**无需修改** — 现有 `uploadChunk` 的 FormData 中已包含 `qqpath` 字段，只需确保传入正确的相对目录即可。

### 2.2 Composable 层：`src/composables/useTransUpload.ts`

#### 修改 1：`TransUploadFileItem` 接口增加文件夹路径字段

```typescript
export interface TransUploadFileItem {
  // ...现有字段
  /** 文件的完整相对路径（来自 webkitRelativePath），文件夹上传时非空 */
  relativePath?: string
  /** 是否来自文件夹上传 */
  isFolderUpload?: boolean
}
```

#### 修改 2：`generateFileUUID` 支持文件夹路径去重

```typescript
function generateFileUUID(file: File): string {
  // 文件夹上传时，用 webkitRelativePath 代替 file.name，避免同名文件 UUID 冲突
  const pathKey = file.webkitRelativePath || file.name
  return `${pathKey}-${file.size}-${file.lastModified}-${Date.now()}`
}
```

#### 修改 3：`uploadSingleChunk` 传递正确的 relativeDir

```typescript
// 在 uploadFile 方法中，将 relativeDir 改为从 file.webkitRelativePath 解析
// 例如 webkitRelativePath = "myFolder/sub/file.txt"
// → relativeDir = "myFolder/sub/"
function parseRelativeDir(file: File, fallbackDir: string): string {
  if (file.webkitRelativePath) {
    const lastSlash = file.webkitRelativePath.lastIndexOf('/')
    if (lastSlash > 0) {
      return file.webkitRelativePath.substring(0, lastSlash + 1)
    }
  }
  return fallbackDir
}
```

#### 修改 4：新增 `uploadFolder` 方法

```typescript
/**
 * 上传文件夹
 * @param files 文件夹中的文件列表（来自 input.webkitdirectory）
 * @param params 上传参数
 * @param onProgress 进度回调
 */
async function uploadFolder(
  files: File[],
  params: string,
  onProgress?: (item: TransUploadFileItem) => void,
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  // 按目录分组，确保同一目录的文件顺序上传
  const filesByDir = new Map<string, File[]>()
  for (const file of files) {
    const relativeDir = parseRelativeDir(file, '')
    if (!filesByDir.has(relativeDir)) {
      filesByDir.set(relativeDir, [])
    }
    filesByDir.get(relativeDir)!.push(file)
  }

  // 逐目录上传（同目录内顺序，不同目录可并发）
  for (const [dir, dirFiles] of filesByDir) {
    for (const file of dirFiles) {
      const result = await uploadFile(file, params, dir, onProgress)
      if (result) success++
      else failed++
    }
  }

  return { success, failed }
}
```

#### 修改 5：在 return 对象中导出新方法

```typescript
return {
  // ...现有导出
  uploadFolder,
}
```

### 2.3 组件层：`TransUploadView.vue`

#### 修改 1：添加文件夹上传按钮和 input

```html
<!-- 在 dropzone-toolbar 中添加 -->
<div class="dropzone-toolbar">
  <a-checkbox v-model="autoSubmitAfterUpload">上传完毕后自动提交</a-checkbox>
  <a-button type="outline" size="small" @click="folderInputRef?.click()">
    <template #icon><IconFolder /></template>
    上传文件夹
  </a-button>
</div>

<!-- 文件夹选择 input（关键：webkitdirectory 属性） -->
<input
  ref="folderInputRef"
  type="file"
  webkitdirectory
  directory
  hidden
  @change="handleFolderSelect"
/>
```

```typescript
const folderInputRef = ref<HTMLInputElement | null>(null)

async function handleFolderSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const files = Array.from(input.files)
  // 文件夹上传时，每个 file.webkitRelativePath 包含完整的相对路径
  await handleFolderFiles(files)
  input.value = ''
}
```

#### 修改 2：`handleFolderFiles` 方法

```typescript
async function handleFolderFiles(files: File[]) {
  if (!params.value) return

  // 校验：同普通文件上传的校验逻辑
  const blackList = initData.value?.blackList || ''
  const maxLength4Name = initData.value?.maxLength4Name || 256
  const maxLength4Path = initData.value?.maxLength4Path || 512
  const invalidFiles = validateFileNames(files, blackList, maxLength4Name, maxLength4Path, '')
  if (invalidFiles.length > 0) {
    const errorMessages = invalidFiles.map(f => `${f.file.name}: ${f.error}`).join('\n')
    Message.error(`文件名校验不通过：${errorMessages}`)
    const invalidFileNames = new Set(invalidFiles.map(f => f.file.name))
    files = files.filter(f => !invalidFileNames.has(f.name))
    if (files.length === 0) return
  }

  // 存储空间校验
  const totalFileSize = files.reduce((sum, f) => sum + f.size, 0)
  const hasSpace = await checkStorageSpace(params.value, totalFileSize)
  if (!hasSpace) return

  autoSubmitTriggered.value = false
  await uploadFolder(files, params.value, updateUploadProgress)
}
```

### 2.4 组件层：`StepTwoUploadFile.vue`

同 TransUploadView.vue 的修改逻辑，添加文件夹上传按钮和 input。

### 2.5 文件列表展示：`TransFileTable.vue` 已上传模式

#### 修改：支持文件夹层级展示

当前已上传列表是平铺展示所有文件。文件夹上传后需要按层级浏览。

**方案 A（推荐 — 与下载模式一致）**：

复用现有的 `mode="download"` 的目录导航能力。已上传模式也展示 `directoryList`，支持点击进入子目录。

```typescript
// TransFileTable.vue uploaded 模式增加目录展示
// 在 Props 中新增
directories?: DirectoryEntity[]   // 已上传模式也需要传入目录列表

// 模板中增加目录行（参考 download 模式的实现）
<div
  v-for="dir in directories"
  :key="dir.relativeDir"
  class="uploaded-item uploaded-item--directory"
  @click="$emit('enter-directory', dir)"
>
  <IconFolder class="uploaded-item__icon uploaded-item__icon--folder" />
  <span class="uploaded-item__name">{{ dir.name }}</span>
</div>
```

**方案 B（树形展示）**：

用树形控件展示文件夹层级。实现成本较高，不建议首选。

---

## 三、上传后展示 — 文件夹层级浏览

### 3.1 TransUploadView.vue / StepTwoUploadFile.vue

当前 `fileListData` 已经包含 `directoryList` 字段（后端 FileListHandler 返回），只是在 uploaded 模式没有渲染。

需要修改：

1. **传递 directories 给 TransFileTable**：
```html
<TransFileTable
  mode="uploaded"
  :uploaded-files="fileListData.fileList"
  :directories="fileListData.directoryList"  <!-- 新增 -->
  @enter-directory="handleEnterDirectory"     <!-- 新增 -->
  @go-back="handleGoBackUploaded"             <!-- 新增 -->
/>
```

2. **维护当前浏览目录**：
```typescript
const uploadedCurrentDir = ref('')

async function handleEnterDirectory(dir: DirectoryEntity) {
  await loadFileList(dir.relativeDir, params.value)
  uploadedCurrentDir.value = dir.relativeDir
}

async function handleGoBackUploaded() {
  const parts = uploadedCurrentDir.value.split('/').filter(Boolean)
  parts.pop()
  const parentDir = parts.length > 0 ? parts.join('/') + '/' : ''
  await loadFileList(parentDir, params.value)
  uploadedCurrentDir.value = parentDir
}
```

### 3.2 TransFileTable.vue

- uploaded 模式增加 `directories` prop 和目录导航 emit
- 渲染目录行，点击触发 `enter-directory` 事件
- 非根目录时显示"返回上级"按钮

---

## 四、关键注意事项

### 4.1 webkitRelativePath 的处理

```
file.webkitRelativePath = "myFolder/subDir/file.txt"

解析规则：
  relativeDir = "myFolder/subDir/"     → 作为 qqpath 传给后端
  fileName    = "file.txt"             → 文件名
```

### 4.2 重复文件检测

文件夹上传时，重复检测逻辑不变（SHA256 + 文件名比对），但需注意：
- 同一文件夹内可能有同名文件（不同子目录）
- `relativeDir` 不同时，即使文件名相同也不算重复

### 4.3 哈希校验

文件夹上传的每个文件走独立的哈希校验流程，与普通文件上传一致。

### 4.4 并发控制

建议文件夹上传时保持 `MAX_CONCURRENT_UPLOADS = 3`，避免同一文件夹下过多并发导致后端压力。

### 4.5 浏览器兼容性

| 浏览器 | `webkitdirectory` 支持 |
|---|---|
| Chrome | ✅ |
| Firefox | ✅ |
| Safari | ✅ |
| Edge | ✅ |
| IE11 | ❌ |

IE11 不支持，但老代码也不支持 IE 的文件夹上传，无需特殊处理。

### 4.6 文件夹上传后的 confirm 逻辑

文件夹上传完成后，`confirmUpload` 不需要特殊处理 — 后端 `act=complete` 是针对整个申请单的，不是针对单个文件夹。

---

## 五、实现优先级

| 步骤 | 内容 | 优先级 |
|---|---|---|
| 1 | useTransUpload 添加 uploadFolder + relativePath 支持 | P0 |
| 2 | TransUploadView / StepTwoUploadFile 添加文件夹选择按钮 | P0 |
| 3 | TransFileTable uploaded 模式支持目录导航 | P1 |
| 4 | 文件夹上传进度汇总（文件夹级进度条） | P2 |

---

## 六、验证清单

- [ ] 选择文件夹后，所有文件正确出现在上传列表
- [ ] 每个文件的 relativeDir 正确解析自 webkitRelativePath
- [ ] 上传完成后，已上传列表能看到文件夹结构
- [ ] 点击文件夹能进入子目录，返回上级正常
- [ ] 重复文件检测在文件夹场景下正常工作
- [ ] 哈希校验在文件夹场景下正常工作
- [ ] 暂停/继续/取消在文件夹场景下正常工作
