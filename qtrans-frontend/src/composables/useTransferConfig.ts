import type { UITransferTabConfigItem, UITransferTypeConfigItem } from '@/types'
import type { TransmissionScenarioChildItem, TransmissionScenarioItem } from '@/api/uiConfig'
import { ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { parseAreaFromAttr } from '@/constants'
import { uiConfigApi } from '@/api/uiConfig'

// 图标映射：根据 fromZone + toZone 组合确定图标
const ICON_MAP: Record<string, { fromIcon: string, toIcon: string, arrowIcon: string }> = {
  'green-green': {
    fromIcon: '/figma/3971_812/7.svg',
    toIcon: '/figma/3971_812/9.svg',
    arrowIcon: '/figma/3971_812/8.svg',
  },
  'green-yellow': {
    fromIcon: '/figma/3971_812/7.svg',
    toIcon: '/figma/3971_812/10.svg',
    arrowIcon: '/figma/3971_812/8.svg',
  },
  'green-red': {
    fromIcon: '/figma/3971_812/7.svg',
    toIcon: '/figma/3971_812/12.svg',
    arrowIcon: '/figma/3971_812/8.svg',
  },
  'green-external': {
    fromIcon: '/figma/3971_812/7.svg',
    toIcon: '/figma/3971_812/14.svg',
    arrowIcon: '/figma/3971_812/8.svg',
  },
  'yellow-green': {
    fromIcon: '/figma/3971_812/10.svg',
    toIcon: '/figma/3971_812/9.svg',
    arrowIcon: '/figma/3971_812/11.svg',
  },
  'yellow-yellow': {
    fromIcon: '/figma/3971_812/10.svg',
    toIcon: '/figma/3971_812/10.svg',
    arrowIcon: '/figma/3971_812/11.svg',
  },
  'yellow-red': {
    fromIcon: '/figma/3971_812/10.svg',
    toIcon: '/figma/3971_812/12.svg',
    arrowIcon: '/figma/3971_812/11.svg',
  },
  'yellow-external': {
    fromIcon: '/figma/3971_812/10.svg',
    toIcon: '/figma/3971_812/14.svg',
    arrowIcon: '/figma/3971_812/11.svg',
  },
  'red-green': {
    fromIcon: '/figma/3971_812/12.svg',
    toIcon: '/figma/3971_812/9.svg',
    arrowIcon: '/figma/3971_812/13.svg',
  },
  'red-yellow': {
    fromIcon: '/figma/3971_812/12.svg',
    toIcon: '/figma/3971_812/10.svg',
    arrowIcon: '/figma/3971_812/13.svg',
  },
  'red-red': {
    fromIcon: '/figma/3971_812/12.svg',
    toIcon: '/figma/3971_812/12.svg',
    arrowIcon: '/figma/3971_812/13.svg',
  },
}

// 默认图标
const DEFAULT_ICONS = {
  fromIcon: '/figma/3971_812/7.svg',
  toIcon: '/figma/3971_812/9.svg',
  arrowIcon: '/figma/3971_812/8.svg',
}

/**
 * 获取图标配置
 */
function getIcons(fromZone: string, toZone: string) {
  const key = `${fromZone}-${toZone}`
  return ICON_MAP[key] || DEFAULT_ICONS
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
      // 使用统一常量解析区域
      const fromZone = parseAreaFromAttr(item.itemAttr1, 'from')
      const toZone = parseAreaFromAttr(item.itemAttr1, 'to')
      const icons = getIcons(fromZone, toZone)

      return {
        id: String(item.itemId),
        key: item.itemCode,
        title: item.itemName,
        desc: item.itemDesc || '',
        fromZone: fromZone as UITransferTypeConfigItem['fromZone'],
        toZone: toZone as UITransferTypeConfigItem['toZone'],
        fromIcon: icons.fromIcon,
        toIcon: icons.toIcon,
        arrowIcon: icons.arrowIcon,
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
