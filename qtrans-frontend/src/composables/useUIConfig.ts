import type {
  UIButtonConfigItem,
  UIConfigTab,
  UILanguageConfig,
  UITranslationItem,
  UITextConfigItem,
  UITextTreeNode,
  UIApplicationConfigItem,
  UITransferTabConfigItem,
  UITransferTypeConfigItem,
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

  const i18nConfigData = ref<UILanguageConfig[]>([])
  const selectedLang = ref('zh-CN')
  const translationData = ref<UITranslationItem[]>([])

  const buttonConfigData = ref<UIButtonConfigItem[]>([])
  const buttonModalVisible = ref(false)
  const editingButton = ref<UIButtonConfigItem | null>(null)

  const applicationConfigData = ref<UIApplicationConfigItem[]>([])
  const applicationModalVisible = ref(false)
  const editingApplication = ref<UIApplicationConfigItem | null>(null)

  const transferTabConfigData = ref<UITransferTabConfigItem[]>([])
  const transferTabModalVisible = ref(false)
  const editingTransferTab = ref<UITransferTabConfigItem | null>(null)

  const transferTypeConfigData = ref<UITransferTypeConfigItem[]>([])
  const transferTypeModalVisible = ref(false)
  const editingTransferType = ref<UITransferTypeConfigItem | null>(null)

  const selectedNode = computed(() => selectedNodeKey.value)
  const editingItem = computed(() => editingButton.value)
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

  async function fetchApplicationConfig() {
    loading.value = true
    try {
      applicationConfigData.value = await uiConfigApi.getApplicationConfig()
    }
    catch (error: any) {
      Message.error(error.message || '获取申请单配置失败')
    }
    finally {
      loading.value = false
    }
  }

  async function fetchTransferTabConfig() {
    loading.value = true
    try {
      transferTabConfigData.value = await uiConfigApi.getTransferTabs()
    }
    catch (error: any) {
      Message.error(error.message || '获取传输页签配置失败')
    }
    finally {
      loading.value = false
    }
  }

  async function fetchTransferTypeConfig() {
    loading.value = true
    try {
      transferTypeConfigData.value = await uiConfigApi.getTransferTypes()
    }
    catch (error: any) {
      Message.error(error.message || '获取传输类型配置失败')
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

  async function handleSaveApplicationConfig(data: Omit<UIApplicationConfigItem, 'id'> | UIApplicationConfigItem) {
    try {
      if ('id' in data && data.id)
        await uiConfigApi.updateApplicationConfig(data.id, data)
      else
        await uiConfigApi.createApplicationConfig(data)
      Message.success('申请单配置保存成功')
      applicationModalVisible.value = false
      await fetchApplicationConfig()
    }
    catch (error: any) {
      Message.error(error.message || '保存失败')
      throw error
    }
  }

  async function handleSaveTransferTabConfig(data: Omit<UITransferTabConfigItem, 'id'> | UITransferTabConfigItem) {
    try {
      if ('id' in data && data.id)
        await uiConfigApi.updateTransferTab(data.id, data)
      else
        await uiConfigApi.createTransferTab(data)
      Message.success('传输页签配置保存成功')
      transferTabModalVisible.value = false
      await fetchTransferTabConfig()
    }
    catch (error: any) {
      Message.error(error.message || '保存失败')
      throw error
    }
  }

  async function handleSaveTransferTypeConfig(data: Omit<UITransferTypeConfigItem, 'id'> | UITransferTypeConfigItem) {
    try {
      if ('id' in data && data.id)
        await uiConfigApi.updateTransferType(data.id, data)
      else
        await uiConfigApi.createTransferType(data)
      Message.success('传输类型配置保存成功')
      transferTypeModalVisible.value = false
      await fetchTransferTypeConfig()
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

  async function handleApplicationSort(newOrderIds: string[]) {
    try {
      await uiConfigApi.sortApplicationConfig(newOrderIds)
      Message.success('排序已更新')
      await fetchApplicationConfig()
    }
    catch (error: any) {
      Message.error(error.message || '排序失败')
    }
  }

  async function handleTransferTabSort(newOrderIds: string[]) {
    try {
      await uiConfigApi.sortTransferTabs(newOrderIds)
      Message.success('排序已更新')
      await fetchTransferTabConfig()
    }
    catch (error: any) {
      Message.error(error.message || '排序失败')
    }
  }

  async function handleTransferTypeSort(newOrderIds: string[]) {
    try {
      await uiConfigApi.sortTransferTypes(newOrderIds)
      Message.success('排序已更新')
      await fetchTransferTypeConfig()
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

  function handleCreateApplication() {
    editingApplication.value = null
    applicationModalVisible.value = true
  }

  function handleEditApplication(item: UIApplicationConfigItem) {
    editingApplication.value = { ...item }
    applicationModalVisible.value = true
  }

  function handleDeleteApplication(item: UIApplicationConfigItem) {
    Modal.confirm({
      title: '确认删除',
      content: `确认删除配置项「${item.label}」吗？`,
      onOk: async () => {
        await uiConfigApi.deleteApplicationConfig(item.id)
        Message.success('删除成功')
        fetchApplicationConfig()
      },
    })
  }

  function handleCreateTransferTab() {
    editingTransferTab.value = null
    transferTabModalVisible.value = true
  }

  function handleEditTransferTab(item: UITransferTabConfigItem) {
    editingTransferTab.value = { ...item }
    transferTabModalVisible.value = true
  }

  function handleDeleteTransferTab(item: UITransferTabConfigItem) {
    Modal.confirm({
      title: '确认删除',
      content: `确认删除页签「${item.label}」吗？`,
      onOk: async () => {
        await uiConfigApi.deleteTransferTab(item.id)
        Message.success('删除成功')
        fetchTransferTabConfig()
      },
    })
  }

  function handleCreateTransferType() {
    editingTransferType.value = null
    transferTypeModalVisible.value = true
  }

  function handleEditTransferType(item: UITransferTypeConfigItem) {
    editingTransferType.value = { ...item }
    transferTypeModalVisible.value = true
  }

  function handleDeleteTransferType(item: UITransferTypeConfigItem) {
    Modal.confirm({
      title: '确认删除',
      content: `确认删除传输类型「${item.title}」吗？`,
      onOk: async () => {
        await uiConfigApi.deleteTransferType(item.id)
        Message.success('删除成功')
        fetchTransferTypeConfig()
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

  async function handleToggleApplicationStatus(item: UIApplicationConfigItem) {
    try {
      const nextStatus = item.status === 'enabled' ? 'disabled' : 'enabled'
      await uiConfigApi.updateApplicationStatus(item.id, nextStatus)
      Message.success(nextStatus === 'enabled' ? '启用成功' : '禁用成功')
      await fetchApplicationConfig()
    }
    catch (error: any) {
      Message.error(error.message || '更新状态失败')
    }
  }

  async function handleToggleTransferTabStatus(item: UITransferTabConfigItem) {
    try {
      const nextStatus = item.status === 'enabled' ? 'disabled' : 'enabled'
      await uiConfigApi.updateTransferTabStatus(item.id, nextStatus)
      Message.success(nextStatus === 'enabled' ? '启用成功' : '禁用成功')
      await fetchTransferTabConfig()
    }
    catch (error: any) {
      Message.error(error.message || '更新状态失败')
    }
  }

  async function handleToggleTransferTypeStatus(item: UITransferTypeConfigItem) {
    try {
      const nextStatus = item.status === 'enabled' ? 'disabled' : 'enabled'
      await uiConfigApi.updateTransferTypeStatus(item.id, nextStatus)
      Message.success(nextStatus === 'enabled' ? '启用成功' : '禁用成功')
      await fetchTransferTypeConfig()
    }
    catch (error: any) {
      Message.error(error.message || '更新状态失败')
    }
  }

  async function refreshByTab(tab: UIConfigTab) {
    if (tab === 'text') return fetchTextConfig()
    if (tab === 'i18n') return fetchI18nConfig()
    if (tab === 'button') return fetchButtonConfig()
    if (tab === 'application') return fetchApplicationConfig()
    if (tab === 'transferTab') return fetchTransferTabConfig()
    if (tab === 'transferType') return fetchTransferTypeConfig()
  }

  async function handleTabChange(tab: string | number) {
    const nextTab = tab as UIConfigTab
    activeTab.value = nextTab
    await refreshByTab(nextTab)
  }

  function handleCloseButtonModal() {
    buttonModalVisible.value = false
    editingButton.value = null
  }

  function handleCloseApplicationModal() {
    applicationModalVisible.value = false
    editingApplication.value = null
  }

  function handleCloseTransferTabModal() {
    transferTabModalVisible.value = false
    editingTransferTab.value = null
  }

  function handleCloseTransferTypeModal() {
    transferTypeModalVisible.value = false
    editingTransferType.value = null
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
    i18nConfigData,
    selectedLang,
    translationData,
    buttonConfigData,
    buttonModalVisible,
    editingButton,
    applicationConfigData,
    applicationModalVisible,
    editingApplication,
    transferTabConfigData,
    transferTabModalVisible,
    editingTransferTab,
    transferTypeConfigData,
    transferTypeModalVisible,
    editingTransferType,
    fetchTextConfig,
    fetchI18nConfig,
    fetchButtonConfig,
    fetchApplicationConfig,
    fetchTransferTabConfig,
    fetchTransferTypeConfig,
    fetchTranslations,
    handleSaveTextConfig,
    handleSaveI18nConfig,
    handleSaveButtonConfig,
    handleSaveApplicationConfig,
    handleSaveTransferTabConfig,
    handleSaveTransferTypeConfig,
    handleImportConfig,
    handleExportConfig,
    handleApplicationSort,
    handleTransferTabSort,
    handleTransferTypeSort,
    handleSelectTextNode,
    handleCreateButton,
    handleEditButton,
    handleDeleteButton,
    handleToggleButtonStatus,
    handleToggleLanguageStatus,
    handleToggleApplicationStatus,
    handleToggleTransferTabStatus,
    handleToggleTransferTypeStatus,
    handleCreateApplication,
    handleEditApplication,
    handleDeleteApplication,
    handleCreateTransferTab,
    handleEditTransferTab,
    handleDeleteTransferTab,
    handleCreateTransferType,
    handleEditTransferType,
    handleDeleteTransferType,
    handleTabChange,
    handleCloseButtonModal,
    handleCloseApplicationModal,
    handleCloseTransferTabModal,
    handleCloseTransferTypeModal,
  }
}
