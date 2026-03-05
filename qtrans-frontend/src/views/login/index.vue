<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const username = ref('submitter')
const password = ref('123456')
const loading = ref(false)
const errorText = ref('')

async function handleLogin() {
  loading.value = true
  errorText.value = ''

  try {
    await authStore.login(username.value, password.value)
    const redirect = String(route.query.redirect || '/dashboard')
    await router.push(redirect)
  }
  catch {
    errorText.value = '登录失败，请确认账号密码'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <form class="login-card" @submit.prevent="handleLogin">
      <h1>QTrans 登录</h1>
      <label>
        账号
        <input v-model="username" placeholder="请输入账号" />
      </label>
      <label>
        密码
        <input v-model="password" type="password" placeholder="请输入密码" />
      </label>
      <p v-if="errorText" class="error">{{ errorText }}</p>
      <button :disabled="loading" type="submit">{{ loading ? '登录中...' : '登录' }}</button>
      <small>Demo账号：submitter / approver1 / approver2 / approver3 / admin（密码均为 123456）</small>
    </form>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: var(--q-bg-main);
}

.login-card {
  width: min(92vw, 420px);
  border-radius: 16px;
  border: 1px solid var(--q-card-border);
  background: rgba(255, 255, 255, 0.65);
  box-shadow: 0 16px 40px rgba(31, 38, 135, 0.12);
  padding: 24px;
  display: grid;
  gap: 12px;
}

h1 {
  margin: 0 0 8px;
}

label {
  display: grid;
  gap: 6px;
  color: #334155;
  font-size: 14px;
}

input {
  height: 38px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  padding: 0 10px;
}

button {
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #155dfc;
  color: #fff;
  cursor: pointer;
}

button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.error {
  margin: 0;
  color: #dc2626;
}

small {
  color: #64748b;
  line-height: 1.5;
}
</style>
