import { beforeEach, describe, expect, it } from 'vitest'

import { clearLocalStorage, getLocalStorage, removeLocalStorage, setLocalStorage } from '@/utils/storage'

describe('storage utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('sets and gets localStorage', () => {
    setLocalStorage('k1', { name: 'demo' })
    expect(getLocalStorage<{ name: string }>('k1')).toEqual({ name: 'demo' })
  })

  it('removes localStorage', () => {
    setLocalStorage('k2', 'v2')
    removeLocalStorage('k2')
    expect(getLocalStorage('k2')).toBeNull()
  })

  it('clears localStorage', () => {
    setLocalStorage('k3', 'v3')
    clearLocalStorage()
    expect(getLocalStorage('k3')).toBeNull()
  })
})
