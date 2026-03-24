import type { SuggestUserItem } from '@/api/auth'
import { ref, shallowRef } from 'vue'
import { authApi } from '@/api/auth'

export interface UserSuggestOption {
  label: string
  value: string
  displayName: string
  userAccount: string
  dept: string
  raw: SuggestUserItem
}

const MIN_KEYWORD_LENGTH = 3
const DEBOUNCE_DELAY = 300

export function useUserSuggest() {
  const loading = ref(false)
  const options = shallowRef<UserSuggestOption[]>([])
  let debounceTimer: number | null = null

  /**
   * 转换用户数据为选项格式
   * 显示格式：displayNameCn / userAccount / dept
   */
  function transformToOptions(users: SuggestUserItem[]): UserSuggestOption[] {
    return users.map(user => ({
      label: `${user.displayNameCn} / ${user.userAccount} / ${user.dept}`,
      value: user.userAccount,
      displayName: user.displayNameCn,
      userAccount: user.userAccount,
      dept: user.dept,
      raw: user,
    }))
  }

  /**
   * 搜索用户（带防抖）
   */
  function search(keyWord: string): void {
    // 清除之前的定时器
    if (debounceTimer) {
      window.clearTimeout(debounceTimer)
      debounceTimer = null
    }

    // 输入少于3个字符，清空选项
    if (!keyWord || keyWord.length < MIN_KEYWORD_LENGTH) {
      options.value = []
      return
    }

    // 防抖处理
    debounceTimer = window.setTimeout(async () => {
      loading.value = true
      try {
        const result = await authApi.suggestUser(keyWord)
        options.value = transformToOptions(result || [])
      }
      catch {
        options.value = []
      }
      finally {
        loading.value = false
      }
    }, DEBOUNCE_DELAY)
  }

  /**
   * 清空搜索结果
   */
  function clear(): void {
    if (debounceTimer) {
      window.clearTimeout(debounceTimer)
      debounceTimer = null
    }
    options.value = []
    loading.value = false
  }

  return {
    loading,
    options,
    search,
    clear,
    MIN_KEYWORD_LENGTH,
  }
}
