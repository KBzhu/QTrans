import type {
  UIButtonConfigItem,
  UICardConfigItem,
  UILanguageConfig,
  UITranslationItem,
  UIConfigTab,
  UITextConfigItem,
  UITextTreeNode,
} from '@/types'
import { http } from 'msw'
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

const initialCards: UICardConfigItem[] = [
  { id: 'card-1', name: '文件基础信息', code: 'base_info', order: 1, required: true, fieldConfig: '{"fields":["name","size","type"]}', status: 'enabled' },
  { id: 'card-2', name: '接收方信息', code: 'receiver_info', order: 2, required: true, fieldConfig: '{"fields":["receiver","email"]}', status: 'enabled' },
  { id: 'card-3', name: '高级选项', code: 'advanced_options', order: 3, required: false, fieldConfig: '{"fields":["watermark","expire"]}', status: 'disabled' },
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

let textItems = [...initialTextItems]
let cardItems = [...initialCards]
let languageItems = [...initialLanguages]
let translationMap = structuredClone(initialTranslations)
let buttonItems = [...initialButtons]
let cardSeq = 10
let buttonSeq = 10

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
  else if (type === 'card') {
    cardItems = [...initialCards]
  }
  else if (type === 'i18n') {
    languageItems = [...initialLanguages]
    translationMap = structuredClone(initialTranslations)
  }
  else {
    buttonItems = [...initialButtons]
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

  http.get('/api/ui-config/cards', async () => {
    await mockDelay(120)
    return success(cardItems.sort((a, b) => a.order - b.order))
  }),

  http.post('/api/ui-config/cards', async ({ request }) => {
    await mockDelay(150)
    const body = await request.json() as Omit<UICardConfigItem, 'id'>
    if (cardItems.some(item => item.code === body.code)) return failed('卡片代码已存在')
    const created: UICardConfigItem = { ...body, id: `card-${++cardSeq}` }
    cardItems.push(created)
    return success(created, '创建成功')
  }),

  http.put('/api/ui-config/cards/:id', async ({ params, request }) => {
    await mockDelay(150)
    const { id } = params as { id: string }
    const body = await request.json() as Partial<UICardConfigItem>
    const idx = cardItems.findIndex(item => item.id === id)
    if (idx === -1) return failed('卡片不存在', 404)
    if (body.code && cardItems.some(item => item.code === body.code && item.id !== id)) return failed('卡片代码已存在')
    cardItems[idx] = { ...cardItems[idx]!, ...body }
    return success(cardItems[idx], '更新成功')
  }),

  http.put('/api/ui-config/cards/sort', async ({ request }) => {
    await mockDelay(150)
    const body = await request.json() as { ids: string[] }
    const rank = new Map((body.ids || []).map((id, index) => [id, index + 1]))
    cardItems = cardItems.map(item => ({ ...item, order: rank.get(item.id) || item.order }))
    return success(cardItems.sort((a, b) => a.order - b.order), '排序成功')
  }),

  http.delete('/api/ui-config/cards/:id', async ({ params }) => {
    await mockDelay(120)
    const { id } = params as { id: string }
    cardItems = cardItems.filter(item => item.id !== id)
    return success(true, '删除成功')
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

  http.post('/api/ui-config/import', async ({ request }) => {
    await mockDelay(150)
    const body = await request.json() as { type: UIConfigTab, payload: unknown }
    resetByType(body.type)
    return success(true, '导入成功（Mock：已恢复为默认数据）')
  }),

  http.get('/api/ui-config/export/:type', async ({ params }) => {
    await mockDelay(120)
    const { type } = params as { type: UIConfigTab }
    if (type === 'text') return success({ type, items: textItems })
    if (type === 'card') return success({ type, items: cardItems })
    if (type === 'i18n') return success({ type, languages: languageItems, translations: translationMap })
    return success({ type, items: buttonItems })
  }),
]
