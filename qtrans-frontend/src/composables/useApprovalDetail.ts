import type { ApplicationDetailResponse, ProcessDetailsResponse } from '@/api/application'
import type { DetailFieldItem, DetailFileItem } from '@/types'

import { Message, Modal } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { approvalApi } from '@/api/approval'
import { applicationApi } from '@/api/application'
import { useFileList } from '@/composables/useFileList'
import { useFileDownload } from '@/composables/useFileDownload'
import { useRegionConfigStore } from '@/stores'

function formatTransWay(transWay: string): string {
  return transWay.split(',').map(s => s.trim()).join(' → ')
}

/**
 * 根据后端 applicationStatus 数字映射中文状态标签
 */
function getStatusLabel(applicationStatus: number): string {
  const map: Record<number, string> = {
    0: '草稿',
    1: '待上传',
    2: '待审批',
    3: '已批准',
    4: '已驳回',
    5: '传输中',
    6: '已完成',
  }
  return map[applicationStatus] || '未知'
}


export function useApprovalDetail() {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()

  const loading = ref(false)
  const detailData = ref<ApplicationDetailResponse | null>(null)
  const processDetailData = ref<ProcessDetailsResponse | null>(null)
  const activeTab = ref<'info' | 'files' | 'detection'>('info')
  const approvalOpinion = ref('')

  // 文件列表 - 使用真实接口
  const {
    files,
    fileLoading,
    totalFiles,
    pagination,
    fetchFiles: fetchFileList,
    onPageChange: onFilePageChange,
    resetFiles,
  } = useFileList()

  // 文件下载
  const {
    downloading,
    downloadingFile,
    downloadFile: downloadSingleFile,
    batchDownload: downloadBatchFiles,
  } = useFileDownload()

  // 当前状态标签
  const statusLabel = computed(() => {
    if (!detailData.value)
      return '-'
    return getStatusLabel(detailData.value.appBaseInfo.applicationStatus)
  })

  // 从列表页跳转时通过 query 传入的值（详情接口返回前先展示）
  const currentHandler = computed(() => (route.query.currentHandler as string) || '')
  const currentStatusFromList = computed(() => (route.query.currentStatus as string) || '')

  // 当前流程状态标签（优先用列表接口的 currentStatus）
  const currentApprovalLabel = computed(() => {
    // 详情接口返回后，根据 isNeedApproval 判断审批是否结束
    if (detailData.value) {
      const isNeedApproval = detailData.value.appBaseApprovalRoute?.isNeedApproval === 1
      if (!isNeedApproval)
        return '审批已结束'
    }
    // 审批中时，优先展示列表页传入的 currentStatus（如"直接主管审批"）
    return currentStatusFromList.value || processDetailData.value?.applicationStatus || '审批中'
  })

  // 当前用户是否是当前审批人
  const canHandleCurrentLevel = computed(() => {
    if (!currentHandler.value)
      return false
    if (authStore.isAdmin)
      return true

    const currentUserAccount = authStore.currentUser?.username || ''
    if (!currentUserAccount)
      return false

    // currentHandler 可能包含多个账号（逗号分隔），检查当前用户是否在其中
    return currentHandler.value.split(',').map(s => s.trim()).includes(currentUserAccount)
  })

  // 基础操作权限（不含资产确认检查）
  const canOperateBase = computed(() => {
    if (!detailData.value)
      return false
    // isNeedApproval === 1 表示还需要审批
    const isNeedApproval = detailData.value.appBaseApprovalRoute?.isNeedApproval === 1
    return isNeedApproval && canHandleCurrentLevel.value
  })

  const canExempt = computed(() => authStore.isAdmin)

  // 基本信息
  const basicInfoRows = computed<DetailFieldItem[]>(() => {
    if (!detailData.value)
      return []

    const { appBaseInfo, appBpmWorkFlow } = detailData.value
    const creationDate = dayjs(appBaseInfo.creationDate)

    return [
      { label: '申请人', value: appBaseInfo.applicantW3Account },
      { label: '申请单号', value: String(appBaseInfo.applicationId) },
      { label: '当前处理人', value: appBpmWorkFlow.currentHandler || '-' },
      { label: '当前状态', value: statusLabel.value },
      { label: '申请时间', value: creationDate.format('YYYY/MM/DD HH:mm:ss') },
      { label: '更新时间', value: dayjs(appBaseInfo.lastUpdateDate || appBaseInfo.creationDate).format('YYYY/MM/DD HH:mm:ss') },
    ]
  })

  // 申请信息
  const applicationInfoRows = computed<DetailFieldItem[]>(() => {
    if (!detailData.value)
      return []

    const { appBaseInfo, appBaseApprovalRoute, appBaseCountryCityRegionRelation, appBaseUploadDownloadInfo } = detailData.value

    const sourceAreaName = useRegionConfigStore().getNameById(appBaseCountryCityRegionRelation.fromRegionTypeId) || '-'
    const targetAreaName = useRegionConfigStore().getNameById(appBaseCountryCityRegionRelation.toRegionTypeId) || '-'

    return [
      { label: '部门', value: appBaseApprovalRoute.selectedDeptName || '-' },
      { label: '传输路由', value: formatTransWay(appBaseInfo.transWay) },
      { label: '上传区域', value: sourceAreaName },
      { label: '下载区域', value: targetAreaName },
      { label: '数据传出国家/城市', value: `${appBaseCountryCityRegionRelation.fromCountryName || '-'} / ${appBaseCountryCityRegionRelation.fromCityName || '-'}` },
      { label: '数据传至国家/城市', value: `${appBaseCountryCityRegionRelation.toCountryName || '-'} / ${appBaseCountryCityRegionRelation.toCityName || '-'}` },
      { label: '下载人账号', value: appBaseUploadDownloadInfo.downloadUser?.map((u: { fullName: string, w3Account: string }) => `${u.fullName}(${u.w3Account})`).join('、') || '-' },
      { label: '抄送人', value: appBaseApprovalRoute.managerCopyW3Account || '-' },
      { label: '包含客户网络数据', value: appBaseApprovalRoute.isCustomerData ? '是' : '否' },
      { label: '申请原因', value: appBaseInfo.reason || '-', fullRow: true },
    ]
  })

  // 获取流程进展（真实接口）
  async function fetchProcessDetail(id: string | number) {
    try {
      const res = await applicationApi.getProcessDetails(id)
      processDetailData.value = res
      return res
    }
    catch (error) {
      console.error('获取流程进展失败:', error)
    }
  }

  async function fetchDetail(id: string) {
    loading.value = true
    resetFiles()
    try {
      // 使用真实接口获取详情
      const res = await applicationApi.getApplicationDetail(id)
      detailData.value = res

      // 同时获取流程进展、文件列表
      fetchProcessDetail(id)
      fetchFileList(id)

      return detailData.value
    }
    finally {
      loading.value = false
    }
  }

  /** 审批操作成功后的统一处理 */
  function onApprovalSuccess(title: string, content: string) {
    approvalOpinion.value = ''
    Modal.success({
      title,
      content,
      okText: '查看',
      onOk: () => {
        router.push({ path: '/approvals', query: { tab: 'approved' } })
      },
    })
  }

  async function handleApprove() {
    if (!detailData.value)
      return

    const appId = detailData.value.appBaseInfo.applicationId
    const res = await approvalApi.userApproved({
      approvedType: 1,
      comments: approvalOpinion.value.trim() || '审批通过',
      appBpmWorkFlow: { applicationId: appId },
    })
    if (res.code !== '200') {
      Message.error('操作失败，请重试')
      return
    }
    onApprovalSuccess('审批通过', '申请已审批通过')
  }

  async function handleReject() {
    if (!detailData.value)
      return

    if (!approvalOpinion.value.trim()) {
      Message.error('请先填写驳回原因')
      return
    }

    const appId = detailData.value.appBaseInfo.applicationId
    const res = await approvalApi.userApproved({
      approvedType: 0,
      comments: approvalOpinion.value.trim(),
      appBpmWorkFlow: { applicationId: appId },
    })
    if (res.code !== '200') {
      Message.error('操作失败，请重试')
      return
    }
    onApprovalSuccess('已驳回', '申请已驳回')
  }

  async function handleExempt() {
    if (!detailData.value)
      return

    const appId = detailData.value.appBaseInfo.applicationId
    const res = await approvalApi.userApproved({
      approvedType: 1,
      comments: approvalOpinion.value.trim() || '免审通过',
      appBpmWorkFlow: { applicationId: appId },
    })
    if (res.code !== '200') {
      Message.error('操作失败，请重试')
      return
    }
    onApprovalSuccess('已免审', '申请已免审通过')
  }

  function handleDownloadFile(file: DetailFileItem) {
    const downloadUrl = detailData.value?.appBaseUploadDownloadInfo?.auditUrl
    if (!downloadUrl) {
      Message.error('当前申请单暂无下载链接')
      return
    }
    downloadSingleFile(file, downloadUrl)
  }

  function handleBatchDownload(fileIds: string[]) {
    const downloadUrl = detailData.value?.appBaseUploadDownloadInfo?.auditUrl
    if (!downloadUrl) {
      Message.error('当前申请单暂无下载链接')
      return
    }
    const selectedFiles = files.value.filter((f: DetailFileItem) => fileIds.includes(f.id))
    downloadBatchFiles(selectedFiles, downloadUrl)
  }

  function goBack() {
    router.push('/approvals')
  }

  return {
    loading,
    detailData,
    processDetailData,
    activeTab,
    approvalOpinion,
    statusLabel,
    basicInfoRows,
    applicationInfoRows,
    files: computed(() => files.value),
    fileLoading,
    totalFiles,
    pagination,
    currentApprovalLabel,
    canOperateBase,
    canExempt,
    downloading,
    downloadingFile,
    fetchDetail,
    handleApprove,
    handleReject,
    handleExempt,
    handleDownloadFile,
    handleBatchDownload,
    onFilePageChange,
    goBack,
  }
}
