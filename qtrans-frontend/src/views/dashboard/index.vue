<script setup lang="ts">
import SelectTypeView from '@/views/application/SelectTypeView.vue'

const notices = [
  {
    title: '2024年一季度系统维护通告 (进行中)',
    content: '维护时间：18:00-24:00。传输Trans产品正在进行数据迁移与业务平稳性能测试。详情咨询用户支撑团队。',
    icon: '/figma/3830_3/23.svg',
  },
  {
    title: '尊敬的Trans用户，新推出的Trans平台版已经测试完毕',
    content: '欢迎大家测试！在测试期间如遇Bug请向运维人员反馈并修复。',
    icon: '/figma/3830_3/24.svg',
  },
  {
    title: '新版插件安全提醒',
    content: '请升级到最新插件版本并及时完成终端安全扫描。',
    icon: '/figma/3830_3/25.svg',
  },
]

const helpDocs = [
  '新Trans平台功能介绍及说明',
  '审批主要基于账号授权及权限管理控制流程',
  '新版本插件安全提醒',
  '网络域间数据传输风险说明',
  '异常问题与常见修复手册',
  '审批驳回原因排查说明',
]
</script>

<template>
  <section class="dashboard">
    <SelectTypeView />

    <div class="dashboard__bottom">
      <section class="glass-panel notices">
        <header class="panel-header">
          <img src="/figma/3830_3/22.svg" alt="重要公告" />
          <h3>重要公告</h3>
        </header>
        <ul>
          <li v-for="notice in notices" :key="notice.title">
            <div class="notice-title">
              <img :src="notice.icon" :alt="notice.title" />
              <span>{{ notice.title }}</span>
            </div>
            <p>{{ notice.content }}</p>
          </li>
        </ul>
      </section>

      <section class="glass-panel helps">
        <header class="panel-header">
          <div class="help-title">
            <img src="/figma/3830_3/28.svg" alt="帮助文档" />
            <h3>帮助文档</h3>
          </div>
          <span class="hotline">IT 热线</span>
        </header>
        <ol>
          <li v-for="(doc, idx) in helpDocs" :key="doc">
            <span class="index">{{ idx + 1 }}.</span>
            <span class="text">{{ doc }}</span>
            <span class="time">2024-03-2{{ idx }} 10:11:42</span>
          </li>
        </ol>
      </section>
    </div>
  </section>
</template>

<style scoped>
.dashboard {
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
}

.notices p {
  margin: 6px 0 0 22px;
  color: #64748b;
  font-size: 14px;
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
