<script setup lang="ts">
import type { CreateChannelRequest, EncryptionConfigType, TransferChannel, UpdateChannelRequest } from '@/types'
import { onMounted } from 'vue'
import { useChannelManage } from '@/composables/useChannelManage'
import ChannelManageModal from './ChannelManageModal.vue'
import ChannelServerModal from './ChannelServerModal.vue'
import './channel-manage.scss'

const {
  listData,
  loading,
  pagination,
  filters,
  modalVisible,
  serverModalVisible,
  editingChannel,
  availableServers,
  channelServers,
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
} = useChannelManage()

const encryptionLabelMap: Record<EncryptionConfigType, string> = {
  data_encryption: '数据加密',
  rms_encryption: 'RMS加密',
  asset_detection: '资产检测',
}

const encryptionColorMap: Record<EncryptionConfigType, string> = {
  data_encryption: 'arcoblue',
  rms_encryption: 'purple',
  asset_detection: 'green',
}

const columns = [
  { title: '通道名称', dataIndex: 'name', width: 180 },
  { title: '通道代码', dataIndex: 'code', width: 200 },
  { title: '加密配置', slotName: 'encryption', width: 280 },
  { title: '服务器数量', dataIndex: 'serverCount', width: 120 },
  { title: '状态', slotName: 'status', width: 120 },
  { title: '创建时间', slotName: 'createdAt', width: 180 },
  { title: '操作', slotName: 'actions', width: 220, fixed: 'right' },
]

function formatDate(value: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

async function onSaveChannel(data: CreateChannelRequest | UpdateChannelRequest) {
  await handleSave(data)
}

async function onSaveServers(servers: Array<{ serverId: string, port: number, priority: number, status: 'enabled' | 'disabled' }>) {
  await handleSaveServers(servers)
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="channel-manage-view">
    <div class="channel-manage-header">
      <h2 class="channel-manage-title">传输通道管理</h2>
      <a-button type="primary" @click="handleCreate">
        <template #icon>
          <icon-plus />
        </template>
        新建通道
      </a-button>
    </div>

    <div class="channel-manage-filters">
      <a-form layout="inline" :model="filters">
        <a-form-item label="通道名称/代码">
          <a-input
            v-model="filters.keyword"
            placeholder="请输入关键词"
            allow-clear
            style="width: 260px"
            @press-enter="handleSearch"
          />
        </a-form-item>

        <a-form-item label="状态">
          <a-select v-model="filters.status" placeholder="请选择状态" allow-clear style="width: 140px">
            <a-option value="enabled" label="启用" />
            <a-option value="disabled" label="禁用" />
          </a-select>
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">
              <template #icon>
                <icon-search />
              </template>
              查询
            </a-button>
            <a-button @click="handleReset">
              <template #icon>
                <icon-refresh />
              </template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </div>

    <div class="channel-manage-table">
      <a-table
        :data="listData"
        :columns="columns"
        :loading="loading"
        :pagination="false"
        :bordered="{ cell: true }"
        row-key="id"
        :scroll="{ x: 1300 }"
      >
        <template #encryption="{ record }">
          <a-space wrap>
            <a-tag
              v-for="item in (record as TransferChannel).encryptionConfigs"
              :key="item"
              :color="encryptionColorMap[item]"
            >
              {{ encryptionLabelMap[item] }}
            </a-tag>
          </a-space>
        </template>

        <template #status="{ record }">
          <a-switch
            :model-value="(record as TransferChannel).status === 'enabled'"
            checked-text="启用"
            unchecked-text="禁用"
            @change="() => handleToggleStatus(record as TransferChannel)"
          />
        </template>

        <template #createdAt="{ record }">
          {{ formatDate((record as TransferChannel).createdAt) }}
        </template>

        <template #actions="{ record }">
          <a-space>
            <a-button type="text" size="small" @click="handleEdit(record as TransferChannel)">编辑</a-button>
            <a-button type="text" size="small" status="warning" @click="handleConfigServer(record as TransferChannel)">
              配置服务器
            </a-button>
            <a-button type="text" size="small" status="danger" @click="handleDelete(record as TransferChannel)">删除</a-button>
          </a-space>
        </template>
      </a-table>

      <div class="channel-manage-pagination">
        <a-pagination
          :total="pagination.total"
          :current="pagination.pageNum"
          :page-size="pagination.pageSize"
          show-total
          show-page-size
          @change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
      </div>
    </div>

    <ChannelManageModal
      v-model:visible="modalVisible"
      :channel="editingChannel"
      @save="onSaveChannel"
      @update:visible="handleCloseModal"
    />

    <ChannelServerModal
      v-model:visible="serverModalVisible"
      :channel-name="currentChannelName"
      :available-servers="availableServers"
      :channel-servers="channelServers"
      @save="onSaveServers"
      @update:visible="handleCloseServerModal"
    />
  </div>
</template>
