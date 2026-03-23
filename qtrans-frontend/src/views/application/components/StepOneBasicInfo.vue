<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ApplicationFormData } from '@/composables/useApplicationForm'
import { users } from '@/mocks/data/users'
import { useAuthStore } from '@/stores'
import { useApplicationConfig } from '@/composables/useApplicationConfig'
import { applicationApi } from '@/api/application'
import DepartmentSelector from '@/components/business/DepartmentSelector.vue'
import CitySelector from '@/components/business/CitySelector.vue'


interface Props {
  formData: ApplicationFormData
  formRules: Record<string, any[]>
  transferTypeLabel: string
  showCustomerDataFields: boolean
  draftApplicationNo: string
  submittedApplication: any
  readonly?: boolean
}

const props = defineProps<Props>()

interface Emits {
  (e: 'update:formData', value: ApplicationFormData): void
  (e: 'copyTemplate', text: string): void
}

const emit = defineEmits<Emits>()

const authStore = useAuthStore()
const formRef = ref<{
  validate: () => Promise<undefined | Record<string, any>>
  clearValidate?: (field?: string | string[]) => void
} | null>(null)

// 区域 → regionTypeId 映射
const REGION_TYPE_MAP: Record<string, number> = {
  green: 1,
  yellow: 0,
  red: 4,
  external: 2,
}

// 高密传低密触发组合
const HIGH_TO_LOW_PAIRS = new Set([
  'yellow->green',
  'green->external',
  'yellow->external',
  'red->yellow',
  'red->green',
])

const isHighToLow = computed(() => {
  const key = `${props.formData.sourceArea}->${props.formData.targetArea}`
  return HIGH_TO_LOW_PAIRS.has(key)
})

const securityLevelOptions = ref<{ label: string; value: string }[]>([])
const securityLevelLoading = ref(false)

// 审批层级状态
const approvalRouteLoading = ref(false)
const approvalRouteConfig = ref<{
  showDirectSupervisor: boolean
  showApproverLevel2: boolean
  showApproverLevel3: boolean
  showApproverLevel4: boolean
}>({
  showDirectSupervisor: false,
  showApproverLevel2: false,
  showApproverLevel3: false,
  showApproverLevel4: false,
})

// Mock 人员数据（接口未提供时使用）
const mockApproverOptions = [
  { label: '张三 / zhangsan / 研发部', value: 'zhangsan' },
  { label: '李四 / lisi / 测试部', value: 'lisi' },
  { label: '王五 / wangwu / 产品部', value: 'wangwu' },
  { label: '赵六 / zhaoliu / 运维部', value: 'zhaoliu' },
  { label: '陈七 / chenqi / 架构部', value: 'chenqi' },
]

// 城市列表状态
const uploadCityOptions = ref<import('@/api/application').CityItem[]>([])
const downloadCityOptions = ref<import('@/api/application').CityItem[]>([])
const uploadCityLoading = ref(false)
const downloadCityLoading = ref(false)
const selectedUploadRegionId = ref<number>(0)


async function fetchSecurityLevelList() {
  const from = REGION_TYPE_MAP[props.formData.sourceArea]
  const to = REGION_TYPE_MAP[props.formData.targetArea]
  if (from === undefined || to === undefined) return
  securityLevelLoading.value = true
  try {
    const list = await applicationApi.findSecurityLevelList({
      fromRegionTypeId: from,
      toRegionTypeId: to,
      isUrgent: 0,
      isContainSourceCode: 0,
      procType: '0',
      isContainLargeModel: 0,
    })
    securityLevelOptions.value = (list || []).map((item: any) => ({
      value: item.securityLookupVO?.itemCode ?? '',
      label: item.securityLookupVO?.itemName ?? '',
    }))
    props.formData.securityLevel = list[0]?.securityLookupVO?.itemCode ?? ''
  }
  catch {
    securityLevelOptions.value = []
  }
  finally {
    securityLevelLoading.value = false
  }
}

/**
 * 查询审批层级配置
 * 当"文件最高密级"有值后联动查询
 */
