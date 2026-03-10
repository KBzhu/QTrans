export type DomainStatus = 'enabled' | 'disabled'

export interface SecurityDomain {
  id: string
  name: string
  code: string
  color: string
  description: string
  status: DomainStatus
  createdAt: string
}

export interface CityDomainMapping {
  id: string
  cityName: string
  country: string
  domainCode: string
  domainName: string
  domainColor: string
  status: DomainStatus
  createdAt: string
}

export interface CreateSecurityDomainRequest {
  name: string
  code: string
  color: string
  description: string
  status: DomainStatus
}

export type UpdateSecurityDomainRequest = Partial<CreateSecurityDomainRequest>

export interface CreateCityMappingRequest {
  cityName: string
  country: string
  domainCode: string
}

export type UpdateCityMappingRequest = Partial<CreateCityMappingRequest>

export interface CityMappingQueryParams {
  keyword?: string
  domainCode?: string
  status?: DomainStatus | ''
  pageNum?: number
  pageSize?: number
}

export interface DomainQueryParams {
  keyword?: string
  status?: DomainStatus | ''
  pageNum?: number
  pageSize?: number
}
