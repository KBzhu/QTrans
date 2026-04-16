/**
 * 传输类型相关常量
 *
 * 注意：
 * - 传输类型标签已由 formatTransferTypeKeyLabel() 动态生成（基于 AREA_LABEL_MAP）
 * - 传输类型标签在申请单流程中由 regionMetadataStore.getTransferTypeLabel() 动态生成
 * - 审批级别已由后端接口动态配置
 * - 下拉选项 TRANSFER_TYPE_OPTIONS 由 AREA_OPTIONS 动态交叉生成
 */

import type { SecurityArea } from './region'
import { AREA_LABEL_MAP, AREA_OPTIONS } from './region'

// ===== 类型定义 =====
/** 传输类型（放宽为 string，避免新增区域类型时需改前端） */
export type TransferType = string

// ===== 默认传输类型 =====
/** 默认传输类型 */
export const DEFAULT_TRANSFER_TYPE = 'green-to-green'

// ===== 传输类型下拉选项（动态生成） =====

/**
 * 传输类型筛选区域：用于下拉选项的区域列表
 * 排除 external（外网在传输类型中映射为 red）
 */
const FILTER_AREAS: SecurityArea[] = AREA_OPTIONS
  .filter(a => a.value !== 'external')
  .map(a => a.value)

/**
 * 动态生成传输类型下拉选项
 * 基于区域列表交叉组合（排除 external，生成如 green-to-green, green-to-yellow 等）
 * 附加 "跨国传输" 特殊选项
 */
export const TRANSFER_TYPE_OPTIONS: Array<{ label: string, value: TransferType }> = [
  ...FILTER_AREAS.flatMap((fromArea) =>
    FILTER_AREAS.map((toArea) => {
      const key = `${fromArea}-to-${toArea}`
      return {
        label: `${AREA_LABEL_MAP[fromArea]}传到${AREA_LABEL_MAP[toArea]}`,
        value: key,
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
