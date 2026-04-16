<script setup lang="ts">
import type { UIApplicationConfigItem, UIApplicationConfigType, UIButtonConfigItem, UIConfigTab, UITranslationItem, UITransferTabConfigItem, UITransferTypeConfigItem, UserRole } from '@/types'
import { computed, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useUIConfig } from '@/composables/useUIConfig'
import './ui-config.scss'

const {
  loading,
  activeTab,
  textTreeData,
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
  handleSelectTextNode,
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
  fetchTranslations,
} = useUIConfig()

const textForm = reactive({
  key: '',
  zhCN: '',
  enUS: '',
  description: '',
})

const buttonForm = reactive<Omit<UIButtonConfigItem, 'id'>>({
  name: '',
  code: '',
  page: '申请单列表',
  roles: ['admin'],
  condition: '{\n  "status": []\n}',
  status: 'enabled',
})

const applicationForm = reactive<Omit<UIApplicationConfigItem, 'id'>>({
  type: 'applicantNotifyOptions',
  label: '',
  value: '',
  order: 1,
  status: 'enabled',
})

const transferTabForm = reactive<Omit<UITransferTabConfigItem, 'id'>>({
  key: '',
  label: '',
  order: 1,
  status: 'enabled',
})

const transferTypeForm = reactive<Omit<UITransferTypeConfigItem, 'id'>>({
  key: '',
  title: '',
  desc: '',
  fromZone: 'green',
  toZone: 'green',
  fromIcon: '',
  toIcon: '',
  arrowIcon: '',
  fromStyle: '',
  toStyle: '',
  level: 'free',
  levelText: '免审批',
  tabGroup: 'green',
  order: 1,
  status: 'enabled',
})

const importModalVisible = ref(false)
const importType = ref<UIConfigTab>('text')
const importPayload = ref('')

const roleOptions: Array<{ label: string, value: UserRole }> = [
  { label: '管理员', value: 'admin' },
  { label: '提交人', value: 'submitter' },
  { label: '一级审批', value: 'approver1' },
  { label: '二级审批', value: 'approver2' },
  { label: '三级审批', value: 'approver3' },
  { label: '合作方', value: 'partner' },
  { label: '供应商', value: 'vendor' },
  { label: '子公司', value: 'subsidiary' },
]

const pageOptions = [
  { label: '申请单列表', value: '申请单列表' },
  { label: '审批详情', value: '审批详情' },
  { label: '传输管理', value: '传输管理' },
  { label: '下载中心', value: '下载中心' },
  { label: '用户管理', value: '用户管理' },
]

const languageColumns = [
  { title: '语言名称', dataIndex: 'name', width: 130 },
  { title: '语言代码', dataIndex: 'code', width: 120 },
  { title: '状态', slotName: 'status', width: 120 },
  { title: '翻译完成度', slotName: 'progress' },
]

const translationColumns = [
  { title: '配置键', dataIndex: 'key', width: 220 },
  { title: '中文', slotName: 'zhCN' },
  { title: '英文', slotName: 'enUS' },
  { title: '状态', slotName: 'status', width: 100 },
]

const buttonColumns = [
  { title: '按钮名称', dataIndex: 'name', width: 140 },
  { title: '按钮代码', dataIndex: 'code', width: 180 },
  { title: '所属页面', dataIndex: 'page', width: 120 },
  { title: '角色权限', slotName: 'roles', width: 240 },
  { title: '显示条件', dataIndex: 'condition', ellipsis: true },
  { title: '状态', slotName: 'status', width: 110 },
  { title: '操作', slotName: 'actions', width: 140, fixed: 'right' },
]

const applicationColumns = [
  { title: '配置类型', slotName: 'type', width: 180 },
  { title: '标签', dataIndex: 'label', width: 140 },
  { title: '值', dataIndex: 'value', ellipsis: true },
  { title: '顺序', dataIndex: 'order', width: 80 },
  { title: '状态', slotName: 'status', width: 100 },
  { title: '操作', slotName: 'actions', width: 180, fixed: 'right' },
]

