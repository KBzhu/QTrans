import type {
  UIButtonConfigItem,
  UILanguageConfig,
  UITranslationItem,
  UIConfigTab,
  UITextConfigItem,
  UITextTreeNode,
  UIApplicationConfigItem,
  UITransferTabConfigItem,
  UITransferTypeConfigItem,
} from '@/types'
import { baseHttp as http } from './_utils'
import { failed, mockDelay, success } from './_utils'

const initialTextItems: UITextConfigItem[] = [
  { key: 'login.title', module: '登录', zhCN: '数据安全传输平台', enUS: 'Data Transfer Platform', description: '登录页标题' },
  { key: 'dashboard.quickCreate', module: '首页', zhCN: '新建申请单', enUS: 'Create Request', description: '首页快捷按钮' },
  { key: 'application.submit', module: '申请单', zhCN: '提交申请', enUS: 'Submit Request', description: '申请单提交按钮' },
  { key: 'approval.reject', module: '审批', zhCN: '驳回', enUS: 'Reject', description: '审批页驳回按钮' },
  { key: 'transfer.start', module: '传输', zhCN: '开始传输', enUS: 'Start Transfer', description: '传输页开始按钮' },
  { key: 'download.batch', module: '下载', zhCN: '批量下载', enUS: 'Batch Download', description: '下载页批量按钮' },
  { key: 'notification.readAll', module: '通知', zhCN: '全部已读', enUS: 'Mark All Read', description: '通知页操作按钮' },
  { key: 'user.create', module: '用户管理', zhCN: '新建用户', enUS: 'Create User', description: '用户管理顶部按钮' },
]

const initialLanguages: UILanguageConfig[] = [
  { code: 'zh-CN', name: '中文', status: 'enabled', progress: 100 },
  { code: 'en-US', name: 'English', status: 'enabled', progress: 88 },
]

const initialTranslations: Record<string, UITranslationItem[]> = {
  'zh-CN': initialTextItems.map(item => ({ key: item.key, zhCN: item.zhCN, enUS: item.enUS, status: 'done' })),
  'en-US': initialTextItems.map(item => ({ key: item.key, zhCN: item.zhCN, enUS: item.enUS, status: item.enUS ? 'done' : 'pending' })),
}

const initialButtons: UIButtonConfigItem[] = [
  {
    id: 'btn-1',
    name: '删除申请单',
    code: 'delete_application',
    page: '申请单列表',
    roles: ['admin', 'submitter'],
    condition: '{"status":["draft","rejected"]}',
    status: 'enabled',
  },
  {
    id: 'btn-2',
    name: '审批通过',
    code: 'approve_pass',
    page: '审批详情',
    roles: ['approver1', 'approver2', 'approver3', 'admin'],
    condition: '{"status":["pending"]}',
    status: 'enabled',
  },
]

const initialApplicationConfig: UIApplicationConfigItem[] = [
  // 申请人通知选项
  { id: 'app-opt-1', type: 'applicantNotifyOptions', label: '应用号消息', value: 'in_app', order: 1, status: 'enabled' },
  { id: 'app-opt-2', type: 'applicantNotifyOptions', label: '邮件', value: 'email', order: 2, status: 'enabled' },
  { id: 'app-opt-3', type: 'applicantNotifyOptions', label: '下载邮件的发送通知', value: 'download_email', order: 3, status: 'enabled' },
  // 下载人通知选项
  { id: 'app-opt-4', type: 'downloaderNotifyOptions', label: '应用号消息', value: 'in_app', order: 1, status: 'enabled' },
  { id: 'app-opt-5', type: 'downloaderNotifyOptions', label: 'W3待办', value: 'w3_todo', order: 2, status: 'enabled' },
  { id: 'app-opt-6', type: 'downloaderNotifyOptions', label: '邮件', value: 'email', order: 3, status: 'enabled' },
  // 最近传输选择
  { id: 'app-tpl-1', type: 'recentTransferTemplates', label: '场景说明1', value: '公司内网/绿区之间互传。', order: 1, status: 'enabled' },
  { id: 'app-tpl-2', type: 'recentTransferTemplates', label: '场景说明2', value: '绿区传外网', order: 2, status: 'enabled' },
  // 注意事项
  { id: 'app-notice-1', type: 'noticeItems', label: '注意事项1', value: 'eTrans 适用场景：公司内网/绿区之间互传，跨域请按审批流程执行。', order: 1, status: 'enabled' },
  { id: 'app-notice-2', type: 'noticeItems', label: '注意事项2', value: '涉及客户网络数据时，需上传客户授权文件并填写 SR 单号。', order: 2, status: 'enabled' },
  { id: 'app-notice-3', type: 'noticeItems', label: '注意事项3', value: '请确保下载人与抄送人信息准确，避免审批与通知遗漏。', order: 3, status: 'enabled' },
]

