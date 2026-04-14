import type { Application, NotifyChannel, TransferType } from '@/types'
import type { SecurityArea } from '@/constants'
import { Message } from '@arco-design/web-vue'

import { useApplicationStore, useAuthStore, useFileStore } from '@/stores'
import { MAX_FILE_SIZE } from '@/utils/constants'
import { ID_TO_AREA, TRANSFER_TYPE_LABEL_MAP, transWayToTransferType as transWayToTransferTypeUtil } from '@/constants'
import { DEFAULT_CITY } from '@/mocks/data/cities'
import { applicationApi } from '@/api/application'
import { completeUpload } from '@/api/transWebService'

// 重新导出 SecurityArea 供其他模块使用
export type { SecurityArea }

interface UploadingFileState {
  uid: string
  name: string
  size: number
  progress: number
  status: 'uploading' | 'paused'
  failedCount: number
  usedTime: number
  remainingTime: number
  raw?: File
}

interface UploadedFileState {
  uid: string
  name: string
  size: number
  fileType: string
  lastModified: string
  sha256: string
  raw?: File
}

export interface ApplicationFormData {
  transferType: TransferType
  department: string
  departmentId?: string       // 新增：部门ID
  sourceArea: SecurityArea
  targetArea: SecurityArea
  sourceCity: string[]
  sourceCityId?: number       // 源城市ID
  sourceRegionId?: number     // 源区域通道ID（从城市选择接口获取）
  targetCity: string[]
  targetCityId?: number       // 目标城市ID
  targetRegionId?: number     // 目标区域通道ID（从城市选择接口获取）
  downloaderAccounts: string[]
  ccAccounts: string[]
  containsCustomerData: 'yes' | 'no'
  srNumber: string
  minDeptSupervisor: string
    securityLevel?: string
  applyReason: string
  applicantNotifyOptions: NotifyChannel[]
  downloaderNotifyOptions: NotifyChannel[]
  // 审批人字段
  directSupervisor?: string   // 直接主管 W3 账号
  approverLevel2?: string     // 二层审批人 W3 账号
  approverLevel3?: string     // 三层审批人 W3 账号
  approverLevel4?: string     // 四层审批人 W3 账号
  // 外网下载字段（绿区/黄区到外网场景）
  vendorName?: string         // 下载方名称（单位）
  downloadEmail?: string      // 下载方邮箱地址
  // 移除废弃字段: storageSize, uploadExpireTime, downloadExpireTime, customerAuthFile
}

const transferTypeAlias: Record<string, TransferType> = {
  'green-to-external': 'green-to-red',
  'green-to-hisilicon': 'green-to-red',
  'routine-apply': 'green-to-green',
  'routine-channel': 'yellow-to-red',
}

// 使用统一常量
const transferTypeLabelMap = TRANSFER_TYPE_LABEL_MAP

/** 从 transWay 字符串推断 transferType（使用统一常量）*/
function transWayToTransferType(transWay: string): TransferType {
  const typeStr = transWayToTransferTypeUtil(transWay)
  // 验证是否为有效类型
  const validTypes: TransferType[] = [
    'green-to-green',
    'green-to-yellow',
    'green-to-red',
    'yellow-to-yellow',
    'yellow-to-red',
    'red-to-red',
    'cross-country',
  ]
  return validTypes.includes(typeStr as TransferType) ? typeStr as TransferType : 'green-to-green'
}

/** 从 uploadUrl 中提取 params 参数 */
function extractParamsFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const params = urlObj.searchParams.get('params')
    return params || ''
  }
  catch {
    // URL 解析失败时尝试从字符串中提取
    const match = url.match(/params=([^&]+)/)
    return match?.[1] ?? ''
  }
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

