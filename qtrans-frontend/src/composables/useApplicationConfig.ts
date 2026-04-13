import type { UIApplicationConfigItem, UIApplicationConfigType } from '@/types'
import { ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { uiConfigApi } from '@/api/uiConfig'

export interface NotifyOption {
  label: string
  value: string
}

/**
 * 申请单配置接口是否启用
 * TODO: 后端接口 /ui-config/application 开发完成后，将 .env 中 VITE_ENABLE_APPLICATION_CONFIG 改为 true
 * @see api/uiConfig.ts - getApplicationConfig
 */
const ENABLE_APPLICATION_CONFIG = import.meta.env.VITE_ENABLE_APPLICATION_CONFIG === 'true'

/** 后端接口未就绪时的兜底空数据，保证调用方不报错 */
const FALLBACK_CONFIG: UIApplicationConfigItem[] = []

export function useApplicationConfig() {
  const loading = ref(false)
  const configData = ref<UIApplicationConfigItem[]>([])

  async function fetchConfig() {
    // --- feature flag: 后端未完成，暂时跳过接口调用 ---
    if (!ENABLE_APPLICATION_CONFIG) {
      configData.value = FALLBACK_CONFIG
      return
    }
    // --- 以下为真实联调代码，后端就绪后自动生效 ---
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
