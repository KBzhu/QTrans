import type { Directive } from 'vue'
import type { UserRole } from '@/types'
import { useAuthStore } from '@/stores'

type PermissionValue = string | string[]
type RoleValue = UserRole | UserRole[]

function removeElement(el: HTMLElement) {
  const parent = el.parentNode
  if (parent)
    parent.removeChild(el)
}

export const permissionDirective: Directive<HTMLElement, PermissionValue> = {
  mounted(el, binding) {
    const authStore = useAuthStore()
    const expected = Array.isArray(binding.value) ? binding.value : [binding.value]

    if (!expected.some(item => authStore.hasPermission(item)))
      removeElement(el)
  },
}

export const roleDirective: Directive<HTMLElement, RoleValue> = {
  mounted(el, binding) {
    const authStore = useAuthStore()
    const expected = Array.isArray(binding.value) ? binding.value : [binding.value]

    if (!expected.some(role => authStore.hasRole(role)))
      removeElement(el)
  },
}
