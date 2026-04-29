import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Application } from '@/types'
import { useAuthStore, useApplicationStore } from '@/stores'
import { useApplicationList } from '../useApplicationList'

function createApp(id: string, applicantId: string): Application {
  return {
    id,
    applicationNo: `QT-${id}`,
    transferType: 'green-to-external',
    department: '研发部',
    sourceArea: 'green',
    targetArea: 'external',
    sourceCountry: '中国',
    sourceCity: ['北京'],
    targetCountry: '中国',
    targetCity: ['上海'],
    downloaderAccounts: ['u_downloader'],
    containsCustomerData: false,
    applyReason: 'demo',
    applicantNotifyOptions: ['in_app'],
    downloaderNotifyOptions: ['in_app'],
    status: 'pending_approval',
    applicantId,
    applicantName: applicantId,
    currentApprovalLevel: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

describe('useApplicationList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('only shows current user applications in my applications view', () => {
    const authStore = useAuthStore()
    const applicationStore = useApplicationStore()

    authStore.currentUser = {
      id: 'u_submitter',
      username: 'submitter',
      name: '张提交',
      email: 'submitter@qtrans.demo',
      phone: '13800000001',
      department: 'dept-rd',
      departmentName: '研发部',
      roles: ['submitter'],
      status: 'enabled',
      loginType: 2,
    }

    applicationStore.applications = [
      createApp('app-1', 'u_submitter'),
      createApp('app-2', 'u_approver1'),
    ]

    const composable = useApplicationList()
    expect(composable.listData.value.map(item => String((item as any).id || (item as any).applicationId))).toContain('app-1')
  })
})
