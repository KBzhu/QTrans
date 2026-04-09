# QuickStart: 上传组件（StepTwoUploadFile + TransUploadView + TransFileTable）

## 给开发者

### 组件概览

| 组件 | 路径 | 说明 |
|------|------|------|
| `StepTwoUploadFile` | `src/views/application/components/StepTwoUploadFile.vue` | 嵌入式上传组件（申请流程步骤二），props 传入参数 |
| `TransUploadView` | `src/views/trans/TransUploadView.vue` | 外网独立上传页面，路由参数传入，有完整导航/错误恢复 |
| `TransFileTable` | `src/components/business/TransFileTable.vue` | 通用文件表格，支持 upload/uploaded/download 三种模式 |
| `useTransUpload` | `src/composables/useTransUpload.ts` | 上传核心 composable，分片上传 + 断点续传 + 哈希校验 |

### 两个上传组件功能一致

`StepTwoUploadFile` 和 `TransUploadView` 现已功能对齐，均支持：
- 自动提交（`watchDeep` + 勾选框）
- SHA256 重复上传拦截
- 已上传文件单个/批量删除
- SHA256 校验状态展示

差异仅在参数来源和页面结构：StepTwoUploadFile 为嵌入式组件（props），TransUploadView 为独立页面（route.query）。

### 快速集成

```vue
<template>
  <StepTwoUploadFile
    :params="uploadParams"
    :auto-submit-after-upload="autoSubmit"
    @update:auto-submit-after-upload="autoSubmit = $event"
    @confirmed="handleConfirmed"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import StepTwoUploadFile from '@/views/application/components/StepTwoUploadFile.vue'

const uploadParams = ref('your-params-string')
const autoSubmit = ref(false)

function handleConfirmed() {
  // 自动提交完成后的处理
}
</script>
```

### TransFileTable 三种模式

```vue
<!-- 上传模式 -->
<TransFileTable
  :files="uploadFileList"
  mode="upload"
  :show-batch-actions="true"
  :show-hash-status="true"
  @pause="handlePause"
  @resume="handleResume"
  @delete="handleDelete"
  @retry="handleRetry"
/>

<!-- 已上传模式 -->
<TransFileTable
  mode="uploaded"
  :uploaded-files="fileList"
  :show-hash-status="true"
  @delete-uploaded-file="handleDeleteFile"
  @toggle-select-uploaded="handleSelectFile"
/>

<!-- 下载模式 -->
<TransFileTable
  mode="download"
  :directories="dirs"
  :download-files="files"
  @download-file="handleDownload"
  @enter-directory="handleEnterDir"
/>
```

### 关键 Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `params` | `string` | 必填 | 上传初始化参数 |
| `autoSubmitAfterUpload` | `boolean` | 必填 | 上传完毕后自动提交 |
| `showHashStatus` | `boolean` | `true` | 是否显示 SHA256 校验状态 |

### 关键 Events

| Event | Payload | 说明 |
|-------|---------|------|
| `confirmed` | - | 自动提交成功后触发 |
| `update:autoSubmitAfterUpload` | `boolean` | 自动提交勾选变化 |
| `delete-uploaded-file` | `FileEntity` | 单文件删除 |

### SHA256 校验状态

已上传列表中每个文件展示校验结果：

- **通过** (绿色): `clientFileHashCode === hashCode`
- **未通过** (红色): `clientFileHashCode !== hashCode`
- **未校验** (灰色): 缺少哈希值

### 自动提交逻辑（两个组件通用）

1. 用户勾选"上传完毕后自动提交"
2. 使用 VueUse `watchDeep` 深度监听 `uploadFileList` 变化
3. 当所有文件结束（completed/error/paused），且至少有一个 completed
4. 且所有 completed 文件哈希校验通过（matched 或 skipped）
5. 自动调用 `confirmUpload`

> StepTwoUploadFile 额外 emit `confirmed` 事件；TransUploadView 为独立页面，提交成功后仅提示

---

## 给测试（QA）

### 回归测试步骤

#### 测试1：上传进度条平滑更新

1. 进入创建申请页面，完成第一步进入上传文件步骤
2. 选择一个大于 10MB 的文件上传
3. **预期结果**: 进度条应平滑增长，而非立即跳到 100%
4. **预期结果**: 上传过程中可见速度显示（如 "2.5 MB/s"）

#### 测试2：自动提交功能

1. 进入上传文件步骤
2. 勾选"上传完毕后自动提交"
3. 选择 1-3 个文件上传
4. **预期结果**: 所有文件上传完成且哈希校验通过后，自动弹出"自动提交成功"提示
5. **预期结果**: 页面自动跳转到提交成功页面
6. 取消勾选后重复上传 → **预期结果**: 不会自动提交

#### 测试3：已上传文件列表 - 删除按钮

1. 上传文件后查看"已上传文件"列表
2. 点击某行的"删除"按钮
3. **预期结果**: 文件从列表中移除
4. **预期结果**: 弹出"文件删除成功"提示

#### 测试4：已上传文件列表 - SHA256 校验状态

1. 查看已上传文件列表
2. **预期结果**: 每行文件名下方显示 "SHA256: abc12345...wxyz" 格式的哈希值
3. **预期结果**: 哈希值后显示状态标签
   - 校验通过：绿色"通过"标签
   - 校验未通过：红色"未通过"标签
   - 无哈希值：灰色"未校验"标签
4. 鼠标悬停哈希值 → **预期结果**: title 显示完整哈希值

#### 测试5：已上传文件 - 批量选择与删除

1. 点击已上传文件行，选中多个文件
2. 点击"删除选中"按钮
3. **预期结果**: 所有选中文件被删除
4. 选中文件后点击单行"删除"按钮
5. **预期结果**: 该文件被删除，选中状态正确更新

#### 边界场景

| 场景 | 操作 | 预期 |
|------|------|------|
| 空文件上传 | 选择 0 字节文件 | 提示错误或正常处理 |
| 网络断开 | 上传中断网 | 状态变为"失败"，可重试 |
| 哈希校验超时 | 上传大文件 | 标记为"skipped"，状态显示"未校验" |
| 自动提交失败 | 勾选自动提交但后端返回失败 | 弹出错误提示，允许手动重试 |
| 多文件部分失败 | 上传3个文件，1个失败 | 自动提交不触发（非全部通过） |
| 全部重复上传 | 选择已上传的同一文件 | 弹出警告提示，不上传 |
| 部分重复上传 | 选择2个文件，1个已上传 | 1个跳过，1个正常上传 |
| 文件内容修改后重传 | 修改文件内容后重新上传 | SHA256 不同，正常上传 |
