import type {
  ImportUIConfigRequest,
  UIButtonConfigItem,
  UICardConfigItem,
  UILanguageConfig,
  UITranslationItem,
  UITextConfigItem,
  UITextTreeNode,
} from '@/types'
import { request } from '@/utils'

export const uiConfigApi = {
  getTextTree: () => request.get<UITextTreeNode[]>('/ui-config/text/tree'),

  getTextItems: () => request.get<UITextConfigItem[]>('/ui-config/text/items'),

  updateTextItem: (key: string, data: Partial<UITextConfigItem>) =>
    request.put<UITextConfigItem>(`/ui-config/text/items/${key}`, data),

  getCardConfigs: () => request.get<UICardConfigItem[]>('/ui-config/cards'),

  createCardConfig: (data: Omit<UICardConfigItem, 'id'>) =>
    request.post<UICardConfigItem>('/ui-config/cards', data),

  updateCardConfig: (id: string, data: Partial<UICardConfigItem>) =>
    request.put<UICardConfigItem>(`/ui-config/cards/${id}`, data),

  deleteCardConfig: (id: string) => request.delete<void>(`/ui-config/cards/${id}`),

  sortCardConfig: (ids: string[]) => request.put<UICardConfigItem[]>('/ui-config/cards/sort', { ids }),

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
}
