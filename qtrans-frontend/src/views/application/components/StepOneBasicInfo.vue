<script setup lang="ts">

import type { ApplicationFormData } from '@/composables/useApplicationForm'
import { computed, ref } from 'vue'
import { useAuthStore, useRegionMetadataStore } from '@/stores'
import { useApplicationConfig } from '@/composables/useApplicationConfig'
import DepartmentSelector from '@/components/business/DepartmentSelector.vue'
import CitySelector from '@/components/business/CitySelector.vue'
import UserSuggestSelect from '@/components/business/UserSuggestSelect.vue'
import type { UserSuggestOption } from '@/composables/useUserSuggest'
import { useApprovalRoute } from './useApprovalRoute'
import { useCitySelection } from './useCitySelection'
import { useSecurityLevel } from './useSecurityLevel'

/* ===== Props & Emits ===== */
interface Props {
  formRules: Record<string, any[]>
  transferTypeLabel: string
  showCustomerDataFields: boolean
  submittedApplication: any
  readonly?: boolean
  /**
   * 驳回重提模式：
   * - readonly 仍为 false，大部分字段可编辑
   * - 但源区域/目标区域/直接主管等核心字段仍保持禁用
   */
  resubmitMode?: boolean
}

const props = defineProps<Props>()
const formData = defineModel<ApplicationFormData>('formData', { required: true })

const emit = defineEmits<{
  (e: 'copyTemplate', text: string): void
}>()


/* ===== Stores & Refs ===== */
const authStore = useAuthStore()
const regionMetadataStore = useRegionMetadataStore()
const formRef = ref<{
  validate: () => Promise<undefined | Record<string, any>>
  clearValidate?: (field?: string | string[]) => void
} | null>(null)

/* ===== Composables ===== */
function isSameFieldValue(currentValue: unknown, nextValue: unknown) {
  if (Array.isArray(currentValue) && Array.isArray(nextValue)) {
    return currentValue.length === nextValue.length
      && currentValue.every((item, index) => item === nextValue[index])
  }

  return currentValue === nextValue
}

function updateFormData(updates: Partial<ApplicationFormData>) {
  const nextUpdates: Partial<ApplicationFormData> = {}
  let hasChanges = false

  for (const [key, value] of Object.entries(updates) as [keyof ApplicationFormData, ApplicationFormData[keyof ApplicationFormData]][]) {
    if (isSameFieldValue(formData.value[key], value))
      continue

    nextUpdates[key] = value as never
    hasChanges = true
  }

  if (!hasChanges)
    return

  formData.value = { ...formData.value, ...nextUpdates }
}

const {
  options: securityLevelOptions,
  loading: securityLevelLoading,
  displaySecretLevel,
} = useSecurityLevel(
  () => ({
    sourceArea: formData.value.sourceArea,
    targetArea: formData.value.targetArea,
    securityLevel: formData.value.securityLevel,
  }),
  updateFormData,
)

const {
  loading: approvalRouteLoading,
  config: approvalRouteConfig,
  approverOptions,
} = useApprovalRoute(
  () => ({
    securityLevel: formData.value.securityLevel,
    departmentId: formData.value.departmentId,
    containsCustomerData: formData.value.containsCustomerData,
    directSupervisor: formData.value.directSupervisor,
    approverLevel2: formData.value.approverLevel2,
    approverLevel3: formData.value.approverLevel3,
    approverLevel4: formData.value.approverLevel4,
  }),
  updateFormData,
)

const {
  state: cityState,
  onSourceCityChange,
  onTargetCityChange,
} = useCitySelection(
  updateFormData,
)


/* ===== Computed ===== */
const { getOptionsByType, getItemsByType } = useApplicationConfig()

// 是否显示文件传输方式（源或目标为外网时）
const isExternalScene = computed(() => isSourceExternal.value || isTargetExternal.value)

// FTP 字段标签前缀（根据传输方向决定是"上传方"还是"下载方"）
const ftpLabelPrefix = computed(() => isSourceExternal.value ? '上传方' : '下载方')

const applicantNotifyOptions = [
  { label: '应用号消息', value: 'in_app' },
  { label: '邮件', value: 'email' },
  { label: '下载邮件的发送通知', value: 'download_email' },
]

const downloaderNotifyOptions = [
  { label: '应用号消息', value: 'in_app' },
  { label: 'W3待办', value: 'w3_todo' },
  { label: '邮件', value: 'email' },
]
const recentTransferTemplates = computed(() => getItemsByType('recentTransferTemplates'))
const noticeItems = computed(() => getItemsByType('noticeItems'))

