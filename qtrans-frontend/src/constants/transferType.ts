/**
 * 传输类型相关常量
 *
 * ⚠️ 传输类型标签已由 regionConfigStore.formatTransferTypeLabel() 动态生成
 * ⚠️ 下拉选项已由 regionConfigStore.areaOptions 动态生成
 *
 * 保留的常量仅作为静态 fallback 或默认值使用
 */

import type { SecurityArea } from './region'

// ===== 类型定义 =====
/** 传输类型（放宽为 string，避免新增区域类型时需改前端） */
export type TransferType = string

// ===== 默认传输类型 =====
/** 默认传输类型 */
export const DEFAULT_TRANSFER_TYPE = 'green-to-green'

// ===== 向后兼容的静态选项（推荐使用 regionConfigStore 动态生成） =====

/**
 * 区域筛选列表（静态 fallback，不含 external）
 * external 在传输类型中按独立选项处理
 * @deprecated 请使用 regionConfigStore.areaOptions 动态生成
 */
const _FALLBACK_FILTER_AREAS: SecurityArea[] = ['green', 'yellow', 'external']

/**
 * 静态传输类型下拉选项（fallback）
 * @deprecated 请从 regionConfigStore 动态交叉生成
 */
export const TRANSFER_TYPE_OPTIONS: Array<{ label: string, value: TransferType }> = [
  ..._FALLBACK_FILTER_AREAS.flatMap((fromArea) =>
    _FALLBACK_FILTER_AREAS.map((toArea) => {
      const labelMap: Record<SecurityArea, string> = {
        green: '绿区',
        yellow: '黄区',
        external: '外网',
      }
      return {
        label: `${labelMap[fromArea]}传到${labelMap[toArea]}`,
        value: `${fromArea}-to-${toArea}`,
      }
    }),
  ),
  { label: '跨国传输', value: 'cross-country' },
]

/** 传输类型下拉选项（包含"全部"选项）*/
export const TRANSFER_TYPE_OPTIONS_WITH_ALL: Array<{ label: string, value: TransferType | 'all' }> = [
  { label: '全部类型', value: 'all' },
  ...TRANSFER_TYPE_OPTIONS,
]
