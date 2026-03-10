import type {
  ChannelQueryParams,
  ChannelServer,
  ChannelServerBinding,
  ChannelStatus,
  CreateChannelRequest,
  PageResponse,
  SaveChannelServersRequest,
  TransferChannel,
  UpdateChannelRequest,
} from '@/types'
import { request } from '@/utils'

export const channelManageApi = {
  getList: (params?: ChannelQueryParams) =>
    request.get<PageResponse<TransferChannel>>('/channel', { params }),

  create: (data: CreateChannelRequest) =>
    request.post<TransferChannel>('/channel', data),

  update: (id: string, data: UpdateChannelRequest) =>
    request.put<TransferChannel>(`/channel/${id}`, data),

  delete: (id: string) =>
    request.delete<void>(`/channel/${id}`),

  updateStatus: (id: string, status: ChannelStatus) =>
    request.put<TransferChannel>(`/channel/${id}/status`, { status }),

  getAvailableServers: () =>
    request.get<ChannelServer[]>('/channel/servers/available'),

  getChannelServers: (id: string) =>
    request.get<ChannelServerBinding[]>(`/channel/${id}/servers`),

  saveChannelServers: (id: string, data: SaveChannelServersRequest) =>
    request.put<ChannelServerBinding[]>(`/channel/${id}/servers`, data),
}
