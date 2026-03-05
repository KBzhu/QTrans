import type { Application, NotifyChannel, TransferType } from '@/types'
import { Message } from '@arco-design/web-vue'

import dayjs from 'dayjs'
import { useApplicationStore, useAuthStore } from '@/stores'
import { APPROVAL_LEVEL_MAP, MAX_FILE_SIZE } from '@/utils/constants'

type SecurityArea = 'green' | 'yellow' | 'red'

interface UploadedFileState {
  uid: string
  name: string
  size: number
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'failed'
  raw?: File
  fileId?: string
}

export interface ApplicationFormData {
  transferType: TransferType
  department: string
  sourceArea: SecurityArea
  targetArea: SecurityArea
  sourceCity: string[]
  targetCity: string[]
  downloaderAccounts: string[]
  ccAccounts: string[]
  containsCustomerData: 'yes' | 'no'

  customerAuthFile?: string
  srNumber: string
  minDeptSupervisor: string
  applyReason: string
  applicantNotifyOptions: NotifyChannel[]
  downloaderNotifyOptions: NotifyChannel[]
  storageSize: number
  uploadExpireTime: string
  downloadExpireTime: string
}

const transferTypeAlias: Record<string, TransferType> = {
  'green-to-external': 'green-to-red',
  'green-to-hisilicon': 'green-to-red',
  'routine-apply': 'green-to-green',
  'routine-channel': 'yellow-to-red',
}

const transferTypeLabelMap: Record<TransferType, string> = {
  'green-to-green': '绿区传到绿区',
  'green-to-yellow': '绿区传到黄区',
  'green-to-red': '绿区传到红区',
  'yellow-to-yellow': '黄区传到黄区',
  'yellow-to-red': '黄区传到红区',
  'red-to-red': '红区传到红区',
  'cross-country': '跨国传输',
}

function normalizeTransferType(input?: string): TransferType {
  if (!input)
    return 'green-to-green'

  const value = transferTypeAlias[input] || input
  const transferTypes = new Set<TransferType>([
    'green-to-green',
    'green-to-yellow',
    'green-to-red',
    'yellow-to-yellow',
    'yellow-to-red',
    'red-to-red',
    'cross-country',
  ])

  if (transferTypes.has(value as TransferType))
    return value as TransferType

  return 'green-to-green'
}

function inferAreas(transferType: TransferType): { sourceArea: SecurityArea, targetArea: SecurityArea } {
  if (transferType === 'green-to-yellow')
    return { sourceArea: 'green', targetArea: 'yellow' }

  if (transferType === 'yellow-to-yellow')
    return { sourceArea: 'yellow', targetArea: 'yellow' }

  if (transferType === 'yellow-to-red')
    return { sourceArea: 'yellow', targetArea: 'red' }

  if (transferType === 'red-to-red')
    return { sourceArea: 'red', targetArea: 'red' }

  if (transferType === 'cross-country')
    return { sourceArea: 'green', targetArea: 'red' }

  return { sourceArea: 'green', targetArea: 'green' }
}

function defaultFormData(transferTypeRaw?: string): ApplicationFormData {
  const transferType = normalizeTransferType(transferTypeRaw)
  const areas = inferAreas(transferType)

  return {
    transferType,
    department: '',
    sourceArea: areas.sourceArea,
    targetArea: areas.targetArea,
    sourceCity: [],
    targetCity: [],
    downloaderAccounts: [],
    ccAccounts: [],
    containsCustomerData: 'no',

    customerAuthFile: '',
    srNumber: '',
    minDeptSupervisor: '',
    applyReason: '',
    applicantNotifyOptions: ['in_app'],
    downloaderNotifyOptions: ['in_app'],
    storageSize: 50,
    uploadExpireTime: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    downloadExpireTime: dayjs().add(30, 'day').format('YYYY-MM-DD'),
  }
}

function cloneFormData(data: ApplicationFormData): ApplicationFormData {
  return {
    ...data,
    sourceCity: [...data.sourceCity],
    targetCity: [...data.targetCity],
    downloaderAccounts: [...data.downloaderAccounts],
    ccAccounts: [...data.ccAccounts],
    applicantNotifyOptions: [...data.applicantNotifyOptions],

    downloaderNotifyOptions: [...data.downloaderNotifyOptions],
  }
}

