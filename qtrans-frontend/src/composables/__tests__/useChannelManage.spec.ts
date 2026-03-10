import type { ChannelServer, ChannelServerBinding, PageResponse, TransferChannel } from '@/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useChannelManage } from '@/composables/useChannelManage'

const {
  getListMock,
  createMock,
  updateMock,
  deleteMock,
  updateStatusMock,
  getAvailableServersMock,
  getChannelServersMock,
  saveChannelServersMock,
} = vi.hoisted(() => ({
  getListMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
  updateStatusMock: vi.fn(),
  getAvailableServersMock: vi.fn(),
  getChannelServersMock: vi.fn(),
  saveChannelServersMock: vi.fn(),
}))

vi.mock('@/api/channelManage', () => ({
  channelManageApi: {
    getList: getListMock,
    create: createMock,
    update: updateMock,
    delete: deleteMock,
    updateStatus: updateStatusMock,
    getAvailableServers: getAvailableServersMock,
    getChannelServers: getChannelServersMock,
    saveChannelServers: saveChannelServersMock,
  },
}))

vi.mock('@arco-design/web-vue', async () => {
  const actual = await vi.importActual('@arco-design/web-vue')
  return {
    ...actual,
    Message: {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    },
    Modal: {
      confirm: vi.fn(),
    },
  }
})

