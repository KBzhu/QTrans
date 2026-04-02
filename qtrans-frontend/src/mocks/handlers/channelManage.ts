import type {
  ChannelServer,
  ChannelServerBinding,
  ChannelStatus,
  EncryptionConfigType,
  SaveChannelServersRequest,
  TransferChannel,
} from '@/types'
import { baseHttp as http } from './_utils'
import { failed, getPagination, mockDelay, success } from './_utils'

const defaultServers: ChannelServer[] = [
  { id: 'server-1', name: '北京主节点', ip: '10.10.1.11', port: 8443, status: 'enabled' },
  { id: 'server-2', name: '上海主节点', ip: '10.10.2.11', port: 8443, status: 'enabled' },
  { id: 'server-3', name: '深圳灾备节点', ip: '10.10.3.21', port: 9443, status: 'enabled' },
  { id: 'server-4', name: '广州边缘节点', ip: '10.10.4.31', port: 8443, status: 'disabled' },
  { id: 'server-5', name: '东京节点', ip: '10.20.1.11', port: 9443, status: 'enabled' },
  { id: 'server-6', name: '法兰克福节点', ip: '10.30.1.11', port: 10443, status: 'enabled' },
]

const defaultChannels: TransferChannel[] = [
  {
    id: 'channel-1',
    name: '默认高速通道',
    code: 'default_highspeed',
    encryptionConfigs: ['data_encryption', 'asset_detection'],
    description: '用于常规跨区高速传输',
    status: 'enabled',
    serverCount: 2,
    createdAt: '2024-03-01T10:00:00.000Z',
  },
  {
    id: 'channel-2',
    name: '跨国专线通道',
    code: 'cross_border_line',
    encryptionConfigs: ['data_encryption', 'rms_encryption', 'asset_detection'],
    description: '用于跨国场景，强制三重能力',
    status: 'enabled',
    serverCount: 2,
    createdAt: '2024-03-05T08:30:00.000Z',
  },
  {
    id: 'channel-3',
    name: '研发灰度通道',
    code: 'rd_gray_channel',
    encryptionConfigs: ['data_encryption'],
    description: '研发环境灰度验证通道',
    status: 'disabled',
    serverCount: 1,
    createdAt: '2024-03-10T14:20:00.000Z',
  },
]

let channels = [...defaultChannels]
let channelIdCounter = 20

let channelServerBindings: Record<string, ChannelServerBinding[]> = {
  'channel-1': [
    { serverId: 'server-1', name: '北京主节点', ip: '10.10.1.11', port: 8443, priority: 1, status: 'enabled' },
    { serverId: 'server-2', name: '上海主节点', ip: '10.10.2.11', port: 8443, priority: 2, status: 'enabled' },
  ],
  'channel-2': [
    { serverId: 'server-5', name: '东京节点', ip: '10.20.1.11', port: 9443, priority: 1, status: 'enabled' },
    { serverId: 'server-6', name: '法兰克福节点', ip: '10.30.1.11', port: 10443, priority: 2, status: 'enabled' },
  ],
  'channel-3': [
    { serverId: 'server-3', name: '深圳灾备节点', ip: '10.10.3.21', port: 9443, priority: 1, status: 'enabled' },
  ],
}

function getServerById(serverId: string) {
  return defaultServers.find(server => server.id === serverId)
}

function normalizeEncryptions(configs: unknown): EncryptionConfigType[] {
  if (!Array.isArray(configs)) return []
  const valid: EncryptionConfigType[] = ['data_encryption', 'rms_encryption', 'asset_detection']
  return configs.filter((item): item is EncryptionConfigType => valid.includes(item as EncryptionConfigType))
}

