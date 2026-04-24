import { computed } from 'vue'
import { useHashWorker } from '@/composables/useHashWorker'

export function useUploadHashWorker() {
  const {
    calculateChunkHashInWorker,
    calculateFileHashInWorker,
    hashWorkerStatus,
    hashWorkerRunning,
    terminateHashWorker,
  } = useHashWorker()

  const chunkHashWorkerStatus = computed(() => hashWorkerStatus.value)
  const fileHashWorkerStatus = computed(() => hashWorkerStatus.value)

  function terminateHashWorkers() {
    terminateHashWorker()
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
