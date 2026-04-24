export type ErrorCode = 'WASM_INIT_FAILED' | 'INVALID_DATA' | 'TASK_NOT_FOUND' | 'UNSUPPORTED'

export interface WorkerMessageBase {
  taskId: string
  requestId: string
}

export interface HashChunkData {
  index: number
  data: ArrayBuffer
}

export interface HashWorkerProgressMessage {
  type: 'progress'
  taskId: string
  processedBytes: number
  totalBytes: number
  percent: number
}

export interface HashWorkerReadyMessage extends WorkerMessageBase {
  type: 'task-ready'
}

export interface HashWorkerChunkUpdatedMessage extends WorkerMessageBase {
  type: 'stream-updated'
  processedBytes: number
  totalBytes: number
  percent: number
}

export interface HashWorkerHashDoneMessage extends WorkerMessageBase {
  type: 'hash-done'
  hash: string
}

export interface HashWorkerChunkHashesDoneMessage extends WorkerMessageBase {
  type: 'chunk-hashes-done'
  hashes: Array<{ index: number; hash: string }>
}

export interface HashWorkerDisposedMessage extends WorkerMessageBase {
  type: 'task-disposed'
}

export interface WorkerErrorMessage {
  type: 'error'
  taskId: string
  requestId?: string
  error: string
  code?: ErrorCode
}

export type HashWorkerOutboundMessage =
  | HashWorkerProgressMessage
  | HashWorkerReadyMessage
  | HashWorkerChunkUpdatedMessage
  | HashWorkerHashDoneMessage
  | HashWorkerChunkHashesDoneMessage
  | HashWorkerDisposedMessage
  | WorkerErrorMessage

export interface HashWorkerInitStreamMessage extends WorkerMessageBase {
  type: 'init-stream'
  totalSize: number
}

export interface HashWorkerUpdateChunkMessage extends WorkerMessageBase {
  type: 'update-chunk'
  chunkData: ArrayBuffer
  chunkIndex: number
}

export interface HashWorkerDigestMessage extends WorkerMessageBase {
  type: 'digest'
}

export interface HashWorkerHashFileMessage extends WorkerMessageBase {
  type: 'hash-file-directly'
  fileData: ArrayBuffer
  totalSize: number
}

export interface HashWorkerHashBatchChunksMessage extends WorkerMessageBase {
  type: 'hash-batch-chunks'
  chunks: HashChunkData[]
}

export interface HashWorkerDisposeMessage extends WorkerMessageBase {
  type: 'dispose-task'
}

export type HashWorkerInboundMessage =
  | HashWorkerInitStreamMessage
  | HashWorkerUpdateChunkMessage
  | HashWorkerDigestMessage
  | HashWorkerHashFileMessage
  | HashWorkerHashBatchChunksMessage
  | HashWorkerDisposeMessage

export interface PreparedUploadChunkPayload extends WorkerMessageBase {
  type: 'prepared-upload-chunk'
  chunkIndex: number
  start: number
  end: number
  size: number
  fileName: string
  fileType: string
  chunkHash: string
  chunkBuffer: ArrayBuffer
}

export interface ReadChunkBufferPayload extends WorkerMessageBase {
  type: 'chunk-buffer-read'
  chunkIndex: number
  start: number
  end: number
  size: number
  chunkBuffer: ArrayBuffer
}

export type UploadPrepWorkerOutboundMessage =
  | PreparedUploadChunkPayload
  | ReadChunkBufferPayload
  | WorkerErrorMessage

export interface UploadPrepWorkerPrepareChunkMessage extends WorkerMessageBase {
  type: 'prepare-upload-chunk'
  file: File
  chunkIndex: number
  chunkSize: number
}

export interface UploadPrepWorkerReadChunkBufferMessage extends WorkerMessageBase {
  type: 'read-chunk-buffer'
  file: File
  chunkIndex: number
  chunkSize: number
}

export type UploadPrepWorkerInboundMessage =
  | UploadPrepWorkerPrepareChunkMessage
  | UploadPrepWorkerReadChunkBufferMessage
