import type { RealPageVO } from '@/types/common'
import type { DetailFileItem } from '@/types/detail'
import { applicationApi } from '@/api/application'
import { Message } from '@arco-design/web-vue'
import { computed, ref } from 'vue'

/** 将后端文件信息映射为前端展示用的 DetailFileItem */
function mapToFileItem(item: { fileName: string, fileSize: number, fileHashCode: string, relativeDir: string | null, fileSizeUnit: string }): DetailFileItem {
  return {
    id: item.fileHashCode,
    fileName: item.fileName,
    fileSize: item.fileSize,
    sha256: item.fileHashCode,
    relativeDir: item.relativeDir,
    fileSizeUnit: item.fileSizeUnit,
  }
}

export function useFileList() {
  const files = ref<DetailFileItem[]>([])
  const fileLoading = ref(false)
  const pageVO = ref<RealPageVO | null>(null)
  const currentApplicationId = ref<string | number>('')

  const totalFiles = computed(() => pageVO.value?.totalRows ?? 0)

  /** 分页配置，可直接传给 a-table 的 :pagination */
  const pagination = computed(() => {
    if (!pageVO.value)
      return false
    return {
      current: pageVO.value.curPage,
      pageSize: pageVO.value.pageSize,
      total: pageVO.value.totalRows,
      showTotal: true,
      showPageSize: true,
      sizeCanChange: true,
    }
  })

  /** 获取文件列表 */
  async function fetchFiles(applicationId: string | number, page = 1, pageSize = 10) {
    currentApplicationId.value = applicationId
    fileLoading.value = true
    try {
      const res = await applicationApi.getMyFileInfoList(applicationId, pageSize, page)
      pageVO.value = res.pageVO
      files.value = res.result.map(mapToFileItem)
    }
    catch (error) {
      console.error('获取文件列表失败:', error)
      Message.error('获取文件列表失败')
      files.value = []
      pageVO.value = null
    }
    finally {
      fileLoading.value = false
    }
  }

  /** 分页变更处理 */
  function onPageChange(page: number, pageSize?: number) {
    if (currentApplicationId.value) {
      fetchFiles(currentApplicationId.value, page, pageSize ?? pageVO.value?.pageSize ?? 10)
    }
  }

  /** 重置状态 */
  function resetFiles() {
    files.value = []
    pageVO.value = null
    currentApplicationId.value = ''
  }

  return {
    files,
    fileLoading,
    pageVO,
    totalFiles,
    pagination,
    fetchFiles,
    onPageChange,
    resetFiles,
  }
}
