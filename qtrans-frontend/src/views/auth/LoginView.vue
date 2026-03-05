<script setup lang="ts">
import { ref } from 'vue'
import { useLogin, demoAccounts } from '@/composables/useLogin'
import type { DemoAccount } from '@/composables/useLogin'

const formRef = ref()
const {
  loginForm,
  loginRules,
  loading,
  errorMessage,
  handleLogin,
  handleQuickLogin,
} = useLogin()

function onSubmit() {
  handleLogin(formRef.value)
}

function getRoleColorClass(account: DemoAccount) {
  if (account.username === 'admin')
    return 'login-demo__role-tag--admin'
  if (account.username.startsWith('approver'))
    return 'login-demo__role-tag--approver'
  return 'login-demo__role-tag--submitter'
}

const demoColumns = [
  { title: '用户名', dataIndex: 'username' },
  { title: '姓名', dataIndex: 'name' },
  { title: '角色', dataIndex: 'role', slotName: 'role' },
]
</script>

<template>
  <div class="login-page">
    <div class="login-brand">
      <div class="login-brand__logo">
        <img src="/figma/3971_1023/1.svg" alt="logo" />
      </div>
      <div class="login-brand__title">文件传输平台</div>
      <div class="login-brand__subtitle">请登录您的账户</div>
    </div>

    <div class="login-card">
      <a-form
        ref="formRef"
        :model="loginForm"
        :rules="loginRules"
        layout="vertical"
        @submit-success="onSubmit"
      >
        <a-form-item field="username" label="用户名" class="login-card__field">
          <a-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            allow-clear
            size="large"
          >
            <template #prefix>
              <img src="/figma/3971_1023/2.svg" alt="" style="width: 20px; height: 20px" />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item field="password" label="密码" class="login-card__field">
          <a-input-password
            v-model="loginForm.password"
            placeholder="请输入密码"
            allow-clear
            size="large"
          >
            <template #prefix>
              <img src="/figma/3971_1023/3.svg" alt="" style="width: 20px; height: 20px" />
            </template>
          </a-input-password>
        </a-form-item>

        <a-checkbox v-model="loginForm.remember" class="login-card__remember">
          记住我
        </a-checkbox>

        <a-alert
          v-if="errorMessage"
          :message="errorMessage"
          type="error"
          closable
          class="login-card__error"
          @close="errorMessage = ''"
        />

        <a-button
          type="primary"
          html-type="submit"
          long
          :loading="loading"
          class="login-card__btn"
        >
          登录
        </a-button>
      </a-form>
    </div>

    <div class="login-demo">
      <div class="login-demo__title">快速体验 — 点击任意行一键登录</div>
      <a-table
        :data="demoAccounts"
        :columns="demoColumns"
        :pagination="false"
        :bordered="false"
        size="small"
        row-key="username"
        class="login-demo__table"
        @row-click="(record: DemoAccount) => handleQuickLogin(record)"
      >
        <template #role="{ record }">
          <span :class="['login-demo__role-tag', getRoleColorClass(record)]">
            {{ record.role }}
          </span>
        </template>
      </a-table>
    </div>
  </div>
</template>

<style scoped src="./login.scss"></style>