async function fetchApprovalRoute() {
  if (!props.formData.securityLevel || !props.formData.departmentId) return

  const from = REGION_TYPE_MAP[props.formData.sourceArea]
  const to = REGION_TYPE_MAP[props.formData.targetArea]
  if (from === undefined || to === undefined) return

  approvalRouteLoading.value = true
  try {
    const res = await applicationApi.findApprovalRoute({
      procTypeId: '0',
      fromRegionTypeId: from,
      toRegionTypeId: to,
      securityLevelId: props.formData.securityLevel,
      isCustomerData: props.formData.containsCustomerData === 'yes' ? 1 : 0,
      isUrgent: 0,
      deptId: props.formData.departmentId,
      isContainLargeModel: 0,
    })

    const first = res?.result?.[0]
    if (first) {
      approvalRouteConfig.value = {
        showDirectSupervisor: first.isManagerApproval === 1,
        showApproverLevel2: first.isManager2Approval === 1,
        showApproverLevel3: first.isManager3Approval === 1,
        showApproverLevel4: first.isManager4Approval === 1,
      }
    }
    else {
      // 无数据时重置
      approvalRouteConfig.value = {
        showDirectSupervisor: false,
        showApproverLevel2: false,
        showApproverLevel3: false,
        showApproverLevel4: false,
      }
    }
  }
  catch {
    approvalRouteConfig.value = {
      showDirectSupervisor: false,
      showApproverLevel2: false,
      showApproverLevel3: false,
      showApproverLevel4: false,
    }
  }
  finally {
    approvalRouteLoading.value = false
  }
}

async function fetchUploadCities() {
  const from = REGION_TYPE_MAP[props.formData.sourceArea]
  const to = REGION_TYPE_MAP[props.formData.targetArea]
  if (from === undefined || to === undefined) return
  uploadCityLoading.value = true
  try {
    const res = await applicationApi.findUploadCity({
      fromRegionTypeId: from,
      toRegionTypeId: to,
      isInternetFtpUpload: 0,
      w3Account: authStore.currentUser?.username || '',
    })
    uploadCityOptions.value = res?.cityList || []

    // 自动选中第一个城市并触发联动
    const first = uploadCityOptions.value[0]
    if (first) {
      selectedUploadRegionId.value = first.regionId
      emit('update:formData', {
        ...props.formData,
        sourceCity: [first.countryName, first.cityName],
        sourceCityId: first.cityId,
        targetCity: [],
        targetCityId: 0,
      })
      fetchDownloadCities(first.regionId)
    }
  }
  catch {
    uploadCityOptions.value = []
  }
  finally {
    uploadCityLoading.value = false
  }
}

async function fetchDownloadCities(uploadRegionId: number) {
  const from = REGION_TYPE_MAP[props.formData.sourceArea]
  const to = REGION_TYPE_MAP[props.formData.targetArea]
  if (from === undefined || to === undefined) return
  downloadCityLoading.value = true
  try {
    const res = await applicationApi.findDownloadCity({
      uploadRegionId,
      fromRegionTypeId: from,
      toRegionTypeId: to,
      isInternetFtpUpload: 0,
      w3Account: authStore.currentUser?.username || '',
    })
    downloadCityOptions.value = res?.cityList || []
    const first = uploadCityOptions.value[0]
    if (first) {
      emit('update:formData', {
        ...props.formData,
        targetCity: [first.countryName, first.cityName],
        targetCityId: first.cityId,
      })
    }

  }
  catch {
    downloadCityOptions.value = []
  }
  finally {
    downloadCityLoading.value = false
  }
}

watch(
  isHighToLow,
  (val) => {
    if (val) {
      fetchSecurityLevelList()
    }
    else {
      securityLevelOptions.value = []
      emit('update:formData', { ...props.formData, securityLevel: undefined })
    }
  },
  { immediate: true },
)

// 监听文件最高密级变化，触发审批层级查询
watch(
  () => props.formData.securityLevel,
  (val) => {
    if (val && isHighToLow.value) {
      fetchApprovalRoute()
    }
    else {
      // 清空审批层级配置
      approvalRouteConfig.value = {
        showDirectSupervisor: false,
        showApproverLevel2: false,
        showApproverLevel3: false,
        showApproverLevel4: false,
      }
      // 清空审批人字段
      emit('update:formData', {
        ...props.formData,
        directSupervisor: '',
        approverLevel2: '',
        approverLevel3: '',
        approverLevel4: '',
      })
    }
  },
  { immediate: false },
)

watch(
  () => [props.formData.sourceArea, props.formData.targetArea] as const,
  ([newSource, newTarget], old) => {
    // 只有 sourceArea 或 targetArea 的值本身变化时才执行
    if (old && newSource === old[0] && newTarget === old[1]) return

    uploadCityOptions.value = []
    downloadCityOptions.value = []
    selectedUploadRegionId.value = 0
    emit('update:formData', {
      ...props.formData,
      sourceCity: [],
      sourceCityId: 0,
      targetCity: [],
      targetCityId: 0,
    })
    fetchUploadCities()
  },
  { immediate: true },
)


const { getOptionsByType, getItemsByType } = useApplicationConfig()

const areaOptions = [
  { label: '绿区', value: 'green' },
  { label: '黄区', value: 'yellow' },
  { label: '红区', value: 'red' },
  { label: '外网', value: 'external' },
]

const applicantNotifyOptions = computed(() => getOptionsByType('applicantNotifyOptions'))
const downloaderNotifyOptions = computed(() => getOptionsByType('downloaderNotifyOptions'))
const recentTransferTemplates = computed(() => getItemsByType('recentTransferTemplates'))
const noticeItems = computed(() => getItemsByType('noticeItems'))

