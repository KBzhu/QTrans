<script setup lang="ts">
import type { ChannelServer, ChannelServerBinding, ChannelStatus } from '@/types'
import { computed, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'

interface Props {
  visible: boolean
  channelName: string
  availableServers: ChannelServer[]
  channelServers: ChannelServerBinding[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'save', servers: Array<{ serverId: string, port: number, priority: number, status: ChannelStatus }>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedServerIds = ref<string[]>([])
const selectedServerConfigs = ref<Array<{ serverId: string, name: string, ip: string, port: number, priority: number, status: ChannelStatus }>>([])
const draggingServerId = ref('')

const transferData = computed(() => {
  return props.availableServers.map(server => ({
    value: server.id,
    label: `${server.name} (${server.ip})`,
    disabled: server.status === 'disabled',
  }))
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return

    const sorted = [...props.channelServers].sort((a, b) => a.priority - b.priority)
    selectedServerIds.value = sorted.map(item => item.serverId)
    selectedServerConfigs.value = sorted.map((item, index) => ({
      serverId: item.serverId,
      name: item.name,
      ip: item.ip,
      port: item.port,
      priority: index + 1,
      status: item.status,
    }))
  },
)

watch(selectedServerIds, (ids) => {
  const existing = new Map(selectedServerConfigs.value.map(item => [item.serverId, item]))

  selectedServerConfigs.value = ids.map((serverId, index) => {
    const current = existing.get(serverId)
    if (current)
      return { ...current, priority: index + 1 }

    const server = props.availableServers.find(item => item.id === serverId)
    return {
      serverId,
      name: server?.name || '未知服务器',
      ip: server?.ip || '-',
      port: server?.port || 8443,
      priority: index + 1,
      status: 'enabled' as ChannelStatus,
    }
  })
})

function handleCancel() {
  emit('update:visible', false)
}

function handleDragStart(serverId: string) {
  draggingServerId.value = serverId
}

function handleDrop(targetServerId: string) {
  if (!draggingServerId.value || draggingServerId.value === targetServerId)
    return

  const sourceIndex = selectedServerConfigs.value.findIndex(item => item.serverId === draggingServerId.value)
  const targetIndex = selectedServerConfigs.value.findIndex(item => item.serverId === targetServerId)

  if (sourceIndex < 0 || targetIndex < 0)
    return

  const moved = selectedServerConfigs.value[sourceIndex]
  const next = [...selectedServerConfigs.value]
  next.splice(sourceIndex, 1)
  next.splice(targetIndex, 0, moved)

  selectedServerConfigs.value = next.map((item, index) => ({ ...item, priority: index + 1 }))
  selectedServerIds.value = selectedServerConfigs.value.map(item => item.serverId)
  draggingServerId.value = ''
}

function handleDragEnd() {
  draggingServerId.value = ''
}

function handleOk() {
  if (selectedServerConfigs.value.length === 0) {
    Message.warning('请至少选择一台服务器')
    return
  }

  const payload = selectedServerConfigs.value.map(item => ({
    serverId: item.serverId,
    port: item.port,
    priority: item.priority,
    status: item.status,
  }))

  emit('save', payload)
}
</script>

<template>
  <a-modal
    :visible="visible"
    :title="`配置服务器 - ${channelName || '传输通道'}`"
    :mask-closable="false"
    width="920px"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <div class="channel-server-modal">
      <a-transfer
        v-model="selectedServerIds"
        :data="transferData"
        :title="['可选服务器', '已选服务器']"
        :show-search="true"
      />

      <div class="selected-server-config">
        <h4>已选服务器配置（支持拖拽排序）</h4>

        <div v-if="selectedServerConfigs.length" class="selected-server-list">
          <div
            v-for="item in selectedServerConfigs"
            :key="item.serverId"
            class="selected-server-item"
            draggable="true"
            @dragstart="handleDragStart(item.serverId)"
            @dragover.prevent
            @drop="handleDrop(item.serverId)"
            @dragend="handleDragEnd"
          >
            <div class="item-left">
              <icon-drag-dot-vertical />
              <span class="item-priority">#{{ item.priority }}</span>
              <span class="item-name">{{ item.name }}</span>
              <span class="item-ip">{{ item.ip }}</span>
            </div>

            <div class="item-right">
              <a-input-number v-model="item.port" :min="1" :max="65535" size="small" placeholder="端口" />
              <a-switch
                :model-value="item.status === 'enabled'"
                size="small"
                checked-text="启用"
                unchecked-text="禁用"
                @change="(value) => { item.status = value ? 'enabled' : 'disabled' }"
              />
            </div>
          </div>
        </div>

        <a-empty v-else description="请先从左侧选择服务器" />
      </div>
    </div>
  </a-modal>
</template>
