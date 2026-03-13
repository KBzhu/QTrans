import type {
  ImportUIConfigRequest,
  UIApplicationConfigItem,
  UIButtonConfigItem,
  UILanguageConfig,
  UITranslationItem,
  UITextConfigItem,
  UITextTreeNode,
  UITransferTabConfigItem,
  UITransferTypeConfigItem,
} from '@/types'
import { request } from '@/utils'

export const uiConfigApi = {
  getTextTree: () => request.get<UITextTreeNode[]>('/ui-config/text/tree'),

  getTextItems: () => request.get<UITextConfigItem[]>('/ui-config/text/items'),

  updateTextItem: (key: string, data: Partial<UITextConfigItem>) =>
    request.put<UITextConfigItem>(`/ui-config/text/items/${key}`, data),

  getLanguages: () => request.get<UILanguageConfig[]>('/ui-config/i18n/languages'),

  updateLanguageStatus: (code: string, status: UILanguageConfig['status']) =>
    request.put<UILanguageConfig>(`/ui-config/i18n/languages/${code}/status`, { status }),

  getTranslations: (lang: string) => request.get<UITranslationItem[]>(`/ui-config/i18n/translations/${lang}`),

  saveTranslations: (lang: string, items: UITranslationItem[]) =>
    request.put<UITranslationItem[]>(`/ui-config/i18n/translations/${lang}`, { items }),

  getButtonConfigs: () => request.get<UIButtonConfigItem[]>('/ui-config/buttons'),

  createButtonConfig: (data: Omit<UIButtonConfigItem, 'id'>) =>
    request.post<UIButtonConfigItem>('/ui-config/buttons', data),

  updateButtonConfig: (id: string, data: Partial<UIButtonConfigItem>) =>
    request.put<UIButtonConfigItem>(`/ui-config/buttons/${id}`, data),

  updateButtonStatus: (id: string, status: UIButtonConfigItem['status']) =>
    request.put<UIButtonConfigItem>(`/ui-config/buttons/${id}/status`, { status }),

  deleteButtonConfig: (id: string) => request.delete<void>(`/ui-config/buttons/${id}`),

  importConfig: (data: ImportUIConfigRequest) => request.post<boolean>('/ui-config/import', data),

  exportConfig: (type: ImportUIConfigRequest['type']) =>
    request.get<Record<string, unknown>>(`/ui-config/export/${type}`),

  getApplicationConfig: () => request.get<UIApplicationConfigItem[]>('/ui-config/application'),

  createApplicationConfig: (data: Omit<UIApplicationConfigItem, 'id'>) =>
    request.post<UIApplicationConfigItem>('/ui-config/application', data),

  updateApplicationConfig: (id: string, data: Partial<UIApplicationConfigItem>) =>
    request.put<UIApplicationConfigItem>(`/ui-config/application/${id}`, data),

  deleteApplicationConfig: (id: string) => request.delete<void>(`/ui-config/application/${id}`),

  sortApplicationConfig: (ids: string[]) => request.put<UIApplicationConfigItem[]>('/ui-config/application/sort', { ids }),

  updateApplicationStatus: (id: string, status: UIApplicationConfigItem['status']) =>
    request.put<UIApplicationConfigItem>(`/ui-config/application/${id}/status`, { status }),

  // 传输类型页签配置 API
  getTransferTabs: () => request.get<UITransferTabConfigItem[]>('/ui-config/transfer-tabs'),

  createTransferTab: (data: Omit<UITransferTabConfigItem, 'id'>) =>
    request.post<UITransferTabConfigItem>('/ui-config/transfer-tabs', data),

  updateTransferTab: (id: string, data: Partial<UITransferTabConfigItem>) =>
    request.put<UITransferTabConfigItem>(`/ui-config/transfer-tabs/${id}`, data),

  deleteTransferTab: (id: string) => request.delete<void>(`/ui-config/transfer-tabs/${id}`),

  sortTransferTabs: (ids: string[]) => request.put<UITransferTabConfigItem[]>('/ui-config/transfer-tabs/sort', { ids }),

  updateTransferTabStatus: (id: string, status: UITransferTabConfigItem['status']) =>
    request.put<UITransferTabConfigItem>(`/ui-config/transfer-tabs/${id}/status`, { status }),

  // 传输类型卡片配置 API
  getTransferTypes: () => request.get<UITransferTypeConfigItem[]>('/ui-config/transfer-types'),

  createTransferType: (data: Omit<UITransferTypeConfigItem, 'id'>) =>
    request.post<UITransferTypeConfigItem>('/ui-config/transfer-types', data),

  updateTransferType: (id: string, data: Partial<UITransferTypeConfigItem>) =>
    request.put<UITransferTypeConfigItem>(`/ui-config/transfer-types/${id}`, data),

  deleteTransferType: (id: string) => request.delete<void>(`/ui-config/transfer-types/${id}`),

  sortTransferTypes: (ids: string[]) => request.put<UITransferTypeConfigItem[]>('/ui-config/transfer-types/sort', { ids }),

  updateTransferTypeStatus: (id: string, status: UITransferTypeConfigItem['status']) =>
    request.put<UITransferTypeConfigItem>(`/ui-config/transfer-types/${id}/status`, { status }),
}
