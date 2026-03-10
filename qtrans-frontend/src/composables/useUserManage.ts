import type { CreateUserRequest, UpdateUserRequest, User, UserQueryParams, UserRole, UserStatus } from '@/types'
import { computed, ref } from 'vue'
import { Modal, Message } from '@arco-design/web-vue'
import { userApi } from '@/api'

export function useUserManage() {
  const listData = ref<User[]>([])
  const loading = ref(false)
  const modalVisible = ref(false)
  const editingUser = ref<User | null>(null)

  const filters = ref<UserQueryParams>({
    keyword: '',
    role: undefined,
    department: undefined,
    status: undefined,
  })

  const isEditMode = computed(() => !!editingUser.value)
  const modalTitle = computed(() => (isEditMode.value ? '编辑用户' : '新建用户'))

  const roleOptions = [
    { label: '提交人', value: 'submitter' },
    { label: '一级审批人', value: 'approver1' },
    { label: '二级审批人', value: 'approver2' },
    { label: '三级审批人', value: 'approver3' },
    { label: '管理员', value: 'admin' },
    { label: '合作伙伴', value: 'partner' },
    { label: '供应商', value: 'vendor' },
    { label: '子公司', value: 'subsidiary' },
  ]

  const statusOptions = [
    { label: '全部', value: '' },
    { label: '启用', value: 'enabled' },
    { label: '禁用', value: 'disabled' },
  ]

  const roleNameMap: Record<UserRole, string> = {
    submitter: '提交人',
    approver1: '一级审批',
    approver2: '二级审批',
    approver3: '三级审批',
    admin: '管理员',
    partner: '合作伙伴',
    vendor: '供应商',
    subsidiary: '子公司',
  }

  const roleColorMap: Record<UserRole, string> = {
    submitter: 'blue',
    approver1: 'orange',
    approver2: 'cyan',
    approver3: 'purple',
    admin: 'red',
    partner: 'green',
    vendor: 'lime',
    subsidiary: 'gold',
  }

  async function fetchList() {
    loading.value = true
    try {
      const params: UserQueryParams = {
        ...filters.value,
        status: filters.value.status || undefined,
      }
      listData.value = await userApi.getList(params)
    }
    catch (error: any) {
      Message.error(error.message || '获取用户列表失败')
    }
    finally {
      loading.value = false
    }
  }

  function handleSearch() {
    fetchList()
  }

  function handleReset() {
    filters.value = {
      keyword: '',
      role: undefined,
      department: undefined,
      status: undefined,
    }
    fetchList()
  }

  function handleCreate() {
    editingUser.value = null
    modalVisible.value = true
  }

  function handleEdit(user: User) {
    editingUser.value = { ...user }
    modalVisible.value = true
  }

  async function handleSave(formData: CreateUserRequest | UpdateUserRequest) {
    try {
      if (isEditMode.value && editingUser.value) {
        await userApi.update(editingUser.value.id, formData as UpdateUserRequest)
        Message.success('更新成功')
      }
      else {
        await userApi.create(formData as CreateUserRequest)
        Message.success('创建成功')
      }

      modalVisible.value = false
      fetchList()
    }
    catch (error: any) {
      Message.error(error.message || '保存失败')
      throw error
    }
  }

  function handleDelete(user: User) {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${user.name}" 吗？删除后无法恢复。`,
      okText: '删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          await userApi.delete(user.id)
          Message.success('删除成功')
          fetchList()
        }
        catch (error: any) {
          Message.error(error.message || '删除失败')
        }
      },
    })
  }

  async function handleToggleStatus(user: User) {
    const nextStatus: UserStatus = user.status === 'enabled' ? 'disabled' : 'enabled'
    const actionText = nextStatus === 'enabled' ? '启用' : '禁用'

    try {
      await userApi.updateStatus(user.id, nextStatus)
      Message.success(`${actionText}成功`)
      fetchList()
    }
    catch (error: any) {
      Message.error(error.message || `${actionText}失败`)
    }
  }

  function handleResetPassword(user: User) {
    Modal.confirm({
      title: '确认重置密码',
      content: `确定要重置用户 "${user.name}" 的密码吗？`,
      okText: '重置',
      cancelText: '取消',
      onOk: async () => {
        try {
          const result = await userApi.resetPassword(user.id)
          Modal.info({
            title: '密码重置成功',
            content: `临时密码：${result.tempPassword}（请妥善保管并通知用户尽快修改）`,
          })
        }
        catch (error: any) {
          Message.error(error.message || '重置密码失败')
        }
      },
    })
  }

  function getRoleName(role: UserRole): string {
    return roleNameMap[role] || role
  }

  function getRoleColor(role: UserRole): string {
    return roleColorMap[role] || 'gray'
  }

  return {
    listData,
    loading,
    filters,
    modalVisible,
    editingUser,
    isEditMode,
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
  }
}