const initialTransferTabs: UITransferTabConfigItem[] = [
  { id: 'tab-1', key: 'green', label: '绿区传出', order: 1, status: 'enabled' },
  { id: 'tab-2', key: 'yellow', label: '黄区传出', order: 2, status: 'enabled' },
  { id: 'tab-3', key: 'external', label: '外网传入', order: 3, status: 'enabled' },
  { id: 'tab-4', key: 'routine', label: '例行申请', order: 4, status: 'enabled' },
]

const initialTransferTypes: UITransferTypeConfigItem[] = [
  {
    id: 'type-1',
    key: 'green-to-green',
    title: '绿区传到绿区',
    desc: '非研发到非研发',
    fromZone: 'green',
    toZone: 'green',
    fromIcon: '/figma/3830_3/9.svg',
    toIcon: '/figma/3830_3/9.svg',
    arrowIcon: '/figma/3830_3/8.svg',
    fromStyle: '',
    toStyle: '',
    level: 'free',
    levelText: '免审批',
    tabGroup: 'green',
    order: 1,
    status: 'enabled',
  },
  {
    id: 'type-2',
    key: 'green-to-yellow',
    title: '绿区传到黄区',
    desc: '非研发到研发',
    fromZone: 'green',
    toZone: 'yellow',
    fromIcon: '/figma/3830_3/9.svg',
    toIcon: '/figma/3830_3/9.svg',
    arrowIcon: '/figma/3830_3/11.svg',
    fromStyle: '',
    toStyle: '',
    level: 'l1',
    levelText: '一级审批',
    tabGroup: 'green',
    order: 2,
    status: 'enabled',
  },
  {
    id: 'type-3',
    key: 'green-to-external',
    title: '绿区传到外网',
    desc: '非研发到外网',
    fromZone: 'green',
    toZone: 'external',
    fromIcon: '/figma/3830_3/9.svg',
    toIcon: '/figma/3830_3/9.svg',
    arrowIcon: '/figma/3830_3/14.svg',
    fromStyle: '',
    toStyle: '',
    level: 'l2',
    levelText: '二级审批',
    tabGroup: 'green',
    order: 3,
    status: 'enabled',
  },
  {
    id: 'type-4',
    key: 'green-to-external',
    title: '绿区传到外网',
    desc: '非研发到外网',
    fromZone: 'green',
    toZone: 'external',
    fromIcon: '/figma/3830_3/9.svg',
    toIcon: '/figma/3830_3/9.svg',
    arrowIcon: '/figma/3830_3/17.svg',
    fromStyle: '',
    toStyle: '',
    level: 'l2',
    levelText: '二级审批',
    tabGroup: 'green',
    order: 4,
    status: 'enabled',
  },
  {
    id: 'type-5',
    key: 'green-to-external',
    title: '绿区传到外网',
    desc: '非研发到外网',
    fromZone: 'green',
    toZone: 'external',
    fromIcon: '/figma/3830_3/9.svg',
    toIcon: '/figma/3830_3/9.svg',
    arrowIcon: '/figma/3830_3/20.svg',
    fromStyle: '',
    toStyle: '',
    level: 'l3',
    levelText: '三级审批',
    tabGroup: 'green',
    order: 5,
    status: 'enabled',
  },
  {
    id: 'type-6',
    key: 'yellow-to-yellow',
    title: '黄区传到黄区',
    desc: '同安全域内传输，需部门主管审批',
    fromZone: 'yellow',
    toZone: 'yellow',
    fromIcon: '/figma/3971_812/10.svg',
    toIcon: '/figma/3971_812/10.svg',
    arrowIcon: '/figma/3971_812/8.svg',
    fromStyle: '',
    toStyle: '',
    level: 'l1',
    levelText: '一级审批',
    tabGroup: 'yellow',
    order: 1,
    status: 'enabled',
  },
  {
    id: 'type-7',
    key: 'yellow-to-external',
    title: '黄区传到外网',
    desc: '跨安全域传输，需二级审批',
    fromZone: 'yellow',
    toZone: 'external',
    fromIcon: '/figma/3971_812/10.svg',
    toIcon: '/figma/3971_812/12.svg',
    arrowIcon: '/figma/3971_812/11.svg',
    fromStyle: '',
    toStyle: '',
    level: 'l2',
    levelText: '二级审批',
    tabGroup: 'yellow',
    order: 2,
    status: 'enabled',
  },
  {
    id: 'type-8',
    key: 'external-to-external',
    title: '外网传到外网',
    desc: '外网域内传输，需二级审批',
    fromZone: 'external',
    toZone: 'external',
    fromIcon: '/figma/3971_812/12.svg',
    toIcon: '/figma/3971_812/12.svg',
    arrowIcon: '/figma/3971_812/11.svg',
    fromStyle: '',
    toStyle: '',
    level: 'l2',
    levelText: '二级审批',
    tabGroup: 'external',
    order: 1,
    status: 'enabled',
  },
  {
    id: 'type-9',
    key: 'cross-country',
    title: '跨国传输',
    desc: '跨国数据传输，需三级审批',
    fromZone: 'cross',
    toZone: 'cross',
    fromIcon: '/figma/3971_812/7.svg',
    toIcon: '/figma/3971_812/12.svg',
    arrowIcon: '/figma/3971_812/11.svg',
    fromStyle: '',
    toStyle: '',
    level: 'l3',
    levelText: '三级审批',
    tabGroup: 'external',
    order: 1,
    status: 'enabled',
  },
]

