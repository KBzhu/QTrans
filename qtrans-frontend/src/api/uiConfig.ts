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

  // ===== 真实后端接口 - 传输场景配置 =====

  /**
   * 获取传输场景 TAB 配置
   * GET /commonService/services/jalor/lookup/itemquery/listbycodes/transmission_scenario/zh_CN
   */
  getTransmissionScenario: () =>
    request.rawGet<Record<string, TransmissionScenarioItem[]>>(
      '/commonService/services/jalor/lookup/itemquery/listbycodes/transmission_scenario/zh_CN',
    ),

  /**
   * 获取传输场景子项（卡片）配置
   * GET /commonService/services/jalor/lookup/itemquery/listbycodes/transmission_scenario_child_item/zh_CN
   */
  getTransmissionScenarioChildItems: () =>
    request.rawGet<Record<string, TransmissionScenarioChildItem[]>>(
      '/commonService/services/jalor/lookup/itemquery/listbycodes/transmission_scenario_child_item/zh_CN',
    ),

  /**
   * 获取帮助文档列表
   * GET /commonService/services/jalor/lookup/itemquery/listbycodes/help_doc_link/zh_CN
   */
  getHelpDocs: () =>
    request.rawGet<Record<string, HelpDocItem[]>>(
      '/commonService/services/jalor/lookup/itemquery/listbycodes/help_doc_link/zh_CN',
    ),

  /**
   * 获取重要公告列表
   * GET /commonService/services/jalor/lookup/itemquery/listbycodes/top_affiche/zh_CN
   */
  getTopAffiches: () =>
    request.rawGet<Record<string, TopAfficheItem[]>>(
      '/commonService/services/jalor/lookup/itemquery/listbycodes/top_affiche/zh_CN',
    ),
}

/** 传输场景 TAB 项 */
export interface TransmissionScenarioItem {
  itemId: number
  itemCode: string
  itemName: string
  itemDesc: string
  itemIndex: number
  status: number
  itemAttr1: string | null
}

/** 传输场景子项（卡片）的父级信息 */
export interface TransmissionScenarioParentItem {
  itemCode: string
}

/** 传输场景子项（卡片） */
export interface TransmissionScenarioChildItem {
  itemAttr5: string
  itemAttr3: any
  itemAttr4: string
  itemId: number
  itemCode: string
  itemName: string
  itemDesc: string
  itemIndex: number
  status: number
  parentItem: TransmissionScenarioParentItem
  itemAttr1: string | null
  itemAttr2: string | null
}

/** 帮助文档项 */
export interface HelpDocItem {
  itemId: number
  itemCode: string
  itemName: string
  itemDesc: string
  itemIndex: number
  status: number
  itemAttr1: string | null
  itemAttr2: string | null
  itemAttr3: string | null
  creationDate: string
  lastUpdateDate: string
}

/** 重要公告项 */
export interface TopAfficheItem {
  itemId: number
  itemCode: string
  itemName: string
  itemDesc: string
  itemIndex: number
  status: number
  itemAttr1: string | null  // 标题
  itemAttr2: string | null  // 图标
  itemAttr3: string | null
  creationDate: string
  lastUpdateDate: string
}
