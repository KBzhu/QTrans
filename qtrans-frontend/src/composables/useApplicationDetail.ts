import type { ApplicationDetailResponse, ProcessDetailsResponse } from '@/api/application'
import type { DetailFieldItem } from '@/types/detail'

/** 详情文件项 */
export interface DetailFileItem {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
  sha256: string
}
import { applicationApi } from '@/api/application'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

/** 区域类型ID到名称的反向映射 */
const REGION_ID_TO_NAME: Record<number, string> = {
  1: '绿区',
  0: '黄区',
  4: '红区',
  2: '外网',
}

function formatTransWay(transWay: string): string {
  // "外网,绿区" -> "外网 → 绿区"
  return transWay.split(',').map(s => s.trim()).join(' → ')
}

function parseNotification(notification: string): string {
  // "[1,2]" -> "邮件通知, 短信通知" (简化展示)
  if (!notification)
    return '-'
  try {
    const arr = JSON.parse(notification)
    if (!Array.isArray(arr) || arr.length === 0)
      return '-'
    const map: Record<number, string> = {
      1: '邮件',
      2: '短信',
    }
    return arr.map((id: number) => map[id] || id).join('、')
  }
  catch {
    return notification
  }
}

export function useApplicationDetail() {
  const router = useRouter()

  const loading = ref(false)
  const detailData = ref<ApplicationDetailResponse | null>(null)
  const processDetailData = ref<ProcessDetailsResponse | null>(null)
  const activeTab = ref<'info' | 'files'>('info')

  // 基本信息
  const basicInfoRows = computed<DetailFieldItem[]>(() => {
    if (!detailData.value)
      return []

    const { appBaseInfo, appBaseUploadDownloadInfo, appBpmWorkFlow } = detailData.value
    const creationDate = dayjs(appBaseInfo.creationDate)
    const uploadEndDate = dayjs(appBaseUploadDownloadInfo.uploadEndDate)
    const downloadEndDate = dayjs(appBaseUploadDownloadInfo.downloadEndDate)

    return [
      { label: '申请人', value: appBaseInfo.applicantW3Account },
      { label: '申请单号', value: String(appBaseInfo.applicationId) },
      { label: '当前处理人', value: appBpmWorkFlow.currentHandler || '-' },
      { label: '上传有效期间', value: `${uploadEndDate.diff(creationDate, 'day')}天` },
      { label: '下载有效期间', value: `${downloadEndDate.diff(creationDate, 'day')}天` },
    ]
  })

  // 申请信息
  const applicationInfoRows = computed<DetailFieldItem[]>(() => {
    if (!detailData.value)
      return []

    const { appBaseInfo, appBaseApprovalRoute, appBaseCountryCityRegionRelation, appBaseUploadDownloadInfo } = detailData.value

    const sourceAreaName = REGION_ID_TO_NAME[appBaseCountryCityRegionRelation.fromRegionTypeId] || '-'
    const targetAreaName = REGION_ID_TO_NAME[appBaseCountryCityRegionRelation.toRegionTypeId] || '-'

    return [
      { label: '部门', value: appBaseApprovalRoute.selectedDeptName || '-' },
      { label: '传输路由', value: formatTransWay(appBaseInfo.transWay) },
      { label: '上传区域', value: sourceAreaName },
      { label: '下载区域', value: targetAreaName },
      { label: '源城市', value: appBaseCountryCityRegionRelation.fromCityName || '-' },
      { label: '目标城市', value: appBaseCountryCityRegionRelation.toCityName || '-' },
      { label: '下载人账号', value: appBaseUploadDownloadInfo.downloadUser?.map(u => `${u.fullName}(${u.w3Account})`).join('、') || '-' },
      { label: '抄送人', value: appBaseApprovalRoute.managerCopyW3Account || '-' },
      { label: '包含客户网络数据', value: appBaseApprovalRoute.isCustomerData ? '是' : '否' },
      { label: '创建时间', value: dayjs(appBaseInfo.creationDate).format('YYYY/MM/DD HH:mm:ss') },
      { label: '申请原因', value: appBaseInfo.reason || '-', fullRow: true },
      { label: '申请人通知范围', value: parseNotification(appBaseInfo.uploadNotification) },
      { label: '下载人通知范围', value: parseNotification(appBaseInfo.downloadNotification) },
    ]
  })

  // 文件列表 - 暂时返回空数组，后续对接文件列表接口
  const files = computed<DetailFileItem[]>(() => {
    return []
  })

  // 是否未上传
  const isNotUploaded = computed(() => {
    return detailData.value?.appBaseUploadDownloadInfo.isUploaded === 0
  })

  async function fetchDetail(id: string | number) {
    loading.value = true
    try {
      const res = await applicationApi.getApplicationDetail(id)
      detailData.value = res
      // 同时获取流程进展
      fetchProcessDetail(id)
      return res
    }
    catch (error) {
      Message.error('获取申请单详情失败')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  // 获取流程进展
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

  function handleContinueUpload() {
    if (!detailData.value)
      return

    // 跳转到上传页面，带上申请单ID
    router.push({
      path: '/application/create',
      query: {
        applicationId: detailData.value.appBaseInfo.applicationId,
        step: '2',
      },
    })
  }

  function handleViewFiles() {
    if (!detailData.value)
      return

    // 跳转到文件列表页
    router.push(`/application/${detailData.value.appBaseInfo.applicationId}/files`)
  }

  function handleDownloadFile(_file: DetailFileItem) {
    Message.info('文件下载功能待对接')
  }

  function handleBatchDownload(_fileIds: string[]) {
    Message.info('批量下载功能待对接')
  }

  return {
    loading,
    detailData,
    processDetailData,
    activeTab,
    basicInfoRows,
    applicationInfoRows,
    files,
    isNotUploaded,
    fetchDetail,
    fetchProcessDetail,
    handleContinueUpload,
    handleViewFiles,
    handleDownloadFile,
    handleBatchDownload,
  }
}
