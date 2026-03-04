export function getLocalStorage<T>(key: string): T | null {
  const value = localStorage.getItem(key)
  if (!value)
    return null

  try {
    return JSON.parse(value) as T
  }
  catch {
    return null
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function removeLocalStorage(key: string): void {
  localStorage.removeItem(key)
}

export function clearLocalStorage(): void {
  localStorage.clear()
}
