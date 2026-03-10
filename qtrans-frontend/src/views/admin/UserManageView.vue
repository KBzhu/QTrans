<script setup lang="ts">
import type { User } from '@/types'
import { onMounted } from 'vue'
import { useUserManage } from '@/composables/useUserManage'
import UserManageModal from './UserManageModal.vue'
import './user-manage.scss'

const {
  listData,
  loading,
  filters,
  modalVisible,
  editingUser,
  modalTitle,
  roleOptions,
  statusOptions,
  fetchList,
  handleSearch,
  handleReset,
  handleCreate,
  handleEdit,
  handleSave,
  handleDelete,
  handleToggleStatus,
  handleResetPassword,
  getRoleName,
  getRoleColor,
} = useUserManage()

onMounted(() => {
  fetchList()
})

const columns = [
  { title: '用户名', dataIndex: 'username', width: 120 },
  { title: '姓名', dataIndex: 'name', width: 100 },
  { title: '邮箱', dataIndex: 'email', width: 200 },
  { title: '部门', dataIndex: 'departmentName', width: 150 },
  { title: '角色', slotName: 'roles', width: 200 },
  { title: '状态', slotName: 'status', width: 100 },
  { title: '创建时间', slotName: 'createdAt', width: 180 },
  { title: '操作', slotName: 'actions', width: 280, fixed: 'right' },
]

function formatDate(dateStr?: string) {
  if (!dateStr)
    return '-'

  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="user-manage-view">
    <div class="user-manage-header">
      <h2 class="user-manage-title">用户管理</h2>
      <a-button type="primary" @click="handleCreate">
        <template #icon>
          <icon-plus />
        </template>
        新建用户
      </a-button>
    </div>

    <div class="user-manage-filters">
      <a-form layout="inline" :model="filters">
        <a-form-item label="用户名/姓名">
          <a-input
            v-model="filters.keyword"
            placeholder="请输入关键词"
            allow-clear
            style="width: 200px"
            @press-enter="handleSearch"
          />
        </a-form-item>

        <a-form-item label="角色">
          <a-select
            v-model="filters.role"
            placeholder="请选择角色"
            allow-clear
            style="width: 150px"
          >
            <a-option
              v-for="item in roleOptions"
              :key="item.value"
              :value="item.value"
              :label="item.label"
            />
          </a-select>
        </a-form-item>

        <a-form-item label="状态">
          <a-select
            v-model="filters.status"
            placeholder="请选择状态"
            style="width: 120px"
          >
            <a-option
              v-for="item in statusOptions"
              :key="item.value"
              :value="item.value"
              :label="item.label"
            />
          </a-select>
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">
              <template #icon>
                <icon-search />
              </template>
              查询
            </a-button>
            <a-button @click="handleReset">
              <template #icon>
                <icon-refresh />
              </template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </div>

    <div class="user-manage-table">
      <a-table
        :data="listData"
        :columns="columns"
        :loading="loading"
        :pagination="false"
        :bordered="{ cell: true }"
        :scroll="{ x: 1400 }"
      >
        <template #roles="{ record }">
          <a-space wrap>
            <a-tag
              v-for="role in (record as User).roles"
              :key="role"
              :color="getRoleColor(role)"
            >
              {{ getRoleName(role) }}
            </a-tag>
          </a-space>
        </template>

        <template #status="{ record }">
          <a-switch
            :model-value="(record as User).status === 'enabled'"
            :checked-value="true"
            :unchecked-value="false"
            @change="() => handleToggleStatus(record as User)"
          >
            <template #checked>
              启用
            </template>
            <template #unchecked>
              禁用
            </template>
          </a-switch>
        </template>

        <template #createdAt="{ record }">
          {{ formatDate((record as User).createdAt) }}
        </template>

        <template #actions="{ record }">
          <a-space>
            <a-button
              type="text"
              size="small"
              @click="handleEdit(record as User)"
            >
              编辑
            </a-button>
            <a-button
              type="text"
              size="small"
              status="warning"
              @click="handleResetPassword(record as User)"
            >
              重置密码
            </a-button>
            <a-button
              type="text"
              size="small"
              status="danger"
              @click="handleDelete(record as User)"
            >
              删除
            </a-button>
          </a-space>
        </template>
      </a-table>
    </div>

    <UserManageModal
      v-model:visible="modalVisible"
      :user="editingUser"
      :role-options="roleOptions"
      @save="handleSave"
    />
  </div>
</template>
