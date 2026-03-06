import type { FileInfo, FileStatus, UploadProgress } from '@/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { STORAGE_KEYS } from '@/utils/constants'
import { getLocalStorage, setLocalStorage } from '@/utils/storage'

type PersistedFileInfo = Omit<FileInfo, 'fileBlob'>

function toPersistedFileInfo(file: FileInfo): PersistedFileInfo {
  const { fileBlob: _, ...rest } = file
  return rest
}

export const useFileStore = defineStore('file', () => {
  const cached = getLocalStorage<PersistedFileInfo[]>(STORAGE_KEYS.FILE_METAS) || []
  const files = ref<Map<string, FileInfo>>(new Map(cached.map(item => [item.id, item])))
  const uploadProgress = ref<Map<string, UploadProgress>>(new Map())
  const transferProgress = ref<Map<string, number>>(new Map())
  const uploadStatus = ref<Map<string, FileStatus>>(new Map(cached.map(item => [item.id, item.uploadStatus])))

  function syncFileMetas() {
    const list = [...files.value.values()].map(toPersistedFileInfo)
    setLocalStorage(STORAGE_KEYS.FILE_METAS, list)
  }

  function setMapValue<K, V>(mapRef: { value: Map<K, V> }, key: K, value: V) {
    const next = new Map(mapRef.value)
    next.set(key, value)
    mapRef.value = next
  }

  function deleteMapValue<K, V>(mapRef: { value: Map<K, V> }, key: K) {
    if (!mapRef.value.has(key))
      return

    const next = new Map(mapRef.value)
    next.delete(key)
    mapRef.value = next
  }

  function addFile(fileInfo: FileInfo) {
    const previous = files.value.get(fileInfo.id)
    setMapValue(files, fileInfo.id, {
      ...previous,
      ...fileInfo,
      fileBlob: fileInfo.fileBlob ?? previous?.fileBlob,
    })
    setMapValue(uploadStatus, fileInfo.id, fileInfo.uploadStatus)
    syncFileMetas()
  }

  function updateUploadProgress(fileId: string, progress: number, speed: number) {
    const base = files.value.get(fileId)
    if (!base)
      return

    const nextStatus: FileStatus = progress >= 100 ? 'completed' : 'uploading'

    setMapValue(uploadProgress, fileId, {
      fileId,
      progress,
      uploadedBytes: Math.floor((progress / 100) * base.fileSize),
      totalBytes: base.fileSize,
      speed,
      status: nextStatus,
    })

    setMapValue(files, fileId, {
      ...base,
      uploadProgress: progress,
      uploadStatus: nextStatus,
      uploadedAt: nextStatus === 'completed' ? new Date().toISOString() : base.uploadedAt,
    })

    setMapValue(uploadStatus, fileId, nextStatus)
    syncFileMetas()
  }

  function pauseUpload(fileId: string) {
    setMapValue(uploadStatus, fileId, 'paused')
    const base = files.value.get(fileId)
    if (base) {
      setMapValue(files, fileId, { ...base, uploadStatus: 'paused' })
      syncFileMetas()
    }
  }

  function resumeUpload(fileId: string) {
    setMapValue(uploadStatus, fileId, 'uploading')
    const base = files.value.get(fileId)
    if (base) {
      setMapValue(files, fileId, { ...base, uploadStatus: 'uploading' })
      syncFileMetas()
    }
  }

  function updateTransferProgress(fileId: string, progress: number) {
    setMapValue(transferProgress, fileId, progress)
  }

  function removeFile(fileId: string) {
    deleteMapValue(files, fileId)
    deleteMapValue(uploadProgress, fileId)
    deleteMapValue(transferProgress, fileId)
    deleteMapValue(uploadStatus, fileId)
    syncFileMetas()
  }

  function getFilesByApplicationId(applicationId: string): FileInfo[] {
    return [...files.value.values()].filter(item => item.applicationId === applicationId)
  }

  return {
    files,
    uploadProgress,
    transferProgress,
    uploadStatus,
    addFile,
    updateUploadProgress,
    pauseUpload,
    resumeUpload,
    updateTransferProgress,
    removeFile,
    getFilesByApplicationId,
  }
})
