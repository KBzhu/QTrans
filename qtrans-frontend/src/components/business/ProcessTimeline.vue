<script setup lang="ts">
import type { ApprovalLogItem } from '@/api/approval'
import type { ProcessDetailsResponse, ProcessStepItem } from '@/api/application'
import { IconCheckCircleFill, IconClockCircle, IconCloseCircleFill } from '@arco-design/web-vue/es/icon'
import { approvalApi } from '@/api/approval'
import { applicationApi } from '@/api/application'
import dayjs from 'dayjs'
import { computed, onMounted, ref, watch } from 'vue'

interface Props {
  applicationId: string | number
}

const props = defineProps<Props>()

const loading = ref(false)
const processData = ref<ProcessDetailsResponse | null>(null)
const approvalLogs = ref<ApprovalLogItem[]>([])

/** 步骤与审批日志的匹配结果 */
interface StepWithLog extends ProcessStepItem {
  matchedLog?: ApprovalLogItem
}

// 按时间排序的步骤列表，并关联审批日志
const sortedSteps = computed<StepWithLog[]>(() => {
  if (!processData.value?.listSteps)
    return []
  const steps = [...processData.value.listSteps].sort((a, b) =>
    dayjs(a.creationDate).valueOf() - dayjs(b.creationDate).valueOf(),
  )

  // 为每个步骤匹配对应的审批日志
  const usedLogIds = new Set<number>()
  return steps.map((step) => {
    const matched = findMatchingLog(step, usedLogIds)
    if (matched) {
      usedLogIds.add(matched.approval_log_id)
    }
    return { ...step, matchedLog: matched }
  })
})

/**
 * 为步骤匹配审批日志
 * 优先按名称匹配（statusName ≈ approve_node_name），不匹配则按 lastUpdateDate 匹配
 */
function findMatchingLog(step: ProcessStepItem, usedLogIds: Set<number>): ApprovalLogItem | undefined {
  // 1. 按名称匹配
  const nameMatch = approvalLogs.value.find(
    log => !usedLogIds.has(log.approval_log_id)
      && log.approve_node_name
      && (step.statusName === log.approve_node_name
        || step.statusName.includes(log.approve_node_name)
        || log.approve_node_name.includes(step.statusName)),
  )
  if (nameMatch)
    return nameMatch

  // 2. 按 lastUpdateDate 匹配
  if (step.lastUpdateDate) {
    const stepTime = dayjs(step.lastUpdateDate).valueOf()
    const timeMatch = approvalLogs.value.find(
      log => !usedLogIds.has(log.approval_log_id)
        && log.lastUpdateDate
        && Math.abs(dayjs(log.lastUpdateDate).valueOf() - stepTime) < 2000, // 2秒容差
    )
    if (timeMatch)
      return timeMatch
  }

  return undefined
}

// 判断步骤状态
function getStepStatus(step: StepWithLog, index: number): 'completed' | 'in-progress' | 'pending' {
  if (step.lastUpdateDate)
    return 'completed'
  if (index === sortedSteps.value.length - 1)
    return 'in-progress'
  return 'pending'
}

// 步骤时间线颜色
function getStepColor(step: StepWithLog, index: number): string {
  const status = getStepStatus(step, index)
  if (status === 'in-progress')
    return 'arcoblue'
  if (status === 'pending')
    return 'gray'
  // completed: 检查是否被驳回
  if (step.matchedLog?.approve_type === 0)
    return 'red'
  return 'green'
}

// 步骤标签信息
function getStepTag(step: StepWithLog, index: number) {
  const status = getStepStatus(step, index)
  if (status === 'in-progress')
    return { text: '进行中', color: 'arcoblue' }
  if (status === 'pending')
    return null
  if (step.matchedLog?.approve_type === 0)
    return { text: '驳回', color: 'red' }
  if (step.matchedLog?.approve_type === 1)
    return { text: '通过', color: 'green' }
  return { text: '已完成', color: 'green' }
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

// 并行获取流程数据 + 审批日志
async function fetchProcessDetails() {
  if (!props.applicationId)
    return

  loading.value = true
  try {
    const [processRes, logRes] = await Promise.all([
      applicationApi.getProcessDetails(props.applicationId),
      approvalApi.getApprovalLog(props.applicationId).catch(() => []),
    ])
    processData.value = processRes
    approvalLogs.value = logRes || []
  }
  catch (error) {
    console.error('获取流程进展失败:', error)
  }
  finally {
    loading.value = false
  }
}

watch(() => props.applicationId, () => {
  fetchProcessDetails()
})

onMounted(() => {
  fetchProcessDetails()
})

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
          :key="`${step.applicationId}-${step.applicationStatus}-${index}`"
          :color="getStepColor(step, index)"
        >
          <div class="process-timeline__node">
            <div class="process-timeline__node-title">
              <IconCheckCircleFill
                v-if="getStepStatus(step, index) === 'completed' && step.matchedLog?.approve_type !== 0"
              />
              <IconCloseCircleFill
                v-else-if="getStepStatus(step, index) === 'completed' && step.matchedLog?.approve_type === 0"
              />
              <IconClockCircle v-else-if="getStepStatus(step, index) === 'in-progress'" />
              <span>{{ step.statusName }}</span>
              <a-tag
                v-if="getStepTag(step, index)"
                :color="getStepTag(step, index)!.color"
                size="small"
              >
                {{ getStepTag(step, index)!.text }}
              </a-tag>
            </div>
            <div class="process-timeline__node-meta">
              <span>{{ dayjs(step.creationDate).format('YYYY/MM/DD HH:mm:ss') }}</span>
              <span v-if="step.usedTime > 0" class="process-timeline__time">
                · 用时 {{ formatUsedTime(step.usedTime) }}
              </span>
            </div>
            <!-- 审批日志详情 -->
            <div v-if="step.matchedLog" class="process-timeline__approval-detail">
              <span class="process-timeline__approver">
                {{ step.matchedLog.approver_w3_account || '-' }}
              </span>
              <span v-if="step.matchedLog.comments" class="process-timeline__comment">
                {{ step.matchedLog.comments }}
              </span>
              <span class="process-timeline__log-time">
                {{ dayjs(step.matchedLog.lastUpdateDate).format('YYYY/MM/DD HH:mm:ss') }}
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

  &__approval-detail {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 12px;
    margin-top: 2px;
    padding: 6px 10px;
    background: #f8fafc;
    border-radius: 6px;
    font-size: 12px;
    color: #475569;
    line-height: 1.6;
  }

  &__approver {
    font-weight: 500;
    color: #1e293b;
  }

  &__comment {
    color: #64748b;
  }

  &__log-time {
    color: #94a3b8;
  }
}
</style>
