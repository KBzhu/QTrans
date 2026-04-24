/// <reference lib="webworker" />

import { createSHA256 } from 'hash-wasm'
import type {
  HashWorkerInboundMessage,
  HashWorkerOutboundMessage,
  WorkerErrorMessage,
} from '@/types/worker-messages'
import { digestArrayBufferSHA256 } from '@/workers/shared/hash-utils'

interface StreamHashTask {
  hasher: Awaited<ReturnType<typeof createSHA256>>
  totalSize: number
  processedBytes: number
}

const ctx: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope
const streamTasks = new Map<string, StreamHashTask>()
const wasmReady = createSHA256().then(() => undefined)

function postMessage(message: HashWorkerOutboundMessage, transferList?: Transferable[]) {
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

ctx.onmessage = async (event: MessageEvent<HashWorkerInboundMessage>) => {
  const message = event.data

  try {
    switch (message.type) {
      case 'init-stream': {
        await wasmReady
        const hasher = await createSHA256()
        streamTasks.set(message.taskId, {
          hasher,
          totalSize: message.totalSize,
          processedBytes: 0,
        })
        postMessage({
          type: 'task-ready',
          taskId: message.taskId,
          requestId: message.requestId,
        })
        return
      }

      case 'update-chunk': {
        const streamTask = streamTasks.get(message.taskId)
        if (!streamTask) {
          postError(message.taskId, '未找到流式哈希任务', message.requestId, 'TASK_NOT_FOUND')
          return
        }

        streamTask.hasher.update(new Uint8Array(message.chunkData))
        streamTask.processedBytes += message.chunkData.byteLength
        const percent = streamTask.totalSize > 0
          ? Math.min(Math.round((streamTask.processedBytes / streamTask.totalSize) * 100), 100)
          : 0

        postMessage({
          type: 'progress',
          taskId: message.taskId,
          processedBytes: streamTask.processedBytes,
          totalBytes: streamTask.totalSize,
          percent,
        })
        postMessage({
          type: 'stream-updated',
          taskId: message.taskId,
          requestId: message.requestId,
          processedBytes: streamTask.processedBytes,
          totalBytes: streamTask.totalSize,
          percent,
        })
        return
      }

      case 'digest': {
        const streamTask = streamTasks.get(message.taskId)
        if (!streamTask) {
          postError(message.taskId, '未找到流式哈希任务', message.requestId, 'TASK_NOT_FOUND')
          return
        }

        const hash = streamTask.hasher.digest()
        streamTasks.delete(message.taskId)
        postMessage({
          type: 'hash-done',
          taskId: message.taskId,
          requestId: message.requestId,
          hash,
        })
        return
      }

      case 'hash-file-directly': {
        await wasmReady
        const hasher = await createSHA256()
        hasher.update(new Uint8Array(message.fileData))
        postMessage({
          type: 'hash-done',
          taskId: message.taskId,
          requestId: message.requestId,
          hash: hasher.digest(),
        })
        return
      }

      case 'hash-batch-chunks': {
        const hashes = await Promise.all(
          message.chunks.map(async chunk => ({
            index: chunk.index,
            hash: await digestArrayBufferSHA256(chunk.data),
          })),
        )

        postMessage({
          type: 'chunk-hashes-done',
          taskId: message.taskId,
          requestId: message.requestId,
          hashes,
        })
        return
      }

      case 'dispose-task': {
        streamTasks.delete(message.taskId)
        postMessage({
          type: 'task-disposed',
          taskId: message.taskId,
          requestId: message.requestId,
        })
        return
      }
    }
  }
  catch (error) {
    postError(message.taskId, error, message.requestId, 'INVALID_DATA')
  }
}

export {}