const userOptions = computed(() => {
  return users.map(user => ({
    label: `${user.username} / ${user.name} / ${user.departmentName}`,
    value: user.username,
  }))
})

const basicInfoRows = computed(() => {
  const user = authStore.currentUser
  const applicant = user ? `${user.username} ${user.name}` : 'zhangcheng XXX13433308'
  const handler = user ? `${user.username} ${user.name}` : 'zhangcheng XXX13433308'

  return [
    { label: '申请人', value: applicant },
    { label: '申请单号', value: props.submittedApplication?.applicationNo || props.draftApplicationNo },
    { label: '当前处理人', value: handler },
  ]
})

function onDepartmentChange(value: { deptId: string, deptName: string }) {
  emit('update:formData', {
    ...props.formData,
    department: value.deptName,
    departmentId: value.deptId,
  })
  formRef.value?.clearValidate?.('department')
}

function onSourceAreaChange(val: any) {
  emit('update:formData', { ...props.formData, sourceArea: val })
  formRef.value?.clearValidate?.('sourceArea')
}

function onTargetAreaChange(val: any) {
  emit('update:formData', { ...props.formData, targetArea: val })
  formRef.value?.clearValidate?.('targetArea')
}

function onSourceCityChange(value: { province: string; city: string; cityId: number; regionId: number }) {
  selectedUploadRegionId.value = value.regionId
  emit('update:formData', {
    ...props.formData,
    sourceCity: [value.province, value.city],
    sourceCityId: value.cityId,
    // 切换上传城市时清空下载城市
    targetCity: [],
    targetCityId: 0,
  })
  fetchDownloadCities(value.regionId)
}

function onTargetCityChange(value: { province: string, city: string, cityId: number }) {
  emit('update:formData', {
    ...props.formData,
    targetCity: [value.province, value.city],
    targetCityId: value.cityId,
  })
  formRef.value?.clearValidate?.('targetCity')
}

function onDownloaderAccountsChange(val: any) {
  emit('update:formData', { ...props.formData, downloaderAccounts: val })
  formRef.value?.clearValidate?.('downloaderAccounts')
}

function onCcAccountsChange(val: any) {
  emit('update:formData', { ...props.formData, ccAccounts: val })
  formRef.value?.clearValidate?.('ccAccounts')
}

function onSecurityLevelChange(val: any) {
  emit('update:formData', { ...props.formData, securityLevel: val })
  formRef.value?.clearValidate?.('securityLevel')
}

function onDirectSupervisorChange(val: string) {
  emit('update:formData', { ...props.formData, directSupervisor: val })
  formRef.value?.clearValidate?.('directSupervisor')
}

function onApproverLevel2Change(val: string) {
  emit('update:formData', { ...props.formData, approverLevel2: val })
  formRef.value?.clearValidate?.('approverLevel2')
}

function onApproverLevel3Change(val: string) {
  emit('update:formData', { ...props.formData, approverLevel3: val })
  formRef.value?.clearValidate?.('approverLevel3')
}

function onApproverLevel4Change(val: string) {
  emit('update:formData', { ...props.formData, approverLevel4: val })
  formRef.value?.clearValidate?.('approverLevel4')
}

async function onCopyRecentTemplate(text: string) {
  emit('copyTemplate', text)
}

async function validate() {
  if (!formRef.value)
    return true

  const errors = await formRef.value.validate()
  // validate() 返回 undefined 表示通过，返回错误对象表示失败
  return errors === undefined
}

