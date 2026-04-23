import { computed } from 'vue'
import { useWebWorkerFn } from '@vueuse/core'

const HASH_WORKER_TIMEOUT = 120_000

export function useUploadHashWorker() {
  const {
    workerFn: calculateChunkHashInWorker,
    workerStatus: chunkHashWorkerStatus,
    workerTerminate: terminateChunkHashWorker,
  } = useWebWorkerFn(
    async (chunkBuffer: ArrayBuffer) => {
      const hashBuffer = await crypto.subtle.digest('SHA-256', chunkBuffer)
      return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
    },
    { timeout: HASH_WORKER_TIMEOUT },
  )

  const {
    workerFn: calculateFileHashInWorker,
    workerStatus: fileHashWorkerStatus,
    workerTerminate: terminateFileHashWorker,
  } = useWebWorkerFn(
    async (file: File) => {
      const fileBuffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer)
      return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
    },
    { timeout: HASH_WORKER_TIMEOUT },
  )

  const hashWorkerRunning = computed(() => {
    return chunkHashWorkerStatus.value === 'RUNNING' || fileHashWorkerStatus.value === 'RUNNING'
  })

  function terminateHashWorkers() {
    terminateChunkHashWorker()
    terminateFileHashWorker()
  }

  return {
    calculateChunkHashInWorker,
    calculateFileHashInWorker,
    chunkHashWorkerStatus,
    fileHashWorkerStatus,
    hashWorkerRunning,
    terminateHashWorkers,
  }
}

export default useUploadHashWorker
