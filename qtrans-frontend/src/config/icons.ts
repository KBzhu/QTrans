/**
 * 图标配置常量
 * 所有图标路径统一配置，便于管理和替换
 */

// 图标基础路径 - 使用public目录便于打包后替换
const ICON_BASE_PATH = '/icons'

// 传输类型图标配置
export const TRANSFER_ICONS = {
  // 区域图标
  GREEN: `${ICON_BASE_PATH}/green.svg`,
  YELLOW: `${ICON_BASE_PATH}/yellow.svg`,
  RED: `${ICON_BASE_PATH}/red.svg`,
  EXTERNAL: `${ICON_BASE_PATH}/external.svg`,
  
  // 箭头图标
  GREEN_ARROW: `${ICON_BASE_PATH}/arrow-green.svg`,
  YELLOW_ARROW: `${ICON_BASE_PATH}/arrow-yellow.svg`,
  RED_ARROW: `${ICON_BASE_PATH}/arrow-red.svg`,
  
  // 默认图标
  DEFAULT_FROM: `${ICON_BASE_PATH}/green.svg`,
  DEFAULT_TO: `${ICON_BASE_PATH}/green.svg`,
  DEFAULT_ARROW: `${ICON_BASE_PATH}/arrow-green.svg`,
}

// 传输类型图标映射
export const TRANSFER_ICON_MAP: Record<string, {
  fromIcon: string,
  toIcon: string,
  arrowIcon: string
}> = {
  'green-green': {
    fromIcon: TRANSFER_ICONS.GREEN,
    toIcon: TRANSFER_ICONS.GREEN,
    arrowIcon: TRANSFER_ICONS.GREEN_ARROW,
  },
  'green-yellow': {
    fromIcon: TRANSFER_ICONS.GREEN,
    toIcon: TRANSFER_ICONS.YELLOW,
    arrowIcon: TRANSFER_ICONS.GREEN_ARROW,
  },
  'green-red': {
    fromIcon: TRANSFER_ICONS.GREEN,
    toIcon: TRANSFER_ICONS.RED,
    arrowIcon: TRANSFER_ICONS.GREEN_ARROW,
  },
  'green-external': {
    fromIcon: TRANSFER_ICONS.GREEN,
    toIcon: TRANSFER_ICONS.EXTERNAL,
    arrowIcon: TRANSFER_ICONS.GREEN_ARROW,
  },
  'yellow-green': {
    fromIcon: TRANSFER_ICONS.YELLOW,
    toIcon: TRANSFER_ICONS.GREEN,
    arrowIcon: TRANSFER_ICONS.YELLOW_ARROW,
  },
  'yellow-yellow': {
    fromIcon: TRANSFER_ICONS.YELLOW,
    toIcon: TRANSFER_ICONS.YELLOW,
    arrowIcon: TRANSFER_ICONS.YELLOW_ARROW,
  },
  'yellow-red': {
    fromIcon: TRANSFER_ICONS.YELLOW,
    toIcon: TRANSFER_ICONS.RED,
    arrowIcon: TRANSFER_ICONS.YELLOW_ARROW,
  },
  'yellow-external': {
    fromIcon: TRANSFER_ICONS.YELLOW,
    toIcon: TRANSFER_ICONS.EXTERNAL,
    arrowIcon: TRANSFER_ICONS.YELLOW_ARROW,
  },
  'red-green': {
    fromIcon: TRANSFER_ICONS.RED,
    toIcon: TRANSFER_ICONS.GREEN,
    arrowIcon: TRANSFER_ICONS.RED_ARROW,
  },
  'red-yellow': {
    fromIcon: TRANSFER_ICONS.RED,
    toIcon: TRANSFER_ICONS.YELLOW,
    arrowIcon: TRANSFER_ICONS.RED_ARROW,
  },
  'red-red': {
    fromIcon: TRANSFER_ICONS.RED,
    toIcon: TRANSFER_ICONS.RED,
    arrowIcon: TRANSFER_ICONS.RED_ARROW,
  },
}

// 获取图标配置
export function getTransferIcons(fromZone: string, toZone: string) {
  const key = `${fromZone}-${toZone}`
  return TRANSFER_ICON_MAP[key] || {
    fromIcon: TRANSFER_ICONS.DEFAULT_FROM,
    toIcon: TRANSFER_ICONS.DEFAULT_TO,
    arrowIcon: TRANSFER_ICONS.DEFAULT_ARROW,
  }
}