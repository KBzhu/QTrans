export interface CityItem {
  code: string
  name: string
  dataCenter: string
}

export interface CountryCities {
  country: string
  countryCode: string
  cities: CityItem[]
}

export const cities: CountryCities[] = [
  {
    country: '中国',
    countryCode: 'CN',
    cities: [
      { code: 'CN-BJ', name: '北京', dataCenter: '北京一站' },
      { code: 'CN-SH', name: '上海', dataCenter: '上海一站' },
      { code: 'CN-GZ', name: '广州', dataCenter: '广州一站' },
      { code: 'CN-SZ', name: '深圳', dataCenter: '深圳一站' },
      { code: 'CN-CD', name: '成都', dataCenter: '成都一站' },
    ],
  },
  {
    country: '美国',
    countryCode: 'US',
    cities: [
      { code: 'US-NYC', name: '纽约', dataCenter: '美东站' },
      { code: 'US-LAX', name: '洛杉矶', dataCenter: '美西站' },
      { code: 'US-CHI', name: '芝加哥', dataCenter: '美中站' },
    ],
  },
  {
    country: '日本',
    countryCode: 'JP',
    cities: [
      { code: 'JP-TYO', name: '东京', dataCenter: '东京站' },
      { code: 'JP-OSA', name: '大阪', dataCenter: '大阪站' },
    ],
  },
  {
    country: '新加坡',
    countryCode: 'SG',
    cities: [
      { code: 'SG-SIN', name: '新加坡', dataCenter: '新加坡站' },
    ],
  },
]
