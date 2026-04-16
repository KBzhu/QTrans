/**
 * 区域配置全局 Store
 *
 * 从后端 region_type 接口动态获取区域元数据，
 * 构建全局映射（id ↔ code ↔ name），替代前端硬编码常量。
 *
 * 初始化：在 App.vue 中调用 fetchRegionConfig() 确保全局可用
 * 降级：接口失败时使用 FALLBACK_REGIONS 兜底
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { request } from '@/utils'

// ===== 类型定义 =====

/** 区域 code 类型（不再包含 red） */
export type SecurityArea = 'green' | 'yellow' | 'external'

/** 后端返回的区域原始数据项 */
interface RegionTypeRawItem {
  itemId: number
  itemCode: string
  itemName: string
  itemAttr1: string // 区域 ID（字符串数字，如 "1"）
  itemAttr2: string // 区域 code（如 "Green", "Yellow", "Internet"）
  status: number
  [key: string]: unknown
}

/** 标准化后的区域配置项 */
export interface RegionItem {
  id: number         // 后端区域 ID（itemAttr1）
  code: SecurityArea // 归一化 code（Green→green, Internet→external）
  name: string       // 中文名（itemName，如 "绿区"）
  rawCode: string    // 后端原始 code（itemAttr2，如 "Green"）
  rawItemCode: string // 后端 itemCode（如 "Green Zone"）
}

// ===== 后端 itemAttr2 → 前端 code 归一化 =====
const RAW_CODE_TO_NORMALIZED: Record<string, SecurityArea> = {
  Green: 'green',
  Yellow: 'yellow',
  Internet: 'external',
}

// ===== 降级兜底数据 =====
const FALLBACK_REGIONS: RegionItem[] = [
  { id: 1, code: 'green', name: '绿区', rawCode: 'Green', rawItemCode: 'Green Zone' },
  { id: 0, code: 'yellow', name: '黄区', rawCode: 'Yellow', rawItemCode: 'Yellow Zone' },
  { id: 2, code: 'external', name: '外网', rawCode: 'Internet', rawItemCode: 'Internet' },
]

