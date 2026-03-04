import type { ApiResponse } from '@/types'
import { HttpResponse, delay } from 'msw'

export async function mockDelay(ms = 200) {
  await delay(ms)
}

export function success<T>(data: T, message = 'success'): HttpResponse<ApiResponse<T>> {
  return HttpResponse.json({
    code: 200,
    message,
    data,
    timestamp: Date.now(),
  })
}

export function failed(message: string, code = 400) {
  return HttpResponse.json(
    {
      code,
      message,
      data: null,
      timestamp: Date.now(),
    },
    { status: 200 },
  )
}

export function getPagination(url: URL) {
  const pageNum = Number(url.searchParams.get('pageNum') || 1)
  const pageSize = Number(url.searchParams.get('pageSize') || 10)
  const safePageNum = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10

  return {
    pageNum: safePageNum,
    pageSize: safePageSize,
    toPage<T>(list: T[]) {
      const total = list.length
      const totalPages = Math.max(1, Math.ceil(total / safePageSize))
      const start = (safePageNum - 1) * safePageSize
      const end = start + safePageSize
      return {
        list: list.slice(start, end),
        total,
        pageNum: safePageNum,
        pageSize: safePageSize,
        totalPages,
      }
    },
  }
}
