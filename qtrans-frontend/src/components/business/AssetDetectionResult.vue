<script setup lang="ts">
import type { KiaKeyFileItem, KiaResultCountResponse, SecretLevelItem } from '@/types/assetDetection'
import { IconCheckCircleFill, IconDown, IconRight, IconExclamationCircleFill } from '@arco-design/web-vue/es/icon'
import { computed, ref, watch } from 'vue'
import { getFileTypeName } from '@/constants/fileType'
import './asset-detection.scss'

const props = defineProps<{
  applicationId: number | string
  /** 是否需要确认功能 */
  requireConfirmation?: boolean
  /** 统计数据（由父组件传入） */
  countData?: { count: number; fileSizeSum: string } | null
  /** 文件列表（由父组件传入） */
  fileList?: (KiaKeyFileItem & { fileTypeName: string; secretLevelName: string; confirmed: boolean })[]
  /** 加载状态 */
  loading?: boolean
  /** 确认状态变化回调 */
  onConfirm?: (fileName: string, confirmed: boolean) => void
}>()

const emit = defineEmits<{
  /** 所有文件确认状态变化 */
  (e: 'confirm-status-change', allConfirmed: boolean): void
}>()

// 展开状态
const isExpanded = ref(false)

// 是否有关键资产
const hasKeyAssets = computed(() => props.countData?.count && props.countData.count > 0)

// 全部确认状态
const allFilesConfirmed = computed(() => {
  if (!props.fileList || props.fileList.length === 0)
    return true
  return props.fileList.every(file => file.confirmed)
})

// 未确认数量
const unconfirmedCount = computed(() => {
  if (!props.fileList)
    return 0
  return props.fileList.filter(f => !f.confirmed).length
})

// 切换展开
function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

// 点击确认/取消确认
function handleToggleConfirm(file: KiaKeyFileItem & { confirmed: boolean }) {
  if (props.onConfirm) {
    props.onConfirm(file.fileName, !file.confirmed)
  }
  emit('confirm-status-change', allFilesConfirmed.value)
}

// 监听 allFilesConfirmed 变化
watch(allFilesConfirmed, (val) => {
  emit('confirm-status-change', val)
}, { immediate: true })
</script>

<template>
  <section v-if="hasKeyAssets" class="asset-detection">
    <a-spin :loading="loading" style="width: 100%">
      <!-- 统计卡片 -->
      <div class="asset-detection__header" @click="toggleExpand">
        <div class="asset-detection__header-left">
          <IconExclamationCircleFill class="asset-detection__icon" />
          <div class="asset-detection__title-wrap">
            <h3 class="asset-detection__title">资产检测结果</h3>
            <p class="asset-detection__summary">
              检测到 <span class="highlight">{{ countData?.count || 0 }}</span> 个关键资产，
              共 <span class="highlight">{{ countData?.fileSizeSum || '0' }}</span>
            </p>
          </div>
        </div>
        <div class="asset-detection__header-right">
          <IconDown v-if="isExpanded" class="asset-detection__arrow" />
          <IconRight v-else class="asset-detection__arrow" />
        </div>
      </div>

      <!-- 展开的列表 -->
      <Transition name="slide">
        <div v-show="isExpanded" class="asset-detection__content">
          <!-- 确认提示 -->
          <div v-if="requireConfirmation" class="asset-detection__confirm-hint">
            <template v-if="!allFilesConfirmed">
              <IconExclamationCircleFill />
              <span>请逐条确认以下 {{ unconfirmedCount }} 项关键资产，全部确认后方可操作</span>
            </template>
            <template v-else>
              <IconCheckCircleFill class="success" />
              <span>所有关键资产已确认，可进行操作</span>
            </template>
          </div>

          <!-- 文件列表 -->
          <div class="asset-detection__table-wrap">
            <table class="asset-detection__table">
              <thead>
                <tr>
                  <th class="col-file-name">文件名称</th>
                  <th class="col-file-type">文件类型</th>
                  <th class="col-secret-level">密级</th>
                  <th v-if="requireConfirmation" class="col-action">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="file in fileList"
                  :key="file.fileName"
                  :class="{ 'is-confirmed': file.confirmed }"
                >
                  <td class="col-file-name" :title="file.fileName">
                    {{ file.fileName.split('/').pop() || file.fileName }}
                  </td>
                  <td class="col-file-type">
                    <span class="file-type-tag">{{ file.fileTypeName }}</span>
                  </td>
                  <td class="col-secret-level">{{ file.secretLevelName }}</td>
                  <td v-if="requireConfirmation" class="col-action">
                    <a-button
                      size="small"
                      :type="file.confirmed ? 'outline' : 'primary'"
                      :status="file.confirmed ? 'success' : undefined"
                      @click="handleToggleConfirm(file)"
                    >
                      <template #icon>
                        <IconCheckCircleFill v-if="file.confirmed" />
                      </template>
                      {{ file.confirmed ? '已确认' : '确认' }}
                    </a-button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Transition>
    </a-spin>
  </section>
</template>
