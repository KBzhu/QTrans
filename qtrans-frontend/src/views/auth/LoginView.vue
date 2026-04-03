<script setup lang="ts">
import { ref } from 'vue'
import { useLogin } from '@/composables/useLogin'
import { IconUser, IconLock } from '@arco-design/web-vue/es/icon'

const formRef = ref()
const activeTab = ref<'domain' | 'local'>('domain')
const {
  loginForm,
  loginRules,
  loading,
  errorMessage,
  handleLogin,
} = useLogin()

function onSubmit() {
  handleLogin(formRef.value)
}

function switchTab(tab: 'domain' | 'local') {
  activeTab.value = tab
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 标题 -->
      <h1 class="login-title">欢迎登录</h1>

      <!-- Tab 切换 -->
      <div class="login-tabs">
        <div
          class="login-tab"
          :class="{ 'is-active': activeTab === 'domain' }"
          @click="switchTab('domain')"
        >
          域账号登录
        </div>
        <div class="login-tab-divider"></div>
        <div
          class="login-tab"
          :class="{ 'is-active': activeTab === 'local' }"
          @click="switchTab('local')"
        >
          本地账号登录
        </div>
      </div>

      <!-- 登录表单 -->
      <a-form
        ref="formRef"
        :model="loginForm"
        :rules="loginRules"
        layout="vertical"
        @submit-success="onSubmit"
        class="login-form"
      >
        <a-form-item field="username" hide-label>
          <a-input
            v-model="loginForm.username"
            placeholder="请输入账号"
            allow-clear
            size="large"
            class="login-input"
          >
            <template #prefix>
              <IconUser class="login-input__icon" />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item field="password" hide-label>
          <a-input-password
            v-model="loginForm.password"
            placeholder="请输入密码"
            allow-clear
            size="large"
            class="login-input"
          >
            <template #prefix>
              <IconLock class="login-input__icon" />
            </template>
          </a-input-password>
        </a-form-item>

        <div class="login-options">
          <a-checkbox v-model="loginForm.remember" class="login-remember">
            记住账号
          </a-checkbox>
        </div>

        <a-alert
          v-if="errorMessage"
          :message="errorMessage"
          type="error"
          closable
          class="login-error"
          @close="errorMessage = ''"
        />

        <a-button
          type="primary"
          html-type="submit"
          :loading="loading"
          class="login-btn"
        >
          登录
        </a-button>
      </a-form>
    </div>
  </div>
</template>

<style scoped src="./login.scss"></style>