const applicationTypeOptions: Array<{ label: string, value: UIApplicationConfigType }> = [
  { label: '申请人通知选项', value: 'applicantNotifyOptions' },
  { label: '下载人通知选项', value: 'downloaderNotifyOptions' },
  { label: '最近传输模板', value: 'recentTransferTemplates' },
  { label: '注意事项', value: 'noticeItems' },
]

const transferTabColumns = [
  { title: '页签 Key', dataIndex: 'key', width: 120 },
  { title: '页签名称', dataIndex: 'label', width: 140 },
  { title: '顺序', dataIndex: 'order', width: 80 },
  { title: '状态', slotName: 'status', width: 100 },
  { title: '操作', slotName: 'actions', width: 180, fixed: 'right' },
]

const transferTypeColumns = [
  { title: '类型 Key', dataIndex: 'key', width: 140 },
  { title: '标题', dataIndex: 'title', width: 140 },
  { title: '所属 Tab', dataIndex: 'tabGroup', width: 100 },
  { title: '审批级别', dataIndex: 'levelText', width: 100 },
  { title: '顺序', dataIndex: 'order', width: 80 },
  { title: '状态', slotName: 'status', width: 100 },
  { title: '操作', slotName: 'actions', width: 180, fixed: 'right' },
]

const zoneOptions = [
  { label: '绿区', value: 'green' },
  { label: '黄区', value: 'yellow' },
  { label: '外网', value: 'external' },
  { label: '跨域', value: 'cross' },
]

const levelOptions = [
  { label: '免审批', value: 'free' },
  { label: '一级审批', value: 'l1' },
  { label: '二级审批', value: 'l2' },
  { label: '三级审批', value: 'l3' },
]

const buttonModalTitle = computed(() => (editingButton.value ? '编辑按钮配置' : '新增按钮配置'))
const applicationModalTitle = computed(() => (editingApplication.value ? '编辑申请单配置' : '新增申请单配置'))
const transferTabModalTitle = computed(() => (editingTransferTab.value ? '编辑传输页签配置' : '新增传输页签配置'))
const transferTypeModalTitle = computed(() => (editingTransferType.value ? '编辑传输类型配置' : '新增传输类型配置'))

function syncTextForm() {
  if (!selectedTextItem.value) {
    textForm.key = ''
    textForm.zhCN = ''
    textForm.enUS = ''
    textForm.description = ''
    return
  }

  textForm.key = selectedTextItem.value.key
  textForm.zhCN = selectedTextItem.value.zhCN
  textForm.enUS = selectedTextItem.value.enUS
  textForm.description = selectedTextItem.value.description
}

function onTreeSelect(keys: string[]) {
  const key = keys[0]
  if (!key || key.startsWith('module:')) return
  handleSelectTextNode(key)
  syncTextForm()
}

async function onSaveText() {
  if (!textForm.key) {
    Message.warning('请先选择配置项')
    return
  }

  await handleSaveTextConfig(textForm.key, {
    zhCN: textForm.zhCN,
    enUS: textForm.enUS,
    description: textForm.description,
  })
  syncTextForm()
}

function openImportModal(type: UIConfigTab) {
  importType.value = type
  importPayload.value = ''
  importModalVisible.value = true
}

async function confirmImport() {
  await handleImportConfig(importType.value, importPayload.value)
  importModalVisible.value = false
}

async function onExport(type: UIConfigTab) {
  await handleExportConfig(type)
}

function handleLangChange(code: string) {
  fetchTranslations(code)
}

async function saveTranslations() {
  await handleSaveI18nConfig(selectedLang.value, translationData.value)
}

