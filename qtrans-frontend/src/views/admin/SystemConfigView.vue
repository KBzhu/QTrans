<template>
    <div class="system-config-container">
      <a-tabs v-model:active-key="activeTab" @change="handleTabChange">
        <!-- Tab1: 传输配置 -->
        <a-tab-pane key="transfer" title="传输配置">
          <div class="config-form">
            <a-form :model="transferConfig" layout="vertical">
              <a-row :gutter="24">
                <a-col :span="12">
                  <a-form-item label="单申请单最大文件大小" field="maxFileSize">
                    <a-input-number
                      v-model="transferConfig.maxFileSize"
                      :min="1"
                      :max="1000"
                      :precision="0"
                    >
                      <template #suffix>GB</template>
                    </a-input-number>
                    <template #extra>建议：50GB</template>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="最大文件数量" field="maxFileCount">
                    <a-input-number
                      v-model="transferConfig.maxFileCount"
                      :min="1"
                      :max="1000"
                      :precision="0"
                    >
                      <template #suffix>个</template>
                    </a-input-number>
                    <template #extra>建议：20个</template>
                  </a-form-item>
                </a-col>
              </a-row>

              <a-row :gutter="24">
                <a-col :span="12">
                  <a-form-item label="文件分片大小" field="chunkSize">
                    <a-input-number
                      v-model="transferConfig.chunkSize"
                      :min="1"
                      :max="100"
                      :precision="0"
                    >
                      <template #suffix>MB</template>
                    </a-input-number>
                    <template #extra>建议：5MB</template>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="最大并发传输数" field="maxConcurrent">
                    <a-input-number
                      v-model="transferConfig.maxConcurrent"
                      :min="1"
                      :max="10"
                      :precision="0"
                    >
                      <template #suffix>个</template>
                    </a-input-number>
                    <template #extra>建议：3个</template>
                  </a-form-item>
                </a-col>
              </a-row>

              <a-row :gutter="24">
                <a-col :span="12">
                  <a-form-item label="上传有效期默认值" field="uploadValidity">
                    <a-input-number
                      v-model="transferConfig.uploadValidity"
                      :min="1"
                      :max="365"
                      :precision="0"
                    >
                      <template #suffix>天</template>
                    </a-input-number>
                    <template #extra>建议：7天</template>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="下载有效期默认值" field="downloadValidity">
                    <a-input-number
                      v-model="transferConfig.downloadValidity"
                      :min="1"
                      :max="365"
                      :precision="0"
                    >
                      <template #suffix>天</template>
                    </a-input-number>
                    <template #extra>建议：30天</template>
                  </a-form-item>
                </a-col>
              </a-row>

              <a-form-item>
                <a-button type="primary" :loading="loading" @click="handleSave('transfer')">
                  保存传输配置
                </a-button>
              </a-form-item>
            </a-form>
          </div>
        </a-tab-pane>

        <!-- Tab2: 审批配置 -->
        <a-tab-pane key="approval" title="审批配置">
          <div class="config-form">
            <a-form :model="approvalConfig" layout="vertical">
              <a-form-item label="审批层级配置">
                <a-table
                  :data="approvalConfig.levelMapping"
                  :pagination="false"
                  :bordered="{ wrapper: true, cell: true }"
                >
                  <template #columns>
                    <a-table-column title="传输类型" data-index="typeName" />
                    <a-table-column title="审批层级" data-index="level" align="center">
                      <template #cell="{ record }">
                        <a-select
                          v-model="record.level"
                          :options="levelOptions"
                          style="width: 120px"
                        />
                      </template>
                    </a-table-column>
                    <a-table-column title="说明" data-index="description" />
                  </template>
                </a-table>
              </a-form-item>

              <a-row :gutter="24">
                <a-col :span="12">
                  <a-form-item label="审批超时时间" field="timeout">
                    <a-input-number
                      v-model="approvalConfig.timeout"
                      :min="1"
                      :max="720"
                      :precision="0"
                    >
                      <template #suffix>小时</template>
                    </a-input-number>
                    <template #extra>建议：48小时</template>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="超时自动驳回" field="autoReject">
                    <a-switch v-model="approvalConfig.autoReject">
                      <template #checked>启用</template>
                      <template #unchecked>禁用</template>
                    </a-switch>
                    <template #extra>启用后超时将自动驳回申请</template>
                  </a-form-item>
                </a-col>
              </a-row>

              <a-form-item>
                <a-button type="primary" :loading="loading" @click="handleSave('approval')">
                  保存审批配置
                </a-button>
              </a-form-item>
            </a-form>
          </div>
        </a-tab-pane>

        <!-- Tab3: 通知配置 -->
        <a-tab-pane key="notification" title="通知配置">
          <div class="config-form">
            <a-form :model="notificationConfig" layout="vertical">
              <a-divider orientation="left">邮件服务配置</a-divider>
              <a-row :gutter="24">
                <a-col :span="12">
                  <a-form-item label="SMTP 服务器" field="emailHost">
                    <a-input v-model="notificationConfig.emailHost" placeholder="smtp.example.com" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="SMTP 端口" field="emailPort">
                    <a-input-number v-model="notificationConfig.emailPort" :min="1" :max="65535" />
                  </a-form-item>
                </a-col>
              </a-row>

              <a-row :gutter="24">
                <a-col :span="12">
                  <a-form-item label="发件人邮箱" field="emailFrom">
                    <a-input v-model="notificationConfig.emailFrom" placeholder="noreply@example.com" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="发件人密码" field="emailPassword">
                    <a-input-password v-model="notificationConfig.emailPassword" placeholder="请输入密码" />
                  </a-form-item>
                </a-col>
              </a-row>

              <a-divider orientation="left">短信服务配置</a-divider>
              <a-row :gutter="24">
                <a-col :span="12">
                  <a-form-item label="服务商" field="smsProvider">
                    <a-select v-model="notificationConfig.smsProvider" :options="smsProviderOptions" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="模板ID" field="smsTemplate">
                    <a-input v-model="notificationConfig.smsTemplate" placeholder="SMS_123456" />
                  </a-form-item>
                </a-col>
              </a-row>

              <a-divider orientation="left">通知触发事件</a-divider>
              <a-form-item label="启用通知的事件" field="enabledEvents">
                <a-checkbox-group v-model="notificationConfig.enabledEvents" direction="vertical">
                  <a-checkbox value="application_submitted">申请单提交</a-checkbox>
                  <a-checkbox value="application_approved">申请单通过</a-checkbox>
                  <a-checkbox value="application_rejected">申请单驳回</a-checkbox>
                  <a-checkbox value="transfer_started">传输开始</a-checkbox>
                  <a-checkbox value="transfer_completed">传输完成</a-checkbox>
                  <a-checkbox value="transfer_failed">传输失败</a-checkbox>
                  <a-checkbox value="download_ready">文件可下载</a-checkbox>
                  <a-checkbox value="file_expired">文件即将过期</a-checkbox>
                </a-checkbox-group>
              </a-form-item>

              <a-form-item>
                <a-button type="primary" :loading="loading" @click="handleSave('notification')">
                  保存通知配置
                </a-button>
              </a-form-item>
            </a-form>
          </div>
        </a-tab-pane>

        <!-- Tab4: 存储配置 -->
        <a-tab-pane key="storage" title="存储配置">
          <div class="config-form">
            <a-form :model="storageConfig" layout="vertical">
              <a-row :gutter="24">
                <a-col :span="12">
                  <a-form-item label="草稿有效期" field="draftValidity">
                    <a-input-number
                      v-model="storageConfig.draftValidity"
                      :min="1"
                      :max="365"
                      :precision="0"
                    >
                      <template #suffix>天</template>
                    </a-input-number>
                    <template #extra>建议：30天</template>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="存储清理周期" field="cleanupCycle">
                    <a-input-number
                      v-model="storageConfig.cleanupCycle"
                      :min="1"
                      :max="365"
                      :precision="0"
                    >
                      <template #suffix>天</template>
                    </a-input-number>
                    <template #extra>自动清理过期数据的周期</template>
                  </a-form-item>
                </a-col>
              </a-row>

              <a-row :gutter="24">
                <a-col :span="12">
                  <a-form-item label="临时文件保留期" field="tempFileRetention">
                    <a-input-number
                      v-model="storageConfig.tempFileRetention"
                      :min="1"
                      :max="30"
                      :precision="0"
                    >
                      <template #suffix>天</template>
                    </a-input-number>
                    <template #extra>建议：7天</template>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="日志保留期" field="logRetention">
                    <a-input-number
                      v-model="storageConfig.logRetention"
                      :min="1"
                      :max="3650"
                      :precision="0"
                    >
                      <template #suffix>天</template>
                    </a-input-number>
                    <template #extra>建议：180天（6个月）</template>
                  </a-form-item>
                </a-col>
              </a-row>

              <a-form-item>
                <a-button type="primary" :loading="loading" @click="handleSave('storage')">
                  保存存储配置
                </a-button>
              </a-form-item>
            </a-form>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>

</template>

<script setup lang="ts">
import { useSystemConfig } from '@/composables/useSystemConfig'

const {
  activeTab,
  transferConfig,
  approvalConfig,
  notificationConfig,
  storageConfig,
  loading,
  levelOptions,
  smsProviderOptions,
  handleTabChange,
  handleSave
} = useSystemConfig()
</script>

<style scoped lang="scss">
@import './system-config.scss';
</style>
