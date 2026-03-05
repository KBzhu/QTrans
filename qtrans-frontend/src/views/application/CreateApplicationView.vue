<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import { computed, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useApplicationForm } from '@/composables/useApplicationForm'
import { useAuthStore } from '@/stores'
import StepOneBasicInfo from './components/StepOneBasicInfo.vue'
import StepTwoUploadFile from './components/StepTwoUploadFile.vue'
import StepThreeSubmitSuccess from './components/StepThreeSubmitSuccess.vue'
import './create-application.scss'


const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const stepOneRef = ref<InstanceType<typeof StepOneBasicInfo> | null>(null)
const customerAuthInputRef = ref<HTMLInputElement | null>(null)
const uploadInputRef = ref<HTMLInputElement | null>(null)

const {
  formData,
  currentStep,
  submittedApplication,
  uploadingFiles,
  uploadedFiles,
  selectedUploadingUids,
  selectedUploadedUids,
  autoSubmitAfterUpload,
  formRules,
  showCustomerDataFields,
  transferTypeLabel,
  hasUnsavedChanges,
  handleNext,
  handlePrev,
  handleSaveDraft,
  handleSubmit,
  loadDraft,
  setCustomerAuthFile,
  addUploadFiles,
  removeUploadingFile,
  removeUploadFile,
  pauseUploadFile,
  resumeUploadFile,
  batchPauseUploading,
  batchResumeUploading,
  batchRemoveUploading,
  batchRemoveUploaded,
  refreshUploadedList,
} = useApplicationForm(String(route.query.type || 'green-to-green'))

const draftApplicationNo = ref(`MWEHR${Math.floor(10000 + Math.random() * 90000)}`)

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
  await handleNext(validateStepOne)
}

async function onClickSubmit() {
  await handleSubmit()
}

async function onClickSaveDraft() {
  await handleSaveDraft()
}

function onCancel() {
  router.back()
}

function onSelectCustomerAuth() {
  customerAuthInputRef.value?.click()
}

function onCustomerAuthChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return

  setCustomerAuthFile(file.name)
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

function goBack() {
  router.back()
}

function goHome() {
  router.push('/dashboard')
}

function goMyApplications() {
  router.push('/applications')
}

const draftId = String(route.query.draftId || '')
if (draftId)
  loadDraft(draftId)

onBeforeRouteLeave(() => {
  if (!hasUnsavedChanges.value || currentStep.value >= 2)
    return true

  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: '确认离开？',
      content: '您有未保存的更改，是否保存为草稿？',
      okText: '保存草稿并离开',
      cancelText: '直接离开',
      onOk: async () => {
        await handleSaveDraft({ silent: true })
        resolve(true)
      },
      onCancel: () => resolve(true),
      onClose: () => resolve(false),
    })
  })
})
</script>

<template>
  <section class="create-application-page">
    <div class="create-application-page__crumbs">
      <button class="back-btn" @click="goBack">
        <img src="/figma/3960_2183/1.svg" alt="返回" />
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
      <template v-if="currentStep === 0">
        <StepOneBasicInfo
          ref="stepOneRef"
          :form-data="formData"
          :form-rules="formRules"
          :transfer-type-label="transferTypeLabel"
          :show-customer-data-fields="showCustomerDataFields"
          :draft-application-no="draftApplicationNo"
          :submitted-application="submittedApplication"
          @update:form-data="(val) => formData = val"
          @copy-template="onCopyRecentTemplate"
          @select-customer-auth="onSelectCustomerAuth"
          @customer-auth-change="onCustomerAuthChange"
        />
        <input ref="customerAuthInputRef" type="file" class="hidden-input" @change="onCustomerAuthChange" />
      </template>

      <template v-else-if="currentStep === 1">
        <StepTwoUploadFile
          :uploading-files="uploadingFiles"
          :uploaded-files="uploadedFiles"
          :selected-uploading-uids="selectedUploadingUids"
          :selected-uploaded-uids="selectedUploadedUids"
          :auto-submit-after-upload="autoSubmitAfterUpload"
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
          @refresh-uploaded-list="refreshUploadedList"
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
    </div>

    <div v-if="currentStep < 2" class="create-application-page__actions">
      <a-button @click="onCancel">取消</a-button>
      <a-button v-if="currentStep > 0" @click="handlePrev">上一步</a-button>
      <a-button v-if="currentStep < 1" type="outline" @click="onClickSaveDraft">保存草稿</a-button>
      <a-button v-if="currentStep < 2" type="primary" @click="currentStep === 1 ? onClickSubmit() : onClickNext()">
        {{ currentStep === 1 ? '提交申请' : '下一步' }}
      </a-button>
    </div>
  </section>
</template>


