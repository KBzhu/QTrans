import { http } from 'msw'
import { getDemoState } from '../data/demo-init'
import { mockDelay, success } from './_utils'

export const departmentHandlers = [
  http.get('/api/departments/tree', async () => {
    await mockDelay(150)
    const state = getDemoState()
    return success(state.departments)
  }),
]