export function useApplicationForm(initialTransferType?: string) {
  const applicationStore = useApplicationStore()
  const authStore = useAuthStore()

  const formData = ref<ApplicationFormData>(defaultFormData(initialTransferType))
  const currentStep = ref(0)
  const currentDraftId = ref('')
  const submittedApplication = ref<Application | null>(null)
  const uploadedFiles = ref<UploadedFileState[]>([])
  const lastSavedSnapshot = ref(JSON.stringify(formData.value))

  const showCustomerDataFields = computed(() => formData.value.containsCustomerData === 'yes')
  const transferTypeLabel = computed(() => transferTypeLabelMap[formData.value.transferType])
  const hasUnsavedChanges = computed(() => {
    if (currentStep.value >= 2)
      return false

    return JSON.stringify(formData.value) !== lastSavedSnapshot.value
      || uploadedFiles.value.some(item => item.status !== 'completed')
  })

  const formRules: Record<string, any[]> = {

    department: [{ required: true, message: '请选择所属部门' }],
    sourceArea: [{ required: true, message: '请选择源安全域' }],
    targetArea: [{ required: true, message: '请选择目标安全域' }],
    sourceCity: [{ required: true, type: 'array', min: 1, message: '请选择源国家/城市' }],
    targetCity: [{ required: true, type: 'array', min: 1, message: '请选择目标国家/城市' }],
    downloaderAccounts: [{ required: true, type: 'array', min: 1, message: '请选择下载人账号' }],
    ccAccounts: [{ required: true, type: 'array', min: 1, message: '请选择抄送人' }],
    srNumber: [{ required: true, message: '请输入 SR 单号' }],
    applyReason: [{ required: true, message: '请输入申请原因' }, { maxLength: 1000, message: '申请原因不能超过 1000 字' }],

    storageSize: [{ required: true, type: 'number', min: 1, max: 50, message: '存储大小需在 1~50GB' }],
    uploadExpireTime: [{ required: true, message: '请选择上传有效期' }],
    downloadExpireTime: [{ required: true, message: '请选择下载有效期' }],
  }

  let autoSaveTimer: number | null = null

  function updateSnapshot() {
    lastSavedSnapshot.value = JSON.stringify(formData.value)
  }

  function watchCustomerDataField() {
    watch(() => formData.value.containsCustomerData, (newVal) => {
      if (newVal === 'no') {
        formData.value.customerAuthFile = ''
        formData.value.srNumber = ''
        formData.value.minDeptSupervisor = ''
        return
      }

      if (!formData.value.minDeptSupervisor)
        formData.value.minDeptSupervisor = '最小部门主管-自动带出'
    }, { immediate: true })
  }

  function setCustomerAuthFile(fileName: string) {
    formData.value.customerAuthFile = fileName
  }

  function addUploadFiles(files: File[]) {
    const validFiles = files.filter(file => file.size <= MAX_FILE_SIZE)
    const invalidCount = files.length - validFiles.length

    if (invalidCount > 0)
      Message.warning(`有 ${invalidCount} 个文件超过 50GB，已忽略`)

    const nextItems = validFiles.map(file => ({
      uid: `${Date.now()}-${file.name}-${Math.random().toString(16).slice(2)}`,
      name: file.name,
      size: file.size,
      progress: 100,
      status: 'completed' as const,
      raw: file,
    }))

    uploadedFiles.value = [...uploadedFiles.value, ...nextItems]
  }

  function removeUploadFile(uid: string) {
    uploadedFiles.value = uploadedFiles.value.filter(item => item.uid !== uid)
  }

  function buildPayload(status: Application['status'] = 'draft'): Partial<Application> {
    const user = authStore.currentUser

    return {
      id: currentDraftId.value || undefined,
      transferType: formData.value.transferType,
      department: formData.value.department,
      sourceArea: formData.value.sourceArea,
      targetArea: formData.value.targetArea,
      sourceCountry: formData.value.sourceCity[0] || '',
      sourceCity: formData.value.sourceCity,
      targetCountry: formData.value.targetCity[0] || '',
      targetCity: formData.value.targetCity,
      downloaderAccounts: formData.value.downloaderAccounts,
      ccAccounts: formData.value.ccAccounts,
      containsCustomerData: formData.value.containsCustomerData === 'yes',

      customerAuthFile: formData.value.customerAuthFile || undefined,
      srNumber: formData.value.srNumber || undefined,
      minDeptSupervisor: formData.value.minDeptSupervisor || undefined,
      applyReason: formData.value.applyReason,
      applicantNotifyOptions: formData.value.applicantNotifyOptions,
      downloaderNotifyOptions: formData.value.downloaderNotifyOptions,
      storageSize: formData.value.storageSize,
      uploadExpireTime: dayjs(formData.value.uploadExpireTime).toISOString(),
      downloadExpireTime: dayjs(formData.value.downloadExpireTime).toISOString(),
      status,
      applicantId: user?.id || 'u_submitter',
      applicantName: user?.name || user?.username || '提交人',
      currentApprovalLevel: APPROVAL_LEVEL_MAP[formData.value.transferType],
    }
  }

  async function handleNext(validateCurrentStep?: () => Promise<boolean>) {
    if (currentStep.value === 0 && validateCurrentStep) {
      const valid = await validateCurrentStep()
      if (!valid)
        return false

      if (showCustomerDataFields.value && (!formData.value.customerAuthFile || !formData.value.srNumber)) {
        Message.error('请补充客户授权文件与 SR 单号')
        return false
      }
    }

    if (currentStep.value === 1 && uploadedFiles.value.length === 0) {
      Message.error('请至少上传一个文件')
      return false
    }

    currentStep.value = Math.min(2, currentStep.value + 1)
    return true
  }

  function handlePrev() {
    currentStep.value = Math.max(0, currentStep.value - 1)
  }

  async function handleSaveDraft(options?: { silent?: boolean }) {
    const draft = await applicationStore.saveDraft(buildPayload('draft'))
    currentDraftId.value = draft.id
    updateSnapshot()

    if (!options?.silent)
      Message.success('草稿已保存')

    return draft
  }

  async function handleSubmit() {
    const created = await applicationStore.createApplication(buildPayload('pending_approval'))

    if (currentDraftId.value)
      applicationStore.deleteDraft(currentDraftId.value)

    submittedApplication.value = created
    currentStep.value = 2
    updateSnapshot()
    Message.success('申请提交成功')

    return created
  }

  function autoSaveDraft() {
    if (autoSaveTimer)
      window.clearInterval(autoSaveTimer)

    autoSaveTimer = window.setInterval(async () => {
      if (!hasUnsavedChanges.value)
        return

      await handleSaveDraft({ silent: true })
    }, 30000)
  }

  function stopAutoSaveDraft() {
    if (!autoSaveTimer)
      return

    window.clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }

  function loadDraft(draftId: string) {
    const draft = applicationStore.drafts.find(item => item.id === draftId)
    if (!draft)
      return false

    currentDraftId.value = draft.id

    formData.value = cloneFormData({
      transferType: draft.transferType,
      department: draft.department,
      sourceArea: draft.sourceArea,
      targetArea: draft.targetArea,
      sourceCity: draft.sourceCity,
      targetCity: draft.targetCity,
      downloaderAccounts: draft.downloaderAccounts,
      ccAccounts: draft.ccAccounts || [],
      containsCustomerData: draft.containsCustomerData ? 'yes' : 'no',

      customerAuthFile: draft.customerAuthFile || '',
      srNumber: draft.srNumber || '',
      minDeptSupervisor: draft.minDeptSupervisor || '',
      applyReason: draft.applyReason,
      applicantNotifyOptions: draft.applicantNotifyOptions,
      downloaderNotifyOptions: draft.downloaderNotifyOptions,
      storageSize: draft.storageSize,
      uploadExpireTime: dayjs(draft.uploadExpireTime).format('YYYY-MM-DD'),
      downloadExpireTime: dayjs(draft.downloadExpireTime).format('YYYY-MM-DD'),
    })

    updateSnapshot()
    return true
  }

  watchCustomerDataField()
  onMounted(() => autoSaveDraft())
  onUnmounted(() => stopAutoSaveDraft())

  return {
    formData,
    currentStep,
    currentDraftId,
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
    autoSaveDraft,
    loadDraft,
    watchCustomerDataField,
    setCustomerAuthFile,
    addUploadFiles,
    removeUploadFile,
  }
}
