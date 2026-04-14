/**
 * 区域相关常量
 *
 * 注意：申请单流程中的区域元数据已迁移到 regionMetadataStore
 * 此文件保留用于其他场景（申请单列表、审批列表等）的类型定义和兼容
 */

// ===== 类型定义 =====
export type SecurityArea = 'green' | 'yellow' | 'red' | 'external'

// ===== ID 映射 =====
/** 区域英文名 → 后端区域ID */
export const AREA_ID_MAP: Record<SecurityArea, number> = {
  green: 1,
  yellow: 0,
  red: 4,
  external: 2,
}

/** 后端区域ID → 区域英文名 */
export const ID_TO_AREA: Record<number, SecurityArea> = {
  1: 'green',
  0: 'yellow',
  4: 'red',
  2: 'external',
}

// ===== 中文标签 =====
/** 区域英文名 → 中文标签 */
export const AREA_LABEL_MAP: Record<SecurityArea, string> = {
  green: '绿区',
  yellow: '黄区',
  red: '红区',
  external: '外网',
}

/** 中文标签 → 区域英文名 */
export const LABEL_TO_AREA: Record<string, SecurityArea> = {
  '绿区': 'green',
  '黄区': 'yellow',
  '红区': 'red',
  '外网': 'external',
}

// ===== 下拉选项 =====
/** 区域下拉选项 */
export const AREA_OPTIONS: Array<{ label: string, value: SecurityArea }> = [
  { label: '绿区', value: 'green' },
  { label: '黄区', value: 'yellow' },
  { label: '红区', value: 'red' },
  { label: '外网', value: 'external' },
]

// ===== 工具函数 =====

/**
 * 根据区域ID获取中文标签
 */
export function areaIdToLabel(id: number): string {
  const area = ID_TO_AREA[id]
  return area ? AREA_LABEL_MAP[area] : '未知区域'
}

/**
 * 根据区域英文名获取区域ID
 */
export function areaToId(area: SecurityArea): number {
  return AREA_ID_MAP[area] ?? 1
}

/**
 * 根据区域ID获取英文名
 */
export function idToArea(id: number): SecurityArea {
  return ID_TO_AREA[id] ?? 'green'
}

/**
 * 从中文区域名组合推断传输类型
 * @deprecated 请使用后端接口返回的传输类型
 */
export function transWayToTransferType(transWay: string): string {
  const parts = transWay.split(',').map(s => s.trim())
  if (parts.length !== 2)
    return 'green-to-green'

  const sourceArea = LABEL_TO_AREA[parts[0] || ''] || 'green'
  const targetArea = LABEL_TO_AREA[parts[1] || ''] || 'green'

  // external 映射为 red（外网按红区处理）
  const normalizedSource = sourceArea === 'external' ? 'red' : sourceArea
  const normalizedTarget = targetArea === 'external' ? 'red' : targetArea

  return `${normalizedSource}-to-${normalizedTarget}`
}

/**
 * 将后端 transWay 字符串格式化为中文显示标签
 * 如 "Green Zone,Red Zone" → "绿区 → 红区"
 * 如 "外网,绿区" → "外网 → 绿区"
 * 用于列表页等无 store 上下文的场景
 */
export function formatTransWayLabel(transWay: string): string {
  if (!transWay) return '-'
  // 英文区域名映射
  const enMap: Record<string, string> = {
    'Green Zone': '绿区',
    'Yellow Zone': '黄区',
    'Red Zone': '红区',
    'External': '外网',
  }
  // 中文区域名保持不变
  const zhSet = new Set(['绿区', '黄区', '红区', '外网'])

  return transWay
    .split(',')
    .map((s) => {
      const trimmed = s.trim()
      if (zhSet.has(trimmed)) return trimmed
      return enMap[trimmed] || trimmed
    })
    .join(' → ')
}

/**
 * 从传输类型 key（如 "green-to-red"）动态生成中文标签
 * 替代硬编码的 TRANSFER_TYPE_LABEL_MAP
 * 如 "green-to-red" → "绿区传到红区"，"cross-country" → "跨国传输"
 */
export function formatTransferTypeKeyLabel(typeKey: string): string {
  if (!typeKey) return '-'
  // 特殊类型
  if (typeKey === 'cross-country') return '跨国传输'
  // 标准格式 "xxx-to-yyy"
  if (typeKey.includes('-to-')) {
    const parts = typeKey.split('-to-')
    const fromLabel = AREA_LABEL_MAP[parts[0] as SecurityArea] || parts[0]
    const toLabel = AREA_LABEL_MAP[parts[1] as SecurityArea] || parts[1]
    return `${fromLabel}传到${toLabel}`
  }
  // 兜底
  return typeKey
}
