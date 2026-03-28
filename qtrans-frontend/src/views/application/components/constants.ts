/**
 * 申请单相关常量
 * 
 * 注意：区域相关常量已统一迁移到 @/constants/region.ts
 * 此处仅保留申请单特有的常量
 */

// 从统一常量文件重新导出，保持向后兼容
export {
  AREA_ID_MAP,
  AREA_LABEL_MAP,
  AREA_OPTIONS,
  ID_TO_AREA,
  LABEL_TO_AREA,
  areaIdToLabel,
  areaToId,
  idToArea,
  parseAreaFromAttr,
  parseAreaIdFromAttr,
  transWayToTransferType,
} from '@/constants'
export type { SecurityArea } from '@/constants'

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
