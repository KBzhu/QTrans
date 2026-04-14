/**
 * 申请单相关常量
 *
 * 注意：区域 ID 映射已迁移到 regionMetadataStore
 * AREA_OPTIONS 暂时保留（用于区域下拉框选项），待后端提供区域选项接口后移除
 */

// 重新导出 SecurityArea 供其他模块使用
export type { SecurityArea } from '@/composables/useApplicationForm'

// 区域下拉选项（暂时保留，待后端提供动态接口后移除）
export { AREA_OPTIONS } from '@/constants/region'
