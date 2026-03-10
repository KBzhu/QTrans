import type { Application, ApplicationStatus, ApprovalRecord, DetailFieldItem, DetailFileItem, TransferType } from '@/types'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApplicationStore, useApprovalStore, useAuthStore, useFileStore } from '@/stores'


const transferTypeLabelMap: Record<TransferType, string> = {
  'green-to-green': '绿区传到绿区',
  'green-to-yellow': '绿区传到黄区',
  'green-to-red': '绿区传到红区',
  'yellow-to-yellow': '黄区传到黄区',
  'yellow-to-red': '黄区传到红区',
  'red-to-red': '红区传到红区',
  'cross-country': '跨国传输',
}

const statusLabelMap: Record<ApplicationStatus, string> = {
  draft: '草稿',
  pending_upload: '待上传',
  pending_approval: '待审批',
  approved: '已批准',
  rejected: '已驳回',
  transferring: '传输中',
  completed: '已完成',
}

const approvalLevelMap: Record<TransferType, number> = {
  'green-to-green': 0,
  'green-to-yellow': 1,
  'green-to-red': 2,
  'yellow-to-yellow': 1,
  'yellow-to-red': 2,
  'red-to-red': 2,
  'cross-country': 3,
}

function toArrayText(value: unknown, separator = ' / ') {
  if (Array.isArray(value))
    return value.map(item => String(item)).filter(Boolean).join(separator)

  return String(value || '')
}

