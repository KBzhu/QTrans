<script setup lang="ts">
import type { DeptItem } from '@/api/dept'
import { deptApi } from '@/api/dept'
import { LOGIN_USER_TYPE } from '@/api/auth'
import { useAuthStore } from '@/stores'
import { Message } from '@arco-design/web-vue'
import { computed, ref, watch } from 'vue'

/** 层级标签 */
const LEVEL_LABELS = ['公司', '一级部门', '二级部门', '三级部门', '四级部门'] as const
/** 最大层级数 */
const MAX_LEVEL = 5

interface Props {
  modelValue?: string
  displayValue?: string
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  displayValue: '',
  placeholder: '请选择部门',
  disabled: false,
})

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: { deptId: string, deptName: string, deptCode: string }): void
}

const emit = defineEmits<Emits>()

const authStore = useAuthStore()

/* ===== 弹窗状态 ===== */
const modalVisible = ref(false)

/* ===== 已选路径（最终确认值） ===== */
// 每层级选中的 deptItem
const confirmedPath = ref<DeptItem[]>([])

function formatDisplayText(value: string) {
  return value
    .split('/')
    .filter(Boolean)
    .join(' / ')
}

/* ===== 展示文本 ===== */
const displayText = computed(() => {
  if (confirmedPath.value.length > 0)
    return confirmedPath.value.map(d => d.deptName).join(' / ')
  return ''
})
const externalDisplayText = ref('')
const currentDisplayText = computed(() => displayText.value || formatDisplayText(externalDisplayText.value))

/* ===== 弹窗内部临时状态 ===== */
// 每个层级的下拉选项列表（index=0 为第一级, 以此类推）
const levelOptions = ref<DeptItem[][]>([])
// 每个层级当前选中的 deptCode
const levelSelected = ref<string[]>([])
// 每个层级的加载状态
const levelLoading = ref<boolean[]>([])
// 每个层级是否已加载过（用于避免重复加载）
const levelLoaded = ref<boolean[]>([])

// 底部「已选路径」预览
const pendingPath = computed<DeptItem[]>(() => {
  const result: DeptItem[] = []
  for (let i = 0; i < levelSelected.value.length; i++) {
    const code = levelSelected.value[i]
    const item = levelOptions.value[i]?.find(d => d.deptCode === code)
    if (item)
      result.push(item)
    else
      break
  }
  return result
})

/* ===== 模糊搜索状态 ===== */
const searchKeyword = ref('')
const searchLoading = ref(false)
const searchLoaded = ref(false) // 标记搜索已完成（用于显示"暂无数据"）
const searchResults = ref<DeptItem[]>([])
let searchTimer: ReturnType<typeof setTimeout> | null = null

/* ===== 初始化：打开弹窗时加载用户部门 ===== */
const initLoading = ref(false)

async function initFromUserDept() {
  const user = authStore.currentUser
  if (!user?.username)
    return

  try {
    initLoading.value = true
    // loginType 在 auth.ts 中是字符串 '2'，对应 LOGIN_USER_TYPE = 2
    const res = await deptApi.searchDeptByAccount(user.username, LOGIN_USER_TYPE)
    if (res.code === 200 && res.data?.deptInfos?.length) {
      const deptInfo = res.data.deptInfos[0]!
      const parentDept = deptInfo.parentDept ?? []
      buildLevelsFromPath(parentDept)
    }
  }
  catch (e) {
    // 初始化失败不提示，保持空状态让用户手动选
  }
  finally {
    initLoading.value = false
  }
}

/**
 * 根据 parentDept 数组（按 deptLevel 升序）构建多级下拉
 * parentDept 中每个元素代表一层，且该层的兄弟节点只有自身（接口未返回兄弟）
 * 所以每层 options 只有一个元素
 */
function buildLevelsFromPath(pathItems: DeptItem[]) {
  // 按 deptLevel 升序排列
  const sorted = [...pathItems].sort((a, b) => Number(a.deptLevel) - Number(b.deptLevel))
  levelOptions.value = sorted.map(item => [item])
  levelSelected.value = sorted.map(item => item.deptCode)
  // 第1层已加载（公司固定），其他层标记为未加载
  levelLoaded.value = sorted.map((_, idx) => idx === 0)
  levelLoading.value = sorted.map(() => false)
}

/* ===== 打开弹窗 ===== */
function openModal() {
  if (props.disabled)
    return
  modalVisible.value = true

  // 若已有确认值，回显；否则从当前用户部门初始化
  if (confirmedPath.value.length > 0) {
    buildLevelsFromPath(confirmedPath.value)
  }
  else {
    levelOptions.value = []
    levelSelected.value = []
    levelLoading.value = []
    levelLoaded.value = []
    initFromUserDept()
  }
}