function openButtonModal(item?: UIButtonConfigItem) {
  if (item) {
    handleEditButton(item)
    Object.assign(buttonForm, {
      name: item.name,
      code: item.code,
      page: item.page,
      roles: [...item.roles],
      condition: item.condition,
      status: item.status,
    })
    return
  }

  handleCreateButton()
  Object.assign(buttonForm, {
    name: '',
    code: '',
    page: '申请单列表',
    roles: ['admin'],
    condition: '{\n  "status": []\n}',
    status: 'enabled',
  })
}

async function saveButton() {
  const payload = editingButton.value
    ? { ...buttonForm, id: editingButton.value.id }
    : { ...buttonForm }
  await handleSaveButtonConfig(payload)
}

function openApplicationModal(item?: UIApplicationConfigItem) {
  if (item) {
    handleEditApplication(item)
    Object.assign(applicationForm, {
      type: item.type,
      label: item.label,
      value: item.value,
      order: item.order,
      status: item.status,
    })
    return
  }

  handleCreateApplication()
  Object.assign(applicationForm, {
    type: 'applicantNotifyOptions',
    label: '',
    value: '',
    order: applicationConfigData.value.filter(c => c.type === 'applicantNotifyOptions').length + 1,
    status: 'enabled',
  })
}

async function saveApplication() {
  const payload = editingApplication.value
    ? { ...applicationForm, id: editingApplication.value.id }
    : { ...applicationForm }
  await handleSaveApplicationConfig(payload)
}

function moveApplication(item: UIApplicationConfigItem, direction: 'up' | 'down') {
  const sameTypeItems = [...applicationConfigData.value]
    .filter(c => c.type === item.type)
    .sort((a, b) => a.order - b.order)
  const index = sameTypeItems.findIndex(c => c.id === item.id)
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || targetIndex < 0 || targetIndex >= sameTypeItems.length) return
  const current = sameTypeItems.splice(index, 1)[0]!
  sameTypeItems.splice(targetIndex, 0, current)
  handleApplicationSort(sameTypeItems.map(c => c.id))
}

function getApplicationTypeName(type: UIApplicationConfigType): string {
  const option = applicationTypeOptions.find(o => o.value === type)
  return option?.label || type
}

function openTransferTabModal(item?: UITransferTabConfigItem) {
  if (item) {
    handleEditTransferTab(item)
    Object.assign(transferTabForm, {
      key: item.key,
      label: item.label,
      order: item.order,
      status: item.status,
    })
    return
  }

  handleCreateTransferTab()
  Object.assign(transferTabForm, {
    key: '',
    label: '',
    order: transferTabConfigData.value.length + 1,
    status: 'enabled',
  })
}

async function saveTransferTab() {
  const payload = editingTransferTab.value
    ? { ...transferTabForm, id: editingTransferTab.value.id }
    : { ...transferTabForm }
  await handleSaveTransferTabConfig(payload)
}

function moveTransferTab(item: UITransferTabConfigItem, direction: 'up' | 'down') {
  const sortedItems = [...transferTabConfigData.value].sort((a, b) => a.order - b.order)
  const index = sortedItems.findIndex(c => c.id === item.id)
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || targetIndex < 0 || targetIndex >= sortedItems.length) return
  const current = sortedItems.splice(index, 1)[0]!
  sortedItems.splice(targetIndex, 0, current)
  handleTransferTabSort(sortedItems.map(c => c.id))
}

function openTransferTypeModal(item?: UITransferTypeConfigItem) {
  if (item) {
    handleEditTransferType(item)
    Object.assign(transferTypeForm, {
      key: item.key,
      title: item.title,
      desc: item.desc,
      fromZone: item.fromZone,
      toZone: item.toZone,
      fromIcon: item.fromIcon,
      toIcon: item.toIcon,
      arrowIcon: item.arrowIcon,
      level: item.level,
      levelText: item.levelText,
      tabGroup: item.tabGroup,
      order: item.order,
      status: item.status,
    })
    return
  }

  handleCreateTransferType()
  Object.assign(transferTypeForm, {
    key: '',
    title: '',
    desc: '',
    fromZone: 'green',
    toZone: 'green',
    fromIcon: '',
    toIcon: '',
    arrowIcon: '',
    level: 'free',
    levelText: '免审批',
    tabGroup: 'green',
    order: transferTypeConfigData.value.filter(t => t.tabGroup === 'green').length + 1,
    status: 'enabled',
  })
}

