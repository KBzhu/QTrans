export interface DepartmentNode {
  id: string
  name: string
  children?: DepartmentNode[]
}

export const departments: DepartmentNode[] = [
  {
    id: 'dept-rd',
    name: '研发部',
    children: [
      { id: 'dept-rd-platform', name: '平台研发组' },
      { id: 'dept-rd-business', name: '业务研发组' },
    ],
  },
  {
    id: 'dept-tech',
    name: '技术部',
    children: [
      { id: 'dept-tech-ops', name: '技术运营组' },
    ],
  },
  {
    id: 'dept-security',
    name: '安全部',
    children: [
      { id: 'dept-security-gov', name: '安全治理组' },
      { id: 'dept-security-audit', name: '安全审计组' },
    ],
  },
  {
    id: 'dept-management',
    name: '管理部',
    children: [
      { id: 'dept-management-pmo', name: 'PMO组' },
    ],
  },
  {
    id: 'dept-it',
    name: 'IT部',
  },
]
