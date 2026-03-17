import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import type { UserRole } from '@/types'

const REMEMBER_KEY = 'qtrans_remember_username'

export interface DemoAccount {
  username: string
  password: string
  role: string
  name: string
}

export const demoAccounts: DemoAccount[] = [
  { username: 'submitter', password: '123456', role: '提交人', name: '张提交' },
  { username: 'approver1', password: '123456', role: '一级审批人', name: '王审批一' },
  { username: 'approver2', password: '123456', role: '二级审批人', name: '李审批二' },
  { username: 'approver3', password: '123456', role: '三级审批人', name: '赵审批三' },
  { username: 'admin', password: '123456', role: '管理员', name: '系统管理员' },
]

function getDefaultRouteByRole(roles?: UserRole[]): string {
  if (!roles || roles.length === 0)
    return '/dashboard'

  const primary = roles[0]
  if (primary === 'submitter')
    return '/applications'
  if (primary?.startsWith('approver'))
    return '/approvals'
  if (primary === 'admin')
    return '/dashboard'

  return '/dashboard'
}

export function useLogin() {
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()

  const loginForm = reactive({
    username: localStorage.getItem(REMEMBER_KEY) || '',
    password: '',
    remember: Boolean(localStorage.getItem(REMEMBER_KEY)),
  })

  const loginRules = {
    username: [{ required: true, message: '请输入用户名' }],
    password: [
      { required: true, message: '请输入密码' },
      { minLength: 6, message: '密码长度不少于6位' },
    ],
  }

  const loading = ref(false)
  const errorMessage = ref('')

  async function handleLogin(formRef?: { validate: () => Promise<Record<string, unknown> | undefined> }) {
    if (formRef) {
      const errors = await formRef.validate()
      if (errors)
        return
    }

    loading.value = true
    errorMessage.value = ''

    try {
      // 调用真实后端登录接口（参数在 API 层写死）
      const user = await authStore.login()
      handleRememberMe()

      const redirect = route.query.redirect as string | undefined
      if (redirect) {
        await router.push(redirect)
      }
      else {
        const target = getDefaultRouteByRole(user.roles)
        await router.push(target)
      }
    }
    catch {
      errorMessage.value = '登录失败，请确认账号密码'
      loginForm.password = ''
    }
    finally {
      loading.value = false
    }
  }

  async function handleQuickLogin(account: DemoAccount) {
    loginForm.username = account.username
    loginForm.password = account.password
    await handleLogin()
  }

  function handleRememberMe() {
    if (loginForm.remember) {
      localStorage.setItem(REMEMBER_KEY, loginForm.username)
    }
    else {
      localStorage.removeItem(REMEMBER_KEY)
    }
  }

  return {
    loginForm,
    loginRules,
    loading,
    errorMessage,
    demoAccounts,
    handleLogin,
    handleQuickLogin,
    handleRememberMe,
  }
}