export const channelManageHandlers = [
  http.get('/api/channel', async ({ request }) => {
    await mockDelay(180)
    const url = new URL(request.url)
    const keyword = (url.searchParams.get('keyword') || '').trim().toLowerCase()
    const status = url.searchParams.get('status') as ChannelStatus | null

    const filtered = channels.filter((channel) => {
      const keywordMatch = keyword
        ? channel.name.toLowerCase().includes(keyword) || channel.code.toLowerCase().includes(keyword)
        : true
      const statusMatch = status ? channel.status === status : true
      return keywordMatch && statusMatch
    })

    const pagination = getPagination(url)
    return success(pagination.toPage(filtered))
  }),

  http.post('/api/channel', async ({ request }) => {
    await mockDelay(180)
    const body = await request.json() as any
    if (channels.some(channel => channel.code === body.code))
      return failed('通道代码已存在')

    const newItem: TransferChannel = {
      id: `channel-${++channelIdCounter}`,
      name: body.name,
      code: body.code,
      encryptionConfigs: normalizeEncryptions(body.encryptionConfigs),
      description: body.description || '',
      status: body.status === 'disabled' ? 'disabled' : 'enabled',
      serverCount: 0,
      createdAt: new Date().toISOString(),
    }

    channels.unshift(newItem)
    channelServerBindings[newItem.id] = []
    return success(newItem, '通道创建成功')
  }),

  http.get('/api/channel/servers/available', async () => {
    await mockDelay(120)
    return success(defaultServers)
  }),

  http.get('/api/channel/:id/servers', async ({ params }) => {
    await mockDelay(120)
    const { id } = params as { id: string }
    if (!channels.some(channel => channel.id === id))
      return failed('通道不存在', 404)

    return success(channelServerBindings[id] || [])
  }),

  http.put('/api/channel/:id/servers', async ({ params, request }) => {
    await mockDelay(180)
    const { id } = params as { id: string }
    const body = await request.json() as SaveChannelServersRequest

    const channel = channels.find(item => item.id === id)
    if (!channel)
      return failed('通道不存在', 404)

    const normalizedServers: ChannelServerBinding[] = (body.servers || []).map((item, index) => {
      const server = getServerById(item.serverId)
      if (!server) {
        return {
          serverId: item.serverId,
          name: '未知服务器',
          ip: '-',
          port: item.port,
          priority: index + 1,
          status: item.status,
        }
      }

      return {
        serverId: item.serverId,
        name: server.name,
        ip: server.ip,
        port: item.port || server.port,
        priority: index + 1,
        status: item.status === 'disabled' ? 'disabled' : 'enabled',
      }
    })

    channelServerBindings[id] = normalizedServers
    channel.serverCount = normalizedServers.length
    return success(normalizedServers, '服务器配置已保存')
  }),

  http.put('/api/channel/:id/status', async ({ request, params }) => {
    await mockDelay(120)
    const { id } = params as { id: string }
    const body = await request.json() as { status: ChannelStatus }
    const index = channels.findIndex(item => item.id === id)

    if (index === -1)
      return failed('通道不存在', 404)

    const targetChannel = channels[index]!
    targetChannel.status = body.status === 'disabled' ? 'disabled' : 'enabled'

    return success(targetChannel, '状态更新成功')
  }),

  http.put('/api/channel/:id', async ({ request, params }) => {
    await mockDelay(180)
    const { id } = params as { id: string }
    const body = await request.json() as any
    const index = channels.findIndex(item => item.id === id)

    if (index === -1)
      return failed('通道不存在', 404)

    if (body.code && channels.some(item => item.code === body.code && item.id !== id))
      return failed('通道代码已存在')

    const targetChannel = channels[index]!
    channels[index] = {

      ...targetChannel,
      ...body,
      encryptionConfigs: body.encryptionConfigs ? normalizeEncryptions(body.encryptionConfigs) : targetChannel.encryptionConfigs,
    }

    return success(channels[index], '更新成功')
  }),

  http.delete('/api/channel/:id', async ({ params }) => {
    await mockDelay(180)
    const { id } = params as { id: string }
    const index = channels.findIndex(item => item.id === id)

    if (index === -1)
      return failed('通道不存在', 404)

    channels.splice(index, 1)
    delete channelServerBindings[id]
    return success(null, '删除成功')
  }),
]