function createChannel(overrides: Partial<TransferChannel> = {}): TransferChannel {
  return {
    id: 'channel-1',
    name: '默认通道',
    code: 'default_channel',
    encryptionConfigs: ['data_encryption'],
    description: 'desc',
    status: 'enabled',
    serverCount: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function createPage<T>(list: T[]): PageResponse<T> {
  return { list, total: list.length, pageNum: 1, pageSize: 10, totalPages: 1 }
}

function createServer(overrides: Partial<ChannelServer> = {}): ChannelServer {
  return {
    id: 'server-1',
    name: '北京主节点',
    ip: '10.10.1.11',
    port: 8443,
    status: 'enabled',
    ...overrides,
  }
}

function createBinding(overrides: Partial<ChannelServerBinding> = {}): ChannelServerBinding {
  return {
    serverId: 'server-1',
    name: '北京主节点',
    ip: '10.10.1.11',
    port: 8443,
    priority: 1,
    status: 'enabled',
    ...overrides,
  }
}

describe('useChannelManage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchList loads channel list and total', async () => {
    getListMock.mockResolvedValueOnce(createPage([createChannel(), createChannel({ id: 'channel-2' })]))

    const composable = useChannelManage()
    await composable.fetchList()

    expect(getListMock).toHaveBeenCalledWith(expect.objectContaining({ pageNum: 1, pageSize: 10 }))
    expect(composable.listData.value).toHaveLength(2)
    expect(composable.pagination.value.total).toBe(2)
  })

  it('handleCreate opens modal', () => {
    const composable = useChannelManage()
    composable.handleCreate()

    expect(composable.modalVisible.value).toBe(true)
    expect(composable.editingChannel.value).toBeNull()
  })

  it('handleEdit opens modal and sets editing channel', () => {
    const composable = useChannelManage()
    const channel = createChannel()
    composable.handleEdit(channel)

    expect(composable.modalVisible.value).toBe(true)
    expect(composable.editingChannel.value).toEqual(channel)
  })

  it('handleSave creates channel in create mode', async () => {
    getListMock.mockResolvedValueOnce(createPage([]))
    createMock.mockResolvedValueOnce(createChannel())

    const composable = useChannelManage()
    await composable.handleSave({
      name: '新通道',
      code: 'new_channel',
      encryptionConfigs: ['data_encryption'],
      description: '',
      status: 'enabled',
    })

    expect(createMock).toHaveBeenCalled()
    expect(composable.modalVisible.value).toBe(false)
  })

  it('handleSave updates channel in edit mode', async () => {
    getListMock.mockResolvedValueOnce(createPage([]))
    updateMock.mockResolvedValueOnce(createChannel({ name: '更新后通道' }))

    const composable = useChannelManage()
    composable.handleEdit(createChannel({ id: 'channel-99' }))

    await composable.handleSave({ name: '更新后通道' })

    expect(updateMock).toHaveBeenCalledWith('channel-99', { name: '更新后通道' })
  })

  it('handleSearch resets page and triggers fetch', async () => {
    getListMock.mockResolvedValueOnce(createPage([]))

    const composable = useChannelManage()
    composable.pagination.value.pageNum = 5
    await composable.handleSearch()

    expect(composable.pagination.value.pageNum).toBe(1)
    expect(getListMock).toHaveBeenCalled()
  })

  it('handleReset clears filters and triggers fetch', async () => {
    getListMock.mockResolvedValueOnce(createPage([]))

    const composable = useChannelManage()
    composable.filters.value.keyword = 'abc'
    composable.filters.value.status = 'enabled'

    await composable.handleReset()

    expect(composable.filters.value.keyword).toBe('')
    expect(composable.filters.value.status).toBeUndefined()
    expect(getListMock).toHaveBeenCalled()
  })

  it('handleToggleStatus toggles status and calls updateStatus api', async () => {
    getListMock.mockResolvedValueOnce(createPage([]))
    updateStatusMock.mockResolvedValueOnce(createChannel({ status: 'disabled' }))

    const composable = useChannelManage()
    await composable.handleToggleStatus(createChannel({ id: 'channel-1', status: 'enabled' }))

    expect(updateStatusMock).toHaveBeenCalledWith('channel-1', 'disabled')
  })

  it('handleConfigServer loads available and selected server list', async () => {
    getAvailableServersMock.mockResolvedValueOnce([createServer()])
    getChannelServersMock.mockResolvedValueOnce([createBinding()])

    const composable = useChannelManage()
    await composable.handleConfigServer(createChannel({ id: 'channel-1', name: '默认通道' }))

    expect(getAvailableServersMock).toHaveBeenCalled()
    expect(getChannelServersMock).toHaveBeenCalledWith('channel-1')
    expect(composable.serverModalVisible.value).toBe(true)
    expect(composable.availableServers.value).toHaveLength(1)
    expect(composable.channelServers.value).toHaveLength(1)
  })

  it('handleSaveServers persists data and closes server modal', async () => {
    getListMock.mockResolvedValueOnce(createPage([]))
    saveChannelServersMock.mockResolvedValueOnce([createBinding()])

    const composable = useChannelManage()
    composable.currentChannelId.value = 'channel-1'
    composable.serverModalVisible.value = true

    await composable.handleSaveServers([
      { serverId: 'server-1', port: 8443, priority: 1, status: 'enabled' },
    ])

    expect(saveChannelServersMock).toHaveBeenCalledWith('channel-1', {
      servers: [{ serverId: 'server-1', port: 8443, priority: 1, status: 'enabled' }],
    })
    expect(composable.serverModalVisible.value).toBe(false)
  })

  it('handleCloseServerModal resets modal state', () => {
    const composable = useChannelManage()
    composable.serverModalVisible.value = true
    composable.currentChannelId.value = 'channel-1'
    composable.channelServers.value = [createBinding()]

    composable.handleCloseServerModal()

    expect(composable.serverModalVisible.value).toBe(false)
    expect(composable.currentChannelId.value).toBe('')
    expect(composable.channelServers.value).toEqual([])
  })

  it('fetchList handles api error and resets loading', async () => {
    const { Message } = await import('@arco-design/web-vue')
    getListMock.mockRejectedValueOnce(new Error('network error'))

    const composable = useChannelManage()
    await composable.fetchList()

    expect(Message.error).toHaveBeenCalledWith('network error')
    expect(composable.loading.value).toBe(false)
  })
})
