<script setup lang="ts">
import ViewPlaceholder from '@/components/common/ViewPlaceholder.vue'
</script>

<template>
  <ViewPlaceholder title="用户管理" description="仅管理员可见，维护用户账号、角色与状态。">
    <div class="actions">
      <button v-role="'admin'" class="btn">新增用户（仅 admin 可见）</button>
    </div>
  </ViewPlaceholder>
</template>

<style scoped>
.actions {
  margin-top: 14px;
}

.btn {
  height: 34px;
  border: none;
  border-radius: 8px;
  color: #fff;
  background: #155dfc;
  padding: 0 12px;
}
</style>
