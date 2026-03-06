import type { Application, ApplicationStatus, DetailFieldItem, DetailFileItem, FileInfo, TransferType } from '@/types'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApplicationStore, useFileStore } from '@/stores'

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

function toArrayText(value: unknown, separator = ' / ') {
  if (Array.isArray(value))
    return value.map(item => String(item)).filter(Boolean).join(separator)

  return String(value || '')
}

function fileInfoToDetailFileItem(fileInfo: FileInfo): DetailFileItem {
  return {
    id: fileInfo.id,
    fileName: fileInfo.fileName,
    fileSize: fileInfo.fileSize,
    uploadedAt: fileInfo.uploadedAt || new Date().toISOString(),
    sha256: `sha256_${fileInfo.id.slice(-16)}`, // 实际项目中应从后端获取真实 sha256
  }
}



export function useApplicationDetail() {
  const router = useRouter()
  const applicationStore = useApplicationStore()
  const fileStore = useFileStore()

  const loading = ref(false)
  const detailData = ref<Application | null>(null)
  const activeTab = ref<'info' | 'files'>('files')

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

  const basicInfoRows = computed<DetailFieldItem[]>(() => {
    if (!detailData.value)
      return []

    const item = detailData.value
    return [
      { label: '申请人', value: `${item.applicantId} ${item.applicantName}`.trim() },
      { label: '申请单号', value: item.applicationNo },
      { label: '当前处理人', value: item.applicantName || '-' },
      { label: '存储空间大小', value: `${item.storageSize || 0} MB` },
      { label: '上传有效期间', value: `${dayjs(item.uploadExpireTime).diff(dayjs(item.createdAt), 'day')}天` },
      { label: '下载有效期间', value: `${dayjs(item.downloadExpireTime).diff(dayjs(item.createdAt), 'day')}天` },
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
      { label: '创建时间', value: dayjs(item.createdAt).format('YYYY/MM/DD HH:mm:ss') },
      { label: '申请原因', value: item.applyReason || '-', fullRow: true },
      { label: '申请人通知范围', value: toArrayText(item.applicantNotifyOptions, '、') || '-' },
      { label: '下载人通知范围', value: toArrayText(item.downloaderNotifyOptions, '、') || '-' },
    ]
  })

  const files = computed<DetailFileItem[]>(() => {
    if (!detailData.value)
      return []

    const realFiles = fileStore.getFilesByApplicationId(detailData.value.id)
    return realFiles.map(fileInfoToDetailFileItem)
  })

  async function fetchDetail(id: string) {
    loading.value = true
    try {
      if (applicationStore.applications.length === 0)
        await applicationStore.fetchApplications({ pageNum: 1, pageSize: 200 })

      const local = [...applicationStore.applications, ...applicationStore.drafts].find(item => item.id === id)
      if (local) {
        detailData.value = local
        return local
      }

      const remote = await applicationStore.fetchApplicationDetail(id)
      detailData.value = remote
      return remote
    }
    finally {
      loading.value = false
    }
  }

  function handleEdit() {
    if (!detailData.value)
      return

    router.push({
      path: '/application/create',
      query: {
        draftId: detailData.value.id,
        type: detailData.value.transferType,
      },
    })
  }

  async function handleDelete() {
    if (!detailData.value)
      return

    await applicationStore.deleteApplication(detailData.value.id)
    Message.success('申请单已删除')
    router.push('/applications')
  }

  async function handleWithdraw() {
    if (!detailData.value)
      return

    const updated = await applicationStore.updateApplication(detailData.value.id, { status: 'draft' })
    detailData.value = updated
    Message.success('申请已撤回并转为草稿')
  }

  function handleUploadFile() {
    if (!detailData.value)
      return

    router.push({
      path: '/application/create',
      query: {
        draftId: detailData.value.id,
        type: detailData.value.transferType,
      },
    })
  }

  function triggerBrowserDownload(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 延迟释放，避免浏览器尚未完成写盘就撤销 URL 导致 .crdownload 残留
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  function handleDownloadFile(file: DetailFileItem) {
    const realFile = fileStore.files.get(file.id)

    if (realFile?.fileBlob) {
      triggerBrowserDownload(realFile.fileBlob, realFile.fileName)
      Message.success(`开始下载：${realFile.fileName}`)
      return
    }

    const blob = new Blob([`mock file content: ${file.fileName}`], { type: 'text/plain;charset=utf-8' })
    triggerBrowserDownload(blob, file.fileName)
    Message.warning('当前文件缺少二进制内容，已回退为模拟下载')
  }

  function handleBatchDownload(fileIds: string[]) {
    const selected = files.value.filter(file => fileIds.includes(file.id))
    selected.forEach(file => handleDownloadFile(file))
    Message.success(`已开始下载 ${selected.length} 个文件`)
  }

  return {
    loading,
    detailData,
    activeTab,
    statusLabel,
    transferTypeLabel,
    basicInfoRows,
    applicationInfoRows,
    files,
    fetchDetail,
    handleEdit,
    handleDelete,
    handleWithdraw,
    handleUploadFile,
    handleDownloadFile,
    handleBatchDownload,
  }
}