async function saveTransferType() {
  const payload = editingTransferType.value
    ? { ...transferTypeForm, id: editingTransferType.value.id }
    : { ...transferTypeForm }
  await handleSaveTransferTypeConfig(payload)
}

function moveTransferType(item: UITransferTypeConfigItem, direction: 'up' | 'down') {
  const sameGroupItems = [...transferTypeConfigData.value]
    .filter(t => t.tabGroup === item.tabGroup)
    .sort((a, b) => a.order - b.order)
  const index = sameGroupItems.findIndex(c => c.id === item.id)
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || targetIndex < 0 || targetIndex >= sameGroupItems.length) return
  const current = sameGroupItems.splice(index, 1)[0]!
  sameGroupItems.splice(targetIndex, 0, current)
  handleTransferTypeSort(sameGroupItems.map(c => c.id))
}

syncTextForm()
</script>

<template>
  <div class="ui-config-view">
    <a-tabs v-model:active-key="activeTab" @change="handleTabChange">
      <a-tab-pane key="text" title="文字内容配置">
        <div class="ui-config-toolbar">
          <a-space>
            <a-button @click="openImportModal('text')">导入 JSON</a-button>
            <a-button @click="onExport('text')">导出 JSON</a-button>
          </a-space>
        </div>

        <div class="text-config-layout">
          <div class="text-tree-panel">
            <a-tree
              :data="textTreeData"
              :selected-keys="selectedNodeKey ? [selectedNodeKey] : []"
              block-node
              @select="onTreeSelect"
            />
          </div>

          <div class="text-form-panel">
            <a-form layout="vertical">
              <a-form-item label="配置键">
                <a-input v-model="textForm.key" readonly />
              </a-form-item>
              <a-form-item label="中文文字">
                <a-input v-model="textForm.zhCN" placeholder="请输入中文文案" />
              </a-form-item>
              <a-form-item label="英文文字">
                <a-input v-model="textForm.enUS" placeholder="请输入英文文案" />
              </a-form-item>
              <a-form-item label="描述">
                <a-textarea v-model="textForm.description" :auto-size="{ minRows: 3, maxRows: 5 }" />
              </a-form-item>
              <a-button type="primary" :loading="loading" @click="onSaveText">保存文字配置</a-button>
            </a-form>
          </div>
        </div>
      </a-tab-pane>

      <a-tab-pane key="i18n" title="国际化配置">
        <div class="ui-config-toolbar">
          <a-space>
            <a-button @click="openImportModal('i18n')">导入 JSON</a-button>
            <a-button @click="onExport('i18n')">导出 JSON</a-button>
            <a-button type="primary" @click="saveTranslations">保存翻译</a-button>
          </a-space>
        </div>

        <div class="i18n-layout">
          <div class="lang-table-panel">
            <a-table :data="i18nConfigData" :columns="languageColumns" :pagination="false" row-key="code" :loading="loading">
              <template #status="{ record }">
                <a-switch
                  :model-value="(record as any).status === 'enabled'"
                  checked-text="启用"
                  unchecked-text="禁用"
                  @change="() => handleToggleLanguageStatus(record as any)"
                />
              </template>

              <template #progress="{ record }">
                <a-progress :percent="(record as any).progress" :show-text="true" size="small" />
              </template>

              <template #rowOperations="{ record }">
                <a-button type="text" @click="handleLangChange((record as any).code)">编辑翻译</a-button>
              </template>
            </a-table>
          </div>

          <div class="translation-panel">
            <div class="translation-header">
              <a-select v-model="selectedLang" style="width: 200px" @change="handleLangChange">
                <a-option v-for="lang in i18nConfigData" :key="lang.code" :value="lang.code" :label="`${lang.name} (${lang.code})`" />
              </a-select>
            </div>

            <a-table :data="translationData" :columns="translationColumns" :pagination="false" row-key="key">
              <template #zhCN="{ record }">
                <a-input v-model="(record as UITranslationItem).zhCN" />
              </template>
              <template #enUS="{ record }">
                <a-input v-model="(record as UITranslationItem).enUS" />
              </template>
              <template #status="{ record }">
                <a-tag :color="(record as UITranslationItem).status === 'done' ? 'green' : 'orange'">
                  {{ (record as UITranslationItem).status === 'done' ? '已完成' : '待补充' }}
                </a-tag>
              </template>
            </a-table>
          </div>
        </div>
      </a-tab-pane>

      <a-tab-pane key="button" title="按钮显隐配置">
        <div class="ui-config-toolbar">
          <a-space>
            <a-button type="primary" @click="openButtonModal()">新增按钮</a-button>
            <a-button @click="openImportModal('button')">导入 JSON</a-button>
            <a-button @click="onExport('button')">导出 JSON</a-button>
          </a-space>
        </div>

        <a-table :data="buttonConfigData" :columns="buttonColumns" :pagination="false" row-key="id" :loading="loading">
          <template #roles="{ record }">
            <a-space wrap>
              <a-tag v-for="role in (record as UIButtonConfigItem).roles" :key="role" color="arcoblue">{{ role }}</a-tag>
            </a-space>
          </template>

          <template #status="{ record }">
            <a-switch
              :model-value="(record as UIButtonConfigItem).status === 'enabled'"
              checked-text="启用"
              unchecked-text="禁用"
              @change="() => handleToggleButtonStatus(record as UIButtonConfigItem)"
            />
          </template>

          <template #actions="{ record }">
            <a-space>
              <a-button type="text" size="small" @click="openButtonModal(record as UIButtonConfigItem)">编辑</a-button>
              <a-button type="text" size="small" status="danger" @click="handleDeleteButton(record as UIButtonConfigItem)">删除</a-button>
            </a-space>
          </template>
        </a-table>
      </a-tab-pane>

      <a-tab-pane key="application" title="申请单配置">
        <div class="ui-config-toolbar">
          <a-space>
            <a-button type="primary" @click="openApplicationModal()">新增配置</a-button>
            <a-button @click="openImportModal('application')">导入 JSON</a-button>
            <a-button @click="onExport('application')">导出 JSON</a-button>
          </a-space>
        </div>

        <a-table :data="applicationConfigData" :columns="applicationColumns" :pagination="false" row-key="id" :loading="loading">
          <template #type="{ record }">
            <a-tag color="arcoblue">{{ getApplicationTypeName((record as UIApplicationConfigItem).type) }}</a-tag>
          </template>

          <template #status="{ record }">
            <a-switch
              :model-value="(record as UIApplicationConfigItem).status === 'enabled'"
              checked-text="启用"
              unchecked-text="禁用"
              @change="() => handleToggleApplicationStatus(record as UIApplicationConfigItem)"
            />
          </template>

          <template #actions="{ record }">
            <a-space>
              <a-button type="text" size="small" @click="moveApplication(record as UIApplicationConfigItem, 'up')">上移</a-button>
              <a-button type="text" size="small" @click="moveApplication(record as UIApplicationConfigItem, 'down')">下移</a-button>
              <a-button type="text" size="small" @click="openApplicationModal(record as UIApplicationConfigItem)">编辑</a-button>
              <a-button type="text" size="small" status="danger" @click="handleDeleteApplication(record as UIApplicationConfigItem)">删除</a-button>
            </a-space>
          </template>
        </a-table>
      </a-tab-pane>

      <a-tab-pane key="transferTab" title="传输页签配置">
        <div class="ui-config-toolbar">
          <a-space>
            <a-button type="primary" @click="openTransferTabModal()">新增页签</a-button>
            <a-button @click="openImportModal('transferTab')">导入 JSON</a-button>
            <a-button @click="onExport('transferTab')">导出 JSON</a-button>
          </a-space>
        </div>

        <a-table :data="transferTabConfigData" :columns="transferTabColumns" :pagination="false" row-key="id" :loading="loading">
          <template #status="{ record }">
            <a-switch
              :model-value="(record as UITransferTabConfigItem).status === 'enabled'"
              checked-text="启用"
              unchecked-text="禁用"
              @change="() => handleToggleTransferTabStatus(record as UITransferTabConfigItem)"
            />
          </template>

          <template #actions="{ record }">
            <a-space>
              <a-button type="text" size="small" @click="moveTransferTab(record as UITransferTabConfigItem, 'up')">上移</a-button>
              <a-button type="text" size="small" @click="moveTransferTab(record as UITransferTabConfigItem, 'down')">下移</a-button>
              <a-button type="text" size="small" @click="openTransferTabModal(record as UITransferTabConfigItem)">编辑</a-button>
              <a-button type="text" size="small" status="danger" @click="handleDeleteTransferTab(record as UITransferTabConfigItem)">删除</a-button>
            </a-space>
          </template>
        </a-table>
      </a-tab-pane>

      <a-tab-pane key="transferType" title="传输类型配置">
        <div class="ui-config-toolbar">
          <a-space>
            <a-button type="primary" @click="openTransferTypeModal()">新增类型</a-button>
            <a-button @click="openImportModal('transferType')">导入 JSON</a-button>
            <a-button @click="onExport('transferType')">导出 JSON</a-button>
          </a-space>
        </div>

        <a-table :data="transferTypeConfigData" :columns="transferTypeColumns" :pagination="false" row-key="id" :loading="loading">
          <template #status="{ record }">
            <a-switch
              :model-value="(record as UITransferTypeConfigItem).status === 'enabled'"
              checked-text="启用"
              unchecked-text="禁用"
              @change="() => handleToggleTransferTypeStatus(record as UITransferTypeConfigItem)"
            />
          </template>

          <template #actions="{ record }">
            <a-space>
              <a-button type="text" size="small" @click="moveTransferType(record as UITransferTypeConfigItem, 'up')">上移</a-button>
              <a-button type="text" size="small" @click="moveTransferType(record as UITransferTypeConfigItem, 'down')">下移</a-button>
              <a-button type="text" size="small" @click="openTransferTypeModal(record as UITransferTypeConfigItem)">编辑</a-button>
              <a-button type="text" size="small" status="danger" @click="handleDeleteTransferType(record as UITransferTypeConfigItem)">删除</a-button>
            </a-space>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>

    <a-modal
      v-model:visible="buttonModalVisible"
      :title="buttonModalTitle"
      width="680px"
      @cancel="handleCloseButtonModal"
      @ok="saveButton"
    >
      <a-form :model="buttonForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="按钮名称" required>
              <a-input v-model="buttonForm.name" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="按钮代码" required>
              <a-input v-model="buttonForm.code" :disabled="Boolean(editingButton)" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="所属页面">
              <a-select v-model="buttonForm.page" :options="pageOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="启用状态">
              <a-switch
                :model-value="buttonForm.status === 'enabled'"
                @change="value => buttonForm.status = value ? 'enabled' : 'disabled'"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="角色权限">
          <a-select v-model="buttonForm.roles" :options="roleOptions" multiple allow-clear />
        </a-form-item>
        <a-form-item label="显示条件（JSON）">
          <a-textarea v-model="buttonForm.condition" :auto-size="{ minRows: 4, maxRows: 8 }" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:visible="importModalVisible"
      title="导入 JSON 配置"
      width="760px"
      @ok="confirmImport"
    >
      <a-form layout="vertical">
        <a-form-item label="配置类型">
          <a-select v-model="importType">
            <a-option value="text">文字内容配置</a-option>
            <a-option value="i18n">国际化配置</a-option>
            <a-option value="button">按钮显隐配置</a-option>
            <a-option value="application">申请单配置</a-option>
            <a-option value="transferTab">传输页签配置</a-option>
            <a-option value="transferType">传输类型配置</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="JSON 内容">
          <a-textarea v-model="importPayload" :auto-size="{ minRows: 10, maxRows: 16 }" placeholder="请粘贴 JSON 内容" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:visible="applicationModalVisible"
      :title="applicationModalTitle"
      width="640px"
      @cancel="handleCloseApplicationModal"
      @ok="saveApplication"
    >
      <a-form :model="applicationForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="配置类型" required>
              <a-select v-model="applicationForm.type" :options="applicationTypeOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="显示顺序">
              <a-input-number v-model="applicationForm.order" :min="1" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="标签" required>
          <a-input v-model="applicationForm.label" placeholder="显示名称" />
        </a-form-item>
        <a-form-item label="值" required>
          <a-textarea v-model="applicationForm.value" :auto-size="{ minRows: 2, maxRows: 6 }" placeholder="选项值或文本内容" />
        </a-form-item>
        <a-form-item label="启用状态">
          <a-switch
            :model-value="applicationForm.status === 'enabled'"
            @change="value => applicationForm.status = value ? 'enabled' : 'disabled'"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:visible="transferTabModalVisible"
      :title="transferTabModalTitle"
      width="560px"
      @cancel="handleCloseTransferTabModal"
      @ok="saveTransferTab"
    >
      <a-form :model="transferTabForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="页签 Key" required>
              <a-input v-model="transferTabForm.key" :disabled="Boolean(editingTransferTab)" placeholder="如: green, yellow" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="显示顺序">
              <a-input-number v-model="transferTabForm.order" :min="1" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="页签名称" required>
          <a-input v-model="transferTabForm.label" placeholder="如: 绿区传出" />
        </a-form-item>
        <a-form-item label="启用状态">
          <a-switch
            :model-value="transferTabForm.status === 'enabled'"
            @change="value => transferTabForm.status = value ? 'enabled' : 'disabled'"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:visible="transferTypeModalVisible"
      :title="transferTypeModalTitle"
      width="760px"
      @cancel="handleCloseTransferTypeModal"
      @ok="saveTransferType"
    >
      <a-form :model="transferTypeForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="类型 Key" required>
              <a-input v-model="transferTypeForm.key" :disabled="Boolean(editingTransferType)" placeholder="如: green-to-yellow" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="所属 Tab" required>
              <a-select v-model="transferTypeForm.tabGroup">
                <a-option v-for="tab in transferTabConfigData" :key="tab.id" :value="tab.key" :label="tab.label" />
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="显示顺序">
              <a-input-number v-model="transferTypeForm.order" :min="1" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="标题" required>
              <a-input v-model="transferTypeForm.title" placeholder="如: 绿区传到黄区" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="描述">
              <a-input v-model="transferTypeForm.desc" placeholder="卡片描述文字" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="源区域">
              <a-select v-model="transferTypeForm.fromZone" :options="zoneOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="目标区域">
              <a-select v-model="transferTypeForm.toZone" :options="zoneOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="审批级别">
              <a-select v-model="transferTypeForm.level" :options="levelOptions" @change="(val: string) => {
                const opt = levelOptions.find(o => o.value === val)
                transferTypeForm.levelText = opt?.label || ''
              }" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="源图标">
              <a-input v-model="transferTypeForm.fromIcon" placeholder="/figma/..." />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="目标图标">
              <a-input v-model="transferTypeForm.toIcon" placeholder="/figma/..." />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="箭头图标">
              <a-input v-model="transferTypeForm.arrowIcon" placeholder="/figma/..." />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="启用状态">
          <a-switch
            :model-value="transferTypeForm.status === 'enabled'"
            @change="value => transferTypeForm.status = value ? 'enabled' : 'disabled'"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
