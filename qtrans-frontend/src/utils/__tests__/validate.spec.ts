import { describe, expect, it } from 'vitest'

import { isAllowedFileType, isValidEmail, isValidFileName, isValidPhone } from '@/utils/validate'

describe('validate utils', () => {
  it('validates email', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('invalid@')).toBe(false)
  })

  it('validates phone', () => {
    expect(isValidPhone('13800138000')).toBe(true)
    expect(isValidPhone('10086')).toBe(false)
  })

  it('validates file name', () => {
    expect(isValidFileName('normal_file.txt')).toBe(true)
    expect(isValidFileName('file/name.txt')).toBe(false)
  })

  it('checks allowed file type', () => {
    expect(isAllowedFileType('data.csv', ['.csv', '.txt'])).toBe(true)
    expect(isAllowedFileType('data.exe', ['.csv', '.txt'])).toBe(false)
  })
})