function defaultFormData(transferTypeRaw?: string, fromZone?: string, toZone?: string): ApplicationFormData {
  const transferType = normalizeTransferType(transferTypeRaw)

  // 优先使用传入的区域参数（从 URL query 传递），否则才调用 inferAreas 推断
  let sourceArea: SecurityArea
  let targetArea: SecurityArea

  if (fromZone && toZone) {
    // 验证传入的区域是否有效
    const validAreas: SecurityArea[] = ['green', 'yellow', 'red', 'external']
    sourceArea = validAreas.includes(fromZone as SecurityArea) ? (fromZone as SecurityArea) : 'green'
    targetArea = validAreas.includes(toZone as SecurityArea) ? (toZone as SecurityArea) : 'green'
  }
  else {
    // 回退到推断逻辑
    const areas = inferAreas(transferType)
    sourceArea = areas.sourceArea
    targetArea = areas.targetArea
  }

  return {
    transferType,
    department: '',
    departmentId: '',
    sourceArea,
    targetArea,
    sourceCity: [...DEFAULT_CITY],
    sourceCityId: 0,
    sourceRegionId: 0,
    targetCity: [...DEFAULT_CITY],
    targetCityId: 0,
    targetRegionId: 0,
    downloaderAccounts: [],
    ccAccounts: [],
    containsCustomerData: 'no',

    srNumber: '',
    minDeptSupervisor: '',
    applyReason: '',
    applicantNotifyOptions: ['in_app'],
    downloaderNotifyOptions: ['in_app'],
    // 审批人字段初始化
    directSupervisor: '',
    approverLevel2: '',
    approverLevel3: '',
    approverLevel4: '',
    // 外网下载字段初始化
    vendorName: '',
    downloadEmail: '',
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

export function useApplicationForm(initialTransferType?: string, fromZone?: string, toZone?: string) {
  const applicationStore = useApplicationStore()
  const authStore = useAuthStore()
  const fileStore = useFileStore()

  const formData = ref<ApplicationFormData>(defaultFormData(initialTransferType, fromZone, toZone))
  const currentStep = ref(0)
  const currentDraftId = ref('')
  const submittedApplication = ref<Application | null>(null)
  const isApplicationCreated = ref(false) // 标记申请单是否已在第一步创建
  const submitting = ref(false) // 提交/创建接口请求中
  const uploadUrl = ref<string>('') // 真实后端返回的上传地址
  const uploadParams = ref<string>('') // 从 uploadUrl 中提取的 params 参数
  const uploadingFiles = ref<UploadingFileState[]>([])
  const uploadedFiles = ref<UploadedFileState[]>([])
  const lastSavedSnapshot = ref(JSON.stringify(formData.value))
  const selectedUploadingUids = ref<string[]>([])
  const selectedUploadedUids = ref<string[]>([])
  const autoSubmitAfterUpload = ref(true)

  const uploadTimers = new Map<string, number>()

  const showCustomerDataFields = computed(() => formData.value.containsCustomerData === 'yes')
  const transferTypeLabel = computed(() => transferTypeLabelMap[formData.value.transferType])
  const hasUnsavedChanges = computed(() => {
    if (currentStep.value >= 2)
      return false

    return JSON.stringify(formData.value) !== lastSavedSnapshot.value
      || uploadingFiles.value.length > 0
      || uploadedFiles.value.length > 0
  })

  const formRules = computed<Record<string, any[]>>(() => {
    const rules: Record<string, any[]> = {
      department: [{ required: true, message: '请选择所属部门' }],
      sourceArea: [{ required: true, message: '请选择源安全域' }],
      targetArea: [{ required: true, message: '请选择目标安全域' }],
      sourceCity: [{ required: true, type: 'array', min: 1, message: '请选择源省份/城市' }],
      targetCity: [{ required: true, type: 'array', min: 1, message: '请选择目标省份/城市' }],
      downloaderAccounts: [{ required: true, type: 'array', min: 1, message: '请选择下载人账号' }],
      // ccAccounts 不再必填
      srNumber: [{ required: true, message: '请输入 SR 单号' }],
      securityLevel: [{ required: true, message: '请选择文件最高密级' }],
      applyReason: [{ required: true, message: '请输入申请原因' }, { maxLength: 1000, message: '申请原因不能超过 1000 字' }],
    }

    // 外网场景：添加必填验证
    if (formData.value.targetArea === 'external') {
      rules.vendorName = [{ required: true, message: '请输入下载方名称' }]
      rules.downloadEmail = [
        { required: true, message: '请输入下载方邮箱地址' },
        { type: 'email', message: '请输入正确的邮箱格式' },
      ]
    }

    return rules
  })

  function updateSnapshot() {
    lastSavedSnapshot.value = JSON.stringify(formData.value)
  }

  function watchCustomerDataField() {
    watch(() => formData.value.containsCustomerData, (newVal) => {
      if (newVal === 'no') {
        formData.value.srNumber = ''
        formData.value.minDeptSupervisor = ''
        return
      }

      if (!formData.value.minDeptSupervisor)
        formData.value.minDeptSupervisor = '最小部门主管-自动带出'
    }, { immediate: true })
  }

  function addUploadFiles(files: File[]) {
    const validFiles = files.filter(file => file.size <= MAX_FILE_SIZE)
    const invalidCount = files.length - validFiles.length

    if (invalidCount > 0)
      Message.warning(`有 ${invalidCount} 个文件超过 50GB，已忽略`)

    const newUploadingFiles = validFiles.map(file => ({
      uid: `${Date.now()}-${file.name}-${Math.random().toString(16).slice(2)}`,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading' as const,
      failedCount: 0,
      usedTime: 0,
      remainingTime: 0,
      raw: file,
    }))

    uploadingFiles.value = [...uploadingFiles.value, ...newUploadingFiles]

    // 开始模拟上传进度
    newUploadingFiles.forEach(file => startUploadSimulation(file.uid))
  }

  function startUploadSimulation(uid: string) {
    const file = uploadingFiles.value.find(f => f.uid === uid)
    if (!file || file.status === 'paused')
      return

    const timer = window.setInterval(() => {
      const currentFile = uploadingFiles.value.find(f => f.uid === uid)
      if (!currentFile || currentFile.status === 'paused') {
        window.clearInterval(timer)
        uploadTimers.delete(uid)
        return
      }

      // 模拟进度增长（每秒增加 5-15%）
      const increment = Math.floor(Math.random() * 10) + 5
      currentFile.progress = Math.min(100, currentFile.progress + increment)
      currentFile.usedTime += 1
      currentFile.remainingTime = Math.max(0, Math.ceil((100 - currentFile.progress) / increment))

      // 上传完成，移到已上传列表
      if (currentFile.progress >= 100) {
        window.clearInterval(timer)
        uploadTimers.delete(uid)

        const uploadedFile: UploadedFileState = {
          uid: currentFile.uid,
          name: currentFile.name,
          size: currentFile.size,
          fileType: currentFile.name.split('.').pop() || 'unknown',
          lastModified: new Date().toISOString(),
          sha256: `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}...`,
          raw: currentFile.raw,
        }

        uploadedFiles.value = [...uploadedFiles.value, uploadedFile]
        uploadingFiles.value = uploadingFiles.value.filter(f => f.uid !== uid)

        // 如果开启自动提交且所有文件上传完成
        if (autoSubmitAfterUpload.value && uploadingFiles.value.length === 0) {
          Message.success('所有文件上传完成')
        }
      }
    }, 1000)

    uploadTimers.set(uid, timer)
  }

  function pauseUploadFile(uid: string) {
    const file = uploadingFiles.value.find(f => f.uid === uid)
    if (!file)
      return

    file.status = 'paused'
    const timer = uploadTimers.get(uid)
    if (timer) {
      window.clearInterval(timer)
      uploadTimers.delete(uid)
    }
  }

  function resumeUploadFile(uid: string) {
    const file = uploadingFiles.value.find(f => f.uid === uid)
    if (!file)
      return

    file.status = 'uploading'
    startUploadSimulation(uid)
  }

  function removeUploadingFile(uid: string) {
    const timer = uploadTimers.get(uid)
    if (timer) {
      window.clearInterval(timer)
      uploadTimers.delete(uid)
    }
    uploadingFiles.value = uploadingFiles.value.filter(f => f.uid !== uid)
    selectedUploadingUids.value = selectedUploadingUids.value.filter(id => id !== uid)
  }

  function removeUploadFile(uid: string) {
    uploadedFiles.value = uploadedFiles.value.filter(item => item.uid !== uid)
    selectedUploadedUids.value = selectedUploadedUids.value.filter(id => id !== uid)
  }

  function batchPauseUploading() {
    selectedUploadingUids.value.forEach(uid => pauseUploadFile(uid))
    Message.success('已暂停选中的文件')
  }

  function batchResumeUploading() {
    selectedUploadingUids.value.forEach(uid => resumeUploadFile(uid))
    Message.success('已继续上传选中的文件')
  }

  function batchRemoveUploading() {
    selectedUploadingUids.value.forEach(uid => removeUploadingFile(uid))
    selectedUploadingUids.value = []
    Message.success('已删除选中的文件')
  }

  function batchRemoveUploaded() {
    selectedUploadedUids.value.forEach(uid => removeUploadFile(uid))
    selectedUploadedUids.value = []
    Message.success('已删除选中的文件')
  }


  async function handleNext(_validateCurrentStep?: () => Promise<boolean>) {
    // 第二步进入第三步
    if (currentStep.value === 1 && uploadedFiles.value.length === 0 && uploadingFiles.value.length === 0) {
      Message.error('请至少上传一个文件')
      return false
    }

    if (currentStep.value === 1 && uploadingFiles.value.length > 0) {
      Message.error('请等待所有文件上传完成')
      return false
    }

    currentStep.value = Math.min(2, currentStep.value + 1)
    return true
  }

  /**
   * 第一步点击"下一步"时调用 - 先验证表单，再调用创建接口
   */
  async function handleNextWithSubmit(validateCurrentStep?: () => Promise<boolean>) {
    // 如果申请单已创建，直接进入下一步
    if (isApplicationCreated.value) {
      currentStep.value = 1
      return true
    }

    // 验证表单
    if (validateCurrentStep) {
      const valid = await validateCurrentStep()
      if (!valid)
        return false

      // 检查客户数据相关字段
      if (showCustomerDataFields.value && !formData.value.srNumber) {
        Message.error('请补充 SR 单号')
        return false
      }
    }

    // 调用真实接口创建申请单
    try {
      submitting.value = true
      const { buildCreatePayload } = await import('@/utils/payloadConverter')
      const payload = buildCreatePayload(formData.value)

      const result = await applicationApi.createReal(payload)

      // 真实后端响应格式: { applicationId, isRedirectToUploadServer, uploadUrl, ftpAddress, ftpUserName, ftpPassword }
      // 错误响应已被 rawClient 拦截器处理，这里只需处理成功响应

      // 从 uploadUrl 中提取 params 参数
      // 格式: https://xxx/valid?params=security%3A...
      const url = result?.uploadUrl || ''
      let extractedParams = ''
      if (url) {
        const paramsMatch = url.match(/params=([^&]+)/)
        if (paramsMatch) {
          // 对 URL 编码的参数进行解码（如 %3A -> :）
          try {
            extractedParams = decodeURIComponent(paramsMatch[1])
          }
          catch {
            extractedParams = paramsMatch[1]
          }
        }
      }

      // 存储上传地址和参数
      uploadUrl.value = url
      uploadParams.value = extractedParams

      // 标记申请单已创建
      isApplicationCreated.value = true

      // 设置已提交的申请单信息
      submittedApplication.value = {
        id: String(result?.applicationId || `real-${Date.now()}`),
        applicationNo: String(result?.applicationId || ''),
        ...formData.value,
        containsCustomerData: formData.value.containsCustomerData === 'yes',
        status: 'pending_approval',
        applicantId: authStore.currentUser?.id || '',
        applicantName: authStore.currentUser?.name || '',
        createdAt: new Date().toISOString(),
      } as Application

      currentStep.value = 1
      updateSnapshot()
      Message.success('申请单创建成功，请上传文件')

      return true
    }
    catch (error: any) {
      Message.error(error?.message || '创建申请单失败，请稍后重试')
      return false
    }
    finally {
      submitting.value = false
    }
  }

  function handlePrev() {
    currentStep.value = Math.max(0, currentStep.value - 1)
  }


  async function handleSubmitReal() {
    try {
      submitting.value = true

      const uploadResult = await completeUpload(uploadParams.value)
      if (!uploadResult.success) {
        Message.error(uploadResult.error || '上传确认失败')
        return
      }
      // 如果有草稿，删除草稿
      if (currentDraftId.value)
        applicationStore.deleteDraft(currentDraftId.value)

      submittedApplication.value = {
        id: `real-${Date.now()}`,
        applicationNo: '',
        ...formData.value,
        containsCustomerData: formData.value.containsCustomerData === 'yes',
        status: 'pending_approval',
        applicantId: authStore.currentUser?.id || '',
        applicantName: authStore.currentUser?.name || '',
        createdAt: new Date().toISOString(),
      } as Application

      currentStep.value = 2
      updateSnapshot()
      Message.success('申请提交成功')
    }
    finally {
      submitting.value = false
    }

    return
  }

  function cleanupUploadTimers() {
    uploadTimers.forEach(timer => window.clearInterval(timer))
    uploadTimers.clear()
  }

  function loadDraft(draftId: string) {
    const draft = applicationStore.drafts.find(item => item.id === draftId)
    if (!draft)
      return false

    currentDraftId.value = draft.id

    formData.value = cloneFormData({
      transferType: draft.transferType,
      department: draft.department,
      departmentId: draft.departmentId,
      sourceArea: draft.sourceArea,
      targetArea: draft.targetArea,
      sourceCity: draft.sourceCity,
      sourceCityId: draft.sourceCityId,
      targetCity: draft.targetCity,
      targetCityId: draft.targetCityId,
      downloaderAccounts: draft.downloaderAccounts,
      ccAccounts: draft.ccAccounts || [],
      containsCustomerData: draft.containsCustomerData ? 'yes' : 'no',

      srNumber: draft.srNumber || '',
      minDeptSupervisor: draft.minDeptSupervisor || '',
      applyReason: draft.applyReason,
      applicantNotifyOptions: draft.applicantNotifyOptions,
      downloaderNotifyOptions: draft.downloaderNotifyOptions,
    })

    updateSnapshot()
    return true
  }

  /**
   * 从后端加载已存在的申请单数据（用于"继续上传文件"场景）
   */
  async function loadApplicationById(applicationId: number | string) {
    try {
      const detail = await applicationApi.getApplicationDetail(applicationId)
      if (!detail)
        return false

      const {
        appBaseInfo,
        appBaseApprovalRoute,
        appBaseCountryCityRegionRelation,
        appBaseUploadDownloadInfo,
      } = detail

      // 推断 transferType
      const transferType = transWayToTransferType(appBaseInfo.transWay)

      // 映射区域（使用统一常量）
      const sourceArea = ID_TO_AREA[appBaseCountryCityRegionRelation.fromRegionTypeId] || 'green'
      const targetArea = ID_TO_AREA[appBaseCountryCityRegionRelation.toRegionTypeId] || 'green'

      // 解析通知配置
      function parseNotification(notification: string): NotifyChannel[] {
        if (!notification)
          return []
        try {
          const arr = JSON.parse(notification)
          return Array.isArray(arr) ? arr.map((id: number) => String(id) as NotifyChannel) : []
        }
        catch {
          return []
        }
      }

      // 映射表单数据
      formData.value = cloneFormData({
        transferType,
        department: appBaseApprovalRoute.selectedDeptName || '',
        departmentId: appBaseApprovalRoute.deptId,
        sourceArea,
        targetArea,
        sourceCity: [appBaseCountryCityRegionRelation.fromCityName || ''],
        sourceCityId: appBaseCountryCityRegionRelation.fromCityId,
        targetCity: [appBaseCountryCityRegionRelation.toCityName || ''],
        targetCityId: appBaseCountryCityRegionRelation.toCityId,
        downloaderAccounts: appBaseUploadDownloadInfo.downloadUser?.map(u => u.w3Account) || [],
        ccAccounts: appBaseApprovalRoute.managerCopyW3Account ? [appBaseApprovalRoute.managerCopyW3Account] : [],
        containsCustomerData: appBaseApprovalRoute.isCustomerData ? 'yes' : 'no',
        srNumber: '',
        minDeptSupervisor: '',
        securityLevel: String(appBaseApprovalRoute.securityLevel || ''),
        applyReason: appBaseInfo.reason || '',
        applicantNotifyOptions: parseNotification(appBaseInfo.uploadNotification),
        downloaderNotifyOptions: parseNotification(appBaseInfo.downloadNotification),
      })

      // 设置已提交的申请单信息
      submittedApplication.value = {
        id: String(appBaseInfo.applicationId),
        applicationNo: String(appBaseInfo.applicationId),
        ...formData.value,
        containsCustomerData: formData.value.containsCustomerData === 'yes',
        status: 'pending_upload',
        applicantId: appBaseInfo.applicantW3Account,
        applicantName: appBaseInfo.applicantW3Account,
        createdAt: appBaseInfo.creationDate,
      } as Application

      // 提取上传参数
      if (appBaseUploadDownloadInfo.uploadUrl) {
        uploadUrl.value = appBaseUploadDownloadInfo.uploadUrl
        uploadParams.value = extractParamsFromUrl(appBaseUploadDownloadInfo.uploadUrl)
      }

      // 标记申请单已创建，进入第二步
      isApplicationCreated.value = true
      currentStep.value = 1

      updateSnapshot()
      return true
    }
    catch (error) {
      Message.error('加载申请单数据失败')
      console.error('loadApplicationById error:', error)
      return false
    }
  }

  watchCustomerDataField()
  onUnmounted(() => {
    cleanupUploadTimers()
  })

  return {
    formData,
    currentStep,
    currentDraftId,
    submittedApplication,
    isApplicationCreated,
    submitting,
    uploadUrl,
    uploadParams,
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
    handleNextWithSubmit,
    handlePrev,
    handleSubmitReal,
    loadDraft,
    loadApplicationById,
    watchCustomerDataField,
    addUploadFiles,
    removeUploadingFile,
    removeUploadFile,
    pauseUploadFile,
    resumeUploadFile,
    batchPauseUploading,
    batchResumeUploading,
    batchRemoveUploading,
    batchRemoveUploaded,
  }
}
