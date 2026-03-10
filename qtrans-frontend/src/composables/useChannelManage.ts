import type {
  ChannelQueryParams,
  ChannelServer,
  ChannelServerBinding,
  ChannelStatus,
  CreateChannelRequest,
  SaveChannelServersRequest,
  TransferChannel,
  UpdateChannelRequest,
} from '@/types'
import { computed, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { channelManageApi } from '@/api/channelManage'

export function useChannelManage() {
  const listData = ref<TransferChannel[]>([])
  const loading = ref(false)

  const pagination = ref({
    pageNum: 1,
    pageSize: 10,
    total: 0,
  })

  const filters = ref<ChannelQueryParams>({
    keyword: '',
    status: undefined,
  })

  const modalVisible = ref(false)
  const serverModalVisible = ref(false)
  const editingChannel = ref<TransferChannel | null>(null)
  const currentChannelId = ref<string>('')

  const availableServers = ref<ChannelServer[]>([])
  const channelServers = ref<ChannelServerBinding[]>([])

  const isEditMode = computed(() => !!editingChannel.value)
  const currentChannelName = computed(() => {
    if (!currentChannelId.value) return ''
    return listData.value.find(item => item.id === currentChannelId.value)?.name || ''
  })

  async function fetchList() {
    loading.value = true
    try {
      const params: ChannelQueryParams = {
        ...filters.value,
        status: filters.value.status || undefined,
        pageNum: pagination.value.pageNum,
        pageSize: pagination.value.pageSize,
      }

      const res = await channelManageApi.getList(params)
      listData.value = res.list
      pagination.value.total = res.total
    }
    catch (error: any) {
      Message.error(error.message || '获取传输通道列表失败')
    }
    finally {
      loading.value = false
    }
  }

  function handleSearch() {
    pagination.value.pageNum = 1
    fetchList()
  }

  function handleReset() {
    filters.value = {
      keyword: '',
      status: undefined,
    }
    pagination.value.pageNum = 1
    fetchList()
  }

  function handlePageChange(page: number) {
    pagination.value.pageNum = page
    fetchList()
  }

  function handlePageSizeChange(pageSize: number) {
    pagination.value.pageSize = pageSize
    pagination.value.pageNum = 1
    fetchList()
  }

  function handleCreate() {
    editingChannel.value = null
    modalVisible.value = true
  }

  function handleEdit(channel: TransferChannel) {
    editingChannel.value = { ...channel }
    modalVisible.value = true
  }

  async function handleSave(data: CreateChannelRequest | UpdateChannelRequest) {
    try {
      if (isEditMode.value && editingChannel.value) {
        await channelManageApi.update(editingChannel.value.id, data as UpdateChannelRequest)
        Message.success('通道更新成功')
      }
      else {
        await channelManageApi.create(data as CreateChannelRequest)
        Message.success('通道创建成功')
      }
      modalVisible.value = false
      fetchList()
    }
    catch (error: any) {
      Message.error(error.message || '保存失败')
      throw error
    }
  }

  function handleDelete(channel: TransferChannel) {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除通道「${channel.name}」吗？删除后不可恢复。`,
      okText: '删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          await channelManageApi.delete(channel.id)
          Message.success('删除成功')
          fetchList()
        }
        catch (error: any) {
          Message.error(error.message || '删除失败')
        }
      },
    })
  }

  async function handleToggleStatus(channel: TransferChannel) {
    const nextStatus: ChannelStatus = channel.status === 'enabled' ? 'disabled' : 'enabled'
    const actionText = nextStatus === 'enabled' ? '启用' : '禁用'

    try {
      await channelManageApi.updateStatus(channel.id, nextStatus)
      Message.success(`${actionText}成功`)
      fetchList()
    }
    catch (error: any) {
      Message.error(error.message || `${actionText}失败`)
    }
  }

  async function handleConfigServer(channel: TransferChannel) {
    currentChannelId.value = channel.id
    serverModalVisible.value = true

    try {
      const [servers, selectedServers] = await Promise.all([
        channelManageApi.getAvailableServers(),
        channelManageApi.getChannelServers(channel.id),
      ])
      availableServers.value = servers
      channelServers.value = selectedServers
    }
    catch (error: any) {
      Message.error(error.message || '加载服务器配置失败')
      serverModalVisible.value = false
    }
  }

  async function handleSaveServers(servers: SaveChannelServersRequest['servers']) {
    if (!currentChannelId.value)
      return

    try {
      await channelManageApi.saveChannelServers(currentChannelId.value, { servers })
      Message.success('服务器配置保存成功')
      serverModalVisible.value = false
      fetchList()
    }
    catch (error: any) {
      Message.error(error.message || '保存服务器配置失败')
      throw error
    }
  }

  function handleCloseServerModal() {
    serverModalVisible.value = false
    currentChannelId.value = ''
    channelServers.value = []
  }

  function handleCloseModal() {
    modalVisible.value = false
    editingChannel.value = null
  }

  return {
    listData,
    loading,
    pagination,
    filters,
    modalVisible,
    serverModalVisible,
    editingChannel,
    currentChannelId,
    availableServers,
    channelServers,
    isEditMode,
    currentChannelName,
    fetchList,
    handleSearch,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
    handleCreate,
    handleEdit,
    handleSave,
    handleDelete,
    handleToggleStatus,
    handleConfigServer,
    handleSaveServers,
    handleCloseServerModal,
    handleCloseModal,
  }
}
