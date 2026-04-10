import type { Application, ApplicationStatus, PageRequest, TransferType } from '@/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { applicationApi, type ApplicationQuery } from '@/api/application'
import { STORAGE_KEYS } from '@/utils/constants'
import { getLocalStorage, setLocalStorage } from '@/utils/storage'

interface FetchApplicationParams extends Partial<PageRequest> {
  status?: ApplicationStatus
  transferType?: TransferType
}

function createDraft(data: Partial<Application>): Application {
  const now = new Date().toISOString()

  return {
    id: data.id || `draft-${Date.now()}`,
    applicationNo: data.applicationNo || `DRAFT-${Date.now()}`,
    transferType: data.transferType || 'green-to-green',
    department: data.department || '',
    sourceArea: data.sourceArea || 'green',
    targetArea: data.targetArea || 'green',
    sourceCountry: data.sourceCountry || '中国',
    sourceCity: data.sourceCity || [],
    targetCountry: data.targetCountry || '中国',
    targetCity: data.targetCity || [],
    downloaderAccounts: data.downloaderAccounts || [],
    ccAccounts: data.ccAccounts || [],
    containsCustomerData: data.containsCustomerData || false,

    srNumber: data.srNumber,
    minDeptSupervisor: data.minDeptSupervisor,
    applyReason: data.applyReason || '',
    applicantNotifyOptions: data.applicantNotifyOptions || ['in_app'],
    downloaderNotifyOptions: data.downloaderNotifyOptions || ['in_app'],
    urgencyLevel: data.urgencyLevel,
    status: 'draft',
    applicantId: data.applicantId || '',
    applicantName: data.applicantName || '',
    currentApprovalLevel: data.currentApprovalLevel || 0,
    createdAt: data.createdAt || now,
    updatedAt: now,
  }
}

export const useApplicationStore = defineStore('application', () => {
  const applications = ref<Application[]>([])
  const currentApplication = ref<Application | null>(null)
  const drafts = ref<Application[]>(getLocalStorage<Application[]>(STORAGE_KEYS.DRAFTS) || [])
  const total = ref(0)
  const loading = ref(false)

  function syncDraftStorage() {
    setLocalStorage(STORAGE_KEYS.DRAFTS, drafts.value)
  }

  async function fetchApplications(params: FetchApplicationParams = {}) {
    loading.value = true
    try {
      const query: ApplicationQuery = {
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 10,
        status: params.status,
        transferType: params.transferType,
      }
      const page = await applicationApi.getList(query)

      const remoteMap = new Map(page.list.map(item => [item.id, item]))
      const localOnly = applications.value.filter(item => !remoteMap.has(item.id))
      const merged = [...page.list, ...localOnly]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      applications.value = merged
      total.value = merged.length
      return {
        ...page,
        list: merged,
        total: merged.length,
      }
    }
    finally {
      loading.value = false
    }
  }

  async function fetchApplicationDetail(id: string) {
    loading.value = true
    try {
      const detail = await applicationApi.getDetail(id)
      currentApplication.value = detail
      return detail
    }
    finally {
      loading.value = false
    }
  }

  async function createApplication(data: Partial<Application>) {
    const created = await applicationApi.create(data)
    applications.value = [created, ...applications.value]
    total.value += 1
    return created
  }

  async function updateApplication(id: string, data: Partial<Application>) {
    const updated = await applicationApi.update(id, data)
    applications.value = applications.value.map(item => (item.id === id ? updated : item))

    if (currentApplication.value?.id === id)
      currentApplication.value = updated

    return updated
  }

  async function deleteApplication(id: string) {
    await applicationApi.remove(id)
    applications.value = applications.value.filter(item => item.id !== id)
    drafts.value = drafts.value.filter(item => item.id !== id)
    total.value = Math.max(0, total.value - 1)
    syncDraftStorage()
  }

  async function saveDraft(data: Partial<Application>) {
    const draft = createDraft(data)
    const index = drafts.value.findIndex(item => item.id === draft.id)

    if (index >= 0)
      drafts.value[index] = { ...drafts.value[index], ...draft, status: 'draft', updatedAt: new Date().toISOString() }
    else
      drafts.value.unshift(draft)

    if (data.id && applications.value.some(item => item.id === data.id))
      await applicationApi.saveDraft(data.id, data)

    syncDraftStorage()
    return draft
  }

  function deleteDraft(id: string) {
    drafts.value = drafts.value.filter(item => item.id !== id)
    syncDraftStorage()
  }

  async function submitApplication(id: string) {
    const updated = await updateApplication(id, { status: 'pending_upload' })
    deleteDraft(id)
    return updated
  }

  return {
    applications,
    currentApplication,
    drafts,
    total,
    loading,
    fetchApplications,
    fetchApplicationDetail,
    createApplication,
    updateApplication,
    deleteApplication,
    saveDraft,
    deleteDraft,
    submitApplication,
  }
}, {
  persist: {
    pick: ['drafts', 'applications'],
  },
})

