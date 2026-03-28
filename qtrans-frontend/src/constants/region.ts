/**
 * 区域相关常量 - 统一维护
 * 
 * 所有区域 ID、名称、标签的映射关系都在此文件维护
 * 避免散落在各处的霰弹式定义
 */

// ===== 类型定义 =====
export type SecurityArea = 'green' | 'yellow' | 'red' | 'external'

// ===== ID 映射（双向）=====
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
/** 区域下拉选项（用于 a-select 等组件）*/
export const AREA_OPTIONS: Array<{ label: string, value: SecurityArea }> = [
  { label: '绿区', value: 'green' },
  { label: '黄区', value: 'yellow' },
  { label: '红区', value: 'red' },
  { label: '外网', value: 'external' },
]

// ===== 工具函数 =====

/**
 * 根据区域ID获取中文标签
 * @param id 后端区域ID
 * @returns 中文标签，如 "绿区"
 */
export function areaIdToLabel(id: number): string {
  const area = ID_TO_AREA[id]
  return area ? AREA_LABEL_MAP[area] : '未知区域'
}

/**
 * 根据区域英文名获取区域ID
 * @param area 区域英文名
 * @returns 后端区域ID，默认 1（绿区）
 */
export function areaToId(area: SecurityArea): number {
  return AREA_ID_MAP[area] ?? 1
}

/**
 * 根据区域ID获取英文名
 * @param id 后端区域ID
 * @returns 区域英文名，默认 'green'
 */
export function idToArea(id: number): SecurityArea {
  return ID_TO_AREA[id] ?? 'green'
}

/**
 * 从 itemAttr1 字符串中解析区域ID
 * 格式: "Create.aspx?action=create&hm=2&wfid=43&transType=0&fromAreaID=0&ToAreaID=15"
 * @param attr itemAttr1 字符串
 * @param key 'from' 或 'to'
 * @returns 区域ID 数字，解析失败返回 null
 */
export function parseAreaIdFromAttr(attr: string | null, key: 'from' | 'to'): number | null {
  if (!attr)
    return null
  // 匹配 fromAreaID 或 ToAreaID（注意大小写）
  const pattern = key === 'from' ? /fromAreaID=(\d+)/i : /ToAreaID=(\d+)/i
  const match = attr.match(pattern)
  return match ? Number(match[1]) : null
}

/**
 * 从 itemAttr1 字符串中解析区域英文名
 * @param attr itemAttr1 字符串
 * @param key 'from' 或 'to'
 * @returns 区域英文名，默认 'green'
 */
export function parseAreaFromAttr(attr: string | null, key: 'from' | 'to'): SecurityArea {
  const id = parseAreaIdFromAttr(attr, key)
  return id !== null ? ID_TO_AREA[id] ?? 'green' : 'green'
}

/**
 * 从中文区域名组合推断传输类型
 * @param transWay 格式如 "绿区,绿区" 或 "外网,绿区"
 * @returns 传输类型字符串
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
