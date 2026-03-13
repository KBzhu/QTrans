/**
 * TransWebService 文件下载 Composable
 * 按照文档规范实现文件下载、文件夹打包检查等功能
 */
import { Message } from '@arco-design/web-vue'
import { ref, shallowRef } from 'vue'
import {
  type DirectoryEntity,
  type DownloadInitResponse,
  type FileEntity,
  type FileListData,
  checkPackageStatus,
  downloadAndSave,
  formatFileSize,
  getFileList,
  initDownload,
} from '@/api/transWebService'

/** 下载进度 */
export interface DownloadProgress {
  fileName: string
  progress: number
  loaded: number
  total: number
  status: 'pending' | 'downloading' | 'completed' | 'error'
  error?: string
}

/** 选中的文件项 */
export interface SelectedFileItem {
  type: 'file' | 'directory'
  name: string
  relativeDir: string
  filePath: string
  fileSize?: number
  lastModify?: string
}

/**
 * TransWebService 下载 Composable
 */
export function useTransDownload() {
  const loading = ref(false)
  const initLoading = ref(false)
  const initData = shallowRef<DownloadInitResponse | null>(null)
  const fileListData = shallowRef<FileListData | null>(null)
  const currentRelativeDir = ref('')
  const selectedFiles = ref<SelectedFileItem[]>([])
  const downloadProgress = shallowRef<DownloadProgress | null>(null)
  const downloading = ref(false)

  /**
   * 初始化下载页面
   */
  async function initialize(params: string, lang = 'zh_CN'): Promise<DownloadInitResponse | null> {
    initLoading.value = true
    try {
      const data = await initDownload(params, lang)
      initData.value = data

      // 加载根目录文件列表
      await loadFileList('', params)

      return data
    }
    catch (error: any) {
      Message.error(`初始化失败: ${error.message || '未知错误'}`)
      return null
    }
    finally {
      initLoading.value = false
    }
  }

  /**
   * 加载文件列表
   */
  async function loadFileList(relativeDir: string, params: string): Promise<FileListData | null> {
    loading.value = true
    try {
      const data = await getFileList(relativeDir, params)
      fileListData.value = data
      currentRelativeDir.value = data.currentRelativeDir || relativeDir
      return data
    }
    catch (error: any) {
      Message.error(`获取文件列表失败: ${error.message || '未知错误'}`)
      return null
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 进入目录
   */
  async function enterDirectory(directory: DirectoryEntity, params: string): Promise<void> {
    selectedFiles.value = []
    await loadFileList(directory.relativeDir, params)
  }

  /**
   * 返回上级目录
   */
  async function goBack(params: string): Promise<void> {
    if (!currentRelativeDir.value || currentRelativeDir.value === '') {
      return
    }

    // 计算上级目录路径
    const parts = currentRelativeDir.value.split('/').filter(Boolean)
    parts.pop()
    const parentDir = parts.length > 0 ? parts.join('/') + '/' : ''

    selectedFiles.value = []
    await loadFileList(parentDir, params)
  }

  /**
   * 刷新当前目录
   */
  async function refreshCurrent(params: string): Promise<void> {
    await loadFileList(currentRelativeDir.value, params)
  }

  /**
   * 选择/取消选择文件
   */
  function toggleSelectFile(item: SelectedFileItem): void {
    const index = selectedFiles.value.findIndex(
      f => f.name === item.name && f.relativeDir === item.relativeDir,
    )
    if (index >= 0) {
      selectedFiles.value.splice(index, 1)
    }
    else {
      selectedFiles.value.push(item)
    }
  }

  /**
   * 全选/取消全选
   */
  function toggleSelectAll(): void {
    if (!fileListData.value) return

    const allItems: SelectedFileItem[] = [
      ...fileListData.value.directoryList.map(d => ({
        type: 'directory' as const,
        name: d.name,
        relativeDir: d.relativeDir,
        filePath: d.filePath,
        lastModify: d.lastModify,
      })),
      ...fileListData.value.fileList.map(f => ({
        type: 'file' as const,
        name: f.fileName,
        relativeDir: f.relativeDir,
        filePath: f.filePath,
        fileSize: f.fileSize,
        lastModify: f.lastModify,
      })),
    ]

    if (selectedFiles.value.length === allItems.length) {
      selectedFiles.value = []
    }
    else {
      selectedFiles.value = allItems
    }
  }

  /**
   * 下载单个文件
   */
  async function downloadFile(
    file: FileEntity,
    params: string,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<boolean> {
    downloading.value = true
    downloadProgress.value = {
      fileName: file.fileName,
      progress: 0,
      loaded: 0,
      total: file.fileSize || 0,
      status: 'downloading',
    }

    try {
      await downloadAndSave(
        file.fileName,
        file.relativeDir,
        params,
        (percent, loaded, total) => {
          downloadProgress.value = {
            fileName: file.fileName,
            progress: percent,
            loaded,
            total,
            status: 'downloading',
          }
          onProgress?.(downloadProgress.value)
        },
      )

      downloadProgress.value.status = 'completed'
      Message.success(`${file.fileName} 下载完成`)
      return true
    }
    catch (error: any) {
      downloadProgress.value.status = 'error'
      downloadProgress.value.error = error.message || '下载失败'
      Message.error(`下载失败: ${error.message || '未知错误'}`)
      return false
    }
    finally {
      downloading.value = false
    }
  }

  /**
   * 下载文件夹
   */
  async function downloadDirectory(
    directory: DirectoryEntity,
    params: string,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<boolean> {
    // 检查文件夹是否正在打包
    const packageStatus = await checkPackageStatus(directory.relativeDir, params)
    if (packageStatus.result) {
      Message.warning(packageStatus.message || '文件夹正在打包中，请稍后再试')
      return false
    }

    downloading.value = true
    downloadProgress.value = {
      fileName: directory.name,
      progress: 0,
      loaded: 0,
      total: 0,
      status: 'downloading',
    }

    try {
      await downloadAndSave(
        directory.name,
        directory.relativeDir,
        params,
        (percent, loaded, total) => {
          downloadProgress.value = {
            fileName: directory.name,
            progress: percent,
            loaded,
            total,
            status: 'downloading',
          }
          onProgress?.(downloadProgress.value)
        },
      )

      downloadProgress.value.status = 'completed'
      Message.success(`${directory.name} 下载完成`)
      return true
    }
    catch (error: any) {
      downloadProgress.value.status = 'error'
      downloadProgress.value.error = error.message || '下载失败'
      Message.error(`下载失败: ${error.message || '未知错误'}`)
      return false
    }
    finally {
      downloading.value = false
    }
  }

  /**
   * 批量下载选中的文件
   */
  async function downloadSelected(params: string): Promise<{ success: number; failed: number }> {
    if (selectedFiles.value.length === 0) {
      Message.warning('请先选择要下载的文件')
      return { success: 0, failed: 0 }
    }

    let success = 0
    let failed = 0

    for (const item of selectedFiles.value) {
      let result = false

      if (item.type === 'file') {
        const file: FileEntity = {
          fileName: item.name,
          fileSize: item.fileSize || 0,
          relativeDir: item.relativeDir,
          filePath: item.filePath,
          lastModify: item.lastModify || '',
          extension: '',
          hashCode: '',
          clientFileHashCode: '',
          fileId: 0,
        }
        result = await downloadFile(file, params)
      }
      else {
        const dir: DirectoryEntity = {
          name: item.name,
          relativeDir: item.relativeDir,
          filePath: item.filePath,
          lastModify: item.lastModify || '',
        }
        result = await downloadDirectory(dir, params)
      }

      if (result) {
        success++
      }
      else {
        failed++
      }
    }

    if (success > 0 && failed === 0) {
      Message.success(`全部下载完成，共 ${success} 个`)
    }
    else if (success > 0 && failed > 0) {
      Message.warning(`下载完成：成功 ${success} 个，失败 ${failed} 个`)
    }

    return { success, failed }
  }

  /**
   * 获取文件图标
   */
  function getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    const iconMap: Record<string, string> = {
      doc: '34',
      docx: '34',
      xls: '31',
      xlsx: '31',
      zip: '37',
      ppt: '40',
      pptx: '40',
      pdf: '34',
      txt: '34',
      jpg: '34',
      jpeg: '34',
      png: '34',
      gif: '34',
    }
    const iconNum = iconMap[ext] || '34'
    return `/figma/3883_5466/${iconNum}.svg`
  }

  /**
   * 判断是否为根目录
   */
  function isRootDirectory(): boolean {
    return currentRelativeDir.value === '' || currentRelativeDir.value === '/'
  }

  return {
    // 状态
    loading,
    initLoading,
    initData,
    fileListData,
    currentRelativeDir,
    selectedFiles,
    downloadProgress,
    downloading,

    // 方法
    initialize,
    loadFileList,
    enterDirectory,
    goBack,
    refreshCurrent,
    toggleSelectFile,
    toggleSelectAll,
    downloadFile,
    downloadDirectory,
    downloadSelected,

    // 工具函数
    formatFileSize,
    getFileIcon,
    isRootDirectory,
  }
}

export default useTransDownload
