import type { DetailFileItem } from '@/types/detail'
import { Message } from '@arco-design/web-vue'
import { initDownload, downloadAndSave } from '@/api/transWebService'
import { ref } from 'vue'

/**
 * 从 URL 中提取 params 参数
 * 例: "https://xxx/transWeb/valid?params=security%3A..." → "security:..."
 */
function extractParamsFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const params = urlObj.searchParams.get('params')
    return params || ''
  }
  catch {
    const match = url.match(/params=([^&]+)/)
    return match?.[1] ?? ''
  }
}

export function useFileDownload() {
  const downloading = ref(false)
  const downloadingFile = ref<string>('')

  /**
   * 下载单个文件
   * @param file 文件项
   * @param downloadUrl 申请单的 downloadUrl（包含 params 参数）
   */
  async function downloadFile(file: DetailFileItem, downloadUrl: string) {
    const params = extractParamsFromUrl(downloadUrl)
    if (!params) {
      Message.error('无法获取下载参数，downloadUrl 无效')
      return
    }

    downloading.value = true
    downloadingFile.value = file.fileName

    try {
      // 第一步：初始化下载，获取 token
      await initDownload(params)

      // 第二步：下载文件并保存
      await downloadAndSave(
        file.fileName,
        file.relativeDir || '/',
        params,
      )

      Message.success(`${file.fileName} 下载成功`)
    }
    catch (error: any) {
      console.error('下载失败:', error)
      Message.error(error?.message || `${file.fileName} 下载失败`)
    }
    finally {
      downloading.value = false
      downloadingFile.value = ''
    }
  }

  /**
   * 批量下载文件（串行逐个下载）
   * @param files 文件列表
   * @param downloadUrl 申请单的 downloadUrl
   */
  async function batchDownload(files: DetailFileItem[], downloadUrl: string) {
    if (files.length === 0) {
      Message.warning('请先选择要下载的文件')
      return
    }

    const params = extractParamsFromUrl(downloadUrl)
    if (!params) {
      Message.error('无法获取下载参数，downloadUrl 无效')
      return
    }

    // 第一步：初始化下载，获取 token（只需一次）
    try {
      await initDownload(params)
    }
    catch (error: any) {
      Message.error(error?.message || '初始化下载失败')
      return
    }

    // 第二步：串行下载每个文件
    let successCount = 0
    let failCount = 0

    for (const file of files) {
      try {
        downloading.value = true
        downloadingFile.value = file.fileName
        await downloadAndSave(file.fileName, file.relativeDir || '/', params)
        successCount++
      }
      catch (error: any) {
        console.error(`${file.fileName} 下载失败:`, error)
        failCount++
      }
    }

    downloading.value = false
    downloadingFile.value = ''

    if (failCount === 0) {
      Message.success(`全部 ${successCount} 个文件下载完成`)
    }
    else {
      Message.warning(`下载完成：${successCount} 个成功，${failCount} 个失败`)
    }
  }

  return {
    downloading,
    downloadingFile,
    downloadFile,
    batchDownload,
  }
}