export const useRegionConfigStore = defineStore('regionConfig', () => {
  // ===== 状态 =====
  const regions = ref<RegionItem[]>([])
  const loaded = ref(false)
  const loading = ref(false)

  // ===== 派生映射（computed，响应式） =====

  /** 区域 ID → code */
  const idToCode = computed(() => {
    const map: Record<number, SecurityArea> = {}
    for (const r of regions.value)
      map[r.id] = r.code
    return map
  })

  /** 区域 code → ID */
  const codeToId = computed(() => {
    const map: Record<SecurityArea, number> = {} as any
    for (const r of regions.value)
      map[r.code] = r.id
    return map
  })

  /** 区域 code → 中文名 */
  const codeToName = computed(() => {
    const map: Record<SecurityArea, string> = {} as any
    for (const r of regions.value)
      map[r.code] = r.name
    return map
  })

  /** 中文名 → code */
  const nameToCode = computed(() => {
    const map: Record<string, SecurityArea> = {}
    for (const r of regions.value)
      map[r.name] = r.code
    return map
  })

  /** 后端原始 code → 前端 code（如 "Green" → "green"） */
  const rawCodeToCode = computed(() => {
    const map: Record<string, SecurityArea> = {}
    for (const r of regions.value)
      map[r.rawCode] = r.code
    return map
  })

  /** 后端 itemCode → 前端 code（如 "Green Zone" → "green"） */
  const rawItemCodeToCode = computed(() => {
    const map: Record<string, SecurityArea> = {}
    for (const r of regions.value)
      map[r.rawItemCode] = r.code
    return map
  })

  /** 区域下拉选项（用于 a-select 等） */
  const areaOptions = computed(() =>
    regions.value.map(r => ({ label: r.name, value: r.code })),
  )

  // ===== 请求方法 =====

  /**
   * 从后端获取区域配置并构建映射
   * 失败时使用 FALLBACK_REGIONS 兜底
   */
  async function fetchRegionConfig(): Promise<void> {
    if (loaded.value || loading.value)
      return

    loading.value = true
    try {
      const res = await request.rawGet<Record<string, RegionTypeRawItem[]>>(
        '/commonService/services/jalor/lookup/itemquery/listbycodes/region_type/zh_CN',
      )

      const rawItems = res?.region_type || []
      const normalized: RegionItem[] = []

      for (const item of rawItems) {
        // 只处理 status=1 的有效项
        if (item.status !== 1)
          continue

        const normalizedCode = RAW_CODE_TO_NORMALIZED[item.itemAttr2]
        if (!normalizedCode) {
          console.warn(`[regionConfig] 未知区域 code: ${item.itemAttr2}，跳过`)
          continue
        }

        normalized.push({
          id: Number(item.itemAttr1),
          code: normalizedCode,
          name: item.itemName,
          rawCode: item.itemAttr2,
          rawItemCode: item.itemCode,
        })
      }

      regions.value = normalized.length > 0 ? normalized : [...FALLBACK_REGIONS]
      loaded.value = true
    }
    catch (error) {
      console.error('[regionConfig] 获取区域配置失败，使用兜底数据:', error)
      regions.value = [...FALLBACK_REGIONS]
      loaded.value = true // 标记已加载，避免重复请求
    }
    finally {
      loading.value = false
    }
  }

  // ===== 工具方法 =====

  /** 根据 code 获取区域 ID */
  function getIdByCode(code: string): number | undefined {
    return codeToId.value[code as SecurityArea]
  }

  /** 根据 ID 获取区域 code */
  function getCodeById(id: number): SecurityArea | undefined {
    return idToCode.value[id]
  }

  /** 根据 code 获取中文名 */
  function getNameByCode(code: string): string | undefined {
    return codeToName.value[code as SecurityArea]
  }

  /** 根据 ID 获取中文名 */
  function getNameById(id: number): string | undefined {
    const code = idToCode.value[id]
    return code ? codeToName.value[code] : undefined
  }

  /**
   * 从传输类型 key 生成中文标签
   * 如 "green-to-yellow" → "绿区传到黄区"，"cross-country" → "跨国传输"
   */
  function formatTransferTypeLabel(typeKey: string): string {
    if (!typeKey)
      return '-'
    if (typeKey === 'cross-country')
      return '跨国传输'
    if (typeKey.includes('-to-')) {
      const parts = typeKey.split('-to-')
      const fromLabel = codeToName.value[parts[0] as SecurityArea] || parts[0]
      const toLabel = codeToName.value[parts[1] as SecurityArea] || parts[1]
      return `${fromLabel}传到${toLabel}`
    }
    return typeKey
  }

  /**
   * 将后端 transWay 字符串格式化为中文显示标签
   * 如 "Green Zone,Yellow Zone" → "绿区 → 黄区"
   * 如 "绿区,外网" → "绿区 → 外网"
   */
  function formatTransWayLabel(transWay: string): string {
    if (!transWay)
      return '-'
    return transWay
      .split(',')
      .map((s) => {
        const trimmed = s.trim()
        // 先尝试通过 itemCode 映射（如 "Green Zone"）
        const byItemCode = rawItemCodeToCode.value[trimmed]
        if (byItemCode)
          return codeToName.value[byItemCode] || trimmed
        // 再尝试通过中文名直接匹配
        const byName = nameToCode.value[trimmed]
        if (byName)
          return trimmed
        // 兜底：尝试通过 rawCode 映射（如 "Green"）
        const byRawCode = rawCodeToCode.value[trimmed]
        if (byRawCode)
          return codeToName.value[byRawCode] || trimmed
        return trimmed
      })
      .join(' → ')
  }

  /**
   * 重新加载区域配置（用于强制刷新）
   */
  function reloadConfig(): Promise<void> {
    loaded.value = false
    return fetchRegionConfig()
  }

  return {
    // 状态
    regions,
    loaded,
    loading,
    // 派生映射
    idToCode,
    codeToId,
    codeToName,
    nameToCode,
    rawCodeToCode,
    rawItemCodeToCode,
    areaOptions,
    // 请求
    fetchRegionConfig,
    reloadConfig,
    // 工具方法
    getIdByCode,
    getCodeById,
    getNameByCode,
    getNameById,
    formatTransferTypeLabel,
    formatTransWayLabel,
  }
})