let textItems = [...initialTextItems]
let languageItems = [...initialLanguages]
let translationMap = structuredClone(initialTranslations)
let buttonItems = [...initialButtons]
let applicationItems = [...initialApplicationConfig]
let transferTabItems = [...initialTransferTabs]
let transferTypeItems = [...initialTransferTypes]
let buttonSeq = 10
let applicationSeq = 20
let transferTabSeq = 10
let transferTypeSeq = 20

function buildTextTree(items: UITextConfigItem[]): UITextTreeNode[] {
  const modules = [...new Set(items.map(item => item.module))]
  return modules.map((module) => {
    const children = items
      .filter(item => item.module === module)
      .map(item => ({
        key: item.key,
        title: `${item.key} - ${item.zhCN}`,
        isLeaf: true,
      }))

    return {
      key: `module:${module}`,
      title: module,
      children,
    }
  })
}

function resetByType(type: UIConfigTab) {
  if (type === 'text') {
    textItems = [...initialTextItems]
  }
  else if (type === 'i18n') {
    languageItems = [...initialLanguages]
    translationMap = structuredClone(initialTranslations)
  }
  else if (type === 'button') {
    buttonItems = [...initialButtons]
  }
  else if (type === 'application') {
    applicationItems = [...initialApplicationConfig]
  }
  else if (type === 'transferTab') {
    transferTabItems = [...initialTransferTabs]
  }
  else if (type === 'transferType') {
    transferTypeItems = [...initialTransferTypes]
  }
}

