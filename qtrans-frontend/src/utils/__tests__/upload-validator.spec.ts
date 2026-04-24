import { describe, expect, it } from 'vitest'

import { detectUploadNameConflicts, validateFileName } from '@/utils/upload-validator'

describe('upload-validator', () => {
  it('校验文件名非法字符与长度', () => {
    expect(validateFileName('safe.txt', '', 32).valid).toBe(true)
    expect(validateFileName('bad:name.txt', '', 32).valid).toBe(false)
    expect(validateFileName('toolong-file-name.txt', '', 8).valid).toBe(false)
  })

  it('区分服务端重复、上传队列重复和本次选择重复', () => {
    const fresh = new File(['1'], 'fresh.txt', { type: 'text/plain' })
    const server = new File(['2'], 'server.txt', { type: 'text/plain' })
    const queued = new File(['3'], 'queued.txt', { type: 'text/plain' })
    const duplicatedA = new File(['4'], 'duplicated.txt', { type: 'text/plain' })
    const duplicatedB = new File(['5'], 'duplicated.txt', { type: 'text/plain' })

    const result = detectUploadNameConflicts(
      [fresh, server, queued, duplicatedA, duplicatedB],
      [{ fileName: 'server.txt', relativeDir: '' }],
      [{ fileName: 'queued.txt', relativeDir: '' }],
      '',
    )

    expect(result.readyFiles.map(file => file.name)).toEqual(['fresh.txt', 'duplicated.txt'])
    expect(result.serverDuplicates.map(file => file.name)).toEqual(['server.txt'])
    expect(result.queueDuplicates.map(file => file.name)).toEqual(['queued.txt'])
    expect(result.selectionDuplicates.map(file => file.name)).toEqual(['duplicated.txt'])
  })

  it('按相对目录区分同名文件', () => {
    const report = new File(['1'], 'report.pdf', { type: 'application/pdf' })

    const result = detectUploadNameConflicts(
      [report],
      [{ fileName: 'report.pdf', relativeDir: 'archive' }],
      [{ fileName: 'report.pdf', relativeDir: 'drafts' }],
      '',
    )

    expect(result.readyFiles.map(file => file.name)).toEqual(['report.pdf'])
    expect(result.serverDuplicates).toHaveLength(0)
    expect(result.queueDuplicates).toHaveLength(0)
    expect(result.selectionDuplicates).toHaveLength(0)
  })
})
