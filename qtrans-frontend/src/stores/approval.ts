import type { Application, ApprovalAction, ApprovalRecord } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { approvalApi } from '@/api/approval'

function toAction(action: 'approve' | 'reject' | 'skip'): ApprovalAction {
  if (action === 'skip')
    return 'exempt'
  return action
}

export const useApprovalStore = defineStore('approval', () => {
  const pendingApprovals = ref<Application[]>([])
  const approvalHistory = ref<ApprovalRecord[]>([])
  const loading = ref(false)

  const pendingCount = computed(() => pendingApprovals.value.length)

  function pushHistoryRecord(applicationId: string, action: 'approve' | 'reject' | 'skip', opinion: string) {
    const level = (pendingApprovals.value.find(item => item.id === applicationId)?.currentApprovalLevel || 1) as 1 | 2 | 3

    approvalHistory.value.unshift({
      id: `apr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      applicationId,
      level,
      approverId: 'current-user',
      approverName: '当前用户',
      action: toAction(action),
      opinion,
      createdAt: new Date().toISOString(),
    })
  }

  async function fetchPendingApprovals() {
    loading.value = true
    try {
      const list = await approvalApi.getPending()
      pendingApprovals.value = list
      return list
    }
    finally {
      loading.value = false
    }
  }

  async function approve(id: string, comment = '审批通过') {
    const updated = await approvalApi.approve(id, comment)
    pendingApprovals.value = pendingApprovals.value.filter(item => item.id !== id)
    pushHistoryRecord(id, 'approve', comment)
    return updated
  }

  async function reject(id: string, reason = '审批驳回') {
    const updated = await approvalApi.reject(id, reason)
    pendingApprovals.value = pendingApprovals.value.filter(item => item.id !== id)
    pushHistoryRecord(id, 'reject', reason)
    return updated
  }

  async function skip(id: string, reason = '免审通过') {
    const updated = await approvalApi.skip(id, reason)
    pendingApprovals.value = pendingApprovals.value.filter(item => item.id !== id)
    pushHistoryRecord(id, 'skip', reason)
    return updated
  }

  async function fetchApprovalHistory(applicationId: string) {
    return approvalHistory.value.filter(item => item.applicationId === applicationId)
  }

  return {
    pendingApprovals,
    approvalHistory,
    loading,
    pendingCount,
    fetchPendingApprovals,
    approve,
    reject,
    skip,
    fetchApprovalHistory,
  }
})
