<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

/* ===== Tab 定义 ===== */
interface TabItem {
  key: string
  label: string
}

const tabs: TabItem[] = [
  { key: 'green', label: '绿区传出' },
  { key: 'yellow', label: '黄区传出' },
  { key: 'red', label: '红区传出' },
  { key: 'external', label: '外网传入' },
  { key: 'routine', label: '例行申请' },
]

const activeTab = ref('green')

/* ===== 传输类型卡片定义 ===== */
interface TransferType {
  key: string
  title: string
  desc: string
  fromZone: 'green' | 'yellow' | 'red' | 'cross'
  toZone: 'green' | 'yellow' | 'red' | 'cross'
  fromIcon: string
  toIcon: string
  arrowIcon: string
  level: 'free' | 'l1' | 'l2' | 'l3'
  levelText: string
  tabGroup: string
}

const transferTypes: TransferType[] = [
  {
    key: 'green-to-green',
    title: '绿区传到绿区',
    desc: '同安全域内传输，无需审批',
    fromZone: 'green',
    toZone: 'green',
    fromIcon: '/figma/3971_812/7.svg',
    toIcon: '/figma/3971_812/9.svg',
    arrowIcon: '/figma/3971_812/8.svg',
    level: 'free',
    levelText: '免审批',
    tabGroup: 'green',
  },
  {
    key: 'green-to-yellow',
    title: '绿区传到黄区',
    desc: '跨安全域传输，需部门主管审批',
    fromZone: 'green',
    toZone: 'yellow',
    fromIcon: '/figma/3971_812/7.svg',
    toIcon: '/figma/3971_812/10.svg',
    arrowIcon: '/figma/3971_812/8.svg',
    level: 'l1',
    levelText: '一级审批',
    tabGroup: 'green',
  },
  {
    key: 'green-to-red',
    title: '绿区传到红区',
    desc: '高安全域传输，需二级审批',
    fromZone: 'green',
    toZone: 'red',
    fromIcon: '/figma/3971_812/7.svg',
    toIcon: '/figma/3971_812/12.svg',
    arrowIcon: '/figma/3971_812/11.svg',
    level: 'l2',
    levelText: '二级审批',
    tabGroup: 'green',
  },
  {
    key: 'yellow-to-yellow',
    title: '黄区传到黄区',
    desc: '同安全域内传输，需部门主管审批',
    fromZone: 'yellow',
    toZone: 'yellow',
    fromIcon: '/figma/3971_812/10.svg',
    toIcon: '/figma/3971_812/10.svg',
    arrowIcon: '/figma/3971_812/8.svg',
    level: 'l1',
    levelText: '一级审批',
    tabGroup: 'yellow',
  },
  {
    key: 'yellow-to-red',
    title: '黄区传到红区',
    desc: '跨安全域传输，需二级审批',
    fromZone: 'yellow',
    toZone: 'red',
    fromIcon: '/figma/3971_812/10.svg',
    toIcon: '/figma/3971_812/12.svg',
    arrowIcon: '/figma/3971_812/11.svg',
    level: 'l2',
    levelText: '二级审批',
    tabGroup: 'yellow',
  },
  {
    key: 'red-to-red',
    title: '红区传到红区',
    desc: '高安全域内传输，需二级审批',
    fromZone: 'red',
    toZone: 'red',
    fromIcon: '/figma/3971_812/12.svg',
    toIcon: '/figma/3971_812/12.svg',
    arrowIcon: '/figma/3971_812/11.svg',
    level: 'l2',
    levelText: '二级审批',
    tabGroup: 'red',
  },
  {
    key: 'cross-country',
    title: '跨国传输',
    desc: '跨国数据传输，需三级审批',
    fromZone: 'cross',
    toZone: 'cross',
    fromIcon: '/figma/3971_812/7.svg',
    toIcon: '/figma/3971_812/12.svg',
    arrowIcon: '/figma/3971_812/11.svg',
    level: 'l3',
    levelText: '三级审批',
    tabGroup: 'external',
  },
]

/* ===== 例行申请卡片 ===== */
interface RoutineCard {
  key: string
  title: string
  desc: string
  fromIcon: string
  toIcon: string
  arrowIcon: string
  fromZone: 'green' | 'yellow' | 'red' | 'cross'
  toZone: 'green' | 'yellow' | 'red' | 'cross'
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

/* ===== 按 Tab 过滤卡片 ===== */
const filteredTypes = computed(() => {
  return transferTypes.filter(t => t.tabGroup === activeTab.value)
})

const isRoutineTab = computed(() => activeTab.value === 'routine')

/* ===== 点击卡片 ===== */
function handleCardClick(typeKey: string) {
  router.push({
    path: '/application/create',
    query: { type: typeKey },
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

    <!-- 传输类型卡片网格 -->
    <div v-if="!isRoutineTab" class="select-type__grid">
      <article
        v-for="item in filteredTypes"
        :key="item.key"
        class="type-card"
        @click="handleCardClick(item.key)"
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
        <div class="type-card__level">
          <span class="level-tag" :class="`level-tag--${item.level}`">
            {{ item.levelText }}
          </span>
        </div>
        <div class="type-card__desc">{{ item.desc }}</div>
      </article>
    </div>

    <!-- 例行申请卡片（大尺寸双列） -->
    <div v-else class="select-type__grid select-type__grid--routine">
      <article
        v-for="item in routineCards"
        :key="item.key"
        class="type-card type-card--routine"
        @click="handleCardClick(item.key)"
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