/* ===== 加载下层部门 ===== */
async function loadSubDept(levelIndex: number) {
  // 已是最大层级，不再加载
  if (levelIndex >= MAX_LEVEL - 1)
    return

  // 获取当前层选中项的 deptCode
  const currentDeptCode = levelSelected.value[levelIndex]
  if (!currentDeptCode)
    return

  // 已加载过，不重复加载
  if (levelLoaded.value[levelIndex + 1])
    return

  try {
    levelLoading.value[levelIndex + 1] = true
    const res = await deptApi.getSubDeptByCode(currentDeptCode)
    if (res.status && res.result.length > 0) {
      // 设置下一层选项
      levelOptions.value[levelIndex + 1] = res.result
      // 标记已加载
      levelLoaded.value[levelIndex + 1] = true
    }
    else {
      levelOptions.value[levelIndex + 1] = []
    }
  }
  catch {
    levelOptions.value[levelIndex + 1] = []
  }
  finally {
    levelLoading.value[levelIndex + 1] = false
  }
}

/* ===== 下拉框展开时加载选项 ===== */
async function onDropdownVisibleChange(levelIndex: number, visible: boolean) {
  if (!visible)
    return

  // 第1层（index=0）固定为公司，不需要加载
  if (levelIndex === 0)
    return

  // 已加载过，不重复加载
  if (levelLoaded.value[levelIndex])
    return

  // 加载当前层选项（参数为上一层选中项的 deptCode）
  await loadSubDept(levelIndex - 1)
}

/* ===== 层级下拉变化 ===== */
async function onLevelChange(levelIndex: number, deptCode: string) {
  // 选中当前层级
  levelSelected.value = [...levelSelected.value.slice(0, levelIndex), deptCode]

  // 清空后续层级的选中值和选项
  levelOptions.value = levelOptions.value.slice(0, levelIndex + 1)
  levelSelected.value = levelSelected.value.slice(0, levelIndex + 1)
  levelLoaded.value = levelLoaded.value.slice(0, levelIndex + 1)
  levelLoading.value = levelLoading.value.slice(0, levelIndex + 1)

  // 立即加载下一层选项
  await loadSubDept(levelIndex)
}

/* ===== 模糊搜索 ===== */
function onSearchInput(val: string) {
  searchKeyword.value = val
  if (!val.trim()) {
    searchResults.value = []
    searchLoaded.value = false
    return
  }
  if (searchTimer)
    clearTimeout(searchTimer)
  searchTimer = setTimeout(() => doSearch(val.trim()), 300)
}

async function doSearch(keyword: string) {
  try {
    searchLoading.value = true
    const res = await deptApi.suggestDept(keyword)
    if (res.status) {
      searchResults.value = res.result
    }
    else {
      searchResults.value = []
    }
    searchLoaded.value = true
  }
  catch {
    searchResults.value = []
    searchLoaded.value = true
  }
  finally {
    searchLoading.value = false
  }
}

/** 点击搜索结果，回填所有层级并加载下一级 */
async function onSelectSearchResult(item: DeptItem) {
  const parentDept = item.parentDept ?? []
  buildLevelsFromPath(parentDept)
  // 清空搜索
  searchKeyword.value = ''
  searchResults.value = []
  searchLoaded.value = false

  // 联动加载下一级（如果当前层级不是最大层级）
  const lastIndex = parentDept.length - 1
  if (lastIndex >= 0 && lastIndex < MAX_LEVEL - 1) {
    await loadSubDept(lastIndex)
  }
}

/* ===== 确认选择 ===== */
function onConfirm() {
  if (pendingPath.value.length === 0) {
    Message.warning('请先选择部门')
    return
  }
  confirmedPath.value = [...pendingPath.value]
  const last = confirmedPath.value[confirmedPath.value.length - 1]!
  const deptName = confirmedPath.value.map(d => d.deptName).join('/')
  externalDisplayText.value = deptName
  emit('update:modelValue', last.deptCode)
  emit('change', {
    deptId: String(last.deptCode),
    deptName,
    deptCode: last.deptCode,
  })
  modalVisible.value = false
}

/* ===== 取消 ===== */
function onCancel() {
  modalVisible.value = false
}

/* ===== 清空 ===== */
function onClear() {
  confirmedPath.value = []
  externalDisplayText.value = ''
  emit('update:modelValue', '')
  emit('change', { deptId: '', deptName: '', deptCode: '' })
}

