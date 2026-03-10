export type ChannelStatus = 'enabled' | 'disabled'

export type EncryptionConfigType = 'data_encryption' | 'rms_encryption' | 'asset_detection'

export interface ChannelServer {
  id: string
  name: string
  ip: string
  port: number
  status: ChannelStatus
}

export interface ChannelServerBinding {
  serverId: string
  name: string
  ip: string
  port: number
  priority: number
  status: ChannelStatus
}

export interface TransferChannel {
  id: string
  name: string
  code: string
  encryptionConfigs: EncryptionConfigType[]
  description: string
  status: ChannelStatus
  serverCount: number
  createdAt: string
}

export interface ChannelQueryParams {
  keyword?: string
  status?: ChannelStatus | ''
  pageNum?: number
  pageSize?: number
}

export interface CreateChannelRequest {
  name: string
  code: string
  encryptionConfigs: EncryptionConfigType[]
  description: string
  status: ChannelStatus
}

export type UpdateChannelRequest = Partial<CreateChannelRequest>

export interface UpdateChannelStatusRequest {
  status: ChannelStatus
}

export interface SaveChannelServersRequest {
  servers: Array<{
    serverId: string
    port: number
    priority: number
    status: ChannelStatus
  }>
}
