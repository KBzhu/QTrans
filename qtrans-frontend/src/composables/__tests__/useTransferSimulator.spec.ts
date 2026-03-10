import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTransferSimulator } from '../useTransferSimulator'

describe('useTransferSimulator', () => {
  const simulator = useTransferSimulator()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    simulator.resetTransfers()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('completes transfer and calls onComplete', async () => {
    const onProgress = vi.fn()
    const onComplete = vi.fn()

    simulator.simulateTransfer('app-1', 1024 * 1024, onProgress, onComplete)

    await vi.runAllTimersAsync()

    expect(onComplete).toHaveBeenCalledOnce()
    expect(onProgress).toHaveBeenCalled()

    const lastPayload = onProgress.mock.calls.at(-1)?.[0]
    expect(lastPayload).toMatchObject({
      applicationId: 'app-1',
      status: 'completed',
      progress: 100,
      transferredBytes: 1024 * 1024,
      totalBytes: 1024 * 1024,
      remainingSeconds: 0,
    })
  })

  it('pauses and resumes transfer from current progress', async () => {
    const onProgress = vi.fn()

    simulator.simulateTransfer('app-2', 2048, onProgress, vi.fn())
    await vi.advanceTimersByTimeAsync(500)

    const paused = simulator.pauseTransfer('app-2')
    const pausedProgress = paused?.progress ?? 0

    expect(paused?.status).toBe('paused')
    expect(pausedProgress).toBeGreaterThan(0)

    await vi.advanceTimersByTimeAsync(1000)
    expect(simulator.getTransferState('app-2')?.progress).toBe(pausedProgress)

    const resumed = simulator.resumeTransfer('app-2')
    expect(resumed?.status).toBe('transferring')

    await vi.advanceTimersByTimeAsync(300)
    expect((simulator.getTransferState('app-2')?.progress ?? 0)).toBeGreaterThan(pausedProgress)
  })

  it('cancels transfer and clears runtime state', () => {
    const cancel = simulator.simulateTransfer('app-3', 4096, vi.fn(), vi.fn())

    cancel()

    expect(simulator.getTransferState('app-3')).toBeNull()
  })
})
