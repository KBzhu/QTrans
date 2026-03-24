/**
 * 区域类型映射：区域名称 -> regionTypeId
 */
export const REGION_TYPE_MAP: Record<string, number> = {
  green: 1,
  yellow: 0,
  red: 4,
  external: 2,
}

/**
 * 高密传低密触发组合
 */
export const HIGH_TO_LOW_PAIRS = new Set([
  'yellow->green',
  'green->external',
  'yellow->external',
  'red->yellow',
  'red->green',
])

/**
 * 区域选项
 */
export const AREA_OPTIONS = [
  { label: '绿区', value: 'green' },
  { label: '黄区', value: 'yellow' },
  { label: '红区', value: 'red' },
  { label: '外网', value: 'external' },
]
