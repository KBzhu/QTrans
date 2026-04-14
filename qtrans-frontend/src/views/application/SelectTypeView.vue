<script setup lang="ts">
import type { UITransferTypeConfigItem } from '@/types'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTransferConfig, saveRegionMetadataToStore } from '@/composables/useTransferConfig'

const router = useRouter()
const { tabs, transferTypes } = useTransferConfig()

const activeTab = ref('')

// 默认选中第一个 tab
watch(tabs, (newTabs) => {
  if (newTabs.length > 0 && !activeTab.value && newTabs[0]) {
    activeTab.value = newTabs[0].key
  }
}, { immediate: true })

/* ===== 按 Tab 过滤卡片 ===== */
const filteredTypes = computed(() => {
  return transferTypes.value.filter(t => t.tabGroup === activeTab.value)
})

const isRoutineTab = computed(() => activeTab.value === 'routine')

/* ===== 点击卡片 ===== */
function handleCardClick(item: UITransferTypeConfigItem) {
  // DEBUG: 打印 itemAttr5
  console.log('[DEBUG handleCardClick] itemAttr5:', item.itemAttr5)

  // 保存区域元数据到 Store
  saveRegionMetadataToStore(item)

  // 从 itemAttr5 解析数字 ID
  const attr5Data = parseItemAttr5FromQuery(item.itemAttr5 || null)
  console.log('[DEBUG handleCardClick] attr5Data:', attr5Data)

  const fromId = attr5Data?.fromId ?? 1
  const toId = attr5Data?.toId ?? 1

  console.log('[DEBUG handleCardClick] final fromId:', fromId, 'toId:', toId)

  router.push({
    path: '/application/create',
    query: {
      type: item.key,
      from: item.fromZone,
      to: item.toZone,
      fromId: String(fromId),
      toId: String(toId),
    },
  })
}

/**
 * 解析 itemAttr5 获取区域数字 ID（用于 URL）
 * 格式: "fromCode:green,fromName:绿区,fromId:1,toCode:yellow,toName:黄区,toId:0"
 */
function parseItemAttr5FromQuery(attr5: string | null): { fromId: number, toId: number } | null {
  if (!attr5)
    return null

  const result: Record<string, string> = {}
  const pairs = attr5.split(',')

  for (const pair of pairs) {
    const [key, value] = pair.split(':')
    if (key && value)
      result[key.trim()] = value.trim()
  }

  if (!result.fromId || !result.toId)
    return null

  return {
    fromId: parseInt(result.fromId, 10),
    toId: parseInt(result.toId, 10),
  }
}

/* ===== 切换 Tab ===== */
function handleTabClick(tabKey: string) {
  activeTab.value = tabKey
}
</script>

<template>
  <section class="select-type">
    <!-- Tab 栏 -->
    <div class="select-type__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="select-type__tab"
        :class="{ active: activeTab === tab.key }"
        @click="handleTabClick(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 传输类型卡片网格 -->
    <div v-if="!isRoutineTab" class="select-type__grid">
      <article
        v-for="item in filteredTypes"
        :key="item.key"
        class="type-card"
        @click="handleCardClick(item)"
      >
        <div class="type-card__icons">
          <div class="type-card__icon-box" :style="item.fromStyle">
            <img :src="item.fromIcon" :alt="item.title" />
          </div>
          <div class="type-card__arrow">
            <img :src="item.arrowIcon" alt="arrow" />
          </div>
          <div class="type-card__icon-box" :style="item.toStyle">
            <img :src="item.toIcon" :alt="item.title" />
          </div>
        </div>
        <div class="type-card__title">{{ item.title }}</div>
        <div class="type-card__desc">{{ item.desc }}</div>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss" src="./select-type.scss"></style>