function buildFileList(record: Application): DetailFileItem[] {
  const size = Math.max(1024 * 1024, Math.round((record.storageSize || 1) * 1024 * 0.42))

  return [
    {
      id: `${record.id}-file-1`,
      fileName: '审批附件汇总.zip',
      fileSize: size,
      uploadedAt: record.updatedAt || record.createdAt,
      sha256: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p${record.id.slice(-2)}`,
    },
  ]
}

export function useApprovalDetail() {
  const router = useRouter()
  const applicationStore = useApplicationStore()
  const approvalStore = useApprovalStore()
  const authStore = useAuthStore()
  const fileStore = useFileStore()


  const loading = ref(false)
  const detailData = ref<Application | null>(null)
  const activeTab = ref<'info' | 'files'>('info')
  const approvalOpinion = ref('')
  const approvalRecords = ref<ApprovalRecord[]>([])

  const statusLabel = computed(() => {
    if (!detailData.value)
      return '-'
    return statusLabelMap[detailData.value.status]
  })

  const transferTypeLabel = computed(() => {
    if (!detailData.value)
      return '-'
    return transferTypeLabelMap[detailData.value.transferType]
  })

  const totalApprovalLevels = computed(() => {
    if (!detailData.value)
      return 1
    return Math.max(1, approvalLevelMap[detailData.value.transferType])
  })

  const currentApprovalLevel = computed(() => {
    if (!detailData.value)
      return 1
    return Math.max(1, detailData.value.currentApprovalLevel || 1)
  })

  const currentApprovalLabel = computed(() => {
    if (!detailData.value)
      return '-'

    if (detailData.value.status !== 'pending_approval')
      return '审批已结束'

    const levelMap: Record<number, string> = {
      1: '一级审批',
      2: '二级审批',
      3: '三级审批',
    }

    return levelMap[currentApprovalLevel.value] || `${currentApprovalLevel.value}级审批`
  })

  const canOperate = computed(() => detailData.value?.status === 'pending_approval')
  const canExempt = computed(() => authStore.isAdmin)

  const basicInfoRows = computed<DetailFieldItem[]>(() => {
    if (!detailData.value)
      return []

    const item = detailData.value
    return [
      { label: '申请人', value: `${item.applicantId} ${item.applicantName}`.trim() },
      { label: '申请单号', value: item.applicationNo },
      { label: '当前审批层级', value: currentApprovalLabel.value },
      { label: '当前状态', value: statusLabel.value },
      { label: '申请时间', value: dayjs(item.createdAt).format('YYYY/MM/DD HH:mm:ss') },
      { label: '更新时间', value: dayjs(item.updatedAt || item.createdAt).format('YYYY/MM/DD HH:mm:ss') },
    ]
  })

  const applicationInfoRows = computed<DetailFieldItem[]>(() => {
    if (!detailData.value)
      return []

    const item = detailData.value
    return [
      { label: '部门', value: item.department || '-' },
      { label: '申请类型', value: transferTypeLabel.value },
      { label: '上传区域', value: item.sourceArea },
      { label: '下载区域', value: item.targetArea },
      { label: '数据传出国家/城市', value: `${item.sourceCountry} / ${toArrayText(item.sourceCity, '、')}` },
      { label: '数据传至国家/城市', value: `${item.targetCountry} / ${toArrayText(item.targetCity, '、')}` },
      { label: '下载人账号', value: toArrayText(item.downloaderAccounts, '、') || '-' },
      { label: '抄送人', value: toArrayText(item.ccAccounts, '、') || '-' },
      { label: '包含客户网络数据', value: item.containsCustomerData ? '是' : '否' },
      { label: '申请原因', value: item.applyReason || '-', fullRow: true },
    ]
  })

  const files = computed<DetailFileItem[]>(() => {
    if (!detailData.value)
      return []
    return buildFileList(detailData.value)
  })

  async function fetchApprovalHistory(id: string) {
    const records = await approvalStore.fetchApprovalHistory(id)
    approvalRecords.value = records
    return records
  }

  async function fetchDetail(id: string) {
    loading.value = true
    try {
      if (applicationStore.applications.length === 0)
        await applicationStore.fetchApplications({ pageNum: 1, pageSize: 200 })

      const local = [...applicationStore.applications, ...applicationStore.drafts].find(item => item.id === id)
      detailData.value = local || await applicationStore.fetchApplicationDetail(id)

      await fetchApprovalHistory(id)
      return detailData.value
    }
    finally {
      loading.value = false
    }
  }

  function isLastLevel(transferType: TransferType, currentLevel: number): boolean {
    const requiredLevels = approvalLevelMap[transferType]
    return currentLevel >= requiredLevels
  }

  async function handleApprove() {
    if (!detailData.value)
      return

    const isLast = isLastLevel(detailData.value.transferType, currentApprovalLevel.value)
    const updated = await approvalStore.approve(detailData.value.id, approvalOpinion.value.trim() || '审批通过')
    detailData.value = updated
    approvalOpinion.value = ''
    await fetchApprovalHistory(updated.id)

    if (isLast) {
      await fileStore.startTransfer(updated.id)
      detailData.value = applicationStore.applications.find(item => item.id === updated.id) || updated
      Message.success('审批通过，已自动开始传输')
    }
    else {
      Message.success('审批通过，已通知下一级审批人')
    }


    setTimeout(() => {
      router.push('/approvals')
    }, 1500)
  }

  async function handleReject() {
    if (!detailData.value)
      return

    if (!approvalOpinion.value.trim()) {
      Message.error('请先填写驳回原因')
      return
    }

    const updated = await approvalStore.reject(detailData.value.id, approvalOpinion.value.trim())
    detailData.value = updated
    approvalOpinion.value = ''
    await fetchApprovalHistory(updated.id)
    Message.success('申请已驳回')

    setTimeout(() => {
      router.push('/approvals')
    }, 1500)
  }

  async function handleExempt() {
    if (!detailData.value)
      return

    const updated = await approvalStore.skip(detailData.value.id, approvalOpinion.value.trim() || '免审通过')
    await fileStore.startTransfer(updated.id)
    detailData.value = applicationStore.applications.find(item => item.id === updated.id) || updated
    approvalOpinion.value = ''
    await fetchApprovalHistory(updated.id)
    Message.success('申请已免审通过，已自动开始传输')


    setTimeout(() => {
      router.push('/approvals')
    }, 1500)
  }

  function handleDownloadFile(file: DetailFileItem) {
    const blob = new Blob([`mock file content: ${file.fileName}`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleBatchDownload(fileIds: string[]) {
    const selected = files.value.filter(file => fileIds.includes(file.id))
    selected.forEach(file => handleDownloadFile(file))
    Message.success(`已开始下载 ${selected.length} 个文件`)
  }

  function goBack() {
    router.push('/approvals')
  }

  return {
    loading,
    detailData,
    activeTab,
    approvalOpinion,
    approvalRecords,
    statusLabel,
    transferTypeLabel,
    basicInfoRows,
    applicationInfoRows,
    files,
    currentApprovalLevel,
    totalApprovalLevels,
    currentApprovalLabel,
    canOperate,
    canExempt,
    fetchDetail,
    handleApprove,
    handleReject,
    handleExempt,
    handleDownloadFile,
    handleBatchDownload,
    goBack,
  }
}
