import type { TransferConfig, ApprovalConfig, NotificationConfig, StorageConfig } from '@/composables/useSystemConfig'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSystemConfig } from '@/composables/useSystemConfig'
import { Message } from '@arco-design/web-vue'

const { getConfigMock, updateConfigMock } = vi.hoisted(() => ({
  getConfigMock: vi.fn(),
  updateConfigMock: vi.fn(),
}))

vi.mock('@/api/systemConfig', () => ({
  systemConfigApi: {
    getConfig: getConfigMock,
    updateConfig: updateConfigMock,
  },
}))

vi.mock('@arco-design/web-vue', async () => {
  const actual = await vi.importActual('@arco-design/web-vue')
  return {
    ...actual,
    Message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }
})

function createDefaultTransferConfig(): TransferConfig {
  return {
    maxFileSize: 50,
    maxFileCount: 20,
    chunkSize: 5,
    maxConcurrent: 3,
    uploadValidity: 7,
    downloadValidity: 30,
  }
}

function createDefaultApprovalConfig(): ApprovalConfig {
  return {
    levelMapping: [
      { typeCode: 'green-to-green', typeName: '绿区传到绿区', level: 0, description: '免审' },
      { typeCode: 'green-to-yellow', typeName: '绿区传到黄区', level: 1, description: '一级审批' },
      { typeCode: 'green-to-red', typeName: '绿区传到红区', level: 2, description: '二级审批' },
    ],
    timeout: 48,
    autoReject: false,
  }
}

function createDefaultNotificationConfig(): NotificationConfig {
  return {
    emailHost: 'smtp.example.com',
    emailPort: 587,
    emailFrom: 'noreply@example.com',
    emailPassword: '',
    smsProvider: 'aliyun',
    smsTemplate: '',
    enabledEvents: ['application_submitted', 'application_approved'],
  }
}

function createDefaultStorageConfig(): StorageConfig {
  return {
    draftValidity: 30,
    cleanupCycle: 7,
    tempFileRetention: 7,
    logRetention: 180,
  }
}

describe('useSystemConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with transfer tab', () => {
    const composable = useSystemConfig()

    expect(composable.activeTab.value).toBe('transfer')
  })

  it('loads transfer config on init', async () => {
    const mockConfig = createDefaultTransferConfig()
    getConfigMock.mockResolvedValueOnce(mockConfig)

    const composable = useSystemConfig()
    await composable.fetchConfig('transfer')

    expect(getConfigMock).toHaveBeenCalledWith('transfer')
    expect(composable.transferConfig.maxFileSize).toBe(50)
    expect(composable.loading.value).toBe(false)
  })

  it('loads approval config with level mapping', async () => {
    const mockConfig = createDefaultApprovalConfig()
    getConfigMock.mockResolvedValueOnce(mockConfig)

    const composable = useSystemConfig()
    await composable.fetchConfig('approval')

    expect(getConfigMock).toHaveBeenCalledWith('approval')
    expect(composable.approvalConfig.levelMapping).toHaveLength(3)
    expect(composable.approvalConfig.timeout).toBe(48)
  })

  it('loads notification config', async () => {
    const mockConfig = createDefaultNotificationConfig()
    getConfigMock.mockResolvedValueOnce(mockConfig)

    const composable = useSystemConfig()
    await composable.fetchConfig('notification')

    expect(getConfigMock).toHaveBeenCalledWith('notification')
    expect(composable.notificationConfig.emailHost).toBe('smtp.example.com')
    expect(composable.notificationConfig.enabledEvents).toContain('application_submitted')
  })

  it('loads storage config', async () => {
    const mockConfig = createDefaultStorageConfig()
    getConfigMock.mockResolvedValueOnce(mockConfig)

    const composable = useSystemConfig()
    await composable.fetchConfig('storage')

    expect(getConfigMock).toHaveBeenCalledWith('storage')
    expect(composable.storageConfig.draftValidity).toBe(30)
    expect(composable.storageConfig.logRetention).toBe(180)
  })

  it('handleTabChange loads new tab config', async () => {
    const mockTransferConfig = createDefaultTransferConfig()
    const mockApprovalConfig = createDefaultApprovalConfig()
    getConfigMock.mockResolvedValueOnce(mockTransferConfig)
    getConfigMock.mockResolvedValueOnce(mockApprovalConfig)

    const composable = useSystemConfig()
    await composable.fetchConfig('transfer')

    await composable.handleTabChange('approval')

    expect(composable.activeTab.value).toBe('approval')
    expect(getConfigMock).toHaveBeenCalledWith('approval')
  })

  it('handleSave saves transfer config', async () => {
    const mockConfig = createDefaultTransferConfig()
    updateConfigMock.mockResolvedValueOnce(mockConfig)

    const composable = useSystemConfig()
    composable.transferConfig.maxFileSize = 100
    await composable.handleSave('transfer')

    expect(updateConfigMock).toHaveBeenCalledWith('transfer', expect.objectContaining({
      maxFileSize: 100,
    }))
    expect(Message.success).toHaveBeenCalledWith('传输配置保存成功')
  })

  it('handleSave saves approval config', async () => {
    const mockConfig = createDefaultApprovalConfig()
    updateConfigMock.mockResolvedValueOnce(mockConfig)

    const composable = useSystemConfig()
    composable.approvalConfig.timeout = 72
    await composable.handleSave('approval')

    expect(updateConfigMock).toHaveBeenCalledWith('approval', expect.objectContaining({
      timeout: 72,
    }))
    expect(Message.success).toHaveBeenCalledWith('审批配置保存成功')
  })

  it('handleSave saves notification config', async () => {
    const mockConfig = createDefaultNotificationConfig()
    updateConfigMock.mockResolvedValueOnce(mockConfig)

    const composable = useSystemConfig()
    composable.notificationConfig.emailHost = 'smtp.newhost.com'
    await composable.handleSave('notification')

    expect(updateConfigMock).toHaveBeenCalledWith('notification', expect.objectContaining({
      emailHost: 'smtp.newhost.com',
    }))
    expect(Message.success).toHaveBeenCalledWith('通知配置保存成功')
  })

  it('handleSave saves storage config', async () => {
    const mockConfig = createDefaultStorageConfig()
    updateConfigMock.mockResolvedValueOnce(mockConfig)

    const composable = useSystemConfig()
    composable.storageConfig.draftValidity = 60
    await composable.handleSave('storage')

    expect(updateConfigMock).toHaveBeenCalledWith('storage', expect.objectContaining({
      draftValidity: 60,
    }))
    expect(Message.success).toHaveBeenCalledWith('存储配置保存成功')
  })



  it('handleSave shows error on API failure', async () => {
    updateConfigMock.mockRejectedValueOnce(new Error('Network error'))

    const composable = useSystemConfig()
    await composable.handleSave('transfer')

    expect(Message.error).toHaveBeenCalledWith('保存配置失败')
  })

  it('fetchConfig shows error on API failure', async () => {
    getConfigMock.mockRejectedValueOnce(new Error('Network error'))

    const composable = useSystemConfig()
    await composable.fetchConfig('transfer')

    expect(Message.error).toHaveBeenCalledWith('加载配置失败')
  })
})
