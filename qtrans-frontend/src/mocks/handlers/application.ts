import type { Application } from '@/types'
import { baseHttp as http } from './_utils'
import { getDemoState } from '../data/demo-init'
import { failed, getPagination, mockDelay, success } from './_utils'

function nextApplicationNo() {
  const seed = Math.floor(1000 + Math.random() * 9000)
  return `QT${new Date().toISOString().slice(0, 10).split('-').join('')}${seed}`
}

function nextRealApplicationNo() {
  // 模拟真实后端申请单号格式: MWEHR + 时间戳后6位 + 随机4位
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(1000 + Math.random() * 9000)
  return `MWEHR${timestamp}${random}`
}

export const applicationHandlers = [
  http.get('/api/applications', async ({ request }) => {
    await mockDelay(250)

    const state = getDemoState()
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const transferType = url.searchParams.get('transferType')

    const filtered = state.applications.filter((item) => {
      const statusMatched = status ? item.status === status : true
      const transferTypeMatched = transferType ? item.transferType === transferType : true
      return statusMatched && transferTypeMatched
    })

    const page = getPagination(url).toPage(filtered)
    return success(page)
  }),

  http.get('/api/applications/drafts', async () => {
    await mockDelay(150)
    const state = getDemoState()
    return success(state.applications.filter(item => item.status === 'draft'))
  }),

  http.get('/api/applications/:id', async ({ params }) => {
    await mockDelay(150)
    const state = getDemoState()
    const id = String(params.id)
    const record = state.applications.find(item => item.id === id)

    if (!record)
      return failed('申请单不存在', 404)

    return success(record)
  }),

  http.post('/api/applications', async ({ request }) => {
    await mockDelay(300)

    const payload = await request.json() as Partial<Application>
    const state = getDemoState()
    const now = new Date().toISOString()

    const created: Application = {
      id: payload.id || `app-${Date.now()}`,
      applicationNo: payload.applicationNo || nextApplicationNo(),
      transferType: payload.transferType || 'green-to-green',
      department: payload.department || '研发部',
      sourceArea: payload.sourceArea || 'green',
      targetArea: payload.targetArea || 'green',
      sourceCountry: payload.sourceCountry || '中国',
      sourceCity: payload.sourceCity || ['北京'],
      targetCountry: payload.targetCountry || '中国',
      targetCity: payload.targetCity || ['上海'],
      downloaderAccounts: payload.downloaderAccounts || [],
      containsCustomerData: payload.containsCustomerData || false,
      srNumber: payload.srNumber,
      minDeptSupervisor: payload.minDeptSupervisor,
      applyReason: payload.applyReason || '',
      applicantNotifyOptions: payload.applicantNotifyOptions || ['in_app'],
      downloaderNotifyOptions: payload.downloaderNotifyOptions || ['in_app'],
      urgencyLevel: payload.urgencyLevel,
      status: payload.status || 'pending_approval',
      applicantId: payload.applicantId || 'u_submitter',
      applicantName: payload.applicantName || '张提交',
      currentApprovalLevel: payload.currentApprovalLevel || 1,
      createdAt: now,
      updatedAt: now,
    }

    state.applications.unshift(created)
    return success(created, '创建成功')
  }),

  http.put('/api/applications/:id', async ({ params, request }) => {
    await mockDelay(250)

    const id = String(params.id)
    const payload = await request.json() as Partial<Application>
    const state = getDemoState()
    const index = state.applications.findIndex(item => item.id === id)

    if (index < 0)
      return failed('申请单不存在', 404)

    const patch = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as Partial<Application>
    const current = state.applications[index]

    if (!current)
      return failed('申请单不存在', 404)

    Object.assign(current, patch, {
      id,
      updatedAt: new Date().toISOString(),
    })

    return success(current, '更新成功')

  }),


  http.delete('/api/applications/:id', async ({ params }) => {
    await mockDelay(200)
    const id = String(params.id)
    const state = getDemoState()
    const index = state.applications.findIndex(item => item.id === id)

    if (index < 0)
      return failed('申请单不存在', 404)

    state.applications.splice(index, 1)
    return success(null, '删除成功')
  }),

  http.post('/api/applications/:id/save-draft', async ({ params, request }) => {
    await mockDelay(200)

    const id = String(params.id)
    const payload = await request.json() as Partial<Application>
    const state = getDemoState()
    const index = state.applications.findIndex(item => item.id === id)

    if (index < 0)
      return failed('申请单不存在', 404)

    const patch = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as Partial<Application>
    const current = state.applications[index]

    if (!current)
      return failed('申请单不存在', 404)

    Object.assign(current, patch, {
      id,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    })

    return success(current, '草稿已保存')


  }),

  // ========================================
  // 真实后端接口 Mock（兜底方案）
  // 当后端调不通时，MSW 会拦截此请求返回 mock 数据
  // ========================================
  http.post('/workflowService/services/frontendService/frontend/application/create', async ({ request }) => {
    await mockDelay(500)

    const payload = await request.json() as Record<string, any>
    const state = getDemoState()
    const now = new Date().toISOString()
    const applicationId = `real-${Date.now()}`
    const applicationNo = nextRealApplicationNo()

    // 创建本地申请单记录（用于列表展示）
    const created: Application = {
      id: applicationId,
      applicationNo,
      transferType: payload.appBaseInfo?.transferType || 'green-to-green',
      department: payload.appBaseInfo?.department || '',
      departmentId: payload.appBaseInfo?.departmentId,
      sourceArea: payload.appBaseCountryCityRegionRelation?.sourceAreaType === 1 ? 'green'
        : payload.appBaseCountryCityRegionRelation?.sourceAreaType === 2 ? 'yellow' : 'red',
      targetArea: payload.appBaseCountryCityRegionRelation?.targetAreaType === 1 ? 'green'
        : payload.appBaseCountryCityRegionRelation?.targetAreaType === 2 ? 'yellow' : 'red',
      sourceCountry: '中国',
      sourceCity: [payload.appBaseCountryCityRegionRelation?.sourceProvince || '', payload.appBaseCountryCityRegionRelation?.sourceCity || ''],
      sourceCityId: payload.appBaseCountryCityRegionRelation?.sourceCityId,
      targetCountry: '中国',
      targetCity: [payload.appBaseCountryCityRegionRelation?.targetProvince || '', payload.appBaseCountryCityRegionRelation?.targetCity || ''],
      targetCityId: payload.appBaseCountryCityRegionRelation?.targetCityId,
      downloaderAccounts: payload.appBaseUploadDownloadInfo?.downloadW3Account?.split(',') || [],
      containsCustomerData: payload.appBaseInfo?.ifCustomerData === 1,
      srNumber: payload.appBaseInfo?.srNo,
      minDeptSupervisor: payload.appBaseInfo?.minDeptManager,
      applyReason: payload.appBaseInfo?.applyReason || '',
      applicantNotifyOptions: payload.appBaseInfo?.applicantNotifyType ? ['in_app'] : [],
      downloaderNotifyOptions: payload.appBaseUploadDownloadInfo?.downloaderNotifyType ? ['in_app'] : [],
      status: 'pending_approval',
      applicantId: 'u_submitter',
      applicantName: '张提交',
      currentApprovalLevel: 1,
      createdAt: now,
      updatedAt: now,
    }

    state.applications.unshift(created)

    // 返回真实后端接口格式
    return success({
      applicationId,
      applicationNo,
      status: 'pending_approval',
      message: '申请单创建成功',
    }, '操作成功')
  }),

]
