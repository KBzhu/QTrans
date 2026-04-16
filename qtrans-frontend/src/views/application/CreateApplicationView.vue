<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useApplicationForm } from '@/composables/useApplicationForm'
import { useAuthStore, useRegionMetadataStore } from '@/stores'
import { DEFAULT_TRANSFER_TYPE } from '@/constants'
import { assetPath } from '@/utils/path'
import StepOneBasicInfo from './components/StepOneBasicInfo.vue'
import StepTwoUploadFile from './components/StepTwoUploadFile.vue'
import StepThreeSubmitSuccess from './components/StepThreeSubmitSuccess.vue'
import './create-application.scss'


const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const regionMetadataStore = useRegionMetadataStore()

const stepOneRef = ref<InstanceType<typeof StepOneBasicInfo> | null>(null)
const uploadInputRef = ref<HTMLInputElement | null>(null)

// 从 URL 获取参数
const typeFromQuery = String(route.query.type || DEFAULT_TRANSFER_TYPE)
const fromZone = route.query.from as string | undefined
const toZone = route.query.to as string | undefined
const fromId = Number(route.query.fromId) ?? 1
const toId = Number(route.query.toId) ?? 1

// 从 URL 读取数字 ID 并更新 store
if (fromId && toId && fromZone && toZone) {
  console.log('[DEBUG CreateApplicationView] URL fromId:', fromId, 'toId:', toId)
  regionMetadataStore.setMetadata({
    fromRegion: {
      code: fromZone,
      name: fromZone,
      id: fromId,
    },
    toRegion: {
      code: toZone,
      name: toZone,
      id: toId,
    },
  })
}

const {
  formData,
  currentStep,
  submittedApplication,
  isApplicationCreated,
  submitting,
  uploadingFiles,
  uploadedFiles,
  selectedUploadingUids,
  selectedUploadedUids,
  autoSubmitAfterUpload,
  formRules,
  showCustomerDataFields,
  transferTypeLabel,
  hasUnsavedChanges,
  uploadParams,
  handleNext,
  handleNextWithSubmit,
  handlePrev,
  handleSubmitReal,
  loadDraft,
  loadApplicationById,
  addUploadFiles,
  removeUploadingFile,
  removeUploadFile,
  pauseUploadFile,
  resumeUploadFile,
  batchPauseUploading,
  batchResumeUploading,
  batchRemoveUploading,
    batchRemoveUploaded,
} = useApplicationForm(typeFromQuery, fromZone, toZone)

const pageLoading = ref(false)

const fileCount = computed(() => uploadedFiles.value.length + uploadingFiles.value.length)

const basicInfoApplicant = computed(() => {
  const user = authStore.currentUser
  return user ? `${user.username} ${user.name}` : 'zhangcheng XXX13433308'
})

async function validateStepOne() {
  if (!stepOneRef.value)
    return true

  return await stepOneRef.value.validate()
}

async function onClickNext() {
  // 第一步：验证表单并调用创建接口
  if (currentStep.value === 0) {
    await handleNextWithSubmit(validateStepOne)
  }
  else {
    // 第二步：进入第三步
    await handleNext()
  }
}

async function onClickSubmit() {
  await handleSubmitReal()
}

function onCancel() {
  router.back()
}

function onSelectUploadFiles() {
  uploadInputRef.value?.click()
}

function onUploadFilesChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  if (files.length === 0)
    return

  addUploadFiles(files)
  input.value = ''
}

async function onCopyRecentTemplate(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    formData.value.applyReason = text
    Message.success('已复制并填入申请原因')
  }
  catch {
    formData.value.applyReason = text
    Message.warning('浏览器不支持剪贴板，已直接填入申请原因')
  }
}

function goHome() {
  router.push('/dashboard')
}

function goMyApplications() {
  router.push('/applications')
}

// 处理页面初始化参数
onMounted(async () => {
  const draftId = String(route.query.draftId || '')
  const applicationId = String(route.query.applicationId || '')

  if (applicationId) {
    // 从已有申请单继续上传
    pageLoading.value = true
    try {
      await loadApplicationById(applicationId)
    }
    finally {
      pageLoading.value = false
    }
  }
  else if (draftId) {
    // 从草稿加载
    loadDraft(draftId)
  }
})