defineExpose({
  validate,
})
</script>

	<template>
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
        <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical" class="apply-form">
          <a-form-item field="department" label="部门" required>
            <DepartmentSelector :model-value="formData.department" :default-to-first="true" :disabled="readonly"
                                @change="onDepartmentChange" />
          </a-form-item>
          <div class="form-grid">
            <a-form-item field="sourceArea" label="上传区域" required>
              <a-select :model-value="formData.sourceArea" :options="areaOptions" :disabled="readonly"
                        @change="onSourceAreaChange" />
            </a-form-item>
            <a-form-item field="targetArea" label="下载区域" required>
              <a-select :model-value="formData.targetArea" :options="areaOptions" :disabled="readonly"
                        @change="onTargetAreaChange" />
            </a-form-item>
            <a-form-item field="sourceCity" label="数据传出省份/城市" required>
              <CitySelector :model-value="formData.sourceCity" :options="uploadCityOptions" :loading="uploadCityLoading"
                            :disabled="readonly" @change="onSourceCityChange" />
            </a-form-item>

            <a-form-item field="targetCity" label="数据传至省份/城市" required>
              <CitySelector :model-value="formData.targetCity" :options="downloadCityOptions"
                            :loading="downloadCityLoading" :disabled="readonly || !selectedUploadRegionId"
                            @change="onTargetCityChange" />
            </a-form-item>
          </div>
          <a-form-item field="downloaderAccounts" label="下载人账号" required>
            <a-select :model-value="formData.downloaderAccounts" :options="userOptions" :disabled="readonly" multiple
                      allow-clear allow-search placeholder="请输入下载人账号" @change="onDownloaderAccountsChange" />
          </a-form-item>
          <a-form-item field="ccAccounts" label="抄送人" required>
            <a-select :model-value="formData.ccAccounts" :options="userOptions" :disabled="readonly" multiple
                      allow-clear allow-search placeholder="请输入抄送人" @change="onCcAccountsChange" />
          </a-form-item>
  <a-form-item label="包含客户网络数据" required>
            <a-radio-group :model-value="formData.containsCustomerData" :disabled="readonly"
                           @change="(val: any) => emit('update:formData', { ...formData, containsCustomerData: val })">
              <a-radio value="yes">是</a-radio>
              <a-radio value="no">否</a-radio>
            </a-radio-group>
          </a-form-item>

          <template v-if="showCustomerDataFields">
            <a-form-item field="srNumber" label="SR单号" required>
              <a-input :model-value="formData.srNumber" :disabled="readonly" placeholder="请输入 SR 单号"
                       @input="(val: string) => emit('update:formData', { ...formData, srNumber: val })" />
            </a-form-item>

            <a-form-item field="minDeptSupervisor" label="最小部门主管">
              <a-input :model-value="formData.minDeptSupervisor" readonly />
            </a-form-item>
          </template>
          <a-form-item v-if="isHighToLow" field="securityLevel" label="文件最高密级" required>
            <a-select :model-value="formData.securityLevel" :options="securityLevelOptions"
                      :loading="securityLevelLoading" :disabled="readonly" placeholder="请选择文件最高密级"
                      @change="onSecurityLevelChange" />
          </a-form-item>

          <!-- 审批人字段（根据审批层级配置动态显示） -->
          <template v-if="isHighToLow && formData.securityLevel">
            <a-form-item v-if="approvalRouteConfig.showDirectSupervisor" field="directSupervisor" label="直接主管" required>
              <a-select :model-value="formData.directSupervisor" :options="mockApproverOptions"
                        :loading="approvalRouteLoading" :disabled="readonly" allow-clear allow-search
                        placeholder="请搜索并选择直接主管" @change="onDirectSupervisorChange" />
            </a-form-item>

            <a-form-item v-if="approvalRouteConfig.showApproverLevel2" field="approverLevel2" label="二层审批人" required>
              <a-select :model-value="formData.approverLevel2" :options="mockApproverOptions"
                        :loading="approvalRouteLoading" :disabled="readonly" allow-clear allow-search
                        placeholder="请选择二层审批人" @change="onApproverLevel2Change" />
            </a-form-item>

            <a-form-item v-if="approvalRouteConfig.showApproverLevel3" field="approverLevel3" label="三层审批人" required>
              <a-select :model-value="formData.approverLevel3" :options="mockApproverOptions"
                        :loading="approvalRouteLoading" :disabled="readonly" allow-clear allow-search
                        placeholder="请选择三层审批人" @change="onApproverLevel3Change" />
            </a-form-item>

            <a-form-item v-if="approvalRouteConfig.showApproverLevel4" field="approverLevel4" label="四层审批人" required>
              <a-select :model-value="formData.approverLevel4" :options="mockApproverOptions"
                        :loading="approvalRouteLoading" :disabled="readonly" allow-clear allow-search
                        placeholder="请选择四层审批人" @change="onApproverLevel4Change" />
            </a-form-item>
          </template>

          <a-form-item field="applyReason" label="申请原因" required>
            <a-textarea :model-value="formData.applyReason" :max-length="1000" :disabled="readonly" show-word-limit
                        placeholder="请填写申请原因"
                        @input="(val: string) => emit('update:formData', { ...formData, applyReason: val })" />
          </a-form-item>

          <div class="form-grid form-grid--notify">
            <a-form-item label="申请人通知选项" required>
              <a-checkbox-group :model-value="formData.applicantNotifyOptions" :options="applicantNotifyOptions"
                                :disabled="readonly"
                                @change="(val: any) => emit('update:formData', { ...formData, applicantNotifyOptions: val })" />
            </a-form-item>
            <a-form-item label="下载人通知选项" required>
              <a-checkbox-group :model-value="formData.downloaderNotifyOptions" :options="downloaderNotifyOptions"
                                :disabled="readonly"
                                @change="(val: any) => emit('update:formData', { ...formData, downloaderNotifyOptions: val })" />
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

<style scoped lang="scss">
// 样式继承自父组件的 create-application.scss
</style>