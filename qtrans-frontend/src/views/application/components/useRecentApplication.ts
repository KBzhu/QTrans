import type { RecentApplicationItem } from '@/api/application'
import { applicationApi } from '@/api/application'
import { ref, watch } from 'vue'

/**
 * 最近传输选择 composable
 * 根据当前表单的源/目标区域 ID 请求最近申请列表
 */
export function useRecentApplication(
  getFromAreaId: () => number | null,
  getToAreaId: () => number | null,
) {
  const loading = ref(false)
  const recentList = ref<RecentApplicationItem[]>([])

  async function fetchRecent() {
    const fromId = getFromAreaId()
    const toId = getToAreaId()
    if (!fromId || !toId) {
      recentList.value = []
      return
    }

    loading.value = true
    try {
      recentList.value = await applicationApi.getMyRecentApplication({
        abc: false,
        formAreaId: String(fromId),
        toAreaId: String(toId),
        procTypes: ['0'],
      })
    }
    catch (error) {
      console.error('获取最近传输选择失败:', error)
      recentList.value = []
    }
    finally {
      loading.value = false
    }
  }

  // 当区域 ID 变化时自动重新请求
  watch(
    [getFromAreaId, getToAreaId],
    () => { fetchRecent() },
    { immediate: true },
  )

  return {
    loading,
    recentList,
    fetchRecent,
  }
}
