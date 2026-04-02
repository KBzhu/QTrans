import { setupWorker } from 'msw/browser'
import { initDemoData } from './data/demo-init'
import { handlers } from './handlers'

initDemoData()

export const worker = setupWorker(...handlers)
