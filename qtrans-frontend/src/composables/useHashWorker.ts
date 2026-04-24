import { computed, ref } from 'vue'
import { tryOnScopeDispose } from '@vueuse/core'
import { createSHA256 } from 'hash-wasm'
import type {
  HashWorkerChunkHashesDoneMessage,
  HashWorkerHashDoneMessage,
  HashWorkerInboundMessage,
  HashWorkerOutboundMessage,
} from '@/types/worker-messages'
import { digestArrayBufferSHA256, digestFileSHA256 } from '@/workers/shared/hash-utils'

export type HashWorkerStatus = 'IDLE' | 'RUNNING' | 'FALLBACK' | 'TERMINATED'

export interface StreamFileHasher {
  taskId: string
  mode: 'worker' | 'main'
  update: (chunkBuffer: ArrayBuffer, chunkIndex: number) => Promise<void>
  digest: () => Promise<string>
  dispose: () => Promise<void>
}

interface PendingRequest<T = unknown> {
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

function createTaskId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function useHashWorker() {
  const worker = ref<Worker | null>(null)
  const hashWorkerStatus = ref<HashWorkerStatus>('IDLE')
  const pendingRequests = new Map<string, PendingRequest>()
  const progressByTask = ref<Record<string, number>>({})

  function rejectAllPending(reason: Error) {
    pendingRequests.forEach(({ reject }) => reject(reason))
    pendingRequests.clear()
  }

  function setFallback(reason?: unknown) {
    if (reason)
      console.warn('[HashWorker] 已降级到主线程:', reason)

    hashWorkerStatus.value = 'FALLBACK'
  }

  function handleWorkerMessage(event: MessageEvent<HashWorkerOutboundMessage>) {
    const message = event.data

    if (message.type === 'progress') {
      progressByTask.value = {
        ...progressByTask.value,
        [message.taskId]: message.percent,
      }
      return
    }

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
    const error = new Error(event.message || 'HashWorker 运行失败')
    rejectAllPending(error)
    terminateHashWorker()
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
      const instance = new Worker(new URL('../workers/hash.worker.ts', import.meta.url), {
        type: 'module',
      })
      instance.onmessage = handleWorkerMessage
      instance.onerror = handleWorkerError
      worker.value = instance
      hashWorkerStatus.value = 'RUNNING'
      return instance
    }
    catch (error) {
      setFallback(error)
      return null
    }
  }

  function postWorkerMessage<T extends HashWorkerOutboundMessage>(
    message: HashWorkerInboundMessage,
    transferList: Transferable[] = [],
  ): Promise<T> {
    const currentWorker = ensureWorker()
    if (!currentWorker)
      return Promise.reject(new Error('HashWorker 不可用'))

    return new Promise<T>((resolve, reject) => {
      pendingRequests.set(message.requestId, {
        resolve: value => resolve(value as T),
        reject,
      })

      try {
        if (transferList.length > 0) {
          currentWorker.postMessage(message, transferList)
          return
        }

        currentWorker.postMessage(message)
      }
      catch (error) {
        pendingRequests.delete(message.requestId)
        reject(error)
      }
    })
  }

  async function calculateChunkHashInWorker(chunkBuffer: ArrayBuffer): Promise<string> {
    const currentWorker = ensureWorker()
    if (!currentWorker)
      return digestArrayBufferSHA256(chunkBuffer)

    const backupBuffer = chunkBuffer.slice(0)
    const taskId = createTaskId('hash-chunk')

    try {
      const response = await postWorkerMessage<HashWorkerChunkHashesDoneMessage>({
        type: 'hash-batch-chunks',
        taskId,
        requestId: createTaskId(taskId),
        chunks: [{ index: 0, data: chunkBuffer }],
      }, [chunkBuffer])

      return response.hashes[0]?.hash || ''
    }
    catch (error) {
      setFallback(error)
      return digestArrayBufferSHA256(backupBuffer)
    }
  }

  async function calculateFileHashInWorker(file: File): Promise<string> {
    const currentWorker = ensureWorker()
    if (!currentWorker)
      return digestFileSHA256(file)

    const fileBuffer = await file.arrayBuffer()
    const taskId = createTaskId('hash-file')

    try {
      const response = await postWorkerMessage<HashWorkerHashDoneMessage>({
        type: 'hash-file-directly',
        taskId,
        requestId: createTaskId(taskId),
        totalSize: file.size,
        fileData: fileBuffer,
      }, [fileBuffer])

      return response.hash
    }
    catch (error) {
      setFallback(error)
      return digestFileSHA256(file)
    }
  }

  async function createStreamFileHasher(totalSize: number): Promise<StreamFileHasher> {
    const currentWorker = ensureWorker()
    const taskId = createTaskId('hash-stream')

    if (!currentWorker) {
      const hasher = await createSHA256()

      return {
        taskId,
        mode: 'main',
        async update(chunkBuffer: ArrayBuffer) {
          hasher.update(new Uint8Array(chunkBuffer))
        },
        async digest() {
          return hasher.digest()
        },
        async dispose() {},
      }
    }

    await postWorkerMessage({
      type: 'init-stream',
      taskId,
      requestId: createTaskId(taskId),
      totalSize,
    })

    progressByTask.value = {
      ...progressByTask.value,
      [taskId]: 0,
    }

    return {
      taskId,
      mode: 'worker',
      async update(chunkBuffer: ArrayBuffer, chunkIndex: number) {
        await postWorkerMessage({
          type: 'update-chunk',
          taskId,
          requestId: createTaskId(taskId),
          chunkData: chunkBuffer,
          chunkIndex,
        }, [chunkBuffer])
      },
      async digest() {
        const response = await postWorkerMessage<HashWorkerHashDoneMessage>({
          type: 'digest',
          taskId,
          requestId: createTaskId(taskId),
        })

        const nextProgress = { ...progressByTask.value }
        delete nextProgress[taskId]
        progressByTask.value = nextProgress

        return response.hash
      },
      async dispose() {
        try {
          await postWorkerMessage({
            type: 'dispose-task',
            taskId,
            requestId: createTaskId(taskId),
          })
        }
        catch {
          // 忽略 dispose 阶段的 Worker 异常
        }
        finally {
          const nextProgress = { ...progressByTask.value }
          delete nextProgress[taskId]
          progressByTask.value = nextProgress
        }
      },
    }
  }

  function terminateHashWorker() {
    rejectAllPending(new Error('HashWorker 已终止'))
    worker.value?.terminate()
    worker.value = null
    progressByTask.value = {}
    hashWorkerStatus.value = 'TERMINATED'
  }

  tryOnScopeDispose(() => {
    terminateHashWorker()
  })

  const hashWorkerRunning = computed(() => hashWorkerStatus.value === 'RUNNING')

  return {
    calculateChunkHashInWorker,
    calculateFileHashInWorker,
    createStreamFileHasher,
    hashWorkerStatus,
    hashWorkerRunning,
    progressByTask,
    terminateHashWorker,
  }
}

export default useHashWorker
