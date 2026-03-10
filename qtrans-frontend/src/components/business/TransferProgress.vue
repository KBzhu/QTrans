<script setup lang="ts">
import type { TransferState } from '@/types'
import { computed, onMounted, ref, watch } from 'vue'
import { useFileStore } from '@/stores'
import { formatDuration, formatFileSize, formatTransferSpeed } from '@/utils/format'
import './TransferProgress.scss'

interface Props {
  applicationId: string
  fileSize: number
  autoStart?: boolean
  statusHint?: TransferState['status']
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: false,
  statusHint: 'pending',
})

const emit = defineEmits<{
  complete: []
  error: [error: Error]
}>()

const fileStore = useFileStore()
const actionLoading = ref(false)

const fallbackState = computed<TransferState>(() => ({
  applicationId: props.applicationId,
  status: props.statusHint,
  progress: props.statusHint === 'completed' ? 100 : 0,
  speedBytesPerSec: 0,
  transferredBytes: props.statusHint === 'completed' ? props.fileSize : 0,
  totalBytes: props.fileSize,
  remainingSeconds: 0,
}))

const currentState = computed(() => fileStore.getTransferStateByApplicationId(props.applicationId) || fallbackState.value)

const statusLabelMap: Record<TransferState['status'], string> = {
  pending: '等待传输',
  transferring: '传输中',
  paused: '已暂停',
  completed: '传输完成',
  error: '传输失败',
}

const statusColorMap: Record<TransferState['status'], string> = {
  pending: 'gray',
  transferring: 'arcoblue',
  paused: 'orange',
  completed: 'green',
  error: 'red',
}

const statusText = computed(() => statusLabelMap[currentState.value.status])
const tagColor = computed(() => statusColorMap[currentState.value.status])
const progressStatus = computed(() => {
  if (currentState.value.status === 'error')
    return 'danger'

  if (currentState.value.status === 'completed')
    return 'success'

  return 'normal'
})

const transferredSize = computed(() => formatFileSize(currentState.value.transferredBytes))
const totalSize = computed(() => formatFileSize(currentState.value.totalBytes || props.fileSize))
const speedText = computed(() => formatTransferSpeed(currentState.value.speedBytesPerSec))
const remainingTimeText = computed(() => {
  if (currentState.value.status === 'completed')
    return '已完成'

  if (currentState.value.remainingSeconds <= 0)
    return '--'

  return formatDuration(currentState.value.remainingSeconds)
})

const canStart = computed(() => currentState.value.status === 'pending')
const canPause = computed(() => currentState.value.status === 'transferring')
const canResume = computed(() => currentState.value.status === 'paused')
const canRetry = computed(() => currentState.value.status === 'error')

async function runAction(handler: () => Promise<unknown> | unknown) {
  if (actionLoading.value)
    return

  actionLoading.value = true
  try {
    await handler()
  }
  catch (error) {
    emit('error', error instanceof Error ? error : new Error('传输操作失败'))
  }
  finally {
    actionLoading.value = false
  }
}

function handleStart() {
  return runAction(() => fileStore.startTransfer(props.applicationId))
}

function handlePause() {
  return runAction(() => fileStore.pauseTransfer(props.applicationId))
}

function handleResume() {
  return runAction(() => fileStore.resumeTransfer(props.applicationId))
}

function handleRetry() {
  return runAction(() => fileStore.retryTransfer(props.applicationId))
}

watch(() => currentState.value.status, (status, previousStatus) => {
  if (status === previousStatus)
    return

  if (status === 'completed') {
    emit('complete')
    return
  }

  if (status === 'error')
    emit('error', new Error(currentState.value.errorMessage || '传输失败'))
})

onMounted(() => {
  if (props.autoStart && currentState.value.status === 'pending')
    void handleStart()
})

defineExpose({
  handleStart,
  handlePause,
  handleResume,
  handleRetry,
})
</script>

<template>
  <section class="transfer-progress" data-testid="transfer-progress">
    <header class="transfer-progress__header">
      <div>
        <h3 class="transfer-progress__title">传输进度</h3>
        <p class="transfer-progress__subtitle">申请单：{{ applicationId }}</p>
      </div>
      <a-tag :color="tagColor" bordered>
        {{ statusText }}
      </a-tag>
    </header>

    <a-progress
      :percent="currentState.progress"
      :status="progressStatus"
      :stroke-width="12"
      :show-text="true"
    />

    <div class="transfer-progress__meta">
      <div class="transfer-progress__meta-item">
        <span class="transfer-progress__meta-label">已传输</span>
        <strong class="transfer-progress__meta-value">{{ transferredSize }} / {{ totalSize }}</strong>
      </div>
      <div class="transfer-progress__meta-item">
        <span class="transfer-progress__meta-label">传输速度</span>
        <strong class="transfer-progress__meta-value">{{ speedText }}</strong>
      </div>
      <div class="transfer-progress__meta-item">
        <span class="transfer-progress__meta-label">剩余时间</span>
        <strong class="transfer-progress__meta-value">{{ remainingTimeText }}</strong>
      </div>
    </div>

    <div class="transfer-progress__actions">
      <a-button v-if="canStart" type="primary" size="small" :loading="actionLoading" @click="handleStart">
        开始传输
      </a-button>
      <a-button v-else-if="canPause" status="warning" size="small" :loading="actionLoading" @click="handlePause">
        暂停传输
      </a-button>
      <a-button v-else-if="canResume" type="primary" size="small" :loading="actionLoading" @click="handleResume">
        继续传输
      </a-button>
      <a-button v-else-if="canRetry" status="danger" size="small" :loading="actionLoading" @click="handleRetry">
        重试传输
      </a-button>
    </div>
  </section>
</template>
