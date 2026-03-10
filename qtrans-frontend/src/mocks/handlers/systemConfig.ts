import { http, HttpResponse } from 'msw'

// 默认配置数据
const defaultConfigs = {
  transfer: {
    maxFileSize: 50,
    maxFileCount: 20,
    chunkSize: 5,
    maxConcurrent: 3,
    uploadValidity: 7,
    downloadValidity: 30
  },
  approval: {
    levelMapping: [
      {
        typeCode: 'green-to-green',
        typeName: '绿区传到绿区（非研发到非研发）',
        level: 0,
        description: '免审'
      },
      {
        typeCode: 'green-to-yellow',
        typeName: '绿区传到黄区（非研发到研发）',
        level: 1,
        description: '一级审批'
      },
      {
        typeCode: 'green-to-internet',
        typeName: '绿区传到外网',
        level: 1,
        description: '一级审批'
      },
      {
        typeCode: 'green-to-red',
        typeName: '绿区传到红区',
        level: 2,
        description: '二级审批'
      },
      {
        typeCode: 'green-to-hisilicon-red',
        typeName: '绿区传到海思红区',
        level: 2,
        description: '二级审批'
      },
      {
        typeCode: 'yellow-to-yellow',
        typeName: '黄区传到黄区（研发到研发）',
        level: 1,
        description: '一级审批'
      },
      {
        typeCode: 'yellow-to-red',
        typeName: '黄区传到红区',
        level: 2,
        description: '二级审批'
      },
      {
        typeCode: 'red-to-red',
        typeName: '红区传到红区',
        level: 2,
        description: '二级审批'
      },
      {
        typeCode: 'cross-country',
        typeName: '跨国传输',
        level: 3,
        description: '三级审批'
      },
      {
        typeCode: 'routine-daily',
        typeName: '例行-日报',
        level: 0,
        description: '免审'
      },
      {
        typeCode: 'routine-weekly',
        typeName: '例行-周报',
        level: 0,
        description: '免审'
      }
    ],
    timeout: 48,
    autoReject: false
  },
  notification: {
    emailHost: 'smtp.example.com',
    emailPort: 587,
    emailFrom: 'noreply@example.com',
    emailPassword: '',
    smsProvider: 'aliyun',
    smsTemplate: '',
    enabledEvents: [
      'application_submitted',
      'application_approved',
      'application_rejected',
      'transfer_completed',
      'download_ready'
    ]
  },
  storage: {
    draftValidity: 30,
    cleanupCycle: 7,
    tempFileRetention: 7,
    logRetention: 180
  }
}

// 当前配置（可修改）
const currentConfigs = { ...defaultConfigs }

/**
 * 系统配置相关 handlers
 */
export const systemConfigHandlers = [
  // 获取配置
  http.get('/api/system-config/:tab', ({ params }) => {
    const { tab } = params
    const config = currentConfigs[tab as keyof typeof currentConfigs]

    if (!config) {
      return HttpResponse.json(
        {
          code: 404,
          message: '配置不存在',
          data: null
        },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      code: 200,
      message: 'success',
      data: config
    })
  }),

  // 更新配置
  http.put('/api/system-config/:tab', async ({ params, request }) => {
    const { tab } = params
    const data = await request.json()

    if (!currentConfigs[tab as keyof typeof currentConfigs]) {
      return HttpResponse.json(
        {
          code: 404,
          message: '配置不存在',
          data: null
        },
        { status: 404 }
      )
    }

    // 更新配置
    currentConfigs[tab as keyof typeof currentConfigs] = data as any

    return HttpResponse.json({
      code: 200,
      message: '配置保存成功',
      data: null
    })
  })
]
