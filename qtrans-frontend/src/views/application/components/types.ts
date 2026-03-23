import type { ApplicationFormData } from '@/composables/useApplicationForm'

export interface StepOneBasicInfoProps {
  formData: ApplicationFormData
  formRules: Record<string, any[]>
  transferTypeLabel: string
  showCustomerDataFields: boolean
  draftApplicationNo: string
  submittedApplication: any
  readonly?: boolean
}

export interface StepOneBasicInfoEmits {
  (e: 'update:formData', value: ApplicationFormData): void
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
