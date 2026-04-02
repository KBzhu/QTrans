import type { CityDomainMapping, DomainStatus, SecurityDomain } from '@/types'
import { baseHttp as http } from './_utils'
import { failed, getPagination, mockDelay, success } from './_utils'

const defaultDomains: SecurityDomain[] = [
  {
    id: 'domain-1',
    name: '绿区',
    code: 'green',
    color: '#00b42a',
    description: '低风险安全域，适用于公开数据传输',
    status: 'enabled',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'domain-2',
    name: '黄区',
    code: 'yellow',
    color: '#ff7d00',
    description: '中风险安全域，适用于内部数据传输',
    status: 'enabled',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'domain-3',
    name: '红区',
    code: 'red',
    color: '#f53f3f',
    description: '高风险安全域，适用于机密数据传输',
    status: 'enabled',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'domain-4',
    name: '黑区',
    code: 'black',
    color: '#1d2129',
    description: '最高风险安全域，严格管控',
    status: 'disabled',
    createdAt: '2024-01-02T00:00:00.000Z',
  },
]

const defaultCities: CityDomainMapping[] = [
  { id: 'city-1', cityName: '北京', country: '中国', domainCode: 'red', domainName: '红区', domainColor: '#f53f3f', status: 'enabled', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 'city-2', cityName: '上海', country: '中国', domainCode: 'yellow', domainName: '黄区', domainColor: '#ff7d00', status: 'enabled', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 'city-3', cityName: '深圳', country: '中国', domainCode: 'green', domainName: '绿区', domainColor: '#00b42a', status: 'enabled', createdAt: '2024-01-02T00:00:00.000Z' },
  { id: 'city-4', cityName: '广州', country: '中国', domainCode: 'yellow', domainName: '黄区', domainColor: '#ff7d00', status: 'enabled', createdAt: '2024-01-02T00:00:00.000Z' },
  { id: 'city-5', cityName: '成都', country: '中国', domainCode: 'green', domainName: '绿区', domainColor: '#00b42a', status: 'enabled', createdAt: '2024-01-03T00:00:00.000Z' },
  { id: 'city-6', cityName: '武汉', country: '中国', domainCode: 'green', domainName: '绿区', domainColor: '#00b42a', status: 'disabled', createdAt: '2024-01-03T00:00:00.000Z' },
  { id: 'city-7', cityName: '东京', country: '日本', domainCode: 'yellow', domainName: '黄区', domainColor: '#ff7d00', status: 'enabled', createdAt: '2024-01-04T00:00:00.000Z' },
  { id: 'city-8', cityName: '大阪', country: '日本', domainCode: 'green', domainName: '绿区', domainColor: '#00b42a', status: 'enabled', createdAt: '2024-01-04T00:00:00.000Z' },
  { id: 'city-9', cityName: '纽约', country: '美国', domainCode: 'red', domainName: '红区', domainColor: '#f53f3f', status: 'enabled', createdAt: '2024-01-05T00:00:00.000Z' },
  { id: 'city-10', cityName: '洛杉矶', country: '美国', domainCode: 'yellow', domainName: '黄区', domainColor: '#ff7d00', status: 'enabled', createdAt: '2024-01-05T00:00:00.000Z' },
  { id: 'city-11', cityName: '伦敦', country: '英国', domainCode: 'yellow', domainName: '黄区', domainColor: '#ff7d00', status: 'enabled', createdAt: '2024-01-06T00:00:00.000Z' },
  { id: 'city-12', cityName: '巴黎', country: '法国', domainCode: 'green', domainName: '绿区', domainColor: '#00b42a', status: 'enabled', createdAt: '2024-01-06T00:00:00.000Z' },
]

let domains = [...defaultDomains]
let cities = [...defaultCities]
let domainIdCounter = 10
let cityIdCounter = 20

function getDomainByCode(code: string): SecurityDomain | undefined {
  return domains.find(d => d.code === code)
}

