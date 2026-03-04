interface TransferProgress {
  applicationId: string
  progress: number
  speedMbps: number
  transferredBytes: number
  totalBytes: number
}

type ProgressCallback = (payload: TransferProgress) => void

export function useTransferSimulator() {
  function simulateTransfer(
    applicationId: string,
    fileSize: number,
    onProgress: ProgressCallback,
    onComplete: () => void,
  ): () => void {
    const totalDuration = 10000 + Math.random() * 5000
    const tick = 500
    const totalSteps = Math.max(1, Math.ceil(totalDuration / tick))

    let progress = 0
    let step = 0

    const timer = window.setInterval(() => {
      step += 1

      const baseIncrease = 100 / totalSteps
      const jitter = (Math.random() * 4) - 2
      progress = Math.min(100, Math.max(0, progress + baseIncrease + jitter))

      const transferredBytes = Math.floor((progress / 100) * fileSize)
      const speedMbps = Number((8 + Math.random() * 18).toFixed(2))

      onProgress({
        applicationId,
        progress: Number(progress.toFixed(2)),
        speedMbps,
        transferredBytes,
        totalBytes: fileSize,
      })

      if (step >= totalSteps || progress >= 100) {
        window.clearInterval(timer)
        onProgress({
          applicationId,
          progress: 100,
          speedMbps,
          transferredBytes: fileSize,
          totalBytes: fileSize,
        })
        onComplete()
      }
    }, tick)

    return () => window.clearInterval(timer)
  }

  return { simulateTransfer }
}
