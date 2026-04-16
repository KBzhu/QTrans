/**
 * 区域相关常量
 *
 * ⚠️ 映射已迁移到 regionConfig Store（动态从后端获取）
 * 本文件仅保留类型定义和降级 fallback
 *
 * 使用映射请用：useRegionConfigStore() 的 computed 和工具方法
 * - idToCode / codeToId / codeToName / nameToCode
 * - getIdByCode() / getCodeById() / getNameByCode() / getNameById()
 * - formatTransferTypeLabel() / formatTransWayLabel()
 */

// ===== 类型定义 =====
/** 区域 code 类型（不再包含 red，红区已废弃） */
export type SecurityArea = 'green' | 'yellow' | 'external'

// ===== 降级 fallback（仅 regionConfig store 初始化失败时使用） =====

/** @internal 降级用：区域 ID → code */
const _FALLBACK_ID_TO_CODE: Record<number, SecurityArea> = {
  1: 'green',
  0: 'yellow',
  2: 'external',
}

/** @internal 降级用：区域 code → ID */
const _FALLBACK_CODE_TO_ID: Record<SecurityArea, number> = {
  green: 1,
  yellow: 0,
  external: 2,
}

/** @internal 降级用：区域 code → 中文名 */
const _FALLBACK_CODE_TO_NAME: Record<SecurityArea, string> = {
  green: '绿区',
  yellow: '黄区',
  external: '外网',
}

// ===== 向后兼容的工具函数（优先使用 regionConfig store） =====

/**
 * 根据区域 ID 获取 code
 * @deprecated 请使用 regionConfigStore.getCodeById(id)
 */
export function idToArea(id: number): SecurityArea {
  return _FALLBACK_ID_TO_CODE[id] ?? 'green'
}

/**
 * 根据区域 code 获取区域 ID
 * @deprecated 请使用 regionConfigStore.getIdByCode(code)
 */
export function areaToId(area: SecurityArea): number {
  return _FALLBACK_CODE_TO_ID[area] ?? 1
}

/**
 * 根据区域 ID 获取中文标签
 * @deprecated 请使用 regionConfigStore.getNameById(id)
 */
export function areaIdToLabel(id: number): string {
  const code = _FALLBACK_ID_TO_CODE[id]
  return code ? _FALLBACK_CODE_TO_NAME[code] : '未知区域'
}

/**
 * 从中文区域名组合推断传输类型
 * @deprecated 请使用后端接口返回的传输类型
 */
export function transWayToTransferType(transWay: string): string {
  const parts = transWay.split(',').map(s => s.trim())
  if (parts.length !== 2)
    return 'green-to-green'

  // 简单归一化：中文名 → code
  const zhToCode: Record<string, SecurityArea> = {
    '绿区': 'green',
    '黄区': 'yellow',
    '外网': 'external',
  }
  const sourceCode = zhToCode[parts[0] || ''] || 'green'
  const targetCode = zhToCode[parts[1] || ''] || 'green'

  return `${sourceCode}-to-${targetCode}`
}

/**
 * 将后端 transWay 字符串格式化为中文显示标签
 * @deprecated 请使用 regionConfigStore.formatTransWayLabel(transWay)
 */
export function formatTransWayLabel(transWay: string): string {
  if (!transWay) return '-'
  const enMap: Record<string, string> = {
    'Green Zone': '绿区',
    'Yellow Zone': '黄区',
    'Internet': '外网',
  }
  const zhSet = new Set(['绿区', '黄区', '外网'])
  return transWay
    .split(',')
    .map((s) => {
      const trimmed = s.trim()
      if (zhSet.has(trimmed)) return trimmed
      return enMap[trimmed] || trimmed
    })
    .join(' → ')
}

/**
 * 从传输类型 key 生成中文标签
 * @deprecated 请使用 regionConfigStore.formatTransferTypeLabel(typeKey)
 */
export function formatTransferTypeKeyLabel(typeKey: string): string {
  if (!typeKey) return '-'
  if (typeKey === 'cross-country') return '跨国传输'
  if (typeKey.includes('-to-')) {
    const parts = typeKey.split('-to-')
    const fromLabel = _FALLBACK_CODE_TO_NAME[parts[0] as SecurityArea] || parts[0]
    const toLabel = _FALLBACK_CODE_TO_NAME[parts[1] as SecurityArea] || parts[1]
    return `${fromLabel}传到${toLabel}`
  }
  return typeKey
}
