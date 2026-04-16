/**
 * 区域元数据 Store
 *
 * 从首页卡片配置（itemAttr5）解析并存储区域元数据
 * 整个申请单流程共享此数据，避免硬编码映射
 *
 * 映射逻辑已迁移到 regionConfig Store（动态从后端获取）
 * 本 store 仅负责"当前选中传输方向的区域元数据"存储
 */

import type { SecurityArea } from '@/constants/region'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRegionConfigStore } from './regionConfig'

/** 区域配置 */
export interface RegionConfig {
  code: SecurityArea  // 'green', 'yellow', 'external'
  name: string        // '绿区', '黄区', '外网'
  id: number          // 后端区域 ID
}

/** 区域元数据（包含源区域和目标区域）*/
export interface RegionMetadata {
  fromRegion: RegionConfig
  toRegion: RegionConfig
}

export const useRegionMetadataStore = defineStore('regionMetadata', () => {
  /** 当前选中的区域元数据 */
  const metadata = ref<RegionMetadata | null>(null)

  /**
   * 设置区域元数据
   */
  function setMetadata(data: RegionMetadata) {
    metadata.value = data
  }

  /**
   * 从区域数字 ID 设置元数据
   * 用于 loadApplicationById 等场景：后端返回 fromRegionTypeId/toRegionTypeId，
   * 通过 regionConfig Store 的动态映射转换为完整 RegionConfig
   */
  function setMetadataFromIds(fromId: number, toId: number) {
    const regionConfigStore = useRegionConfigStore()

    const fromCode = regionConfigStore.getCodeById(fromId) || 'green'
    const toCode = regionConfigStore.getCodeById(toId) || 'green'

    metadata.value = {
      fromRegion: {
        code: fromCode,
        name: regionConfigStore.getNameByCode(fromCode) || fromCode,
        id: fromId,
      },
      toRegion: {
        code: toCode,
        name: regionConfigStore.getNameByCode(toCode) || toCode,
        id: toId,
      },
    }
  }

  /**
   * 获取源区域 ID（用于调用后端接口）
   */
  function getFromId(): number | null {
    return metadata.value?.fromRegion.id ?? null
  }

  /**
   * 获取目标区域 ID（用于调用后端接口）
   */
  function getToId(): number | null {
    return metadata.value?.toRegion.id ?? null
  }

  /**
   * 获取源区域 code
   */
  function getFromCode(): SecurityArea | null {
    return metadata.value?.fromRegion.code ?? null
  }

  /**
   * 获取目标区域 code
   */
  function getToCode(): SecurityArea | null {
    return metadata.value?.toRegion.code ?? null
  }

  /**
   * 获取源区域中文名
   */
  function getFromName(): string | null {
    return metadata.value?.fromRegion.name ?? null
  }

  /**
   * 获取目标区域中文名
   */
  function getToName(): string | null {
    return metadata.value?.toRegion.name ?? null
  }

  /**
   * 动态生成传输类型标签："{源区域}传到{目标区域}"
   * 区域名称来自后端配置，不再硬编码
   */
  function getTransferTypeLabel(): string {
    const fromName = metadata.value?.fromRegion.name
    const toName = metadata.value?.toRegion.name
    if (fromName && toName)
      return `${fromName}传到${toName}`
    return '传输申请'
  }

  /**
   * 清空区域元数据
   */
  function clearMetadata() {
    metadata.value = null
  }

  return {
    metadata,
    setMetadata,
    setMetadataFromIds,
    getFromId,
    getToId,
    getFromCode,
    getToCode,
    getFromName,
    getToName,
    getTransferTypeLabel,
    clearMetadata,
  }
})