const basicInfoRows = computed(() => {
  const user = authStore.currentUser
  const applicant = user ? `${user.username} ${user.name}` : 'zhangcheng XXX13433308'
  const handler = user ? `${user.username} ${user.name}` : 'zhangcheng XXX13433308'

  return [
    { label: '申请人', value: applicant },
    { label: '申请单号', value: props.submittedApplication?.applicationNo || '待提交后生成' },
    { label: '当前处理人', value: handler },
  ]
})

/* ===== 区域只读显示 ===== */
const fromRegionName = computed(() => regionMetadataStore.getFromName() || formData.value.sourceArea)
const toRegionName = computed(() => regionMetadataStore.getToName() || formData.value.targetArea)
const isTargetExternal = computed(() => regionMetadataStore.getToCode() === 'external' || formData.value.targetArea === 'Internet')
const isSourceExternal = computed(() => regionMetadataStore.getFromCode() === 'external' || formData.value.sourceArea === 'external')

/* ===== Event Handlers ===== */
function onDepartmentChange(value: { deptId: string, deptName: string, deptCode: string }) {
  updateFormData({
    department: value.deptName,
    departmentId: value.deptCode || value.deptId,
  })
  formRef.value?.clearValidate?.('department')
}

function onDownloaderAccountsChange(val: string | string[] | undefined, selectedItems: UserSuggestOption[] = []) {
  const accounts = Array.isArray(val) ? val : val ? [val] : []
  // 根据选中的 accounts 顺序收集对应的 email
  const emails = accounts.map((account) => {
    const item = selectedItems.find(opt => opt.value === account)
    return item?.raw?.email || ''
  })
  updateFormData({ downloaderAccounts: accounts, downloaderEmails: emails })
  formRef.value?.clearValidate?.('downloaderAccounts')
}

function onCcAccountsChange(val: string | string[] | undefined) {
  updateFormData({ ccAccounts: Array.isArray(val) ? val : val ? [val] : [] })
  formRef.value?.clearValidate?.('ccAccounts')
}

function onSecurityLevelChange() {
  formRef.value?.clearValidate?.('securityLevel')
}

function onDirectSupervisorChange(val: string | string[] | undefined) {
  updateFormData({ directSupervisor: typeof val === 'string' ? val : '' })
  formRef.value?.clearValidate?.('directSupervisor')
}

function onApproverLevel2Change() {
  formRef.value?.clearValidate?.('approverLevel2')
}

function onApproverLevel3Change() {
  formRef.value?.clearValidate?.('approverLevel3')
}

function onApproverLevel4Change() {
  formRef.value?.clearValidate?.('approverLevel4')
}

function onCopyRecentTemplate(text: string) {
  emit('copyTemplate', text)
}

/* ===== Form Validation ===== */
async function validate() {
  if (!formRef.value)
    return true

  const errors = await formRef.value.validate()
  return errors === undefined
}

defineExpose({ validate })
</script>

