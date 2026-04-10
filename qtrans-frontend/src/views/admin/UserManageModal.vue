<script setup lang="ts">
import type { CreateUserRequest, UpdateUserRequest, User } from '@/types'
import { computed, reactive, ref, watch } from 'vue'
import { departments } from '@/mocks/data/departments'

interface Props {
  visible: boolean
  user: User | null
  roleOptions: Array<{ label: string, value: string }>
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'save', data: CreateUserRequest | UpdateUserRequest): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref()
const isEditMode = computed(() => !!props.user)

const formData = reactive<CreateUserRequest>({
  username: '',
  name: '',
  email: '',
  phone: '',
  department: '',
  departmentName: '',
  roles: [],
  password: '',
})

const formRules = {
  username: [
    { required: true, message: '请输入用户名' },
    { minLength: 3, message: '用户名至少3个字符' },
  ],
  name: [{ required: true, message: '请输入姓名' }],
  email: [
    { required: true, message: '请输入邮箱' },
    { type: 'email', message: '邮箱格式不正确' },
  ],
  phone: [
    { required: true, message: '请输入手机号' },
    { match: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
  ],
  department: [{ required: true, message: '请选择部门' }],
  roles: [{ required: true, message: '请选择角色' }],
  password: [
    {
      required: !isEditMode.value,
      message: '请输入初始密码',
    },
    { minLength: 6, message: '密码至少6个字符' },
  ],
}


watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      if (props.user) {
        Object.assign(formData, {
          username: props.user.username,
          name: props.user.name,
          email: props.user.email,
          phone: props.user.phone,
          department: props.user.department,
          departmentName: props.user.departmentName,
          roles: [...props.user.roles],
          password: '',
        })
      }
      else {
        Object.assign(formData, {
          username: '',
          name: '',
          email: '',
          phone: '',
          department: '',
          departmentName: '',
          roles: [],
          password: '',
        })
      }
    }
  },
)

function handleDepartmentChange(value: string) {
  const findName = (nodes: typeof departments, id: string): string => {
    for (const node of nodes) {
      if (node.id === id)
        return node.name

      if (node.children) {
        const found = findName(node.children, id)
        if (found)
          return found
      }
    }
    return ''
  }

  formData.department = value
  formData.departmentName = findName(departments, value)
}

function handleCancel() {
  emit('update:visible', false)
}

async function handleOk() {
  const valid = await formRef.value?.validate()
  if (!valid) {
    const submitData = isEditMode.value
      ? {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          departmentName: formData.departmentName,
          roles: formData.roles,
        } as UpdateUserRequest
      : { ...formData } as CreateUserRequest

    emit('save', submitData)
  }
}

function flattenTree(tree: typeof departments): Array<{ value: string, label: string }> {
  const result: Array<{ value: string, label: string }> = []
  const walk = (nodes: typeof departments, prefix = '') => {
    nodes.forEach((node) => {
      result.push({ value: node.id, label: prefix + node.name })
      if (node.children)
        walk(node.children, `${prefix}${node.name} / `)
    })
  }
  walk(tree)
  return result
}

const departmentOptions = computed(() => flattenTree(departments))
</script>

<template>
  <a-modal
    :visible="visible"
    :title="isEditMode ? '编辑用户' : '新建用户'"
    :mask-closable="false"
    width="600px"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      layout="vertical"
      auto-label-width
    >
      <a-form-item field="username" label="用户名">
        <a-input
          v-model="formData.username"
          placeholder="请输入用户名"
          :disabled="isEditMode"
        />
      </a-form-item>

      <a-form-item field="name" label="姓名">
        <a-input v-model="formData.name" placeholder="请输入姓名" />
      </a-form-item>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item field="email" label="邮箱">
            <a-input v-model="formData.email" placeholder="请输入邮箱" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item field="phone" label="手机号">
            <a-input v-model="formData.phone" placeholder="请输入手机号" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item field="department" label="所属部门">
        <a-select
          v-model="formData.department"
          placeholder="请选择部门"
          allow-search
          @change="handleDepartmentChange"
        >
          <a-option
            v-for="item in departmentOptions"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          />
        </a-select>
      </a-form-item>

      <a-form-item field="roles" label="角色">
        <a-select
          v-model="formData.roles"
          placeholder="请选择角色"
          multiple
          allow-clear
        >
          <a-option
            v-for="item in roleOptions"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          />
        </a-select>
      </a-form-item>

      <a-form-item v-if="!isEditMode" field="password" label="初始密码">
        <a-input-password
          v-model="formData.password"
          placeholder="请输入初始密码（默认：123456）"
          allow-clear
        />
        <template #extra>
          <span style="color: #86909c; font-size: 12px;">留空则使用默认密码：123456</span>
        </template>
      </a-form-item>
    </a-form>
  </a-modal>
</template>
