import type { UITransferTabConfigItem, UITransferTypeConfigItem } from '@/types'
import type { TransmissionScenarioChildItem, TransmissionScenarioItem } from '@/api/uiConfig'
import { ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { uiConfigApi } from '@/api/uiConfig'
import { useRegionMetadataStore } from '@/stores'

/**
 * 解析 itemAttr5 获取区域元数据
 * 格式: "fromCode:green,fromName:绿区,fromId:1,toCode:yellow,toName:黄区,toId:0"
 */
function parseItemAttr5(attr5: string | null): { fromCode: string, fromName: string, fromId: number, toCode: string, toName: string, toId: number } | null {
  if (!attr5)
    return null

  const result: Record<string, string> = {}
  const pairs = attr5.split(',')

  for (const pair of pairs) {
    const [key, value] = pair.split(':')
    if (key && value)
      result[key.trim()] = value.trim()
  }

  if (!result.fromCode || !result.fromName || !result.fromId || !result.toCode || !result.toName || !result.toId)
    return null

  return {
    fromCode: result.fromCode,
    fromName: result.fromName,
    fromId: parseInt(result.fromId, 10),
    toCode: result.toCode,
    toName: result.toName,
    toId: parseInt(result.toId, 10),
  }
}

/**
 * 转换 TAB 数据
 */
function transformTabs(data: TransmissionScenarioItem[]): UITransferTabConfigItem[] {
  return data
    .filter(item => item.status === 1)
    .map(item => ({
      id: String(item.itemId),
      key: item.itemCode,
      label: item.itemName,
      order: item.itemIndex,
      status: 'enabled' as const,
    }))
    .sort((a, b) => a.order - b.order)
}

/**
 * 转换卡片数据
 */
function transformTypes(data: TransmissionScenarioChildItem[]): UITransferTypeConfigItem[] {
  return data
    .filter(item => item.status === 1)
    .map((item) => {
      // 解析 itemAttr5 获取区域元数据
      const attr5Data = parseItemAttr5(item.itemAttr5)

      // 默认值（兼容旧数据）
      const fromCode = attr5Data?.fromCode || 'green'
      const toCode = attr5Data?.toCode || 'green'

      // 图标路径直接从后端获取（itemAttr2 = from 图标，itemAttr3 = to 图标）
      // 需要拼接成完整路径
      const fromIcon = item.itemAttr2 ? `/icons/${item.itemAttr2}` : '/icons/green.svg'
      const toIcon = item.itemAttr3 ? `/icons/${item.itemAttr3}` : '/icons/green.svg'

      // 解析 itemAttr4 获取 from/to 各自的样式（用 | 分隔）
      // 格式: "from样式CSS;|to样式CSS;"
      const attr4Parts = (item.itemAttr4 || '').split('|')
      const fromStyle = attr4Parts[0] || ''
      const toStyle = attr4Parts[1] || ''

      return {
        id: String(item.itemId),
        key: item.itemCode,
        title: item.itemName,
        desc: item.itemDesc || '',
        fromZone: fromCode as UITransferTypeConfigItem['fromZone'],
        toZone: toCode as UITransferTypeConfigItem['toZone'],
        fromIcon,
        toIcon,
        arrowIcon: '/icons/arrow.svg', // 统一箭头
        fromStyle,
        toStyle,
        tabGroup: item.parentItem?.itemCode || '',
        order: item.itemIndex,
        status: 'enabled' as const,
      }
    })
    .sort((a, b) => a.order - b.order)
}

export function useTransferConfig() {
  const loading = ref(false)
  const tabs = ref<UITransferTabConfigItem[]>([])
  const transferTypes = ref<UITransferTypeConfigItem[]>([])

  async function fetchConfig() {
    loading.value = true
    try {
      const [scenarioRes, childItemsRes] = await Promise.all([
        uiConfigApi.getTransmissionScenario(),
        uiConfigApi.getTransmissionScenarioChildItems(),
      ])

      // 从响应对象中提取数组
      const scenarioData = scenarioRes?.transmission_scenario || []
      const childItemsData = childItemsRes?.transmission_scenario_child_item || []

      tabs.value = transformTabs(scenarioData)
      transferTypes.value = transformTypes(childItemsData)
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

/**
 * 点击卡片时保存区域元数据到 Store
 */
export function saveRegionMetadataToStore(item: UITransferTypeConfigItem) {
  const regionMetadataStore = useRegionMetadataStore()
  const attr5Data = parseItemAttr5(item.itemAttr5 || null)

  if (attr5Data) {
    regionMetadataStore.setMetadata({
      fromRegion: {
        code: attr5Data.fromCode,
        name: attr5Data.fromName,
        id: attr5Data.fromId,
      },
      toRegion: {
        code: attr5Data.toCode,
        name: attr5Data.toName,
        id: attr5Data.toId,
      },
    })
  }
  else {
    // 降级处理：使用卡片数据中的 fromZone/toZone
    regionMetadataStore.setMetadata({
      fromRegion: {
        code: item.fromZone,
        name: item.fromZone, // 暂时用 code 作为 name
        id: 1, // 默认值
      },
      toRegion: {
        code: item.toZone,
        name: item.toZone,
        id: 1,
      },
    })
  }
}