/* ===== 外部 modelValue 变化时同步显示（初始化回显场景） ===== */
watch(
  () => [props.modelValue, props.displayValue] as const,
  ([modelValue, displayValue]) => {
    externalDisplayText.value = displayValue || ''

    const currentConfirmedCode = confirmedPath.value[confirmedPath.value.length - 1]?.deptCode || ''
    if (!modelValue) {
      confirmedPath.value = []
      return
    }

    if (currentConfirmedCode && currentConfirmedCode !== modelValue)
      confirmedPath.value = []
  },
  { immediate: true },
)
</script>

<template>
  <div class="dept-selector-root">
    <div class="dept-selector-trigger" :class="{ 'is-disabled': disabled }" @click="openModal">
      <span v-if="currentDisplayText" class="dept-selector-trigger__text">{{ currentDisplayText }}</span>
      <span v-else class="dept-selector-trigger__placeholder">{{ placeholder }}</span>
      <span v-if="currentDisplayText && !disabled" class="dept-selector-trigger__clear" @click.stop="onClear">
        <icon-close />
      </span>
      <icon-right v-else class="dept-selector-trigger__arrow" />
    </div>

    <!-- 弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      title="选择部门"
      :width="560"
      :mask-closable="false"
      :render-to-body="true"
      class="dept-selector-modal"
      @cancel="onCancel"
    >
    <div class="dept-selector-modal__body">
      <!-- 辅助搜索 -->
      <div class="dept-search">
        <a-input
          :value="searchKeyword"
          placeholder="输入部门名称模糊搜索"
          allow-clear
          @input="onSearchInput"
          @clear="() => { searchKeyword = ''; searchResults = []; searchLoaded = false }"
        >
          <template #prefix>
            <icon-search />
          </template>
        </a-input>

        <!-- 搜索结果下拉 -->
        <div v-if="searchKeyword.trim() && (searchResults.length > 0 || searchLoading || searchLoaded)" class="dept-search__results">
          <div v-if="searchLoading" class="dept-search__loading">
            <a-spin :size="14" /> 搜索中...
          </div>
          <a-empty v-else-if="searchResults.length === 0" class="dept-search__empty">
            暂无数据
          </a-empty>
          <template v-else>
            <div
              v-for="item in searchResults"
              :key="item.deptCode"
              class="dept-search__result-item"
              @click="onSelectSearchResult(item)"
            >
              <icon-branch class="dept-search__result-icon" />
              <div>
                <div class="dept-search__result-name">{{ item.deptName }}</div>
                <div class="dept-search__result-path">{{ item.deptPathName }}</div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 多级联动下拉 -->
      <div v-if="initLoading" class="dept-levels-loading">
        <a-spin /> 加载中...
      </div>
      <div v-else class="dept-levels">
        <div
          v-for="(options, idx) in levelOptions"
          :key="idx"
          class="dept-levels__item"
        >
          <span class="dept-levels__label">{{ LEVEL_LABELS[idx] }}</span>
          <a-select
            :model-value="levelSelected[idx]"
            :options="options.map(o => ({ label: o.deptName, value: o.deptCode }))"
            :loading="levelLoading[idx]"
            :disabled="idx === 0"
            placeholder="请选择"
            class="dept-levels__select"
            @change="(val: string) => onLevelChange(idx, val)"
            @popup-visible-change="(visible: boolean) => onDropdownVisibleChange(idx, visible)"
          />
        </div>
        <div v-if="levelOptions.length === 0" class="dept-levels__empty">
          暂无层级数据，请通过搜索框选择部门
        </div>
      </div>

      <!-- 已选路径预览 -->
      <div v-if="pendingPath.length > 0" class="dept-selected-path">
        <span class="dept-selected-path__label">已选：</span>
        <span class="dept-selected-path__value">
          {{ pendingPath.map(d => d.deptName).join(' / ') }}
        </span>
      </div>
    </div>

      <template #footer>
        <a-space>
          <a-button @click="onCancel">取消</a-button>
          <a-button type="primary" @click="onConfirm">确认</a-button>
        </a-space>
      </template>
    </a-modal>
  </div>
</template>

<!-- scoped 样式：触发器部分 -->
<style src="./DepartmentSelector.scss" lang="scss" scoped />
<!-- 非 scoped 样式：Modal 弹窗部分（因 render-to-body 挂载到 body 层） -->
<style src="./DepartmentSelectorModal.scss" lang="scss" />
