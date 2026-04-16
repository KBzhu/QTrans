import { ref, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'
import { systemConfigApi } from '@/api/systemConfig'

/**
 * 传输配置类型
 */
export interface TransferConfig {
  maxFileSize: number // GB
  maxFileCount: number
  chunkSize: number // MB
  maxConcurrent: number
  uploadValidity: number // 天
  downloadValidity: number // 天
}

/**
 * 审批层级映射
 */
export interface ApprovalLevelMapping {
  typeCode: string
  typeName: string
  level: number
  description: string
}

/**
 * 审批配置类型
 */
export interface ApprovalConfig {
  levelMapping: ApprovalLevelMapping[]
  timeout: number // 小时
  autoReject: boolean
}

/**
 * 通知配置类型
 */
export interface NotificationConfig {
  emailHost: string
  emailPort: number
  emailFrom: string
  emailPassword: string
  smsProvider: string
  smsTemplate: string
  enabledEvents: string[]
}

/**
 * 存储配置类型
 */
export interface StorageConfig {
  draftValidity: number // 天
  cleanupCycle: number // 天
  tempFileRetention: number // 天
  logRetention: number // 天
}

/**
 * Tab 类型
 */
export type ConfigTab = 'transfer' | 'approval' | 'notification' | 'storage'

/**
 * 系统配置 composable
 */
export function useSystemConfig() {
  // 当前激活的 Tab
  const activeTab = ref<ConfigTab>('transfer')

  // 加载状态
  const loading = ref(false)

  // 传输配置
  const transferConfig = reactive<TransferConfig>({
    maxFileSize: 50,
    maxFileCount: 20,
    chunkSize: 5,
    maxConcurrent: 3,
    uploadValidity: 7,
    downloadValidity: 30
  })

  // 审批配置
  const approvalConfig = reactive<ApprovalConfig>({
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
        typeCode: 'green-to-external',
        typeName: '绿区传到外网',
        level: 2,
        description: '二级审批'
      },
      {
        typeCode: 'yellow-to-external',
        typeName: '黄区传到外网',
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
        typeCode: 'external-to-external',
        typeName: '外网传到外网',
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
  })

  // 通知配置
  const notificationConfig = reactive<NotificationConfig>({
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
  })

  // 存储配置
  const storageConfig = reactive<StorageConfig>({
    draftValidity: 30,
    cleanupCycle: 7,
    tempFileRetention: 7,
    logRetention: 180
  })

  // 审批层级选项
  const levelOptions = [
    { label: '免审', value: 0 },
    { label: '一级审批', value: 1 },
    { label: '二级审批', value: 2 },
    { label: '三级审批', value: 3 }
  ]

  // 短信服务商选项
  const smsProviderOptions = [
    { label: '阿里云', value: 'aliyun' },
    { label: '腾讯云', value: 'tencent' },
    { label: '华为云', value: 'huawei' },
    { label: '其他', value: 'other' }
  ]

  /**
   * 加载配置数据
   */
  const fetchConfig = async (tab: ConfigTab) => {
    loading.value = true
    try {
      const data = await systemConfigApi.getConfig(tab)
      
      switch (tab) {
        case 'transfer':
          Object.assign(transferConfig, data)
          break
        case 'approval':
          Object.assign(approvalConfig, data)
          break
        case 'notification':
          Object.assign(notificationConfig, data)
          break
        case 'storage':
          Object.assign(storageConfig, data)
          break
      }
    } catch (error) {
      console.error('加载配置失败:', error)
      Message.error('加载配置失败')
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存配置
   */
  const handleSave = async (tab: ConfigTab) => {
    loading.value = true
    try {
      let data: any
      let tabName = ''

      switch (tab) {
        case 'transfer':
          data = transferConfig
          tabName = '传输配置'
          break
        case 'approval':
          data = approvalConfig
          tabName = '审批配置'
          break
        case 'notification':
          data = notificationConfig
          tabName = '通知配置'
          break
        case 'storage':
          data = storageConfig
          tabName = '存储配置'
          break
      }

      await systemConfigApi.updateConfig(tab, data)
      Message.success(`${tabName}保存成功`)
    } catch (error) {
      console.error('保存配置失败:', error)
      Message.error('保存配置失败')
    } finally {
      loading.value = false
    }
  }

  /**
   * Tab 切换
   */
  const handleTabChange = (key: string | number) => {
    activeTab.value = key as ConfigTab
    fetchConfig(key as ConfigTab)
  }

  // 初始加载传输配置
  fetchConfig('transfer')

  return {
    activeTab,
    transferConfig,
    approvalConfig,
    notificationConfig,
    storageConfig,
    loading,
    levelOptions,
    smsProviderOptions,
    fetchConfig,
    handleSave,
    handleTabChange
  }
}
