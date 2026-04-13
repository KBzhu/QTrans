import type { TopAfficheItem } from '@/api/uiConfig'
import { ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { uiConfigApi } from '@/api/uiConfig'

/** 重要公告列表项（UI 使用） */
export interface TopAfficheListItem {
  id: string
  code: string
  title: string
  content: string
  link: string | null
  icon: string | null
  updateTime: string
  order: number
}

/**
 * 格式化日期时间
 * @param dateStr ISO 格式日期字符串
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
 * 转换公告数据
 */
function transformAffiches(data: TopAfficheItem[]): TopAfficheListItem[] {
  return data
    .map((item) => {
      // 标题：优先使用 itemAttr1，为空则用固定标题
      const title = item.itemAttr1?.trim() || '系统公告'

      // 正文：直接使用 itemDesc
      const content = item.itemDesc || ''

      // 链接：使用 itemAttr3
      const link = item.itemAttr3?.trim() || null

      return {
        id: String(item.itemId),
        code: item.itemCode,
        title,
        content,
        link,
        icon: item.itemAttr2 || null,
        updateTime: formatDateTime(item.lastUpdateDate),
        order: item.itemIndex,
      }
    })
    .sort((a, b) => a.order - b.order)
}

export function useTopAffiches() {
  const loading = ref(false)
  const affiches = ref<TopAfficheListItem[]>([])

  async function fetchAffiches() {
    loading.value = true
    try {
      const res = await uiConfigApi.getTopAffiches()
      const data = res?.top_affiche || []
      affiches.value = transformAffiches(data)
    }
    catch (error: any) {
      Message.error(error.message || '获取公告失败')
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 打开公告链接
   */
  function openAfficheLink(link: string | null) {
    if (link)
      window.open(link, '_blank')
  }

  // 初始化时获取数据
  fetchAffiches()

  return {
    loading,
    affiches,
    fetchAffiches,
    openAfficheLink,
  }
}
