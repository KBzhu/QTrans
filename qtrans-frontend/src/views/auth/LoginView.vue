<script setup lang="ts">
import { onMounted } from 'vue'
import { useLogin } from '@/composables/useLogin'

const {
  loading,
  errorMessage,
  handleSsoCallback,
} = useLogin()

// 页面加载时自动处理 SSO 回调
onMounted(() => {
  handleSsoCallback()
})
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <a-spin v-if="loading" :loading="true" tip="正在登录..." />
      <template v-else-if="errorMessage">
        <a-result status="error" :title="errorMessage" sub-title="即将跳转到统一登录系统..." />
      </template>
      <template v-else>
        <a-spin :loading="true" tip="正在跳转到统一登录系统..." />
      </template>
    </div>
  </div>
</template>

<style scoped src="./login.scss"></style>
