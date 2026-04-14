<script setup lang="ts">
import type { NotifyChannel } from '@/types/application'
import type { ApplicationFormData } from '@/composables/useApplicationForm'
import { computed, ref } from 'vue'
import { useAuthStore, useRegionMetadataStore } from '@/stores'
import { useApplicationConfig } from '@/composables/useApplicationConfig'
import DepartmentSelector from '@/components/business/DepartmentSelector.vue'
import CitySelector from '@/components/business/CitySelector.vue'
import UserSuggestSelect from '@/components/business/UserSuggestSelect.vue'
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

const applicantNotifyOptions = computed(() => getOptionsByType('applicantNotifyOptions'))
const downloaderNotifyOptions = computed(() => getOptionsByType('downloaderNotifyOptions'))
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
const isTargetExternal = computed(() => regionMetadataStore.getToCode() === 'external' || formData.value.targetArea === 'external')

/* ===== Event Handlers ===== */
function onDepartmentChange(value: { deptId: string, deptName: string, deptCode: string }) {
  updateFormData({
    department: value.deptName,
    departmentId: value.deptCode || value.deptId,
  })
  formRef.value?.clearValidate?.('department')
}

function onDownloaderAccountsChange(val: string | string[] | undefined) {
  updateFormData({ downloaderAccounts: Array.isArray(val) ? val : val ? [val] : [] })
  formRef.value?.clearValidate?.('downloaderAccounts')
}

function onCcAccountsChange(val: string | string[] | undefined) {
  updateFormData({ ccAccounts: Array.isArray(val) ? val : val ? [val] : [] })
  formRef.value?.clearValidate?.('ccAccounts')
}

function onContainsCustomerDataChange(val: 'yes' | 'no') {
  updateFormData({ containsCustomerData: val })
}

function onSrNumberChange(val: string) {
  updateFormData({ srNumber: val })
}

function onSecurityLevelChange(val: string) {
  updateFormData({ securityLevel: val })
  formRef.value?.clearValidate?.('securityLevel')
}

function onDirectSupervisorChange(val: string | string[] | undefined) {
  updateFormData({ directSupervisor: typeof val === 'string' ? val : '' })
  formRef.value?.clearValidate?.('directSupervisor')
}

function onApproverLevel2Change(val: string) {
  updateFormData({ approverLevel2: val })
  formRef.value?.clearValidate?.('approverLevel2')
}

function onApproverLevel3Change(val: string) {
  updateFormData({ approverLevel3: val })
  formRef.value?.clearValidate?.('approverLevel3')
}

function onApproverLevel4Change(val: string) {
  updateFormData({ approverLevel4: val })
  formRef.value?.clearValidate?.('approverLevel4')
}

function onApplyReasonChange(val: string) {
  updateFormData({ applyReason: val })
}

function onApplicantNotifyChange(val: NotifyChannel[]) {
  updateFormData({ applicantNotifyOptions: val })
}

function onDownloaderNotifyChange(val: NotifyChannel[]) {
  updateFormData({ downloaderNotifyOptions: val })
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
                :model-value="formData.vendorName"
                :disabled="readonly"
                placeholder="请输入下载方名称（单位）"
                @input="(val: string) => updateFormData({ vendorName: val })"
              />
            </a-form-item>
            <a-form-item field="downloadEmail" label="下载方邮箱地址" required>
              <a-input
                :model-value="formData.downloadEmail"
                :disabled="readonly"
                placeholder="请输入下载方邮箱地址"
                @input="(val: string) => updateFormData({ downloadEmail: val })"
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
          <a-form-item label="包含客户网络数据" required>
            <a-radio-group
              :model-value="formData.containsCustomerData"
              :disabled="readonly"
              @change="onContainsCustomerDataChange"
            >
              <a-radio value="yes">是</a-radio>
              <a-radio value="no">否</a-radio>
            </a-radio-group>
          </a-form-item>

          <!-- 客户数据相关字段 -->
          <template v-if="showCustomerDataFields">
            <a-form-item field="srNumber" label="SR单号" required>
              <a-input
                :model-value="formData.srNumber"
                :disabled="readonly"
                placeholder="请输入 SR 单号"
                @input="onSrNumberChange"
              />
            </a-form-item>
            <a-form-item field="minDeptSupervisor" label="最小部门主管">
              <a-input :model-value="formData.minDeptSupervisor" readonly />
            </a-form-item>
          </template>

          <!-- 文件最高密级（后端通过 isDisplaySecretLevelControl 控制） -->
          <a-form-item v-if="displaySecretLevel" field="securityLevel" label="文件最高密级" required>
            <a-select
              :model-value="formData.securityLevel"
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
                :disabled="readonly"
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
                :model-value="formData.approverLevel2"
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
                :model-value="formData.approverLevel3"
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
                :model-value="formData.approverLevel4"
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
              :model-value="formData.applyReason"
              :max-length="1000"
              :disabled="readonly"
              show-word-limit
              placeholder="请填写申请原因"
              @input="onApplyReasonChange"
            />
          </a-form-item>

          <!-- 通知选项 -->
          <div class="form-grid form-grid--notify">
            <a-form-item label="申请人通知选项" required>
              <a-checkbox-group
                :model-value="formData.applicantNotifyOptions"
                :options="applicantNotifyOptions"
                :disabled="readonly"
                @change="onApplicantNotifyChange"
              />
            </a-form-item>
            <a-form-item label="下载人通知选项" required>
              <a-checkbox-group
                :model-value="formData.downloaderNotifyOptions"
                :options="downloaderNotifyOptions"
                :disabled="readonly"
                @change="onDownloaderNotifyChange"
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
            <span>{{ index + 1 }}. {{ item }}</span>
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