<template>
  <div class="step-one-layout">
    <div class="step-one-layout__main">
      <!-- 基本信息 -->
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

      <!-- 申请信息 -->
      <section class="module-card module-card--form">
        <header class="module-card__header">
          <span class="module-card__title">申请信息</span>
        </header>
        <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical" class="apply-form">
          <!-- 部门 -->
          <a-form-item field="department" label="部门" required>
            <DepartmentSelector
              :model-value="formData.departmentId"
              :display-value="formData.department"
              :disabled="readonly"
              :auto-init="true"
              @change="onDepartmentChange"
            />
          </a-form-item>

          <!-- 文件传输方式（源或目标为外网时显示） -->
          <template v-if="isExternalScene">
            <a-form-item field="transferMode" label="文件传输方式" required>
              <a-radio-group v-model="formData.transferMode" :disabled="readonly">
                <a-radio :value="0">我司提供服务器</a-radio>
                <a-radio :value="1">对方提供服务器</a-radio>
              </a-radio-group>
            </a-form-item>

            <!-- 对方提供服务器时的 FTP 字段 -->
            <template v-if="formData.transferMode === 1">
              <a-form-item field="vendorFtpAddress" :label="`${ftpLabelPrefix}FTP地址`" required>
                <a-input
                  v-model="formData.vendorFtpAddress"
                  :disabled="readonly"
                  placeholder="例如：ftp://xxxx或者ftps://xxxx"
                />
              </a-form-item>
              <a-form-item field="vendorFtpUserName" :label="`${ftpLabelPrefix}FTP账号`" required>
                <a-input
                  v-model="formData.vendorFtpUserName"
                  :disabled="readonly"
                  placeholder="请输入FTP账号"
                />
              </a-form-item>
              <a-form-item field="vendorFtpPassword" :label="`${ftpLabelPrefix}FTP密码`" required>
                <a-input-password
                  v-model="formData.vendorFtpPassword"
                  :disabled="readonly"
                  placeholder="请输入FTP密码"
                  allow-show-password
                />
              </a-form-item>
              <a-form-item field="vendorFtpVirtualPath" :label="`${ftpLabelPrefix}文件存放目录`" required>
                <a-input
                  v-model="formData.vendorFtpVirtualPath"
                  :disabled="readonly"
                  placeholder="请输入文件存放目录"
                />
              </a-form-item>
              <!-- 外网传入时显示：获取文件名称 -->
              <a-form-item
                v-if="isSourceExternal"
                field="vendorFtpFiles"
                label="获取文件名称"
                required
              >
                <a-input
                  v-model="formData.vendorFtpFiles"
                  :disabled="readonly"
                  placeholder="请输入获取文件名称"
                />
              </a-form-item>
            </template>
          </template>

          <!-- 区域选择（只读回显，从首页传输场景确定） -->
          <div class="form-grid">
            <a-form-item field="sourceArea" label="上传区域">
              <a-input :model-value="fromRegionName" readonly />
            </a-form-item>
            <a-form-item field="targetArea" label="下载区域">
              <a-input :model-value="toRegionName" readonly />
            </a-form-item>

            <!-- 城市选择 -->
            <a-form-item field="sourceCity" label="数据传出省份/城市" required>
              <CitySelector
                :model-value="formData.sourceCity"
                :options="cityState.uploadCityOptions"
                :loading="cityState.uploadCityLoading"
                :disabled="readonly"
                @change="onSourceCityChange"
              />
            </a-form-item>
            <a-form-item field="targetCity" label="数据传至省份/城市" required>
              <CitySelector
                :model-value="formData.targetCity"
                :options="cityState.downloadCityOptions"
                :loading="cityState.downloadCityLoading"
                :disabled="readonly || !cityState.selectedUploadRegionId"
                @change="onTargetCityChange"
              />
            </a-form-item>
          </div>

          <!-- 外网下载字段（目标区域为外网时显示） -->
          <template v-if="isTargetExternal">
            <a-form-item field="vendorName" label="下载方名称（单位）" required>
              <a-input
                v-model="formData.vendorName"
                :disabled="readonly"
                placeholder="请输入下载方名称（单位）"
              />
            </a-form-item>
            <a-form-item field="downloadEmail" label="下载方邮箱地址" required
            validate-trigger="blur">
              <a-input
                v-model="formData.downloadEmail"
                :disabled="readonly"
                placeholder="请输入下载方邮箱地址"
              />
            </a-form-item>
          </template>

          <!-- 外网上传字段（源区域为外网时显示，与外网下载字段互斥） -->
          <template v-if="isSourceExternal">
            <a-form-item field="vendorName" label="上传方名称（单位/人）" required>
              <a-input
                v-model="formData.vendorName"
                :disabled="readonly"
                placeholder="请输入上传方名称（单位/人）"
              />
            </a-form-item>
            <a-form-item field="uploaderEmail" label="上传方邮箱地址" required
            validate-trigger="blur">
              <a-input
                v-model="formData.uploaderEmail"
                :disabled="readonly"
                placeholder="请输入上传方邮箱地址"
              />
            </a-form-item>
          </template>

          <!-- 下载人账号 -->
          <a-form-item field="downloaderAccounts" label="下载人账号" required>
            <UserSuggestSelect
              :model-value="formData.downloaderAccounts"
              :disabled="readonly"
              multiple
              placeholder="请输入至少3个字符搜索下载人账号"
              @change="onDownloaderAccountsChange"
            />
          </a-form-item>

          <!-- 抄送人 -->
          <a-form-item field="ccAccounts" label="抄送人">
            <UserSuggestSelect
              :model-value="formData.ccAccounts"
              :disabled="readonly"
              multiple
              placeholder="请输入至少3个字符搜索抄送人"
              @change="onCcAccountsChange"
            />
          </a-form-item>

          <!-- 包含客户网络数据 -->
          <a-form-item field="containsCustomerData" label="包含客户网络数据" required>
            <a-radio-group
              v-model="formData.containsCustomerData"
              :disabled="readonly"
            >
              <a-radio value="yes">是</a-radio>
              <a-radio value="no">否</a-radio>
            </a-radio-group>
          </a-form-item>

          <!-- 客户数据相关字段 -->
          <template v-if="showCustomerDataFields">
            <a-form-item field="srNumber" label="SR单号" required>
              <a-input
                v-model="formData.srNumber"
                :disabled="readonly"
                placeholder="请输入 SR 单号"
              />
            </a-form-item>
            <a-form-item field="minDeptSupervisor" label="最小部门主管">
              <a-input :model-value="formData.minDeptSupervisor" readonly />
            </a-form-item>
          </template>

          <!-- 文件最高密级（后端通过 isDisplaySecretLevelControl 控制） -->
          <a-form-item v-if="displaySecretLevel" field="securityLevel" label="文件最高密级" required>
            <a-select
              v-model="formData.securityLevel"
              :options="securityLevelOptions"
              :loading="securityLevelLoading"
              :disabled="readonly"
              placeholder="请选择文件最高密级"
              @change="onSecurityLevelChange"
            />
          </a-form-item>

          <!-- 审批人字段 -->
          <!-- 审批人字段（后端通过 isDisplaySecretLevelControl 控制） -->
          <template v-if="displaySecretLevel && formData.securityLevel">
            <a-form-item
              v-if="approvalRouteConfig.showDirectSupervisor"
              field="directSupervisor"
              label="直接主管"
              required
            >
              <UserSuggestSelect
                :model-value="formData.directSupervisor"
                :disabled="readonly || resubmitMode"
                placeholder="请输入至少3个字符搜索直接主管"
                @change="onDirectSupervisorChange"
              />
            </a-form-item>

            <a-form-item
              v-if="approvalRouteConfig.showApproverLevel2"
              field="approverLevel2"
              label="二层审批人"
              required
            >
              <a-select
                v-model="formData.approverLevel2"
                :options="approverOptions.level2"
                :loading="approvalRouteLoading"
                :disabled="readonly"
                placeholder="请选择二层审批人"
                @change="onApproverLevel2Change"
              />
            </a-form-item>

            <a-form-item
              v-if="approvalRouteConfig.showApproverLevel3"
              field="approverLevel3"
              label="三层审批人"
              required
            >
              <a-select
                v-model="formData.approverLevel3"
                :options="approverOptions.level3"
                :loading="approvalRouteLoading"
                :disabled="readonly"
                placeholder="请选择三层审批人"
                @change="onApproverLevel3Change"
              />
            </a-form-item>

            <a-form-item
              v-if="approvalRouteConfig.showApproverLevel4"
              field="approverLevel4"
              label="四层审批人"
              required
            >
              <a-select
                v-model="formData.approverLevel4"
                :options="approverOptions.level4"
                :loading="approvalRouteLoading"
                :disabled="readonly"
                placeholder="请选择四层审批人"
                @change="onApproverLevel4Change"
              />
            </a-form-item>
          </template>

          <!-- 申请原因 -->
          <a-form-item field="applyReason" label="申请原因" required>
            <a-textarea
              v-model="formData.applyReason"
              :max-length="1000"
              :disabled="readonly"
              show-word-limit
              placeholder="请填写申请原因"
            />
          </a-form-item>

          <!-- 通知选项 -->
          <div class="form-grid form-grid--notify">
            <a-form-item field="applicantNotifyOptions" label="申请人通知选项" required>
              <a-checkbox-group
                v-model="formData.applicantNotifyOptions"
                :options="applicantNotifyOptions"
                :disabled="readonly"
              />
            </a-form-item>
            <a-form-item field="downloaderNotifyOptions" label="下载人通知选项" required>
              <a-checkbox-group
                v-model="formData.downloaderNotifyOptions"
                :options="downloaderNotifyOptions"
                :disabled="readonly"
              />
            </a-form-item>
          </div>
        </a-form>
      </section>
    </div>

    <!-- 侧边栏 -->
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
            <span>{{ Number(index) + 1 }}. {{ item }}</span>
            <button type="button" @click="onCopyRecentTemplate(item)">一键复制</button>
          </li>
        </ul>
      </section>
    </aside>
  </div>
</template>

<style scoped lang="scss">
// 样式继承自父组件的 create-application.scss
</style>
