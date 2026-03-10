import type {
  CityDomainMapping,
  CityMappingQueryParams,
  CreateCityMappingRequest,
  CreateSecurityDomainRequest,
  DomainQueryParams,
  DomainStatus,
  PageResponse,
  SecurityDomain,
  UpdateCityMappingRequest,
  UpdateSecurityDomainRequest,
} from '@/types'
import { request } from '@/utils'

export const regionManageApi = {
  // 城市映射 CRUD
  getCityList: (params?: CityMappingQueryParams) =>
    request.get<PageResponse<CityDomainMapping>>('/region/cities', { params }),

  createCity: (data: CreateCityMappingRequest) =>
    request.post<CityDomainMapping>('/region/cities', data),

  updateCity: (id: string, data: UpdateCityMappingRequest) =>
    request.put<CityDomainMapping>(`/region/cities/${id}`, data),

  deleteCity: (id: string) =>
    request.delete<void>(`/region/cities/${id}`),

  // 安全域 CRUD
  getDomainList: (params?: DomainQueryParams) =>
    request.get<PageResponse<SecurityDomain>>('/region/domains', { params }),

  createDomain: (data: CreateSecurityDomainRequest) =>
    request.post<SecurityDomain>('/region/domains', data),

  updateDomain: (id: string, data: UpdateSecurityDomainRequest) =>
    request.put<SecurityDomain>(`/region/domains/${id}`, data),

  deleteDomain: (id: string) =>
    request.delete<void>(`/region/domains/${id}`),

  toggleDomainStatus: (id: string, status: DomainStatus) =>
    request.patch<SecurityDomain>(`/region/domains/${id}/status`, { status }),

  // 获取所有可用安全域（不分页，用于下拉选择）
  getAllDomains: () =>
    request.get<SecurityDomain[]>('/region/domains/all'),
}
