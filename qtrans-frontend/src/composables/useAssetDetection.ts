import type { KiaFileItem, KiaKeyFileItem, KiaResultCountResponse, KiaResultListRequest, SecretLevelItem } from '@/types/assetDetection'
import { computed, reactive, ref } from 'vue'
import { assetDetectionApi } from '@/api/assetDetection'
import { FILE_TYPE_ALL_KEYS, getFileTypeName } from '@/constants/fileType'

/**
 * 资产检测结果 composable
 * 用于申请单详情和审批单详情页面
 * 
 * 支持两级确认逻辑：
 * 1. 文件确认：所有检测文件都可以逐条确认
 * 2. 关键资产确认：如果存在关键资产(fileType=4)，需要额外确认
 * 
 * 确认顺序：串行（先确认所有文件，确认完后如果有关键资产，再确认关键资产）
 */
export function useAssetDetection() {
  // ========== 加载状态 ==========
  const countLoading = ref(false)
  const listLoading = ref(false)
  const keyListLoading = ref(false)

  // ========== 统计数据 ==========
  const countData = ref<KiaResultCountResponse | null>(null)

  // ========== 所有检测文件列表（分页） ==========
  const fileList = ref<KiaFileItem[]>([])
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  // ========== 关键资产列表（fileType=4） ==========
  const keyFileList = ref<KiaKeyFileItem[]>([])

  // ========== 密级枚举 ==========
  const secretLevelList = ref<SecretLevelItem[]>([])
  const secretLevelMap = ref<Record<string | number, string>>({})

  // ========== 筛选条件 ==========
  const filters = reactive({
    fileType: undefined as number | undefined,
    fileName: undefined as string | undefined,
  })

  // ========== 确认状态 ==========
  // 文件确认状态（所有文件）
  const confirmedFiles = ref<Set<string>>(new Set())
  // 关键资产确认状态
  const confirmedKeyAssets = ref<Set<string>>(new Set())
  // 是否已完成文件确认阶段
  const fileConfirmationCompleted = ref(false)

  // ========== 计算属性 ==========

  /** 是否有检测结果 */
  const hasDetectionResult = computed(() => countData.value?.count && countData.value.count > 0)

  /** 是否有关键资产 */
  const hasKeyAssets = computed(() => keyFileList.value.length > 0)

  /** 是否所有文件都已确认（逐条确认够数 或 点击了"确认全部文件"） */
  const allFilesConfirmed = computed(() => {
    // 用户点击"确认全部文件"后直接标记为已完成
    if (fileConfirmationCompleted.value)
      return true
    if (pagination.total === 0)
      return false
    return confirmedFiles.value.size >= pagination.total
  })

  /** 已确认的文件数量 */
  const confirmedFileCount = computed(() => {
    if (fileConfirmationCompleted.value)
      return pagination.total
    return confirmedFiles.value.size
  })

  /** 是否所有关键资产都已确认 */
  const allKeyAssetsConfirmed = computed(() => {
    if (!hasKeyAssets.value)
      return true
    return keyFileList.value.every(file => confirmedKeyAssets.value.has(file.fileName))
  })

  /** 当前是否处于关键资产确认阶段 */
  const isInKeyAssetConfirmationStage = computed(() => {
    return fileConfirmationCompleted.value && hasKeyAssets.value && !allKeyAssetsConfirmed.value
  })

  /** 是否可以操作（按钮是否置灰） */
  const canOperate = computed(() => {
    // 没有检测结果，可以操作
    if (!hasDetectionResult.value)
      return true
    
    // 还没确认完所有文件，不能操作
    if (!allFilesConfirmed.value)
      return false
    
    // 文件确认完了，但有关键资产未确认，不能操作
    if (hasKeyAssets.value && !allKeyAssetsConfirmed.value)
      return false
    
    // 所有确认都完成了，可以操作
    return true
  })

  /** 处理后的文件列表（带展示名称和确认状态） */
  const processedFileList = computed(() => {
    const allConfirmed = fileConfirmationCompleted.value
    return fileList.value.map((file) => ({
      ...file,
      fileTypeName: getFileTypeName(file.fileType),
      secretLevelName: secretLevelMap.value[file.secretLevel] ?? `密级${file.secretLevel}`,
      // 已逐条确认 或 点击了"确认全部文件" 都视为已确认
      confirmed: allConfirmed || confirmedFiles.value.has(file.fileName),
    }))
  })

  /** 处理后的关键资产列表 */
  const processedKeyFileList = computed(() => {
    return keyFileList.value.map((file) => ({
      ...file,
      fileTypeName: getFileTypeName(file.fileType),
      secretLevelName: secretLevelMap.value[file.secretLevel] ?? `密级${file.secretLevel}`,
      confirmed: confirmedKeyAssets.value.has(file.fileName),
    }))
  })

  /** 分类统计数据 */
  const categoryStats = computed(() => {
    if (!countData.value?.result)
      return []
    return countData.value.result.map(item => ({
      fileType: item.fileType,
      fileTypeName: getFileTypeName(item.fileType),
      count: item.record,
    }))
  })

  // ========== 方法 ==========

  /**
   * 获取密级枚举
   */
  async function fetchSecretLevels() {
    try {
      const list = await assetDetectionApi.getSecretLevelList()
      secretLevelList.value = list
      // 构建映射
      const map: Record<string | number, string> = {}
      list.forEach((item) => {
        map[item.value] = item.label
      })
      secretLevelMap.value = map
      return list
    }
    catch (error) {
      console.error('获取密级枚举失败:', error)
      return []
    }
  }

  /**
   * 查询检测结果统计
   */
  async function fetchKiaCount(applicationId: number | string) {
    countLoading.value = true
    try {
      const res = await assetDetectionApi.getKiaResultCount(applicationId)
      countData.value = res
      return res
    }
    catch (error) {
      console.error('查询检测结果统计失败:', error)
      countData.value = null
      return null
    }
    finally {
      countLoading.value = false
    }
  }

  /**
   * 分页查询所有检测文件
   * - 未选类型时：传 fileTypes（全部 key 数组）
   * - 选了单个类型时：传 fileType（单个值）
   */
  async function fetchKiaResultList(applicationId: number | string, pageNum?: number) {
    listLoading.value = true
    try {
      // 先确保密级枚举已加载
      if (secretLevelList.value.length === 0) {
        await fetchSecretLevels()
      }

      const currentPage = pageNum ?? pagination.current

      // 构建查询参数：
      // 有具体 fileType 时传单个 fileType，否则传 fileTypes 全部数组
      const rawFileType = filters.fileType
      const hasFileType = rawFileType != null && !Number.isNaN(Number(rawFileType))
      const params: KiaResultListRequest = {
        applicationId,
        pageNum: currentPage,
        pageSize: pagination.pageSize,
      }
      if (hasFileType) {
        params.fileType = Number(rawFileType)
      }
      else {
        params.fileTypes = FILE_TYPE_ALL_KEYS
      }
      if (filters.fileName) {
        params.fileName = filters.fileName.trim()
      }

      const res = await assetDetectionApi.getKiaResultList(params)

      fileList.value = res.result || []
      pagination.total = res.pageVO?.totalRows || 0
      pagination.current = currentPage

      return res
    }
    catch (error) {
      console.error('查询检测文件列表失败:', error)
      fileList.value = []
      pagination.total = 0
      return null
    }
    finally {
      listLoading.value = false
    }
  }

  /**
   * 查询关键资产列表（fileType=4）
   */
  async function fetchKiaKeyList(applicationId: number | string) {
    keyListLoading.value = true
    try {
      // 先确保密级枚举已加载
      if (secretLevelList.value.length === 0) {
        await fetchSecretLevels()
      }

      const list = await assetDetectionApi.getKiaResultKeyList(applicationId)
      keyFileList.value = list
      return list
    }
    catch (error) {
      console.error('查询关键资产列表失败:', error)
      keyFileList.value = []
      return []
    }
    finally {
      keyListLoading.value = false
    }
  }

  /**
   * 初始化资产检测数据
   * 1. 查询统计
   * 2. 如果有结果，查询所有文件列表
   * 3. 同时查询关键资产列表（用于确认逻辑判断）
   */
  async function initAssetDetection(applicationId: number | string) {
    // 重置状态
    countData.value = null
    fileList.value = []
    keyFileList.value = []
    confirmedFiles.value = new Set()
    confirmedKeyAssets.value = new Set()
    fileConfirmationCompleted.value = false
    pagination.current = 1
    pagination.total = 0
    filters.fileType = undefined
    filters.fileName = undefined

    // 查询统计
    const countRes = await fetchKiaCount(applicationId)

    // 有检测结果时查询列表
    if (countRes && countRes.count > 0) {
      // 并行查询文件列表和关键资产列表
      await Promise.all([
        fetchKiaResultList(applicationId, 1),
        fetchKiaKeyList(applicationId),
      ])
    }
  }

  /**
   * 确认单个文件
   */
  function confirmFile(fileName: string) {
    confirmedFiles.value.add(fileName)
  }

  /**
   * 取消确认单个文件
   */
  function unconfirmFile(fileName: string) {
    confirmedFiles.value.delete(fileName)
  }

  /**
   * 确认单个关键资产
   */
  function confirmKeyAsset(fileName: string) {
    confirmedKeyAssets.value.add(fileName)
  }

  /**
   * 取消确认单个关键资产
   */
  function unconfirmKeyAsset(fileName: string) {
    confirmedKeyAssets.value.delete(fileName)
  }

  /**
   * 批量确认当前页所有文件
   */
  function confirmAllCurrentPageFiles() {
    fileList.value.forEach((file) => {
      confirmedFiles.value.add(file.fileName)
    })
  }

  /**
   * 确认全部文件（一次性，基于总数而非当前页数据）
   */
  function confirmAllFiles() {
    // 标记完成（影响 allFilesConfirmed / canOperate / 按钮隐藏）
    fileConfirmationCompleted.value = true
    // 将当前已加载的文件名加入 Set（影响 processedFileList 行状态）
    fileList.value.forEach((file) => {
      confirmedFiles.value.add(file.fileName)
    })
  }

  /**
   * 确认所有关键资产
   */
  function confirmAllKeyAssets() {
    keyFileList.value.forEach((file) => {
      confirmedKeyAssets.value.add(file.fileName)
    })
  }

  /**
   * 重置所有确认状态
   */
  function resetConfirmation() {
    confirmedFiles.value = new Set()
    confirmedKeyAssets.value = new Set()
    fileConfirmationCompleted.value = false
  }

  /**
   * 更新筛选条件并重新查询
   */
  async function updateFilters(applicationId: number | string, newFilters: Partial<typeof filters>) {
    Object.assign(filters, newFilters)
    pagination.current = 1
    await fetchKiaResultList(applicationId, 1)
  }

  /**
   * 切换页码
   */
  async function changePage(applicationId: number | string, page: number) {
    await fetchKiaResultList(applicationId, page)
  }

  /**
   * 切换每页数量
   */
  async function changePageSize(applicationId: number | string, size: number) {
    pagination.pageSize = size
    pagination.current = 1
    await fetchKiaResultList(applicationId, 1)
  }

  return {
    // 状态
    countLoading,
    listLoading,
    keyListLoading,
    countData,
    fileList,
    pagination,
    keyFileList,
    secretLevelList,
    secretLevelMap,
    confirmedFiles,
    confirmedKeyAssets,
    fileConfirmationCompleted,
    filters,

    // 计算属性
    hasDetectionResult,
    hasKeyAssets,
    allFilesConfirmed,
    confirmedFileCount,
    allKeyAssetsConfirmed,
    isInKeyAssetConfirmationStage,
    canOperate,
    processedFileList,
    processedKeyFileList,
    categoryStats,

    // 方法
    fetchSecretLevels,
    fetchKiaCount,
    fetchKiaResultList,
    fetchKiaKeyList,
    initAssetDetection,
    confirmFile,
    unconfirmFile,
    confirmKeyAsset,
    unconfirmKeyAsset,
    confirmAllCurrentPageFiles,
    confirmAllFiles,
    confirmAllKeyAssets,
    resetConfirmation,
    updateFilters,
    changePage,
    changePageSize,
  }
}
