/// <reference lib="webworker" />

import type {
  UploadPrepWorkerInboundMessage,
  UploadPrepWorkerOutboundMessage,
  WorkerErrorMessage,
} from '@/types/worker-messages'
import { digestArrayBufferSHA256, getChunkBounds } from '@/workers/shared/hash-utils'

const ctx: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope

function postMessage(message: UploadPrepWorkerOutboundMessage, transferList?: Transferable[]) {
  if (transferList && transferList.length > 0) {
    ctx.postMessage(message, transferList)
    return
  }

  ctx.postMessage(message)
}

function postError(taskId: string, error: unknown, requestId?: string, code?: WorkerErrorMessage['code']) {
  postMessage({
    type: 'error',
    taskId,
    requestId,
    error: error instanceof Error ? error.message : String(error),
    code,
  })
}

ctx.onmessage = async (event: MessageEvent<UploadPrepWorkerInboundMessage>) => {
  const message = event.data

  try {
    switch (message.type) {
      case 'prepare-upload-chunk': {
        const bounds = getChunkBounds(message.file.size, message.chunkIndex, message.chunkSize)
        const chunkBlob = message.file.slice(bounds.start, bounds.end)
        const chunkBuffer = await chunkBlob.arrayBuffer()
        const chunkHash = await digestArrayBufferSHA256(chunkBuffer)

        postMessage({
          type: 'prepared-upload-chunk',
          taskId: message.taskId,
          requestId: message.requestId,
          chunkIndex: message.chunkIndex,
          start: bounds.start,
          end: bounds.end,
          size: bounds.size,
          fileName: message.file.name,
          fileType: message.file.type,
          chunkHash,
          chunkBuffer,
        }, [chunkBuffer])
        return
      }

      case 'read-chunk-buffer': {
        const bounds = getChunkBounds(message.file.size, message.chunkIndex, message.chunkSize)
        const chunkBlob = message.file.slice(bounds.start, bounds.end)
        const chunkBuffer = await chunkBlob.arrayBuffer()

        postMessage({
          type: 'chunk-buffer-read',
          taskId: message.taskId,
          requestId: message.requestId,
          chunkIndex: message.chunkIndex,
          start: bounds.start,
          end: bounds.end,
          size: bounds.size,
          chunkBuffer,
        }, [chunkBuffer])
        return
      }
    }
  }
  catch (error) {
    postError(message.taskId, error, message.requestId, 'INVALID_DATA')
  }
}

export {}
