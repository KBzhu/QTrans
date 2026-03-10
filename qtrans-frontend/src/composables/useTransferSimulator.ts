import type { TransferState } from '@/types'

type ProgressCallback = (payload: TransferState) => void
type ErrorCallback = (error: Error) => void

type Runtime = {
  applicationId: string
  fileSize: number
  totalDuration: number
  intervalMs: number
  progress: number
  transferredBytes: number
  speedBytesPerSec: number
  remainingSeconds: number
  elapsedMs: number
  startedAt: number
  status: TransferState['status']
  timer: ReturnType<typeof setInterval> | null
  onProgress: ProgressCallback
  onComplete: () => void
  onError?: ErrorCallback
}

const MIN_DURATION_MS = 10000
const DURATION_RANGE_MS = 5000
const INTERVAL_MS = 100
const runtimes = new Map<string, Runtime>()

function createPayload(runtime: Runtime): TransferState {
  return {
    applicationId: runtime.applicationId,
    status: runtime.status,
    progress: Number(runtime.progress.toFixed(2)),
    speedBytesPerSec: Math.max(0, Math.round(runtime.speedBytesPerSec)),
    transferredBytes: Math.max(0, Math.round(runtime.transferredBytes)),
    totalBytes: runtime.fileSize,
    remainingSeconds: Math.max(0, Math.ceil(runtime.remainingSeconds)),
  }
}

function clearRuntimeTimer(runtime: Runtime) {
  if (runtime.timer !== null) {
    clearInterval(runtime.timer)
    runtime.timer = null
  }
}

function emitProgress(runtime: Runtime) {
  runtime.onProgress(createPayload(runtime))
}

function finishRuntime(runtime: Runtime) {
  clearRuntimeTimer(runtime)
  runtime.status = 'completed'
  runtime.progress = 100
  runtime.transferredBytes = runtime.fileSize
  runtime.remainingSeconds = 0
  emitProgress(runtime)
  runtime.onComplete()
  runtimes.delete(runtime.applicationId)
}

function startRuntime(runtime: Runtime) {
  clearRuntimeTimer(runtime)
  runtime.status = 'transferring'
  runtime.startedAt = Date.now() - runtime.elapsedMs

  const totalSteps = Math.max(1, Math.ceil(runtime.totalDuration / runtime.intervalMs))
  const baseIncrease = 100 / totalSteps

  runtime.timer = setInterval(() => {
    try {
      const elapsedMs = Math.max(runtime.intervalMs, Date.now() - runtime.startedAt)
      runtime.elapsedMs = elapsedMs

      const increment = Math.max(0.2, baseIncrease + (Math.random() * 2))
      runtime.progress = Math.min(100, runtime.progress + increment)
      runtime.transferredBytes = (runtime.fileSize * runtime.progress) / 100
      runtime.speedBytesPerSec = runtime.transferredBytes / (elapsedMs / 1000)

      const remainingBytes = Math.max(0, runtime.fileSize - runtime.transferredBytes)
      runtime.remainingSeconds = runtime.speedBytesPerSec > 0
        ? remainingBytes / runtime.speedBytesPerSec
        : 0

      emitProgress(runtime)

      if (runtime.progress >= 100)
        finishRuntime(runtime)
    }
    catch (error) {
      clearRuntimeTimer(runtime)
      runtime.status = 'error'
      emitProgress(runtime)
      runtime.onError?.(error instanceof Error ? error : new Error('传输模拟失败'))
      runtimes.delete(runtime.applicationId)
    }
  }, runtime.intervalMs)
}

export function useTransferSimulator() {
  function simulateTransfer(
    applicationId: string,
    fileSize: number,
    onProgress: ProgressCallback,
    onComplete: () => void,
    onError?: ErrorCallback,
  ): () => void {
    cancelTransfer(applicationId)

    const runtime: Runtime = {
      applicationId,
      fileSize: Math.max(fileSize, 1),
      totalDuration: MIN_DURATION_MS + Math.random() * DURATION_RANGE_MS,
      intervalMs: INTERVAL_MS,
      progress: 0,
      transferredBytes: 0,
      speedBytesPerSec: 0,
      remainingSeconds: 0,
      elapsedMs: 0,
      startedAt: Date.now(),
      status: 'pending',
      timer: null,
      onProgress,
      onComplete,
      onError,
    }

    runtimes.set(applicationId, runtime)
    startRuntime(runtime)

    return () => cancelTransfer(applicationId)
  }

  function pauseTransfer(applicationId: string) {
    const runtime = runtimes.get(applicationId)
    if (!runtime)
      return null

    clearRuntimeTimer(runtime)
    runtime.elapsedMs = Math.max(runtime.elapsedMs, Date.now() - runtime.startedAt)
    runtime.status = 'paused'
    emitProgress(runtime)
    return createPayload(runtime)
  }

  function resumeTransfer(applicationId: string) {
    const runtime = runtimes.get(applicationId)
    if (!runtime)
      return null

    startRuntime(runtime)
    return createPayload(runtime)
  }

  function cancelTransfer(applicationId: string) {
    const runtime = runtimes.get(applicationId)
    if (!runtime)
      return

    clearRuntimeTimer(runtime)
    runtimes.delete(applicationId)
  }

  function getTransferState(applicationId: string) {
    const runtime = runtimes.get(applicationId)
    return runtime ? createPayload(runtime) : null
  }

  function resetTransfers() {
    Array.from(runtimes.values()).forEach(clearRuntimeTimer)
    runtimes.clear()
  }

  return {
    simulateTransfer,
    pauseTransfer,
    resumeTransfer,
    cancelTransfer,
    getTransferState,
    resetTransfers,
  }
}

