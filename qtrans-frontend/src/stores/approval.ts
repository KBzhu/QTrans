import type { ApprovalRecord } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { approvalApi } from '@/api/approval'

export const useApprovalStore = defineStore('approval', () => {
  const approvalHistory = ref<ApprovalRecord[]>([])
  const loading = ref(false)
  const pendingCount = ref(0)

  const pendingCountValue = computed(() => pendingCount.value)

  async function fetchPendingApprovals(pageSize = 20, pageNum = 1) {
    loading.value = true
    try {
      const result = await approvalApi.getWaitingForApproval(pageSize, pageNum)
      pendingCount.value = result.pageVO?.totalRows ?? result.result?.length ?? 0
      return result
    }
    finally {
      loading.value = false
    }
  }

  async function approve(applicationId: number, comments = '审批通过') {
    return approvalApi.userApproved({
      approvedType: 1,
      comments,
      appBpmWorkFlow: { applicationId },
    })
  }

  async function reject(applicationId: number, comments = '审批驳回') {
    return approvalApi.userApproved({
      approvedType: 0,
      comments,
      appBpmWorkFlow: { applicationId },
    })
  }

  async function fetchApprovalHistory(applicationId: string) {
    const records = await approvalApi.getHistory(applicationId)
    const localRecords = approvalHistory.value.filter(item => item.applicationId === applicationId)

    const mergedMap = new Map<string, ApprovalRecord>()
    ;[...records, ...localRecords].forEach((item) => {
      mergedMap.set(item.id, item)
    })

    const merged = [...mergedMap.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    approvalHistory.value = [
      ...approvalHistory.value.filter(item => item.applicationId !== applicationId),
      ...merged,
    ]

    return merged
  }


  return {
    approvalHistory,
    loading,
    pendingCount: pendingCountValue,
    fetchPendingApprovals,
    approve,
    reject,
    fetchApprovalHistory,
  }
})

