export interface CityItem {
  code: string
  name: string
  dataCenter: string
  id: number  // 城市ID，用于后端接口
}

export interface ProvinceCities {
  province: string
  provinceCode: string
  cities: CityItem[]
}

export const cities: ProvinceCities[] = [
  {
    province: '北京市',
    provinceCode: 'BJ',
    cities: [
      { code: 'BJ-BJ', name: '北京', dataCenter: '北京一站', id: 11 },
    ],
  },
  {
    province: '上海市',
    provinceCode: 'SH',
    cities: [
      { code: 'SH-SH', name: '上海', dataCenter: '上海一站', id: 21 },
    ],
  },
  {
    province: '广东省',
    provinceCode: 'GD',
    cities: [
      { code: 'GD-GZ', name: '广州', dataCenter: '广州一站', id: 41 },
      { code: 'GD-SZ', name: '深圳', dataCenter: '深圳一站', id: 42 },
      { code: 'GD-DG', name: '东莞', dataCenter: '东莞一站', id: 43 },
      { code: 'GD-FS', name: '佛山', dataCenter: '佛山一站', id: 44 },
    ],
  },
  {
    province: '江苏省',
    provinceCode: 'JS',
    cities: [
      { code: 'JS-NJ', name: '南京', dataCenter: '南京一站', id: 25 },
      { code: 'JS-SZ', name: '苏州', dataCenter: '苏州一站', id: 26 },
      { code: 'JS-WX', name: '无锡', dataCenter: '无锡一站', id: 27 },
    ],
  },
  {
    province: '浙江省',
    provinceCode: 'ZJ',
    cities: [
      { code: 'ZJ-HZ', name: '杭州', dataCenter: '杭州一站', id: 31 },
      { code: 'ZJ-NB', name: '宁波', dataCenter: '宁波一站', id: 32 },
    ],
  },
  {
    province: '四川省',
    provinceCode: 'SC',
    cities: [
      { code: 'SC-CD', name: '成都', dataCenter: '成都一站', id: 51 },
    ],
  },
  {
    province: '湖北省',
    provinceCode: 'HB',
    cities: [
      { code: 'HB-WH', name: '武汉', dataCenter: '武汉一站', id: 61 },
    ],
  },
  {
    province: '陕西省',
    provinceCode: 'SN',
    cities: [
      { code: 'SN-XA', name: '西安', dataCenter: '西安一站', id: 71 },
    ],
  },
  {
    province: '山东省',
    provinceCode: 'SD',
    cities: [
      { code: 'SD-JN', name: '济南', dataCenter: '济南一站', id: 81 },
      { code: 'SD-QD', name: '青岛', dataCenter: '青岛一站', id: 82 },
    ],
  },
  {
    province: '福建省',
    provinceCode: 'FJ',
    cities: [
      { code: 'FJ-FZ', name: '福州', dataCenter: '福州一站', id: 91 },
      { code: 'FJ-XM', name: '厦门', dataCenter: '厦门一站', id: 92 },
    ],
  },
]

// 默认城市：广东省-深圳
export const DEFAULT_CITY = ['GD', 'GD-SZ'] as const
