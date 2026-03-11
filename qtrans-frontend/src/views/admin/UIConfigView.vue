<script setup lang="ts">
import type { UIButtonConfigItem, UICardConfigItem, UIConfigTab, UITranslationItem, UserRole } from '@/types'
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
  cardConfigData,
  cardModalVisible,
  editingCard,
  i18nConfigData,
  selectedLang,
  translationData,
  buttonConfigData,
  buttonModalVisible,
  editingButton,
  handleSelectTextNode,
  handleSaveTextConfig,
  handleSaveCardConfig,
  handleSaveI18nConfig,
  handleSaveButtonConfig,
  handleImportConfig,
  handleExportConfig,
  handleCardSort,
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
  fetchTranslations,
} = useUIConfig()

const textForm = reactive({
  key: '',
  zhCN: '',
  enUS: '',
  description: '',
})

const cardForm = reactive<Omit<UICardConfigItem, 'id'>>({
  name: '',
  code: '',
  order: 1,
  required: false,
  fieldConfig: '{\n  "fields": []\n}',
  status: 'enabled',
})

const buttonForm = reactive<Omit<UIButtonConfigItem, 'id'>>({
  name: '',
  code: '',
  page: '申请单列表',
  roles: ['admin'],
  condition: '{\n  "status": []\n}',
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

const cardColumns = [
  { title: '卡片名称', dataIndex: 'name', width: 160 },
  { title: '卡片代码', dataIndex: 'code', width: 160 },
  { title: '显示顺序', dataIndex: 'order', width: 100 },
  { title: '是否必填', slotName: 'required', width: 100 },
  { title: '启用状态', slotName: 'status', width: 120 },
  { title: '操作', slotName: 'actions', width: 220, fixed: 'right' },
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

const cardModalTitle = computed(() => (editingCard.value ? '编辑卡片配置' : '新增卡片配置'))
const buttonModalTitle = computed(() => (editingButton.value ? '编辑按钮配置' : '新增按钮配置'))

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

function openCardModal(item?: UICardConfigItem) {
  if (item) {
    handleEditCard(item)
    Object.assign(cardForm, {
      name: item.name,
      code: item.code,
      order: item.order,
      required: item.required,
      fieldConfig: item.fieldConfig,
      status: item.status,
    })
    return
  }

  handleCreateCard()
  Object.assign(cardForm, {
    name: '',
    code: '',
    order: cardConfigData.value.length + 1,
    required: false,
    fieldConfig: '{\n  "fields": []\n}',
    status: 'enabled',
  })
}

async function saveCard() {
  const payload = editingCard.value
    ? { ...cardForm, id: editingCard.value.id }
    : { ...cardForm }
  await handleSaveCardConfig(payload)
}

function moveCard(item: UICardConfigItem, direction: 'up' | 'down') {
  const ordered = [...cardConfigData.value].sort((a, b) => a.order - b.order)
  const index = ordered.findIndex(card => card.id === item.id)
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return
  const [current] = ordered.splice(index, 1)
  ordered.splice(targetIndex, 0, current)
  handleCardSort(ordered.map(card => card.id))
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

syncTextForm()
</script>

<template>
  <div class="ui-config-view">
    <div class="ui-config-view__header">
      <h2 class="ui-config-view__title">界面配置</h2>
    </div>

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

      <a-tab-pane key="card" title="申请单卡片配置">
        <div class="ui-config-toolbar">
          <a-space>
            <a-button type="primary" @click="openCardModal()">新增卡片</a-button>
            <a-button @click="openImportModal('card')">导入 JSON</a-button>
            <a-button @click="onExport('card')">导出 JSON</a-button>
          </a-space>
        </div>

        <a-table :data="cardConfigData" :columns="cardColumns" :pagination="false" row-key="id" :loading="loading">
          <template #required="{ record }">
            <a-tag :color="(record as UICardConfigItem).required ? 'green' : 'gray'">
              {{ (record as UICardConfigItem).required ? '必填' : '选填' }}
            </a-tag>
          </template>

          <template #status="{ record }">
            <a-tag :color="(record as UICardConfigItem).status === 'enabled' ? 'green' : 'gray'">
              {{ (record as UICardConfigItem).status === 'enabled' ? '启用' : '禁用' }}
            </a-tag>
          </template>

          <template #actions="{ record }">
            <a-space>
              <a-button type="text" size="small" @click="moveCard(record as UICardConfigItem, 'up')">上移</a-button>
              <a-button type="text" size="small" @click="moveCard(record as UICardConfigItem, 'down')">下移</a-button>
              <a-button type="text" size="small" @click="openCardModal(record as UICardConfigItem)">编辑</a-button>
              <a-button type="text" size="small" status="danger" @click="handleDeleteCard(record as UICardConfigItem)">删除</a-button>
            </a-space>
          </template>
        </a-table>
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
    </a-tabs>

    <a-modal
      v-model:visible="cardModalVisible"
      :title="cardModalTitle"
      width="640px"
      @cancel="handleCloseCardModal"
      @ok="saveCard"
    >
      <a-form :model="cardForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="卡片名称" required>
              <a-input v-model="cardForm.name" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="卡片代码" required>
              <a-input v-model="cardForm.code" :disabled="Boolean(editingCard)" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="显示顺序">
              <a-input-number v-model="cardForm.order" :min="1" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="是否必填">
              <a-switch v-model="cardForm.required" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="字段配置（JSON）">
          <a-textarea v-model="cardForm.fieldConfig" :auto-size="{ minRows: 4, maxRows: 8 }" />
        </a-form-item>
        <a-form-item label="启用状态">
          <a-switch
            :model-value="cardForm.status === 'enabled'"
            @change="value => cardForm.status = value ? 'enabled' : 'disabled'"
          />
        </a-form-item>
      </a-form>
    </a-modal>

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
            <a-option value="card">申请单卡片配置</a-option>
            <a-option value="i18n">国际化配置</a-option>
            <a-option value="button">按钮显隐配置</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="JSON 内容">
          <a-textarea v-model="importPayload" :auto-size="{ minRows: 10, maxRows: 16 }" placeholder="请粘贴 JSON 内容" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
