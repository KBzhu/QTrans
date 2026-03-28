/**
 * 传输类型相关常量 - 统一维护
 */

// ===== 类型定义 =====
/** 传输类型 - 单一来源定义 */
export type TransferType =
  | 'green-to-green'
  | 'green-to-yellow'
  | 'green-to-red'
  | 'yellow-to-yellow'
  | 'yellow-to-red'
  | 'red-to-red'
  | 'cross-country'

// ===== 传输类型标签映射 =====
/** 传输类型 → 中文标签 */
export const TRANSFER_TYPE_LABEL_MAP: Record<TransferType, string> = {
  'green-to-green': '绿区传到绿区',
  'green-to-yellow': '绿区传到黄区',
  'green-to-red': '绿区传到红区',
  'yellow-to-yellow': '黄区传到黄区',
  'yellow-to-red': '黄区传到红区',
  'red-to-red': '红区传到红区',
  'cross-country': '跨国传输',
}

// ===== 传输类型下拉选项 =====
/** 传输类型下拉选项（用于 a-select 等组件）*/
export const TRANSFER_TYPE_OPTIONS: Array<{ label: string, value: TransferType }> = [
  { label: '绿区传到绿区', value: 'green-to-green' },
  { label: '绿区传到黄区', value: 'green-to-yellow' },
  { label: '绿区传到红区', value: 'green-to-red' },
  { label: '黄区传到黄区', value: 'yellow-to-yellow' },
  { label: '黄区传到红区', value: 'yellow-to-red' },
  { label: '红区传到红区', value: 'red-to-red' },
  { label: '跨国传输', value: 'cross-country' },
]

/** 传输类型下拉选项（包含"全部"选项）*/
export const TRANSFER_TYPE_OPTIONS_WITH_ALL: Array<{ label: string, value: TransferType | 'all' }> = [
  { label: '全部类型', value: 'all' },
  ...TRANSFER_TYPE_OPTIONS,
]

// ===== 工具函数 =====

/**
 * 获取传输类型的中文标签
 * @param type 传输类型
 * @returns 中文标签
 */
export function getTransferTypeLabel(type: TransferType | undefined | null): string {
  if (!type)
    return '-'
  return TRANSFER_TYPE_LABEL_MAP[type] ?? type
}

/**
 * 验证传输类型是否有效
 * @param type 传输类型字符串
 * @returns 是否为有效的传输类型
 */
export function isValidTransferType(type: string): type is TransferType {
  return type in TRANSFER_TYPE_LABEL_MAP
}
