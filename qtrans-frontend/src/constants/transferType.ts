/**
 * 传输类型相关常量
 *
 * 注意：
 * - 传输类型标签已由 formatTransferTypeKeyLabel() 动态生成（基于 AREA_LABEL_MAP）
 * - 传输类型标签在申请单流程中由 regionMetadataStore.getTransferTypeLabel() 动态生成
 * - 审批级别已由后端接口动态配置
 * - 下拉选项 TRANSFER_TYPE_OPTIONS 暂时保留，待后端提供动态接口后移除
 */

// ===== 类型定义 =====
/** 传输类型（放宽为 string，避免新增区域类型时需改前端） */
export type TransferType = string

// ===== 传输类型下拉选项 =====
// TODO: 待后端提供传输类型选项接口后，改为动态获取
/** 传输类型下拉选项 */
export const TRANSFER_TYPE_OPTIONS: Array<{ label: string, value: TransferType }> = [
  { label: '绿区传到绿区', value: 'green-to-green' },
  { label: '绿区传到黄区', value: 'green-to-yellow' },
  { label: '绿区传到红区', value: 'green-to-red' },
  { label: '黄区传到绿区', value: 'yellow-to-green' },
  { label: '黄区传到黄区', value: 'yellow-to-yellow' },
  { label: '黄区传到红区', value: 'yellow-to-red' },
  { label: '红区传到绿区', value: 'red-to-green' },
  { label: '红区传到黄区', value: 'red-to-yellow' },
  { label: '红区传到红区', value: 'red-to-red' },
  { label: '跨国传输', value: 'cross-country' },
]

/** 传输类型下拉选项（包含"全部"选项）*/
export const TRANSFER_TYPE_OPTIONS_WITH_ALL: Array<{ label: string, value: TransferType | 'all' }> = [
  { label: '全部类型', value: 'all' },
  ...TRANSFER_TYPE_OPTIONS,
]
