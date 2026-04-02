import { passthrough } from 'msw'
import { baseHttp as http } from './_utils'
import { applicationHandlers } from './application'
import { approvalHandlers } from './approval'
import { authHandlers } from './auth'
import { cityHandlers } from './city'
import { departmentHandlers } from './department'
import { fileHandlers } from './file'
import { notificationHandlers } from './notification'
import { userHandlers } from './user'
import { systemConfigHandlers } from './systemConfig'
import { auditLogHandlers } from './auditLog'
import { regionManageHandlers } from './regionManage'
import { channelManageHandlers } from './channelManage'
import { uiConfigHandlers } from './uiConfig'

// 真实后端接口透传配置（不被 MSW 拦截）
const passthroughHandlers = [
  // commonService 相关接口 - 透传到真实后端
  http.all('/commonService/*', () => passthrough()),
]

export const handlers = [
  ...passthroughHandlers,
  ...authHandlers,
  ...applicationHandlers,
  ...approvalHandlers,
  ...fileHandlers,
  ...userHandlers,
  ...departmentHandlers,
  ...cityHandlers,
  ...notificationHandlers,
  ...systemConfigHandlers,
  ...auditLogHandlers,
  ...regionManageHandlers,
  ...channelManageHandlers,
  ...uiConfigHandlers,
]

