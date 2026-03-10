import type { Application, FileInfo, FileStatus, Notification, TransferState, UploadProgress } from '@/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useTransferSimulator } from '@/composables/useTransferSimulator'
import { STORAGE_KEYS } from '@/utils/constants'
import { getLocalStorage, setLocalStorage } from '@/utils/storage'
import { useApplicationStore } from './application'
import { useNotificationStore } from './notification'

type PersistedFileInfo = Omit<FileInfo, 'fileBlob'>

function toPersistedFileInfo(file: FileInfo): PersistedFileInfo {
  const { fileBlob: _, ...rest } = file
  return rest
}

function buildNotification(userId: string, title: string, content: string, relatedId: string): Notification {
  return {
    id: `ntf-${relatedId}-${userId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    type: 'transfer',
    title,
    content,
    relatedId,
    read: false,
    createdAt: new Date().toISOString(),
  }
}

export const useFileStore = defineStore('file', () => {
  const applicationStore = useApplicationStore()
  const notificationStore = useNotificationStore()
  const { simulateTransfer, pauseTransfer: pauseTransferTask, resumeTransfer: resumeTransferTask, cancelTransfer, getTransferState } = useTransferSimulator()

  const cached = getLocalStorage<PersistedFileInfo[]>(STORAGE_KEYS.FILE_METAS) || []
  const files = ref<Map<string, FileInfo>>(new Map(cached.map(item => [item.id, item])))
  const uploadProgress = ref<Map<string, UploadProgress>>(new Map())
  const transferProgress = ref<Map<string, number>>(new Map())
  const transferStates = ref<Map<string, TransferState>>(new Map())
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

  function updateTransferProgress(applicationId: string, progress: number) {
    setMapValue(transferProgress, applicationId, progress)
  }

  function setTransferState(state: TransferState) {
    setMapValue(transferStates, state.applicationId, state)
    updateTransferProgress(state.applicationId, state.progress)
  }

  function getFilesByApplicationId(applicationId: string): FileInfo[] {
    return [...files.value.values()].filter(item => item.applicationId === applicationId)
  }

  function getTransferStateByApplicationId(applicationId: string) {
    return transferStates.value.get(applicationId) || null
  }

  async function ensureApplication(applicationId: string) {
    const local = applicationStore.applications.find(item => item.id === applicationId)
      || applicationStore.drafts.find(item => item.id === applicationId)
      || (applicationStore.currentApplication?.id === applicationId ? applicationStore.currentApplication : null)

    if (local)
      return local

    return applicationStore.fetchApplicationDetail(applicationId)
  }

  function getApplicationTotalBytes(application: Application) {
    const totalByFiles = getFilesByApplicationId(application.id)
      .reduce((sum, item) => sum + Math.max(item.fileSize, 0), 0)

    if (totalByFiles > 0)
      return totalByFiles

    if (application.storageSize > 0)
      return Math.round(application.storageSize * 1024 * 1024)

    return 1024 * 1024
  }

  function notifyTransferCompleted(application: Application) {
    const receivers = [application.applicantId, ...application.downloaderAccounts].filter(Boolean)
    const title = '文件传输已完成'
    const content = `申请单 ${application.applicationNo} 已完成传输，可进入待我下载查看归档文件。`

    receivers.forEach((userId) => {
      notificationStore.addNotification(buildNotification(userId, title, content, application.id))
    })
  }

  async function startTransfer(applicationId: string) {
    const application = await ensureApplication(applicationId)
    const totalBytes = getApplicationTotalBytes(application)

    const transferringApp = await applicationStore.updateApplication(applicationId, {
      status: 'transferring',
      currentApprovalLevel: 0,
    })

    setTransferState({
      applicationId,
      status: 'transferring',
      progress: 0,
      speedBytesPerSec: 0,
      transferredBytes: 0,
      totalBytes,
      remainingSeconds: 0,
    })

    simulateTransfer(
      applicationId,
      totalBytes,
      (payload) => {
        setTransferState(payload)
      },
      async () => {
        const completedApp = await applicationStore.updateApplication(applicationId, {
          status: 'completed',
          currentApprovalLevel: 0,
        })

        setTransferState({
          applicationId,
          status: 'completed',
          progress: 100,
          speedBytesPerSec: 0,
          transferredBytes: totalBytes,
          totalBytes,
          remainingSeconds: 0,
        })
        notifyTransferCompleted(completedApp)
      },
      async (error) => {
        setTransferState({
          applicationId,
          status: 'error',
          progress: getTransferStateByApplicationId(applicationId)?.progress || 0,
          speedBytesPerSec: 0,
          transferredBytes: getTransferStateByApplicationId(applicationId)?.transferredBytes || 0,
          totalBytes,
          remainingSeconds: 0,
          errorMessage: error.message,
        })
        await applicationStore.updateApplication(applicationId, {
          status: 'approved',
          currentApprovalLevel: 0,
        })
      },
    )

    return transferringApp
  }

  function pauseTransfer(applicationId: string) {
    const payload = pauseTransferTask(applicationId)
    if (payload)
      setTransferState(payload)
    return payload
  }

  function resumeTransfer(applicationId: string) {
    const payload = resumeTransferTask(applicationId) || getTransferState(applicationId)
    if (payload)
      setTransferState(payload)
    return payload
  }

  async function retryTransfer(applicationId: string) {
    cancelTransfer(applicationId)
    deleteMapValue(transferStates, applicationId)
    deleteMapValue(transferProgress, applicationId)
    return startTransfer(applicationId)
  }

  function removeFile(fileId: string) {
    deleteMapValue(files, fileId)
    deleteMapValue(uploadProgress, fileId)
    deleteMapValue(uploadStatus, fileId)
    syncFileMetas()
  }

  return {
    files,
    uploadProgress,
    transferProgress,
    transferStates,
    uploadStatus,
    addFile,
    updateUploadProgress,
    pauseUpload,
    resumeUpload,
    updateTransferProgress,
    setTransferState,
    startTransfer,
    pauseTransfer,
    resumeTransfer,
    retryTransfer,
    removeFile,
    getFilesByApplicationId,
    getTransferStateByApplicationId,
  }
})

