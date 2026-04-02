import type { KiaKeyFileItem, SecretLevelItem } from '@/types/assetDetection'
import { computed, ref } from 'vue'
import { assetDetectionApi } from '@/api/assetDetection'
import { getFileTypeName } from '@/constants/fileType'

/**
 * 资产检测结果 composable
 * 用于申请单详情和审批单详情页面
 */
export function useAssetDetection() {
  // 加载状态
  const countLoading = ref(false)
  const listLoading = ref(false)

  // 统计数据
  const countData = ref<{
    count: number
    fileSizeSum: string
  } | null>(null)

  // 关键资产列表
  const keyFileList = ref<KiaKeyFileItem[]>([])

  // 密级枚举
  const secretLevelList = ref<SecretLevelItem[]>([])
  const secretLevelMap = ref<Record<string | number, string>>({})

  // 确认状态（审批详情用）
  const confirmedFiles = ref<Set<string>>(new Set())

  // 是否有关键资产
  const hasKeyAssets = computed(() => countData.value?.count && countData.value.count > 0)

  // 是否所有文件都已确认
  const allFilesConfirmed = computed(() => {
    if (!hasKeyAssets.value || keyFileList.value.length === 0)
      return false
    return keyFileList.value.every(file => confirmedFiles.value.has(file.fileName))
  })

  // 处理后的文件列表（带展示名称）
  const processedFileList = computed(() => {
    return keyFileList.value.map((file) => ({
      ...file,
      fileTypeName: getFileTypeName(file.fileType),
      secretLevelName: secretLevelMap.value[file.secretLevel] ?? `密级${file.secretLevel}`,
      confirmed: confirmedFiles.value.has(file.fileName),
    }))
  })

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
   * 查询关键资产统计
   */
  async function fetchKiaCount(applicationId: number | string) {
    countLoading.value = true
    try {
      const res = await assetDetectionApi.getKiaResultCount(applicationId)
      countData.value = {
        count: res.count,
        fileSizeSum: res.fileSizeSum,
      }
      return res
    }
    catch (error) {
      console.error('查询关键资产统计失败:', error)
      countData.value = null
      return null
    }
    finally {
      countLoading.value = false
    }
  }

  /**
   * 查询关键资产列表
   */
  async function fetchKiaList(applicationId: number | string) {
    listLoading.value = true
    try {
      // 先确保密级枚举已加载
      if (secretLevelList.value.length === 0) {
        await fetchSecretLevels()
      }

      const list = await assetDetectionApi.getKiaResultKeyList(applicationId)
      keyFileList.value = list
      // 重置确认状态
      confirmedFiles.value = new Set()
      return list
    }
    catch (error) {
      console.error('查询关键资产列表失败:', error)
      keyFileList.value = []
      return []
    }
    finally {
      listLoading.value = false
    }
  }

  /**
   * 初始化资产检测数据
   * 先查统计，有关键资产时再查列表
   */
  async function initAssetDetection(applicationId: number | string) {
    // 重置状态
    countData.value = null
    keyFileList.value = []
    confirmedFiles.value = new Set()

    // 查询统计
    const countRes = await fetchKiaCount(applicationId)

    // 有关键资产时查询列表
    if (countRes && countRes.count > 0) {
      await fetchKiaList(applicationId)
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
   * 确认全部文件
   */
  function confirmAllFiles() {
    keyFileList.value.forEach((file) => {
      confirmedFiles.value.add(file.fileName)
    })
  }

  /**
   * 重置确认状态
   */
  function resetConfirmation() {
    confirmedFiles.value = new Set()
  }

  return {
    // 状态
    countLoading,
    listLoading,
    countData,
    keyFileList,
    secretLevelList,
    secretLevelMap,
    confirmedFiles,

    // 计算属性
    hasKeyAssets,
    allFilesConfirmed,
    processedFileList,

    // 方法
    fetchSecretLevels,
    fetchKiaCount,
    fetchKiaList,
    initAssetDetection,
    confirmFile,
    unconfirmFile,
    confirmAllFiles,
    resetConfirmation,
  }
}
