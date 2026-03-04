import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFileStore } from '@/stores/file'

describe('useFileStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('updateUploadProgress updates progress value', () => {
    const store = useFileStore()

    store.addFile({
      id: 'file-1',
      applicationId: 'app-1',
      fileName: 'demo.txt',
      fileSize: 100,
      fileType: 'text/plain',
      uploadStatus: 'pending',
      uploadProgress: 0,
    })

    store.updateUploadProgress('file-1', 50, 1024)

    expect(store.uploadProgress.get('file-1')?.progress).toBe(50)
    expect(store.uploadStatus.get('file-1')).toBe('uploading')
  })

  it('pauseUpload sets paused status', () => {
    const store = useFileStore()

    store.addFile({
      id: 'file-2',
      applicationId: 'app-1',
      fileName: 'demo2.txt',
      fileSize: 200,
      fileType: 'text/plain',
      uploadStatus: 'uploading',
      uploadProgress: 10,
    })

    store.pauseUpload('file-2')

    expect(store.uploadStatus.get('file-2')).toBe('paused')
  })
})