export const regionManageHandlers = [
  // ============ 城市映射 ============
  http.get('/api/region/cities', async ({ request }) => {
    await mockDelay(200)
    const url = new URL(request.url)
    const keyword = (url.searchParams.get('keyword') || '').trim().toLowerCase()
    const domainCode = url.searchParams.get('domainCode')
    const status = url.searchParams.get('status') as DomainStatus | null

    const filtered = cities.filter((city) => {
      const keywordMatch = keyword
        ? city.cityName.toLowerCase().includes(keyword) || city.country.toLowerCase().includes(keyword)
        : true
      const domainMatch = domainCode ? city.domainCode === domainCode : true
      const statusMatch = status ? city.status === status : true
      return keywordMatch && domainMatch && statusMatch
    })

    const pagination = getPagination(url)
    return success(pagination.toPage(filtered))
  }),

  http.post('/api/region/cities', async ({ request }) => {
    await mockDelay(200)
    const body = await request.json() as any
    const domain = getDomainByCode(body.domainCode)
    if (!domain) return failed('安全域不存在')

    const newCity: CityDomainMapping = {
      id: `city-${++cityIdCounter}`,
      cityName: body.cityName,
      country: body.country,
      domainCode: domain.code,
      domainName: domain.name,
      domainColor: domain.color,
      status: 'enabled',
      createdAt: new Date().toISOString(),
    }
    cities.unshift(newCity)
    return success(newCity, '城市映射创建成功')
  }),

  http.put('/api/region/cities/:id', async ({ request, params }) => {
    await mockDelay(200)
    const { id } = params as { id: string }
    const body = await request.json() as any
    const index = cities.findIndex(c => c.id === id)
    if (index === -1) return failed('城市映射不存在', 404)

    if (body.domainCode) {
      const domain = getDomainByCode(body.domainCode)
      if (!domain) return failed('安全域不存在')
      body.domainName = domain.name
      body.domainColor = domain.color
    }

    cities[index] = { ...cities[index], ...body }
    return success(cities[index], '更新成功')
  }),

  http.delete('/api/region/cities/:id', async ({ params }) => {
    await mockDelay(200)
    const { id } = params as { id: string }
    const index = cities.findIndex(c => c.id === id)
    if (index === -1) return failed('城市映射不存在', 404)
    cities.splice(index, 1)
    return success(null, '删除成功')
  }),

  // ============ 安全域 ============
  http.get('/api/region/domains/all', async () => {
    await mockDelay(100)
    return success(domains.filter(d => d.status === 'enabled'))
  }),

  http.get('/api/region/domains', async ({ request }) => {
    await mockDelay(200)
    const url = new URL(request.url)
    const keyword = (url.searchParams.get('keyword') || '').trim().toLowerCase()
    const status = url.searchParams.get('status') as DomainStatus | null

    const filtered = domains.filter((domain) => {
      const keywordMatch = keyword
        ? domain.name.toLowerCase().includes(keyword) || domain.code.toLowerCase().includes(keyword)
        : true
      const statusMatch = status ? domain.status === status : true
      return keywordMatch && statusMatch
    })

    const pagination = getPagination(url)
    return success(pagination.toPage(filtered))
  }),

  http.post('/api/region/domains', async ({ request }) => {
    await mockDelay(200)
    const body = await request.json() as any
    if (domains.some(d => d.code === body.code)) {
      return failed('安全域代码已存在')
    }
    const newDomain: SecurityDomain = {
      id: `domain-${++domainIdCounter}`,
      name: body.name,
      code: body.code,
      color: body.color || '#165dff',
      description: body.description || '',
      status: body.status ?? 'enabled',
      createdAt: new Date().toISOString(),
    }
    domains.unshift(newDomain)
    return success(newDomain, '安全域创建成功')
  }),

  http.put('/api/region/domains/:id', async ({ request, params }) => {
    await mockDelay(200)
    const { id } = params as { id: string }
    const body = await request.json() as any
    const index = domains.findIndex(d => d.id === id)
    if (index === -1) return failed('安全域不存在', 404)
    domains[index] = { ...domains[index], ...body }
    return success(domains[index], '更新成功')
  }),

  http.delete('/api/region/domains/:id', async ({ params }) => {
    await mockDelay(200)
    const { id } = params as { id: string }
    const index = domains.findIndex(d => d.id === id)
    if (index === -1) return failed('安全域不存在', 404)
    domains.splice(index, 1)
    return success(null, '删除成功')
  }),

  http.patch('/api/region/domains/:id/status', async ({ request, params }) => {
    await mockDelay(150)
    const { id } = params as { id: string }
    const body = await request.json() as { status: DomainStatus }
    const index = domains.findIndex(d => d.id === id)
    if (index === -1) return failed('安全域不存在', 404)
    domains[index].status = body.status
    return success(domains[index], '状态更新成功')
  }),
]
