<script setup lang="ts">
import type { TransferType } from '@/types'
import { Message, Modal } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { cities } from '@/mocks/data/cities'
import { departments, type DepartmentNode } from '@/mocks/data/departments'

import { users } from '@/mocks/data/users'
import { useApplicationForm } from '@/composables/useApplicationForm'
import { useAuthStore } from '@/stores'
import { formatFileSize } from '@/utils'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref<{ validate: () => Promise<void> } | null>(null)
const customerAuthInputRef = ref<HTMLInputElement | null>(null)
const uploadInputRef = ref<HTMLInputElement | null>(null)

const {
  formData,
  currentStep,
  submittedApplication,
  uploadedFiles,
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
  removeUploadFile,
} = useApplicationForm(String(route.query.type || 'green-to-green'))

const areaOptions = [
  { label: '绿区', value: 'green' },
  { label: '黄区', value: 'yellow' },
  { label: '红区', value: 'red' },
]

const applicantNotifyOptions = [
  { label: '应用号消息', value: 'in_app' },
  { label: 'W3待办', value: 'w3_todo' },
  { label: '邮件', value: 'email' },
  { label: '下载邮件的发送通知', value: 'download_email' },
]

const downloaderNotifyOptions = [
  { label: '应用号消息', value: 'in_app' },
  { label: 'W3待办', value: 'w3_todo' },
  { label: '邮件', value: 'email' },
]

const transferTypeOptions: { label: string, value: TransferType }[] = [
  { label: '绿区传到绿区', value: 'green-to-green' },
  { label: '绿区传到黄区', value: 'green-to-yellow' },
  { label: '绿区传到红区', value: 'green-to-red' },
  { label: '黄区传到黄区', value: 'yellow-to-yellow' },
  { label: '黄区传到红区', value: 'yellow-to-red' },
  { label: '红区传到红区', value: 'red-to-red' },
  { label: '跨国传输', value: 'cross-country' },
]

interface DepartmentTreeOption {
  title: string
  key: string
  children?: DepartmentTreeOption[]
}

const departmentDialogVisible = ref(false)
const departmentSelectedKey = ref('')

const departmentOptions = computed(() => {
  const walk = (nodes: DepartmentNode[]): DepartmentTreeOption[] => nodes.map(node => ({
    title: node.name,
    key: node.name,
    children: node.children?.length ? walk(node.children) : undefined,
  }))

  return walk(departments)
})




const cityOptions = computed(() => {
  return cities.map(country => ({
    label: country.country,
    value: country.country,
    children: country.cities.map(city => ({
      label: city.name,
      value: city.name,
    })),
  }))
})

const userOptions = computed(() => {
  return users.map(user => ({
    label: `${user.username} / ${user.name} / ${user.departmentName}`,
    value: user.username,
  }))
})

const recentTransferTemplates = [
  '新eTrans平台使用传输场景说明：公司内网/绿区之间互传。',
  '跨安全域传输说明：请确认接收方权限与数据最小化范围。',
]

const noticeItems = [
  'eTrans 适用场景：公司内网/绿区之间互传，跨域请按审批流程执行。',
  '涉及客户网络数据时，需上传客户授权文件并填写 SR 单号。',
  '请确保下载人与抄送人信息准确，避免审批与通知遗漏。',
]

const draftApplicationNo = ref(`MWEHR${Math.floor(10000 + Math.random() * 90000)}`)

const basicInfoRows = computed(() => {
  const user = authStore.currentUser
  const applicant = user ? `${user.username} ${user.name}` : 'zhangcheng XXX13433308'
  const handler = user ? `${user.username} ${user.name}` : 'zhangcheng XXX13433308'

  return [
    { label: '申请人', value: applicant },
    { label: '申请单号', value: submittedApplication.value?.applicationNo || draftApplicationNo.value },
    { label: '当前处理人', value: handler },
    { label: '存储空间大小', value: `${formData.value.storageSize}G` },
    { label: '上传有效期', value: formatRemainDays(formData.value.uploadExpireTime) },
    { label: '下载有效期', value: formatRemainDays(formData.value.downloadExpireTime) },
  ]
})

const fileCount = computed(() => uploadedFiles.value.length)

const summaryRows = computed(() => {
  return [
    { label: '申请类型', value: transferTypeLabel.value },
    { label: '申请人', value: basicInfoRows.value[0]?.value || '--' },
    { label: '所属部门', value: formData.value.department || '--' },
    { label: '文件数量', value: `${fileCount.value} 个` },
    { label: '审批人', value: 'zhaodan' },
    { label: '下载人', value: formData.value.downloaderAccounts.join('、') || '--' },
  ]
})

