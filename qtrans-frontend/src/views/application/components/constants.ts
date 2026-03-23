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

/**
 * Mock 审批人员选项（接口未提供时使用）
 */
export const MOCK_APPROVER_OPTIONS = [
  { label: '张三 / zhangsan / 研发部', value: 'zhangsan' },
  { label: '李四 / lisi / 测试部', value: 'lisi' },
  { label: '王五 / wangwu / 产品部', value: 'wangwu' },
  { label: '赵六 / zhaoliu / 运维部', value: 'zhaoliu' },
  { label: '陈七 / chenqi / 架构部', value: 'chenqi' },
]
