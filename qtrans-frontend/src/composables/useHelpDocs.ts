import type { HelpDocItem } from '@/api/uiConfig'
import { ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { uiConfigApi } from '@/api/uiConfig'

/** 帮助文档列表项（UI 使用） */
export interface HelpDocListItem {
  id: string
  code: string
  title: string
  link: string
  updateTime: string
  order: number
}

/**
 * 格式化日期时间
 * @param dateStr ISO 格式日期字符串，如 "2023-07-25T11:30:07.000+0800"
 */
function formatDateTime(dateStr: string): string {
  if (!dateStr)
    return '--'

  try {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }
  catch {
    return '--'
  }
}

/**
 * 转换帮助文档数据
 */
function transformHelpDocs(data: HelpDocItem[]): HelpDocListItem[] {
  return data
    .map(item => ({
      id: String(item.itemId),
      code: item.itemCode,
      title: item.itemName,
      // 直接使用中文链接
      link: item.itemAttr1 || '',
      updateTime: formatDateTime(item.lastUpdateDate),
      order: item.itemIndex,
    }))
    .sort((a, b) => a.order - b.order)
}

export function useHelpDocs() {
  const loading = ref(false)
  const helpDocs = ref<HelpDocListItem[]>([])

  async function fetchHelpDocs() {
    loading.value = true
    try {
      const res = await uiConfigApi.getHelpDocs()
      const data = res?.help_doc_link || []
      helpDocs.value = transformHelpDocs(data)
    }
    catch (error: any) {
      Message.error(error.message || '获取帮助文档失败')
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 打开帮助文档链接
   */
  function openDocLink(link: string) {
    if (link) {
      window.open(link, '_blank')
    }
  }

  // 初始化时获取数据
  fetchHelpDocs()

  return {
    loading,
    helpDocs,
    fetchHelpDocs,
    openDocLink,
  }
}
