<script setup lang="ts">
import type { UITransferTypeConfigItem } from '@/types'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTransferConfig } from '@/composables/useTransferConfig'

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

/* ===== 例行申请卡片（暂时保留硬编码） ===== */
interface RoutineCard {
  key: string
  title: string
  desc: string
  fromIcon: string
  toIcon: string
  arrowIcon: string
  fromZone: 'green' | 'yellow' | 'red' | 'cross' | 'external' | 'hisilicon'
  toZone: 'green' | 'yellow' | 'red' | 'cross' | 'external' | 'hisilicon'
}

const routineCards: RoutineCard[] = [
  {
    key: 'routine-apply',
    title: '例行申请',
    desc: '定期传输任务',
    fromIcon: '/figma/3971_812/7.svg',
    toIcon: '/figma/3971_812/9.svg',
    arrowIcon: '/figma/3971_812/8.svg',
    fromZone: 'green',
    toZone: 'green',
  },
  {
    key: 'routine-channel',
    title: '例行通道',
    desc: '常规传输通道',
    fromIcon: '/figma/3971_812/10.svg',
    toIcon: '/figma/3971_812/12.svg',
    arrowIcon: '/figma/3971_812/11.svg',
    fromZone: 'cross',
    toZone: 'cross',
  },
]

/* ===== 点击卡片 ===== */
function handleCardClick(item: UITransferTypeConfigItem | RoutineCard) {
  router.push({
    path: '/application/create',
    query: {
      type: item.key,
      from: item.fromZone,
      to: item.toZone,
    },
  })
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

    <!-- 首页--传输类型卡片网格--绿区传出开始 -->
    <div v-if="!isRoutineTab" class="select-type__grid">
      <article
        v-for="item in filteredTypes"
        :key="item.key"
        class="type-card"
        @click="handleCardClick(item)"
      >
        <div class="type-card__icons">
          <div class="type-card__icon-box" :class="`zone-${item.fromZone}`">
            <img :src="item.fromIcon" :alt="item.title" />
          </div>
          <div class="type-card__arrow">
            <img :src="item.arrowIcon" alt="arrow" />
          </div>
          <div class="type-card__icon-box" :class="`zone-${item.toZone}`">
            <img :src="item.toIcon" :alt="item.title" />
          </div>
        </div>
        <div class="type-card__title">{{ item.title }}</div>
        <div class="type-card__desc">{{ item.desc }}</div>
      </article>
    </div>

    <!-- 例行申请卡片（大尺寸双列） -->
    <div v-else class="select-type__grid select-type__grid--routine">
      <article
        v-for="item in routineCards"
        :key="item.key"
        class="type-card type-card--routine"
        @click="handleCardClick(item)"
      >
        <div class="type-card__icons">
          <div class="type-card__icon-box" :class="`zone-${item.fromZone}`">
            <img :src="item.fromIcon" :alt="item.title" />
          </div>
          <div class="type-card__arrow">
            <img :src="item.arrowIcon" alt="arrow" />
          </div>
          <div class="type-card__icon-box" :class="`zone-${item.toZone}`">
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
