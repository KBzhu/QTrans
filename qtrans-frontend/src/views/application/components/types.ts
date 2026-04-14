export interface StepOneBasicInfoProps {
  formRules: Record<string, any[]>
  transferTypeLabel: string
  showCustomerDataFields: boolean
  submittedApplication: any
  readonly?: boolean
}

export interface StepOneBasicInfoEmits {
  (e: 'copyTemplate', text: string): void
}


export interface ApprovalRouteConfig {
  showDirectSupervisor: boolean
  showApproverLevel2: boolean
  showApproverLevel3: boolean
  showApproverLevel4: boolean
}

export interface CitySelectionState {
  uploadCityOptions: import('@/api/application').CityItem[]
  downloadCityOptions: import('@/api/application').CityItem[]
  uploadCityLoading: boolean
  downloadCityLoading: boolean
  selectedUploadRegionId: number
}
