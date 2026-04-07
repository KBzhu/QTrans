/**
 * 文件类型枚举映射
 * 用于资产检测结果展示
 */
export const FILE_TYPE_MAP: Record<number, string> = {
  0: '检测通过',
  1: '真实后缀被修改过',
  3: '压缩包加密',
  4: '关键资产',
  5: '源码',
  8: '压缩包解压失败，有原因',
  15: '压缩包解压失败，原因未知',
  18: '检测失败',
  19: '断裂代码',
  22: '员工个人照片',
  23: '不允许外出资产',
  24: '外非资产',
  51: '设计文档关键字或者黑名单后缀',
  57: '特种文件',
  62: '华为源码',
  66: '代码文件后缀',
  67: '疑似夹带',
}


/**
 * 获取文件类型名称
 */
export function getFileTypeName(fileType: number): string {
  return FILE_TYPE_MAP[fileType] || `未知类型(${fileType})`
}
