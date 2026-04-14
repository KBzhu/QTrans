/**
 * 区域元数据 Store
 *
 * 从首页卡片配置（itemAttr5）解析并存储区域元数据
 * 整个申请单流程共享此数据，避免硬编码映射
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 区域配置 */
export interface RegionConfig {
  code: string        // 'green', 'yellow', 'red', 'external'
  name: string        // '绿区', '黄区', '红区', '外网'
  id: number          // 1, 0, 4, 2
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
  function getFromCode(): string | null {
    return metadata.value?.fromRegion.code ?? null
  }

  /**
   * 获取目标区域 code
   */
  function getToCode(): string | null {
    return metadata.value?.toRegion.code ?? null
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
    getFromId,
    getToId,
    getFromCode,
    getToCode,
    clearMetadata,
  }
})