export const uiConfigHandlers = [
  http.get('/api/ui-config/text/tree', async () => {
    await mockDelay(120)
    return success(buildTextTree(textItems))
  }),

  http.get('/api/ui-config/text/items', async () => {
    await mockDelay(120)
    return success(textItems)
  }),

  http.put('/api/ui-config/text/items/:key', async ({ params, request }) => {
    await mockDelay(150)
    const { key } = params as { key: string }
    const body = await request.json() as Partial<UITextConfigItem>
    const idx = textItems.findIndex(item => item.key === key)
    if (idx === -1) return failed('配置项不存在', 404)
    textItems[idx] = { ...textItems[idx]!, ...body }
    return success(textItems[idx], '保存成功')
  }),

  http.get('/api/ui-config/i18n/languages', async () => {
    await mockDelay(120)
    return success(languageItems)
  }),

  http.put('/api/ui-config/i18n/languages/:code/status', async ({ params, request }) => {
    await mockDelay(120)
    const { code } = params as { code: string }
    const body = await request.json() as { status: UILanguageConfig['status'] }
    const idx = languageItems.findIndex(item => item.code === code)
    if (idx === -1) return failed('语言不存在', 404)
    languageItems[idx] = { ...languageItems[idx]!, status: body.status === 'disabled' ? 'disabled' : 'enabled' }
    return success(languageItems[idx], '状态更新成功')
  }),

  http.get('/api/ui-config/i18n/translations/:lang', async ({ params }) => {
    await mockDelay(120)
    const { lang } = params as { lang: string }
    return success(translationMap[lang] || [])
  }),

  http.put('/api/ui-config/i18n/translations/:lang', async ({ params, request }) => {
    await mockDelay(150)
    const { lang } = params as { lang: string }
    const body = await request.json() as { items: UITranslationItem[] }
    translationMap[lang] = (body.items || []).map(item => ({
      ...item,
      status: item.enUS?.trim() ? 'done' : 'pending',
    }))
    return success(translationMap[lang], '保存成功')
  }),

  http.get('/api/ui-config/buttons', async () => {
    await mockDelay(120)
    return success(buttonItems)
  }),

  http.post('/api/ui-config/buttons', async ({ request }) => {
    await mockDelay(150)
    const body = await request.json() as Omit<UIButtonConfigItem, 'id'>
    if (buttonItems.some(item => item.code === body.code)) return failed('按钮代码已存在')
    const created: UIButtonConfigItem = { ...body, id: `btn-${++buttonSeq}` }
    buttonItems.push(created)
    return success(created, '创建成功')
  }),

  http.put('/api/ui-config/buttons/:id', async ({ params, request }) => {
    await mockDelay(150)
    const { id } = params as { id: string }
    const body = await request.json() as Partial<UIButtonConfigItem>
    const idx = buttonItems.findIndex(item => item.id === id)
    if (idx === -1) return failed('按钮不存在', 404)
    if (body.code && buttonItems.some(item => item.code === body.code && item.id !== id)) return failed('按钮代码已存在')
    buttonItems[idx] = { ...buttonItems[idx]!, ...body }
    return success(buttonItems[idx], '更新成功')
  }),

  http.put('/api/ui-config/buttons/:id/status', async ({ params, request }) => {
    await mockDelay(120)
    const { id } = params as { id: string }
    const body = await request.json() as { status: UIButtonConfigItem['status'] }
    const idx = buttonItems.findIndex(item => item.id === id)
    if (idx === -1) return failed('按钮不存在', 404)
    buttonItems[idx] = { ...buttonItems[idx]!, status: body.status === 'disabled' ? 'disabled' : 'enabled' }
    return success(buttonItems[idx], '状态更新成功')
  }),

  http.delete('/api/ui-config/buttons/:id', async ({ params }) => {
    await mockDelay(120)
    const { id } = params as { id: string }
    buttonItems = buttonItems.filter(item => item.id !== id)
    return success(true, '删除成功')
  }),

  // 申请单配置 API
  http.get('/api/ui-config/application', async () => {
    await mockDelay(120)
    return success(applicationItems.sort((a, b) => a.order - b.order))
  }),

  http.post('/api/ui-config/application', async ({ request }) => {
    await mockDelay(150)
    const body = await request.json() as Omit<UIApplicationConfigItem, 'id'>
    const created: UIApplicationConfigItem = { ...body, id: `app-cfg-${++applicationSeq}` }
    applicationItems.push(created)
    return success(created, '创建成功')
  }),

  http.put('/api/ui-config/application/:id', async ({ params, request }) => {
    await mockDelay(150)
    const { id } = params as { id: string }
    const body = await request.json() as Partial<UIApplicationConfigItem>
    const idx = applicationItems.findIndex(item => item.id === id)
    if (idx === -1) return failed('配置项不存在', 404)
    applicationItems[idx] = { ...applicationItems[idx]!, ...body }
    return success(applicationItems[idx], '更新成功')
  }),

  http.put('/api/ui-config/application/sort', async ({ request }) => {
    await mockDelay(150)
    const body = await request.json() as { ids: string[] }
    const rank = new Map((body.ids || []).map((id, index) => [id, index + 1]))
    applicationItems = applicationItems.map(item => ({ ...item, order: rank.get(item.id) || item.order }))
    return success(applicationItems.sort((a, b) => a.order - b.order), '排序成功')
  }),

  http.put('/api/ui-config/application/:id/status', async ({ params, request }) => {
    await mockDelay(120)
    const { id } = params as { id: string }
    const body = await request.json() as { status: UIApplicationConfigItem['status'] }
    const idx = applicationItems.findIndex(item => item.id === id)
    if (idx === -1) return failed('配置项不存在', 404)
    applicationItems[idx] = { ...applicationItems[idx]!, status: body.status === 'disabled' ? 'disabled' : 'enabled' }
    return success(applicationItems[idx], '状态更新成功')
  }),

  http.delete('/api/ui-config/application/:id', async ({ params }) => {
    await mockDelay(120)
    const { id } = params as { id: string }
    applicationItems = applicationItems.filter(item => item.id !== id)
    return success(true, '删除成功')
  }),

  // 传输类型页签配置 API
  http.get('/api/ui-config/transfer-tabs', async () => {
    await mockDelay(120)
    return success(transferTabItems.sort((a, b) => a.order - b.order))
  }),

  http.post('/api/ui-config/transfer-tabs', async ({ request }) => {
    await mockDelay(150)
    const body = await request.json() as Omit<UITransferTabConfigItem, 'id'>
    if (transferTabItems.some(item => item.key === body.key)) return failed('页签 key 已存在')
    const created: UITransferTabConfigItem = { ...body, id: `tab-${++transferTabSeq}` }
    transferTabItems.push(created)
    return success(created, '创建成功')
  }),

  http.put('/api/ui-config/transfer-tabs/:id', async ({ params, request }) => {
    await mockDelay(150)
    const { id } = params as { id: string }
    const body = await request.json() as Partial<UITransferTabConfigItem>
    const idx = transferTabItems.findIndex(item => item.id === id)
    if (idx === -1) return failed('页签不存在', 404)
    if (body.key && transferTabItems.some(item => item.key === body.key && item.id !== id)) return failed('页签 key 已存在')
    transferTabItems[idx] = { ...transferTabItems[idx]!, ...body }
    return success(transferTabItems[idx], '更新成功')
  }),

  http.put('/api/ui-config/transfer-tabs/sort', async ({ request }) => {
    await mockDelay(150)
    const body = await request.json() as { ids: string[] }
    const rank = new Map((body.ids || []).map((id, index) => [id, index + 1]))
    transferTabItems = transferTabItems.map(item => ({ ...item, order: rank.get(item.id) || item.order }))
    return success(transferTabItems.sort((a, b) => a.order - b.order), '排序成功')
  }),

  http.put('/api/ui-config/transfer-tabs/:id/status', async ({ params, request }) => {
    await mockDelay(120)
    const { id } = params as { id: string }
    const body = await request.json() as { status: UITransferTabConfigItem['status'] }
    const idx = transferTabItems.findIndex(item => item.id === id)
    if (idx === -1) return failed('页签不存在', 404)
    transferTabItems[idx] = { ...transferTabItems[idx]!, status: body.status === 'disabled' ? 'disabled' : 'enabled' }
    return success(transferTabItems[idx], '状态更新成功')
  }),

  http.delete('/api/ui-config/transfer-tabs/:id', async ({ params }) => {
    await mockDelay(120)
    const { id } = params as { id: string }
    transferTabItems = transferTabItems.filter(item => item.id !== id)
    return success(true, '删除成功')
  }),

  // 传输类型卡片配置 API
  http.get('/api/ui-config/transfer-types', async () => {
    await mockDelay(120)
    return success(transferTypeItems.sort((a, b) => a.order - b.order))
  }),

  http.post('/api/ui-config/transfer-types', async ({ request }) => {
    await mockDelay(150)
    const body = await request.json() as Omit<UITransferTypeConfigItem, 'id'>
    if (transferTypeItems.some(item => item.key === body.key)) return failed('类型 key 已存在')
    const created: UITransferTypeConfigItem = { ...body, id: `type-${++transferTypeSeq}` }
    transferTypeItems.push(created)
    return success(created, '创建成功')
  }),

  http.put('/api/ui-config/transfer-types/:id', async ({ params, request }) => {
    await mockDelay(150)
    const { id } = params as { id: string }
    const body = await request.json() as Partial<UITransferTypeConfigItem>
    const idx = transferTypeItems.findIndex(item => item.id === id)
    if (idx === -1) return failed('类型不存在', 404)
    if (body.key && transferTypeItems.some(item => item.key === body.key && item.id !== id)) return failed('类型 key 已存在')
    transferTypeItems[idx] = { ...transferTypeItems[idx]!, ...body }
    return success(transferTypeItems[idx], '更新成功')
  }),

  http.put('/api/ui-config/transfer-types/sort', async ({ request }) => {
    await mockDelay(150)
    const body = await request.json() as { ids: string[] }
    const rank = new Map((body.ids || []).map((id, index) => [id, index + 1]))
    transferTypeItems = transferTypeItems.map(item => ({ ...item, order: rank.get(item.id) || item.order }))
    return success(transferTypeItems.sort((a, b) => a.order - b.order), '排序成功')
  }),

  http.put('/api/ui-config/transfer-types/:id/status', async ({ params, request }) => {
    await mockDelay(120)
    const { id } = params as { id: string }
    const body = await request.json() as { status: UITransferTypeConfigItem['status'] }
    const idx = transferTypeItems.findIndex(item => item.id === id)
    if (idx === -1) return failed('类型不存在', 404)
    transferTypeItems[idx] = { ...transferTypeItems[idx]!, status: body.status === 'disabled' ? 'disabled' : 'enabled' }
    return success(transferTypeItems[idx], '状态更新成功')
  }),

  http.delete('/api/ui-config/transfer-types/:id', async ({ params }) => {
    await mockDelay(120)
    const { id } = params as { id: string }
    transferTypeItems = transferTypeItems.filter(item => item.id !== id)
    return success(true, '删除成功')
  }),

  http.post('/api/ui-config/import', async ({ request }) => {
    await mockDelay(150)
    const body = await request.json() as { type: UIConfigTab, payload: unknown }
    resetByType(body.type)
    return success(true, '导入成功（Mock：已恢复为默认数据）')
  }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (http.get as any)('/api/ui-config/export/:type', async ({ params }: { params: Record<string, string> }) => {
    await mockDelay(120)
    const { type } = params as { type: UIConfigTab }
    if (type === 'text') return success({ type, items: textItems })
    if (type === 'i18n') return success({ type, languages: languageItems, translations: translationMap })
    if (type === 'button') return success({ type, items: buttonItems })
    if (type === 'application') return success({ type, items: applicationItems })
    if (type === 'transferTab') return success({ type, items: transferTabItems })
    if (type === 'transferType') return success({ type, items: transferTypeItems })
    return success({ type, items: [] })
  }),
]
