<script setup lang="ts">
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import type { ApplicationFormData } from '@/composables/useApplicationForm'
import { cities } from '@/mocks/data/cities'
import { departments, type DepartmentNode } from '@/mocks/data/departments'
import { users } from '@/mocks/data/users'
import { useAuthStore } from '@/stores'
import { Message } from '@arco-design/web-vue'

interface Props {
  formData: ApplicationFormData
  formRules: Record<string, any[]>
  transferTypeLabel: string
  showCustomerDataFields: boolean
  draftApplicationNo: string
  submittedApplication: any
}

const props = defineProps<Props>()

interface Emits {
  (e: 'update:formData', value: ApplicationFormData): void
  (e: 'copyTemplate', text: string): void
  (e: 'selectCustomerAuth'): void
  (e: 'customerAuthChange', event: Event): void
}

const emit = defineEmits<Emits>()

const authStore = useAuthStore()
const formRef = ref<{ validate: () => Promise<void> } | null>(null)
const departmentDialogVisible = ref(false)
const departmentSelectedKey = ref('')

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

interface DepartmentTreeOption {
  title: string
  key: string
  children?: DepartmentTreeOption[]
}

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

const basicInfoRows = computed(() => {
  const user = authStore.currentUser
  const applicant = user ? `${user.username} ${user.name}` : 'zhangcheng XXX13433308'
  const handler = user ? `${user.username} ${user.name}` : 'zhangcheng XXX13433308'

  return [
    { label: '申请人', value: applicant },
    { label: '申请单号', value: props.submittedApplication?.applicationNo || props.draftApplicationNo },
    { label: '当前处理人', value: handler },
    { label: '存储空间大小', value: `${props.formData.storageSize}G` },
    { label: '上传有效期', value: formatRemainDays(props.formData.uploadExpireTime) },
    { label: '下载有效期', value: formatRemainDays(props.formData.downloadExpireTime) },
  ]
})

function formatRemainDays(dateValue: string) {
  const days = dayjs(dateValue).diff(dayjs(), 'day')
  if (Number.isNaN(days))
    return '--'
  return `${Math.max(days, 0)}天`
}

function openDepartmentDialog() {
  departmentSelectedKey.value = props.formData.department || ''
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

  const updated = { ...props.formData, department: departmentSelectedKey.value }
  emit('update:formData', updated)
  departmentDialogVisible.value = false
  return true
}

async function onCopyRecentTemplate(text: string) {
  emit('copyTemplate', text)
}

function normalizeCityValue(val: unknown): string[] {
  if (Array.isArray(val)) {
    if (val.length === 0)
      return []

    if (Array.isArray(val[0]))
      return (val[0] as Array<string | number>).map(item => String(item)).filter(Boolean)

    return (val as Array<string | number>).map(item => String(item)).filter(Boolean)
  }

  if (typeof val === 'string' || typeof val === 'number')
    return [String(val)]

  return []
}

async function validate() {

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
              <a-select
                :model-value="formData.sourceArea"
                :options="areaOptions"
                @change="(val: any) => emit('update:formData', { ...formData, sourceArea: val })"
              />
            </a-form-item>

            <a-form-item field="targetArea" label="下载区域" required>
              <a-select
                :model-value="formData.targetArea"
                :options="areaOptions"
                @change="(val: any) => emit('update:formData', { ...formData, targetArea: val })"
              />
            </a-form-item>

            <a-form-item field="sourceCity" label="数据传出国家/城市" required>
              <a-cascader
                :model-value="formData.sourceCity"
                :options="cityOptions"
                path-mode
                allow-clear
                allow-search
                placeholder="请输入或选择国家/城市"
                @change="(val: unknown) => emit('update:formData', { ...formData, sourceCity: normalizeCityValue(val) })"

              />
            </a-form-item>

            <a-form-item field="targetCity" label="数据传至国家/城市" required>
              <a-cascader
                :model-value="formData.targetCity"
                :options="cityOptions"
                path-mode
                allow-clear
                allow-search
                placeholder="请输入或选择国家/城市"
                @change="(val: unknown) => emit('update:formData', { ...formData, targetCity: normalizeCityValue(val) })"

              />
            </a-form-item>
          </div>

          <a-form-item field="downloaderAccounts" label="下载人账号" required>
            <a-select
              :model-value="formData.downloaderAccounts"
              :options="userOptions"
              multiple
              allow-clear
              allow-search
              placeholder="请输入下载人账号"
              @change="(val: any) => emit('update:formData', { ...formData, downloaderAccounts: val })"
            />
          </a-form-item>

          <a-form-item field="ccAccounts" label="抄送人" required>
            <a-select
              :model-value="formData.ccAccounts"
              :options="userOptions"
              multiple
              allow-clear
              allow-search
              placeholder="请输入抄送人"
              @change="(val: any) => emit('update:formData', { ...formData, ccAccounts: val })"
            />
          </a-form-item>

          <a-form-item label="包含客户网络数据" required>
            <a-radio-group
              :model-value="formData.containsCustomerData"
              @change="(val: any) => emit('update:formData', { ...formData, containsCustomerData: val })"
            >
              <a-radio value="yes">是</a-radio>
              <a-radio value="no">否</a-radio>
            </a-radio-group>
          </a-form-item>

          <template v-if="showCustomerDataFields">
            <div class="form-grid">
              <a-form-item field="customerAuthFile" label="客户授权文件" required>
                <div class="inline-file-field">
                  <a-input :model-value="formData.customerAuthFile" readonly placeholder="请选择客户授权文件" />
                  <a-button type="outline" @click="emit('selectCustomerAuth')">上传</a-button>
                </div>
              </a-form-item>

              <a-form-item field="srNumber" label="SR单号" required>
                <a-input
                  :model-value="formData.srNumber"
                  placeholder="请输入 SR 单号"
                  @input="(val: string) => emit('update:formData', { ...formData, srNumber: val })"
                />
              </a-form-item>
            </div>

            <a-form-item field="minDeptSupervisor" label="最小部门主管">
              <a-input :model-value="formData.minDeptSupervisor" readonly />
            </a-form-item>
          </template>

          <a-form-item field="applyReason" label="申请原因" required>
            <a-textarea
              :model-value="formData.applyReason"
              :max-length="1000"
              show-word-limit
              placeholder="请填写申请原因"
              @input="(val: string) => emit('update:formData', { ...formData, applyReason: val })"
            />
          </a-form-item>

          <div class="form-grid form-grid--notify">
            <a-form-item label="申请人通知选项" required>
              <a-checkbox-group
                :model-value="formData.applicantNotifyOptions"
                :options="applicantNotifyOptions"
                @change="(val: any) => emit('update:formData', { ...formData, applicantNotifyOptions: val })"
              />
            </a-form-item>
            <a-form-item label="下载人通知选项" required>
              <a-checkbox-group
                :model-value="formData.downloaderNotifyOptions"
                :options="downloaderNotifyOptions"
                @change="(val: any) => emit('update:formData', { ...formData, downloaderNotifyOptions: val })"
              />
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
</template>

<style scoped lang="scss">
// 样式继承自父组件的 create-application.scss
</style>
