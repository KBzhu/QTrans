import { computed, ref } from 'vue'
import { tryOnScopeDispose } from '@vueuse/core'
import type {
  PreparedUploadChunkPayload,
  ReadChunkBufferPayload,
  UploadPrepWorkerInboundMessage,
  UploadPrepWorkerOutboundMessage,
} from '@/types/worker-messages'
import { digestArrayBufferSHA256, getChunkBounds } from '@/workers/shared/hash-utils'

export type UploadPrepWorkerStatus = 'IDLE' | 'RUNNING' | 'FALLBACK' | 'TERMINATED'

interface PendingRequest<T = unknown> {
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

export interface PreparedUploadChunk {
  chunkIndex: number
  start: number
  end: number
  size: number
  fileName: string
  fileType: string
  chunkHash: string
  chunkBuffer: ArrayBuffer
}

export interface ReadChunkBufferResult {
  chunkIndex: number
  start: number
  end: number
  size: number
  chunkBuffer: ArrayBuffer
}

function createTaskId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function useUploadPrepWorker() {
  const worker = ref<Worker | null>(null)
  const uploadPrepWorkerStatus = ref<UploadPrepWorkerStatus>('IDLE')
  const pendingRequests = new Map<string, PendingRequest>()

  function rejectAllPending(reason: Error) {
    pendingRequests.forEach(({ reject }) => reject(reason))
    pendingRequests.clear()
  }

  function setFallback(reason?: unknown) {
    if (reason)
      console.warn('[UploadPrepWorker] 已降级到主线程:', reason)

    uploadPrepWorkerStatus.value = 'FALLBACK'
  }

  function handleWorkerMessage(event: MessageEvent<UploadPrepWorkerOutboundMessage>) {
    const message = event.data

    if (message.type === 'error') {
      if (message.requestId) {
        const pending = pendingRequests.get(message.requestId)
        if (pending) {
          pending.reject(new Error(message.error))
          pendingRequests.delete(message.requestId)
        }
      }
      return
    }

    const pending = pendingRequests.get(message.requestId)
    if (!pending)
      return

    pending.resolve(message)
    pendingRequests.delete(message.requestId)
  }

  function handleWorkerError(event: ErrorEvent) {
    const error = new Error(event.message || 'UploadPrepWorker 运行失败')
    rejectAllPending(error)
    terminateUploadPrepWorker()
    setFallback(error)
  }

  function ensureWorker(): Worker | null {
    if (typeof Worker === 'undefined') {
      setFallback('当前环境不支持 Worker')
      return null
    }

    if (worker.value)
      return worker.value

    try {
      const instance = new Worker(new URL('../workers/upload-prep.worker.ts', import.meta.url), {
        type: 'module',
      })
      instance.onmessage = handleWorkerMessage
      instance.onerror = handleWorkerError
      worker.value = instance
      uploadPrepWorkerStatus.value = 'RUNNING'
      return instance
    }
    catch (error) {
      setFallback(error)
      return null
    }
  }

  function postWorkerMessage<T extends UploadPrepWorkerOutboundMessage>(
    message: UploadPrepWorkerInboundMessage,
  ): Promise<T> {
    const currentWorker = ensureWorker()
    if (!currentWorker)
      return Promise.reject(new Error('UploadPrepWorker 不可用'))

    return new Promise<T>((resolve, reject) => {
      pendingRequests.set(message.requestId, {
        resolve: value => resolve(value as T),
        reject,
      })

      try {
        currentWorker.postMessage(message)
      }
      catch (error) {
        pendingRequests.delete(message.requestId)
        reject(error)
      }
    })
  }

  async function prepareUploadChunkFallback(
    file: File,
    chunkIndex: number,
    chunkSize: number,
  ): Promise<PreparedUploadChunk> {
    const bounds = getChunkBounds(file.size, chunkIndex, chunkSize)
    const chunkBlob = file.slice(bounds.start, bounds.end)
    const chunkBuffer = await chunkBlob.arrayBuffer()

    return {
      chunkIndex,
      start: bounds.start,
      end: bounds.end,
      size: bounds.size,
      fileName: file.name,
      fileType: file.type,
      chunkHash: await digestArrayBufferSHA256(chunkBuffer),
      chunkBuffer,
    }
  }

  async function readChunkBufferFallback(
    file: File,
    chunkIndex: number,
    chunkSize: number,
  ): Promise<ReadChunkBufferResult> {
    const bounds = getChunkBounds(file.size, chunkIndex, chunkSize)
    const chunkBlob = file.slice(bounds.start, bounds.end)

    return {
      chunkIndex,
      start: bounds.start,
      end: bounds.end,
      size: bounds.size,
      chunkBuffer: await chunkBlob.arrayBuffer(),
    }
  }

  async function prepareUploadChunk(
    file: File,
    chunkIndex: number,
    chunkSize: number,
  ): Promise<PreparedUploadChunk> {
    const currentWorker = ensureWorker()
    if (!currentWorker)
      return prepareUploadChunkFallback(file, chunkIndex, chunkSize)

    const taskId = createTaskId('prepare-upload-chunk')

    try {
      const response = await postWorkerMessage<PreparedUploadChunkPayload>({
        type: 'prepare-upload-chunk',
        taskId,
        requestId: createTaskId(taskId),
        file,
        chunkIndex,
        chunkSize,
      })

      return {
        chunkIndex: response.chunkIndex,
        start: response.start,
        end: response.end,
        size: response.size,
        fileName: response.fileName,
        fileType: response.fileType,
        chunkHash: response.chunkHash,
        chunkBuffer: response.chunkBuffer,
      }
    }
    catch (error) {
      setFallback(error)
      return prepareUploadChunkFallback(file, chunkIndex, chunkSize)
    }
  }

  async function readChunkBuffer(
    file: File,
    chunkIndex: number,
    chunkSize: number,
  ): Promise<ReadChunkBufferResult> {
    const currentWorker = ensureWorker()
    if (!currentWorker)
      return readChunkBufferFallback(file, chunkIndex, chunkSize)

    const taskId = createTaskId('read-chunk-buffer')

    try {
      const response = await postWorkerMessage<ReadChunkBufferPayload>({
        type: 'read-chunk-buffer',
        taskId,
        requestId: createTaskId(taskId),
        file,
        chunkIndex,
        chunkSize,
      })

      return {
        chunkIndex: response.chunkIndex,
        start: response.start,
        end: response.end,
        size: response.size,
        chunkBuffer: response.chunkBuffer,
      }
    }
    catch (error) {
      setFallback(error)
      return readChunkBufferFallback(file, chunkIndex, chunkSize)
    }
  }

  function terminateUploadPrepWorker() {
    rejectAllPending(new Error('UploadPrepWorker 已终止'))
    worker.value?.terminate()
    worker.value = null
    uploadPrepWorkerStatus.value = 'TERMINATED'
  }

  tryOnScopeDispose(() => {
    terminateUploadPrepWorker()
  })

  const uploadPrepWorkerRunning = computed(() => uploadPrepWorkerStatus.value === 'RUNNING')

  return {
    prepareUploadChunk,
    readChunkBuffer,
    uploadPrepWorkerStatus,
    uploadPrepWorkerRunning,
    terminateUploadPrepWorker,
  }
}

export default useUploadPrepWorker
