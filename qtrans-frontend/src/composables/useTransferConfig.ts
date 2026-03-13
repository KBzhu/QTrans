import type { UITransferTabConfigItem, UITransferTypeConfigItem } from '@/types'
import { ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { uiConfigApi } from '@/api/uiConfig'

export function useTransferConfig() {
  const loading = ref(false)
  const tabs = ref<UITransferTabConfigItem[]>([])
  const transferTypes = ref<UITransferTypeConfigItem[]>([])

  async function fetchConfig() {
    loading.value = true
    try {
      const [tabData, typeData] = await Promise.all([
        uiConfigApi.getTransferTabs(),
        uiConfigApi.getTransferTypes(),
      ])
      tabs.value = tabData.filter(t => t.status === 'enabled').sort((a, b) => a.order - b.order)
      transferTypes.value = typeData.filter(t => t.status === 'enabled').sort((a, b) => a.order - b.order)
    }
    catch (error: any) {
      Message.error(error.message || '获取传输配置失败')
    }
    finally {
      loading.value = false
    }
  }

  // 初始化时获取配置
  fetchConfig()

  return {
    loading,
    tabs,
    transferTypes,
    fetchConfig,
  }
}
