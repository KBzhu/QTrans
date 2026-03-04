import { applicationHandlers } from './application'
import { approvalHandlers } from './approval'
import { authHandlers } from './auth'
import { cityHandlers } from './city'
import { departmentHandlers } from './department'
import { fileHandlers } from './file'
import { notificationHandlers } from './notification'
import { userHandlers } from './user'

export const handlers = [
  ...authHandlers,
  ...applicationHandlers,
  ...approvalHandlers,
  ...fileHandlers,
  ...userHandlers,
  ...departmentHandlers,
  ...cityHandlers,
  ...notificationHandlers,
]
