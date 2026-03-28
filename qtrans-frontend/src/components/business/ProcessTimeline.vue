<script setup lang="ts">
import type { ProcessDetailsResponse, ProcessStepItem } from '@/api/application'
import { IconCheckCircleFill, IconClockCircle } from '@arco-design/web-vue/es/icon'
import { applicationApi } from '@/api/application'
import dayjs from 'dayjs'
import { computed, onMounted, ref, watch } from 'vue'

interface Props {
  applicationId: string | number
}

const props = defineProps<Props>()

const loading = ref(false)
const processData = ref<ProcessDetailsResponse | null>(null)

// 按时间排序的步骤列表
const sortedSteps = computed<ProcessStepItem[]>(() => {
  if (!processData.value?.listSteps)
    return []
  return [...processData.value.listSteps].sort((a, b) =>
    dayjs(a.creationDate).valueOf() - dayjs(b.creationDate).valueOf(),
  )
})

// 判断步骤状态：completed/in-progress/pending
function getStepStatus(step: ProcessStepItem, index: number): 'completed' | 'in-progress' | 'pending' {
  // 有 lastUpdateDate 表示已完成
  if (step.lastUpdateDate)
    return 'completed'

  // 最后一个步骤如果没有 lastUpdateDate，表示正在进行
  if (index === sortedSteps.value.length - 1)
    return 'in-progress'

  return 'pending'
}

// 步骤颜色
function getStepColor(step: ProcessStepItem, index: number): string {
  const status = getStepStatus(step, index)
  if (status === 'completed')
    return 'green'
  if (status === 'in-progress')
    return 'arcoblue'
  return 'gray'
}

// 格式化用时
function formatUsedTime(seconds: number): string {
  if (seconds <= 0)
    return '-'
  if (seconds < 60)
    return `${seconds}秒`
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}小时${minutes}分`
}

// 获取流程数据
async function fetchProcessDetails() {
  if (!props.applicationId)
    return

  loading.value = true
  try {
    const res = await applicationApi.getProcessDetails(props.applicationId)
    processData.value = res
  }
  catch (error) {
    console.error('获取流程进展失败:', error)
  }
  finally {
    loading.value = false
  }
}

// 监听 applicationId 变化
watch(() => props.applicationId, () => {
  fetchProcessDetails()
})

onMounted(() => {
  fetchProcessDetails()
})

// 暴露刷新方法
defineExpose({
  refresh: fetchProcessDetails,
})
</script>

<template>
  <section class="process-timeline">
    <a-spin :loading="loading" style="width: 100%">
      <a-timeline v-if="sortedSteps.length > 0">
        <a-timeline-item
          v-for="(step, index) in sortedSteps"
          :key="`${step.applicationId}-${step.applicationStatus}`"
          :color="getStepColor(step, index)"
        >
          <div class="process-timeline__node">
            <div class="process-timeline__node-title">
              <IconCheckCircleFill v-if="getStepStatus(step, index) === 'completed'" />
              <IconClockCircle v-else-if="getStepStatus(step, index) === 'in-progress'" />
              <span>{{ step.statusName }}</span>
              <a-tag
                v-if="getStepStatus(step, index) === 'completed'"
                color="green"
                size="small"
              >
                已完成
              </a-tag>
              <a-tag
                v-else-if="getStepStatus(step, index) === 'in-progress'"
                color="arcoblue"
                size="small"
              >
                进行中
              </a-tag>
            </div>
            <div class="process-timeline__node-meta">
              <span>{{ dayjs(step.creationDate).format('YYYY/MM/DD HH:mm:ss') }}</span>
              <span v-if="step.usedTime > 0" class="process-timeline__time">
                · 用时 {{ formatUsedTime(step.usedTime) }}
              </span>
            </div>
          </div>
        </a-timeline-item>
      </a-timeline>
      <a-empty v-else description="暂无流程进展" />
    </a-spin>
  </section>
</template>

<style scoped lang="scss">
.process-timeline {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 20px;

  :deep(.arco-timeline-item-content) {
    padding-bottom: 18px;
  }

  &__node {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__node-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #1e293b;
    font-size: 14px;
    font-weight: 600;
  }

  &__node-meta {
    color: #64748b;
    font-size: 13px;
    line-height: 1.5;
  }

  &__time {
    color: #94a3b8;
    margin-left: 4px;
  }
}
</style>