function formatRemainDays(dateValue: string) {
  const days = dayjs(dateValue).diff(dayjs(), 'day')
  if (Number.isNaN(days))
    return '--'
  return `${Math.max(days, 0)}天`
}

async function validateStepOne() {
  if (!formRef.value)
    return true

  try {
    await formRef.value.validate()
    return true
  }
  catch {
    return false
  }
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

function openDepartmentDialog() {
  departmentSelectedKey.value = formData.value.department || ''
  departmentDialogVisible.value = true
}

function onDepartmentSelect(selectedKeys: Array<string | number>) {
  departmentSelectedKey.value = selectedKeys[0] ? String(selectedKeys[0]) : ''
}

function onConfirmDepartment() {
  if (!departmentSelectedKey.value) {
    Message.warning('请选择部门')
    return false
  }

  formData.value.department = departmentSelectedKey.value
  departmentDialogVisible.value = false
  return true
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
      <a-steps :current="currentStep" size="large">
        <a-step title="发起申请" />
        <a-step title="上传文件" />
        <a-step title="提交" />
      </a-steps>
    </div>

    <div class="create-application-page__content-card">
      <template v-if="currentStep === 0">
        <div class="step-one-layout">
          <div class="step-one-layout__main">
            <section class="module-card">
              <header class="module-card__header">
                <span class="module-card__title">基本信息</span>
              </header>
              <div class="readonly-grid">
                <div v-for="item in basicInfoRows" :key="item.label" class="readonly-item">
                  <span class="readonly-item__label">{{ item.label }}</span>
                  <div class="readonly-item__value">{{ item.value }}</div>
                </div>
              </div>
            </section>

            <section class="module-card module-card--form">
              <header class="module-card__header">
                <span class="module-card__title">申请信息</span>
              </header>

              <a-form
                ref="formRef"
                :model="formData"
                :rules="formRules"
                layout="vertical"
                class="apply-form"
              >
                <a-form-item field="department" label="部门" required>
                  <div class="department-trigger" @click="openDepartmentDialog" style="width: 100%;">
                    <a-input
                    :model-value="formData.department"
                      readonly
                      placeholder="请选择部门"
                       @click.stop="openDepartmentDialog"
                    />
                  </div>
                </a-form-item>


                <div class="form-grid">
                  <a-form-item field="sourceArea" label="上传区域" required>
                    <a-select v-model="formData.sourceArea" :options="areaOptions" />
                  </a-form-item>

                  <a-form-item field="targetArea" label="下载区域" required>
                    <a-select v-model="formData.targetArea" :options="areaOptions" />
                  </a-form-item>

                  <a-form-item field="sourceCity" label="数据传出国家/城市" required>
                    <a-cascader
                      v-model="formData.sourceCity"
                      :options="cityOptions"
                      allow-clear
                      allow-search
                      placeholder="请输入或选择国家/城市"
                    />
                  </a-form-item>

                  <a-form-item field="targetCity" label="数据传至国家/城市" required>
                    <a-cascader
                      v-model="formData.targetCity"
                      :options="cityOptions"
                      allow-clear
                      allow-search
                      placeholder="请输入或选择国家/城市"
                    />
                  </a-form-item>
                </div>

                <a-form-item field="downloaderAccounts" label="下载人账号" required>
                  <a-select
                    v-model="formData.downloaderAccounts"
                    :options="userOptions"
                    multiple
                    allow-clear
                    allow-search
                    placeholder="请输入下载人账号"
                  />
                </a-form-item>

                <a-form-item field="ccAccounts" label="抄送人" required>
                  <a-select
                    v-model="formData.ccAccounts"
                    :options="userOptions"
                    multiple
                    allow-clear
                    allow-search
                    placeholder="请输入抄送人"
                  />
                </a-form-item>

                <a-form-item label="包含客户网络数据" required>
                  <a-radio-group v-model="formData.containsCustomerData" type="button">
                    <a-radio value="yes">是</a-radio>
                    <a-radio value="no">否</a-radio>
                  </a-radio-group>
                </a-form-item>

                <template v-if="showCustomerDataFields">
                  <div class="form-grid">
                    <a-form-item field="customerAuthFile" label="客户授权文件" required>
                      <div class="inline-file-field">
                        <a-input :model-value="formData.customerAuthFile" readonly placeholder="请选择客户授权文件" />
                        <a-button type="outline" @click="onSelectCustomerAuth">上传</a-button>
                        <input ref="customerAuthInputRef" type="file" class="hidden-input" @change="onCustomerAuthChange" />
                      </div>
                    </a-form-item>

                    <a-form-item field="srNumber" label="SR单号" required>
                      <a-input v-model="formData.srNumber" placeholder="请输入 SR 单号" />
                    </a-form-item>
                  </div>

                  <a-form-item field="minDeptSupervisor" label="最小部门主管">
                    <a-input v-model="formData.minDeptSupervisor" readonly />
                  </a-form-item>
                </template>

                <a-form-item field="applyReason" label="申请原因" required>
                  <a-textarea
                    v-model="formData.applyReason"
                    :max-length="1000"
                    show-word-limit
                    placeholder="请填写申请原因"
                  />
                </a-form-item>

                <div class="form-grid form-grid--notify">
                  <a-form-item label="申请人通知选项" required>
                    <a-checkbox-group v-model="formData.applicantNotifyOptions" :options="applicantNotifyOptions" />
                  </a-form-item>
                  <a-form-item label="下载人通知选项" required>
                    <a-checkbox-group v-model="formData.downloaderNotifyOptions" :options="downloaderNotifyOptions" />
                  </a-form-item>
                </div>
              </a-form>
            </section>
          </div>

          <aside class="step-one-layout__side">
            <section class="side-card side-card--notice">
              <header class="side-card__header">注意事项</header>
              <ol class="side-card__list">
                <li v-for="(item, index) in noticeItems" :key="index">{{ item }}</li>
              </ol>
            </section>

            <section class="side-card side-card--recent">
              <header class="side-card__header">最近传输选择</header>
              <ul class="recent-list">
                <li v-for="(item, index) in recentTransferTemplates" :key="item" class="recent-list__item">
                  <span>{{ index + 1 }}. {{ item }}</span>
                  <button type="button" @click="onCopyRecentTemplate(item)">一键复制</button>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </template>

      <template v-else-if="currentStep === 1">
        <div class="section-title">
          <h2>上传文件</h2>
          <span class="sub-text">支持断点续传（演示版）</span>
        </div>

        <div class="upload-panel">
          <div class="upload-panel__drop">
            <a-button type="primary" @click="onSelectUploadFiles">选择文件</a-button>
            <p>单文件不超过 50GB，可多选上传</p>
            <input ref="uploadInputRef" class="hidden-input" type="file" multiple @change="onUploadFilesChange" />
          </div>

          <a-table :data="uploadedFiles" :pagination="false" row-key="uid" class="upload-table">
            <template #columns>
              <a-table-column title="文件名" data-index="name" />
              <a-table-column title="大小">
                <template #cell="{ record }">
                  {{ formatFileSize(record.size) }}
                </template>
              </a-table-column>
              <a-table-column title="状态">
                <template #cell="{ record }">
                  <a-tag color="green" v-if="record.status === 'completed'">已完成</a-tag>
                  <a-tag color="orange" v-else-if="record.status === 'uploading'">上传中</a-tag>
                  <a-tag color="gray" v-else>待上传</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="操作" :width="120">
                <template #cell="{ record }">
                  <a-button type="text" status="danger" @click="removeUploadFile(record.uid)">移除</a-button>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </template>

      <template v-else>
        <div class="submit-success">
          <div class="submit-success__icon">
            <img src="/figma/3960_2183/3.svg" alt="success" />
          </div>
          <h2>申请已提交成功！</h2>
          <p class="submit-success__no">申请单号：{{ submittedApplication?.applicationNo || '--' }}</p>
          <p class="submit-success__desc">您的申请已经提交成功，等待审批中...</p>

          <div class="submit-success__detail">
            <h3>申请详情</h3>
            <div class="submit-success__detail-grid">
              <div v-for="item in summaryRows" :key="item.label" class="detail-item">
                <span class="detail-item__label">{{ item.label }}：</span>
                <span class="detail-item__value">{{ item.value }}</span>
              </div>
            </div>
          </div>

          <div class="submit-success__actions">
            <a-button @click="goHome">返回首页</a-button>
            <a-button type="primary" @click="goMyApplications">查看我的申请</a-button>
          </div>
        </div>
      </template>
    </div>

    <a-modal
      v-model:visible="departmentDialogVisible"
      title="选择部门"
      ok-text="确认"
      cancel-text="取消"
      :on-before-ok="onConfirmDepartment"
      class="department-modal"
    >
      <a-tree
        :data="departmentOptions"
        block-node
        :selected-keys="departmentSelectedKey ? [departmentSelectedKey] : []"
        @select="onDepartmentSelect"
      />
    </a-modal>

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

<style scoped lang="scss" src="./create-application.scss"></style>
