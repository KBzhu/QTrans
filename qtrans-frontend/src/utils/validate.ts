export function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(email)
}

export function isValidPhone(phone: string): boolean {
  const pattern = /^1[3-9]\d{9}$/
  return pattern.test(phone)
}

export function isValidFileName(name: string): boolean {
  if (!name.trim())
    return false

  const forbiddenChars = /[\\/:*?"<>|]/
  return !forbiddenChars.test(name)
}

export function isAllowedFileType(name: string, allowList: string[]): boolean {
  const lowerName = name.toLowerCase()
  return allowList.some(ext => lowerName.endsWith(ext.toLowerCase()))
}
