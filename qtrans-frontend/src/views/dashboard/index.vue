<script setup lang="ts">
import SelectTypeView from '@/views/application/SelectTypeView.vue'
import { assetPath } from '@/utils/path'
import { useHelpDocs } from '@/composables/useHelpDocs'
import { useTopAffiches } from '@/composables/useTopAffiches'

// 帮助文档 - 真实后端数据
const { helpDocs, openDocLink } = useHelpDocs()

// 重要公告 - 真实后端数据
const { affiches, openAfficheLink } = useTopAffiches()
</script>

<template>
  <section class="dashboard">
    <SelectTypeView />

    <div class="dashboard__bottom">
      <section class="glass-panel notices">
        <header class="panel-header">
          <img :src="assetPath('/figma/3830_3/22.svg')" alt="重要公告" />
          <h3>重要公告</h3>
        </header>
        <ul>
          <template v-if="affiches.length > 0">
            <li v-for="affiche in affiches" :key="affiche.id">
              <div class="notice-title">
                <img v-if="affiche.icon" :src="affiche.icon" :alt="affiche.title" />
                <span class="title-text">{{ affiche.title }}</span>
              </div>
              <p class="notice-content">
                <span class="content-text">{{ affiche.content }}</span>
                <span class="affiche-time">{{ affiche.updateTime }}</span>
              </p>
              <a
                v-if="affiche.link"
                :href="affiche.link"
                target="_blank"
                class="affiche-link"
                @click.stop
              >
                查看详情
              </a>
            </li>
          </template>
          <li v-else class="notices-empty-tip">暂无公告</li>
        </ul>
      </section>

      <section class="glass-panel helps">
        <header class="panel-header">
          <div class="help-title">
            <img :src="assetPath('/figma/3830_3/28.svg')" alt="帮助文档" />

            <h3>帮助文档</h3>
          </div>
          <span class="hotline">IT 热线</span>
        </header>
        <ol>
          <template v-if="helpDocs.length > 0">
            <li v-for="(doc, idx) in helpDocs" :key="doc.id" @click="openDocLink(doc.link)">
              <span class="index">{{ idx + 1 }}.</span>
              <span class="text" :title="doc.title">{{ doc.title }}</span>
              <span class="time">{{ doc.updateTime }}</span>
            </li>
          </template>
          <li v-else class="empty-tip">暂无帮助文档</li>
        </ol>
      </section>
    </div>
  </section>
</template>

<style scoped>
.dashboard {
  margin-right: 20px;
  margin-left: 20px;
  display: grid;
  gap: clamp(12px, 1.1vw, 20px);
}

.dashboard__bottom {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

.glass-panel {
  border-radius: 14px;
  border: 1px solid var(--q-card-border);
  background: rgba(255, 255, 255, 0.28);
  box-shadow: 0 8px 24px rgba(31, 38, 135, 0.15);
  overflow: hidden;
}

.panel-header {
  height: 72px;
  border-bottom: 1px solid #bedbff;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header h3 {
  margin: 0;
}

.notices .panel-header {
  justify-content: flex-start;
  gap: 10px;
}

.notices ul {
  margin: 0;
  padding: 16px 20px;
  list-style: none;
}

.notices li {
  margin-bottom: 14px;
}

.notice-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1e293b;
  font-weight: 600;
  flex: 1;
}

.notice-title .title-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-content {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin: 6px 0 0 22px;
}

.notice-content .content-text {
  flex: 1;
  color: #64748b;
  font-size: 14px;
  word-break: break-all;
}

.affiche-time {
  color: #94a3b8;
  font-size: 11px;
  white-space: nowrap;
  flex-shrink: 0;
}

.notices .affiche-link {
  display: block;
  margin: 6px 0 0 22px;
  color: #165dff;
  font-size: 13px;
  text-decoration: none;
}

.notices .affiche-link:hover {
  text-decoration: underline;
}

.notices .notices-empty-tip {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
  cursor: default;
}

.help-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hotline {
  color: #193cb8;
}

.helps ol {
  margin: 0;
  padding: 14px 18px;
  list-style: none;
}

.helps li {
  display: grid;
  grid-template-columns: 20px 1fr auto;
  gap: 8px;
  align-items: center;
  height: 42px;
  border-radius: 8px;
  padding: 0 8px;
}

.helps li:hover {
  background: rgba(255, 255, 255, 0.45);
}

.helps .index {
  color: #94a3b8;
  font-weight: 600;
}

.helps .text {
  color: #1e293b;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.helps .time {
  color: #94a3b8;
  font-size: 11px;
}

.helps .empty-tip {
  display: block !important;
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
  cursor: default;
  height: auto;
}

@media (max-width: 1024px) {
  .dashboard__bottom {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .helps li {
    grid-template-columns: 20px 1fr;
  }

  .helps .time {
    display: none;
  }
}
</style>
