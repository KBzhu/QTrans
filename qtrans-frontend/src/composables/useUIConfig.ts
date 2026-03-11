import type {
  UIButtonConfigItem,
  UICardConfigItem,
  UIConfigTab,
  UILanguageConfig,
  UITranslationItem,
  UITextConfigItem,
  UITextTreeNode,
} from '@/types'
import { computed, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { uiConfigApi } from '@/api/uiConfig'

export function useUIConfig() {
  const loading = ref(false)
  const activeTab = ref<UIConfigTab>('text')

  const textTreeData = ref<UITextTreeNode[]>([])
  const textConfigData = ref<UITextConfigItem[]>([])
  const selectedNodeKey = ref<string>('')

  const cardConfigData = ref<UICardConfigItem[]>([])
  const cardModalVisible = ref(false)
  const editingCard = ref<UICardConfigItem | null>(null)

  const i18nConfigData = ref<UILanguageConfig[]>([])
  const selectedLang = ref('zh-CN')
  const translationData = ref<UITranslationItem[]>([])

  const buttonConfigData = ref<UIButtonConfigItem[]>([])
  const buttonModalVisible = ref(false)
  const editingButton = ref<UIButtonConfigItem | null>(null)

  const selectedNode = computed(() => selectedNodeKey.value)
  const editingItem = computed(() => editingCard.value || editingButton.value)
  const selectedTextItem = computed(() => textConfigData.value.find(item => item.key === selectedNodeKey.value) || null)

  async function fetchTextConfig() {
    loading.value = true
    try {
      const [tree, items] = await Promise.all([
        uiConfigApi.getTextTree(),
        uiConfigApi.getTextItems(),
      ])
      textTreeData.value = tree
      textConfigData.value = items
      if (!selectedNodeKey.value && items.length > 0)
        selectedNodeKey.value = items[0]!.key
    }
    catch (error: any) {
      Message.error(error.message || '获取文字配置失败')
    }
    finally {
      loading.value = false
    }
  }

  async function fetchCardConfig() {
    loading.value = true
    try {
      cardConfigData.value = await uiConfigApi.getCardConfigs()
    }
    catch (error: any) {
      Message.error(error.message || '获取卡片配置失败')
    }
    finally {
      loading.value = false
    }
  }

  async function fetchI18nConfig() {
    loading.value = true
    try {
      const languages = await uiConfigApi.getLanguages()
      i18nConfigData.value = languages
      if (!languages.some(item => item.code === selectedLang.value))
        selectedLang.value = languages[0]?.code || 'zh-CN'
      await fetchTranslations(selectedLang.value)
    }
    catch (error: any) {
      Message.error(error.message || '获取国际化配置失败')
    }
    finally {
      loading.value = false
    }
  }

  async function fetchTranslations(lang: string) {
    selectedLang.value = lang
    translationData.value = await uiConfigApi.getTranslations(lang)
  }

  async function fetchButtonConfig() {
    loading.value = true
    try {
      buttonConfigData.value = await uiConfigApi.getButtonConfigs()
    }
    catch (error: any) {
      Message.error(error.message || '获取按钮配置失败')
    }
    finally {
      loading.value = false
    }
  }

  async function handleSaveTextConfig(key: string, data: Pick<UITextConfigItem, 'zhCN' | 'enUS' | 'description'>) {
    try {
      await uiConfigApi.updateTextItem(key, data)
      Message.success('文字配置保存成功')
      await fetchTextConfig()
    }
    catch (error: any) {
      Message.error(error.message || '保存失败')
      throw error
    }
  }

  async function handleSaveCardConfig(data: Omit<UICardConfigItem, 'id'> | UICardConfigItem) {
    try {
      if ('id' in data && data.id)
        await uiConfigApi.updateCardConfig(data.id, data)
      else
        await uiConfigApi.createCardConfig(data)
      Message.success('卡片配置保存成功')
      cardModalVisible.value = false
      await fetchCardConfig()
    }
    catch (error: any) {
      Message.error(error.message || '保存失败')
      throw error
    }
  }

  async function handleSaveI18nConfig(lang: string, data: UITranslationItem[]) {
    try {
      await uiConfigApi.saveTranslations(lang, data)
      Message.success('国际化配置保存成功')
      await fetchTranslations(lang)
      await fetchI18nConfig()
    }
    catch (error: any) {
      Message.error(error.message || '保存失败')
      throw error
    }
  }

  async function handleSaveButtonConfig(data: Omit<UIButtonConfigItem, 'id'> | UIButtonConfigItem) {
    try {
      if ('id' in data && data.id)
        await uiConfigApi.updateButtonConfig(data.id, data)
      else
        await uiConfigApi.createButtonConfig(data)
      Message.success('按钮配置保存成功')
      buttonModalVisible.value = false
      await fetchButtonConfig()
    }
    catch (error: any) {
      Message.error(error.message || '保存失败')
      throw error
    }
  }

  async function handleImportConfig(type: UIConfigTab, rawText: string) {
    try {
      const payload = JSON.parse(rawText)
      await uiConfigApi.importConfig({ type, payload })
      Message.success('导入成功')
      await refreshByTab(type)
    }
    catch (error: any) {
      Message.error(error.message || '导入失败，请检查 JSON')
      throw error
    }
  }

  async function handleExportConfig(type: UIConfigTab) {
    try {
      const data = await uiConfigApi.exportConfig(type)
      const content = JSON.stringify(data, null, 2)
      const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ui-config-${type}.json`
      link.click()
      URL.revokeObjectURL(url)
      Message.success('导出成功')
      return content
    }
    catch (error: any) {
      Message.error(error.message || '导出失败')
      throw error
    }
  }

  async function handleCardSort(newOrderIds: string[]) {
    try {
      await uiConfigApi.sortCardConfig(newOrderIds)
      Message.success('排序已更新')
      await fetchCardConfig()
    }
    catch (error: any) {
      Message.error(error.message || '排序失败')
    }
  }

  function handleSelectTextNode(key: string) {
    const target = textConfigData.value.find(item => item.key === key)
    if (target)
      selectedNodeKey.value = key
  }

  function handleCreateCard() {
    editingCard.value = null
    cardModalVisible.value = true
  }

  function handleEditCard(item: UICardConfigItem) {
    editingCard.value = { ...item }
    cardModalVisible.value = true
  }

  function handleDeleteCard(item: UICardConfigItem) {
    Modal.confirm({
      title: '确认删除',
      content: `确认删除卡片「${item.name}」吗？`,
      onOk: async () => {
        await uiConfigApi.deleteCardConfig(item.id)
        Message.success('删除成功')
        fetchCardConfig()
      },
    })
  }

  function handleCreateButton() {
    editingButton.value = null
    buttonModalVisible.value = true
  }

  function handleEditButton(item: UIButtonConfigItem) {
    editingButton.value = { ...item }
    buttonModalVisible.value = true
  }

  function handleDeleteButton(item: UIButtonConfigItem) {
    Modal.confirm({
      title: '确认删除',
      content: `确认删除按钮「${item.name}」吗？`,
      onOk: async () => {
        await uiConfigApi.deleteButtonConfig(item.id)
        Message.success('删除成功')
        fetchButtonConfig()
      },
    })
  }

  async function handleToggleButtonStatus(item: UIButtonConfigItem) {
    try {
      const nextStatus = item.status === 'enabled' ? 'disabled' : 'enabled'
      await uiConfigApi.updateButtonStatus(item.id, nextStatus)
      Message.success(nextStatus === 'enabled' ? '启用成功' : '禁用成功')
      await fetchButtonConfig()
    }
    catch (error: any) {
      Message.error(error.message || '更新状态失败')
    }
  }

  async function handleToggleLanguageStatus(item: UILanguageConfig) {
    try {
      const nextStatus = item.status === 'enabled' ? 'disabled' : 'enabled'
      await uiConfigApi.updateLanguageStatus(item.code, nextStatus)
      Message.success(nextStatus === 'enabled' ? '启用成功' : '禁用成功')
      await fetchI18nConfig()
    }
    catch (error: any) {
      Message.error(error.message || '更新状态失败')
    }
  }

  async function refreshByTab(tab: UIConfigTab) {
    if (tab === 'text') return fetchTextConfig()
    if (tab === 'card') return fetchCardConfig()
    if (tab === 'i18n') return fetchI18nConfig()
    return fetchButtonConfig()
  }

  async function handleTabChange(tab: string | number) {
    const nextTab = tab as UIConfigTab
    activeTab.value = nextTab
    await refreshByTab(nextTab)
  }

  function handleCloseCardModal() {
    cardModalVisible.value = false
    editingCard.value = null
  }

  function handleCloseButtonModal() {
    buttonModalVisible.value = false
    editingButton.value = null
  }

  fetchTextConfig()

  return {
    loading,
    activeTab,
    selectedNode,
    editingItem,
    textTreeData,
    textConfigData,
    selectedNodeKey,
    selectedTextItem,
    cardConfigData,
    cardModalVisible,
    editingCard,
    i18nConfigData,
    selectedLang,
    translationData,
    buttonConfigData,
    buttonModalVisible,
    editingButton,
    fetchTextConfig,
    fetchCardConfig,
    fetchI18nConfig,
    fetchButtonConfig,
    fetchTranslations,
    handleSaveTextConfig,
    handleSaveCardConfig,
    handleSaveI18nConfig,
    handleSaveButtonConfig,
    handleImportConfig,
    handleExportConfig,
    handleCardSort,
    handleSelectTextNode,
    handleCreateCard,
    handleEditCard,
    handleDeleteCard,
    handleCreateButton,
    handleEditButton,
    handleDeleteButton,
    handleToggleButtonStatus,
    handleToggleLanguageStatus,
    handleTabChange,
    handleCloseCardModal,
    handleCloseButtonModal,
  }
}
