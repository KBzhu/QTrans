import type { User } from '@/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUserManage } from '@/composables/useUserManage'
import { Message, Modal } from '@arco-design/web-vue'

const { getListMock, createMock, updateMock, updateStatusMock, deleteMock, resetPasswordMock } = vi.hoisted(() => ({
  getListMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  updateStatusMock: vi.fn(),
  deleteMock: vi.fn(),
  resetPasswordMock: vi.fn(),
}))

vi.mock('@/api/user', () => ({
  userApi: {
    getList: getListMock,
    create: createMock,
    update: updateMock,
    updateStatus: updateStatusMock,
    delete: deleteMock,
    resetPassword: resetPasswordMock,
  },
}))

vi.mock('@arco-design/web-vue', async () => {
  const actual = await vi.importActual('@arco-design/web-vue')
  return {
    ...actual,
    Message: {
      success: vi.fn(),
      error: vi.fn(),
    },
    Modal: {
      confirm: vi.fn((options: any) => {
        if (options.onOk)
          options.onOk()
      }),
      info: vi.fn(),
    },
  }
})

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: overrides.id || 'u-default',
    username: overrides.username || 'testuser',
    name: overrides.name || '测试用户',
    email: overrides.email || 'test@demo.com',
    phone: overrides.phone || '13800000000',
    department: overrides.department || 'dept-it',
    departmentName: overrides.departmentName || 'IT部',
    roles: overrides.roles || ['submitter'],
    status: overrides.status || 'enabled',
    createdAt: overrides.createdAt || '2026-03-10T10:00:00.000Z',
    updatedAt: overrides.updatedAt || '2026-03-10T10:00:00.000Z',
  }
}

describe('useUserManage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchList loads user list with filters', async () => {
    const mockUsers = [
      createUser({ id: 'u1', username: 'user1', name: '用户1' }),
      createUser({ id: 'u2', username: 'user2', name: '用户2' }),
    ]
    getListMock.mockResolvedValueOnce(mockUsers)

    const composable = useUserManage()
    composable.filters.value.keyword = 'user1'
    await composable.fetchList()

    expect(getListMock).toHaveBeenCalledWith(expect.objectContaining({ keyword: 'user1' }))
    expect(composable.listData.value).toEqual(mockUsers)
    expect(composable.loading.value).toBe(false)
  })

  it('handleSearch triggers fetchList', async () => {
    getListMock.mockResolvedValueOnce([])

    const composable = useUserManage()
    composable.filters.value.role = 'admin'
    await composable.handleSearch()

    expect(getListMock).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }))
  })

  it('handleReset clears filters and reloads', async () => {
    getListMock.mockResolvedValueOnce([])

    const composable = useUserManage()
    composable.filters.value.keyword = 'test'
    composable.filters.value.role = 'admin'
    await composable.handleReset()

    expect(composable.filters.value.keyword).toBe('')
    expect(composable.filters.value.role).toBeUndefined()
    expect(getListMock).toHaveBeenCalled()
  })

  it('handleCreate opens modal in create mode', () => {
    const composable = useUserManage()
    composable.handleCreate()

    expect(composable.modalVisible.value).toBe(true)
    expect(composable.editingUser.value).toBeNull()
    expect(composable.isEditMode.value).toBe(false)
  })

  it('handleEdit opens modal in edit mode', () => {
    const user = createUser({ id: 'u-edit', name: '编辑用户' })
    const composable = useUserManage()
    composable.handleEdit(user)

    expect(composable.modalVisible.value).toBe(true)
    expect(composable.editingUser.value).toEqual(user)
    expect(composable.isEditMode.value).toBe(true)
  })

  it('handleSave creates new user when not in edit mode', async () => {
    const newUser = createUser({ id: 'u-new', username: 'newuser' })
    createMock.mockResolvedValueOnce(newUser)
    getListMock.mockResolvedValueOnce([newUser])

    const composable = useUserManage()
    composable.editingUser.value = null
    await composable.handleSave({
      username: 'newuser',
      name: '新用户',
      email: 'new@demo.com',
      phone: '13800000001',
      department: 'dept-it',
      departmentName: 'IT部',
      roles: ['submitter'],
      password: '123456',
    })

    expect(createMock).toHaveBeenCalled()
    expect(Message.success).toHaveBeenCalledWith('创建成功')
    expect(composable.modalVisible.value).toBe(false)
  })

  it('handleSave updates user when in edit mode', async () => {
    const updatedUser = createUser({ id: 'u-upd', name: '更新后用户' })
    updateMock.mockResolvedValueOnce(updatedUser)
    getListMock.mockResolvedValueOnce([updatedUser])

    const composable = useUserManage()
    composable.editingUser.value = createUser({ id: 'u-upd' })
    await composable.handleSave({
      name: '更新后用户',
      email: 'updated@demo.com',
      phone: '13800000002',
      department: 'dept-it',
      departmentName: 'IT部',
      roles: ['admin'],
    })

    expect(updateMock).toHaveBeenCalledWith('u-upd', expect.any(Object))
    expect(Message.success).toHaveBeenCalledWith('更新成功')
  })

  it('handleDelete confirms and deletes user', async () => {
    deleteMock.mockResolvedValueOnce(true)
    getListMock.mockResolvedValueOnce([])

    const composable = useUserManage()
    const user = createUser({ id: 'u-del', name: '删除用户' })
    composable.handleDelete(user)

    expect(Modal.confirm).toHaveBeenCalled()
    await vi.waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith('u-del')
      expect(Message.success).toHaveBeenCalledWith('删除成功')
    })
  })

  it('handleToggleStatus switches user status', async () => {
    const user = createUser({ id: 'u-toggle', status: 'enabled' })
    updateStatusMock.mockResolvedValueOnce({ ...user, status: 'disabled' })
    getListMock.mockResolvedValueOnce([])

    const composable = useUserManage()
    await composable.handleToggleStatus(user)

    expect(updateStatusMock).toHaveBeenCalledWith('u-toggle', 'disabled')
    expect(Message.success).toHaveBeenCalledWith('禁用成功')
  })

  it('handleResetPassword confirms and resets password', async () => {
    resetPasswordMock.mockResolvedValueOnce({ tempPassword: 'Tempabc123' })

    const composable = useUserManage()
    const user = createUser({ id: 'u-reset', name: '重置密码用户' })
    composable.handleResetPassword(user)

    expect(Modal.confirm).toHaveBeenCalled()
    await vi.waitFor(() => {
      expect(resetPasswordMock).toHaveBeenCalledWith('u-reset')
      expect(Modal.info).toHaveBeenCalled()
    })
  })

  it('getRoleName and getRoleColor return correct values', () => {
    const composable = useUserManage()

    expect(composable.getRoleName('admin')).toBe('管理员')
    expect(composable.getRoleName('submitter')).toBe('提交人')
    expect(composable.getRoleColor('admin')).toBe('red')
    expect(composable.getRoleColor('submitter')).toBe('blue')
  })
})
