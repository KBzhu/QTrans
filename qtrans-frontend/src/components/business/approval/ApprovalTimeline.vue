<script setup lang="ts">
import type { ApprovalRecord, ApplicationStatus } from '@/types'
import { IconCheckCircleFill, IconClockCircle } from '@arco-design/web-vue/es/icon'
import dayjs from 'dayjs'
import { computed } from 'vue'

interface Props {
  applicationId: string
  applicantName: string
  submittedAt: string
  approvalRecords: ApprovalRecord[]
  currentLevel: number
  totalLevels: number
  status: ApplicationStatus
}

const props = defineProps<Props>()

const sortedRecords = computed(() => {
  return [...props.approvalRecords].sort((a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf())
})

const recordMap = computed(() => {
  return sortedRecords.value.reduce<Record<number, ApprovalRecord>>((acc, item) => {
    acc[item.level] = item
    return acc
  }, {})
})

const showFinishedNode = computed(() => ['approved', 'rejected', 'transferring', 'completed'].includes(props.status))

function levelTitle(level: number) {
  const levelMap: Record<number, string> = {
    1: '一级审批',
    2: '二级审批',
    3: '三级审批',
  }

  return levelMap[level] || `${level}级审批`
}

function actionText(action: ApprovalRecord['action']) {
  if (action === 'approve')
    return '已通过'
  if (action === 'reject')
    return '已驳回'
  return '已免审'
}

function actionTagColor(action: ApprovalRecord['action']) {
  if (action === 'approve')
    return 'green'
  if (action === 'reject')
    return 'red'
  return 'orangered'
}

function nodeColor(level: number) {
  const record = recordMap.value[level]
  if (record)
    return record.action === 'reject' ? 'red' : 'green'

  if (props.status === 'pending_approval' && props.currentLevel === level)
    return 'arcoblue'

  return 'gray'
}
</script>

<template>
  <section class="approval-timeline">
    <a-timeline>
      <a-timeline-item color="green">
        <div class="approval-timeline__node">
          <div class="approval-timeline__node-title">
            <IconCheckCircleFill />
            <span>申请已提交</span>
          </div>
          <div class="approval-timeline__node-meta">
            申请人：{{ applicantName || '-' }} · {{ dayjs(submittedAt).format('YYYY/MM/DD HH:mm:ss') }}
          </div>
        </div>
      </a-timeline-item>

      <a-timeline-item
        v-for="level in totalLevels"
        :key="`${applicationId}-${level}`"
        :color="nodeColor(level)"
      >
        <div class="approval-timeline__node">
          <div class="approval-timeline__node-title">
            <span>{{ levelTitle(level) }}</span>
            <a-tag v-if="recordMap[level]" :color="actionTagColor(recordMap[level].action)">
              {{ actionText(recordMap[level].action) }}
            </a-tag>
            <a-tag v-else-if="status === 'pending_approval' && currentLevel === level" color="arcoblue">审批中</a-tag>
            <a-tag v-else color="gray">待处理</a-tag>
          </div>

          <div v-if="recordMap[level]" class="approval-timeline__node-meta">
            审批人：{{ recordMap[level].approverName }} · {{ dayjs(recordMap[level].createdAt).format('YYYY/MM/DD HH:mm:ss') }}
          </div>

          <a-typography-paragraph
            v-if="recordMap[level]?.opinion"
            class="approval-timeline__opinion"
            :ellipsis="{ rows: 3, expandable: true }"
          >
            审批意见：{{ recordMap[level]?.opinion }}
          </a-typography-paragraph>
        </div>
      </a-timeline-item>

      <a-timeline-item v-if="showFinishedNode" color="green">
        <div class="approval-timeline__node">
          <div class="approval-timeline__node-title">
            <IconClockCircle />
            <span>审批流程结束</span>
          </div>
          <div class="approval-timeline__node-meta">当前状态：{{ status }}</div>
        </div>
      </a-timeline-item>
    </a-timeline>
  </section>
</template>

<style scoped lang="scss" src="./approval-timeline.scss"></style>