onBeforeRouteLeave(() => {
  // 第3步：直接离开
  if (currentStep.value >= 2)
    return true

  // 第2步：无论有无变更，都弹窗确认
  if (currentStep.value === 1) {
    return new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '确认离开？',
        content: '离开后需要重新上传文件，您可在「我的申请单」中找到状态为「待上传」的流程单继续操作，确认离开？',
        okText: '确认离开',
        cancelText: '取消',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
        onClose: () => resolve(false),
      })
    })
  }

  // 第1步：无变更直接离开，有变更弹窗确认
  if (!hasUnsavedChanges.value)
    return true

  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: '确认离开？',
      content: '离开后当前填写内容将丢失，下次进入需要重新填写，确认离开？',
      okText: '确认离开',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
      onClose: () => resolve(false),
    })
  })
})
</script>

<template>
  <section class="create-application-page">
    <div class="create-application-page__crumbs">
      <button class="back-btn" @click="onCancel">
        <img :src="assetPath('/figma/3960_2183/1.svg')" alt="返回" />

        <span>返回</span>
      </button>
      <span class="crumb-divider">/</span>
      <span class="crumb-text">首页 / {{ transferTypeLabel }}</span>
    </div>

    <div class="create-application-page__steps-card">
      <a-steps :current="currentStep + 1" size="large">

        <a-step title="发起申请" />
        <a-step title="上传文件" />
        <a-step title="提交" />
      </a-steps>
    </div>

    <div class="create-application-page__content-card">
      <a-spin :loading="pageLoading" style="width: 100%">
        <template v-if="currentStep === 0">
        <StepOneBasicInfo
          ref="stepOneRef"
          v-model:form-data="formData"
          :form-rules="formRules"
          :transfer-type-label="transferTypeLabel"
          :show-customer-data-fields="showCustomerDataFields"
          :submitted-application="submittedApplication"
          :readonly="isApplicationCreated"
          @copy-template="onCopyRecentTemplate"
        />

      </template>

      <template v-else-if="currentStep === 1">
        <StepTwoUploadFile
          :uploading-files="uploadingFiles"
          :uploaded-files="uploadedFiles"
          :selected-uploading-uids="selectedUploadingUids"
          :selected-uploaded-uids="selectedUploadedUids"
          :auto-submit-after-upload="autoSubmitAfterUpload"
          :params="uploadParams"
          @update:selected-uploading-uids="(val: string[]) => selectedUploadingUids = val"
          @update:selected-uploaded-uids="(val: string[]) => selectedUploadedUids = val"
          @update:auto-submit-after-upload="(val: boolean) => autoSubmitAfterUpload = val"
          @select-upload-files="onSelectUploadFiles"
          @pause-upload-file="pauseUploadFile"
          @resume-upload-file="resumeUploadFile"
          @remove-uploading-file="removeUploadingFile"
          @remove-upload-file="removeUploadFile"
          @batch-pause-uploading="batchPauseUploading"
          @batch-resume-uploading="batchResumeUploading"
          @batch-remove-uploading="batchRemoveUploading"
        @batch-remove-uploaded="batchRemoveUploaded"
      />
        <input ref="uploadInputRef" class="hidden-input" type="file" multiple @change="onUploadFilesChange" />
      </template>

      <template v-else>
        <StepThreeSubmitSuccess
          :submitted-application="submittedApplication"
          :transfer-type-label="transferTypeLabel"
          :file-count="fileCount"
          :form-data="formData"
          :basic-info-applicant="basicInfoApplicant"
          @go-home="goHome"
          @go-my-applications="goMyApplications"
        />
      </template>
      </a-spin>
    </div>

    <div v-if="currentStep < 2" class="create-application-page__actions">
      <a-button v-if="currentStep > 0" :disabled="submitting" @click="handlePrev">上一步</a-button>
      <a-button v-if="currentStep === 0" type="primary" :loading="submitting" @click="onClickNext">
        下一步
      </a-button>
      <a-button v-if="currentStep === 1" type="primary" :loading="submitting" @click="onClickSubmit">
        提交申请
      </a-button>
      <a-button :disabled="submitting" @click="onCancel">取消</a-button>
    </div>
  </section>
</template>


