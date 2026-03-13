import type { UIButtonConfigItem, UILanguageConfig, UITranslationItem, UITextConfigItem, UITextTreeNode } from '@/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUIConfig } from '@/composables/useUIConfig'

const {
  getTextTreeMock,
  getTextItemsMock,
  updateTextItemMock,
  getLanguagesMock,
  updateLanguageStatusMock,
  getTranslationsMock,
  saveTranslationsMock,
  getButtonConfigsMock,
  createButtonConfigMock,
  updateButtonConfigMock,
  updateButtonStatusMock,
  deleteButtonConfigMock,
  importConfigMock,
  exportConfigMock,
} = vi.hoisted(() => ({
  getTextTreeMock: vi.fn(),
  getTextItemsMock: vi.fn(),
  updateTextItemMock: vi.fn(),
  getLanguagesMock: vi.fn(),
  updateLanguageStatusMock: vi.fn(),
  getTranslationsMock: vi.fn(),
  saveTranslationsMock: vi.fn(),
  getButtonConfigsMock: vi.fn(),
  createButtonConfigMock: vi.fn(),
  updateButtonConfigMock: vi.fn(),
  updateButtonStatusMock: vi.fn(),
  deleteButtonConfigMock: vi.fn(),
  importConfigMock: vi.fn(),
  exportConfigMock: vi.fn(),
}))

vi.mock('@/api/uiConfig', () => ({
  uiConfigApi: {
    getTextTree: getTextTreeMock,
    getTextItems: getTextItemsMock,
    updateTextItem: updateTextItemMock,
    getLanguages: getLanguagesMock,
    updateLanguageStatus: updateLanguageStatusMock,
    getTranslations: getTranslationsMock,
    saveTranslations: saveTranslationsMock,
    getButtonConfigs: getButtonConfigsMock,
    createButtonConfig: createButtonConfigMock,
    updateButtonConfig: updateButtonConfigMock,
    updateButtonStatus: updateButtonStatusMock,
    deleteButtonConfig: deleteButtonConfigMock,
    importConfig: importConfigMock,
    exportConfig: exportConfigMock,
  },
}))

vi.mock('@arco-design/web-vue', async () => {
  const actual = await vi.importActual('@arco-design/web-vue')
  return {
    ...actual,
    Message: {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    },
    Modal: {
      confirm: vi.fn(),
    },
  }
})

function createTextItem(overrides: Partial<UITextConfigItem> = {}): UITextConfigItem {
  return {
    key: 'login.title',
    module: '登录',
    zhCN: '登录',
    enUS: 'Login',
    description: 'desc',
    ...overrides,
  }
}

function createLanguage(overrides: Partial<UILanguageConfig> = {}): UILanguageConfig {
  return {
    code: 'zh-CN',
    name: '中文',
    status: 'enabled',
    progress: 100,
    ...overrides,
  }
}

function createTranslation(overrides: Partial<UITranslationItem> = {}): UITranslationItem {
  return {
    key: 'login.title',
    zhCN: '登录',
    enUS: 'Login',
    status: 'done',
    ...overrides,
  }
}

function createButton(overrides: Partial<UIButtonConfigItem> = {}): UIButtonConfigItem {
  return {
    id: 'btn-1',
    name: '删除',
    code: 'delete_btn',
    page: '申请单列表',
    roles: ['admin'],
    condition: '{}',
    status: 'enabled',
    ...overrides,
  }
}

describe('useUIConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getTextTreeMock.mockResolvedValue([{ key: 'module:登录', title: '登录', children: [{ key: 'login.title', title: 'login.title', isLeaf: true }] } as UITextTreeNode])
    getTextItemsMock.mockResolvedValue([createTextItem()])
    getLanguagesMock.mockResolvedValue([createLanguage()])
    getTranslationsMock.mockResolvedValue([createTranslation()])
    getButtonConfigsMock.mockResolvedValue([createButton()])
  })

  it('initial fetch loads text config', async () => {
    const composable = useUIConfig()
    await Promise.resolve()
    await Promise.resolve()

    expect(getTextTreeMock).toHaveBeenCalled()
    expect(composable.textConfigData.value).toHaveLength(1)
    expect(composable.selectedNodeKey.value).toBe('login.title')
  })

  it('handleSaveTextConfig calls update api', async () => {
    updateTextItemMock.mockResolvedValue(createTextItem({ zhCN: '登录页' }))

    const composable = useUIConfig()
    await composable.handleSaveTextConfig('login.title', {
      zhCN: '登录页',
      enUS: 'Login Page',
      description: 'desc',
    })

    expect(updateTextItemMock).toHaveBeenCalledWith('login.title', expect.objectContaining({ zhCN: '登录页' }))
  })

  it('fetchI18nConfig loads languages and translations', async () => {
    const composable = useUIConfig()
    await composable.fetchI18nConfig()

    expect(getLanguagesMock).toHaveBeenCalled()
    expect(getTranslationsMock).toHaveBeenCalledWith('zh-CN')
  })

  it('handleSaveI18nConfig saves translation list', async () => {
    saveTranslationsMock.mockResolvedValue([createTranslation()])

    const composable = useUIConfig()
    await composable.handleSaveI18nConfig('zh-CN', [createTranslation({ enUS: 'Login' })])

    expect(saveTranslationsMock).toHaveBeenCalledWith('zh-CN', expect.any(Array))
  })

  it('handleToggleButtonStatus toggles and refreshes', async () => {
    updateButtonStatusMock.mockResolvedValue(createButton({ status: 'disabled' }))

    const composable = useUIConfig()
    await composable.handleToggleButtonStatus(createButton({ id: 'btn-1', status: 'enabled' }))

    expect(updateButtonStatusMock).toHaveBeenCalledWith('btn-1', 'disabled')
  })

  it('handleSaveButtonConfig creates button config', async () => {
    createButtonConfigMock.mockResolvedValue(createButton({ id: 'btn-2' }))

    const composable = useUIConfig()
    await composable.handleSaveButtonConfig({
      name: '新按钮',
      code: 'new_btn',
      page: '申请单列表',
      roles: ['admin'],
      condition: '{}',
      status: 'enabled',
    })

    expect(createButtonConfigMock).toHaveBeenCalled()
  })

  it('handleImportConfig parses json and calls import api', async () => {
    importConfigMock.mockResolvedValue(true)

    const composable = useUIConfig()
    await composable.handleImportConfig('text', '{"items":[]}')

    expect(importConfigMock).toHaveBeenCalledWith({ type: 'text', payload: { items: [] } })
  })

  it('handleExportConfig returns exported content', async () => {
    exportConfigMock.mockResolvedValue({ items: [createTextItem()] })
    const link = { href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(link)
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    const composable = useUIConfig()
    const content = await composable.handleExportConfig('text')

    expect(exportConfigMock).toHaveBeenCalledWith('text')
    expect(content).toContain('login.title')

    createElementSpy.mockRestore()
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
  })
})
