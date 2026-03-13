import type { UIApplicationConfigItem, UIApplicationConfigType } from '@/types'
import { ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { uiConfigApi } from '@/api/uiConfig'

export interface NotifyOption {
  label: string
  value: string
}

export function useApplicationConfig() {
  const loading = ref(false)
  const configData = ref<UIApplicationConfigItem[]>([])

  async function fetchConfig() {
    loading.value = true
    try {
      configData.value = await uiConfigApi.getApplicationConfig()
    }
    catch (error: any) {
      Message.error(error.message || '获取申请单配置失败')
    }
    finally {
      loading.value = false
    }
  }

  function getOptionsByType(type: UIApplicationConfigType): NotifyOption[] {
    return configData.value
      .filter(item => item.type === type && item.status === 'enabled')
      .sort((a, b) => a.order - b.order)
      .map(item => ({ label: item.label, value: item.value }))
  }

  function getItemsByType(type: UIApplicationConfigType): string[] {
    return configData.value
      .filter(item => item.type === type && item.status === 'enabled')
      .sort((a, b) => a.order - b.order)
      .map(item => item.value)
  }

  // 预加载配置
  fetchConfig()

  return {
    loading,
    configData,
    fetchConfig,
    getOptionsByType,
    getItemsByType,
  }
}
