<script setup lang="ts">
import { computed } from 'vue'
import type { Application } from '@/types'
import { assetPath } from '@/utils/path'

interface Props {
  submittedApplication: Application | null
  transferTypeLabel: string
  fileCount: number
  formData: {
    department: string
    downloaderAccounts: string[]
  }
  basicInfoApplicant: string
}

const props = defineProps<Props>()

interface Emits {
  (e: 'goHome'): void
  (e: 'goMyApplications'): void
}

const emit = defineEmits<Emits>()

const summaryRows = computed(() => {
  return [
    { label: '申请类型', value: props.transferTypeLabel },
    { label: '申请人', value: props.basicInfoApplicant || '--' },
    { label: '所属部门', value: props.formData.department || '--' },
    { label: '文件数量', value: `${props.fileCount} 个` },
    { label: '审批人', value: 'zhaodan' },
    { label: '下载人', value: props.formData.downloaderAccounts.join('、') || '--' },
  ]
})
</script>

<template>
  <div class="submit-success">
    <div class="submit-success__icon" aria-hidden="true">
      <img :src="assetPath('/figma/3960_2183/3.svg')" alt="" class="submit-success__icon-bg" />
      <img :src="assetPath('/figma/3960_2183/4.svg')" alt="" class="submit-success__icon-check" />
    </div>

    <h2>申请已提交成功！</h2>
    <p class="submit-success__no">申请单号：{{ submittedApplication?.applicationNo || '--' }}</p>
    <p class="submit-success__desc">您的申请已经提交成功，等待审批中...</p>

    <div class="submit-success__detail">
      <h3>申请详情</h3>
      <div class="submit-success__detail-grid">
        <div v-for="item in summaryRows" :key="item.label" class="detail-item">
          <span class="detail-item__label">{{ item.label }}：</span>
          <span class="detail-item__value">{{ item.value }}</span>
        </div>
      </div>
    </div>

    <div class="submit-success__actions">
      <a-button @click="emit('goHome')">返回首页</a-button>
      <a-button type="primary" @click="emit('goMyApplications')">查看我的申请</a-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
// 样式继承自父组件的 create-application.scss
</style>
