import dayjs from 'dayjs'

export function formatFileSize(bytes: number): string {
  if (bytes <= 0)
    return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  const fixed = size >= 10 || unitIndex === 0 ? 0 : 1
  const output = size.toFixed(fixed).replace(/\.0$/, '')
  return `${output} ${units[unitIndex]}`
}

export function formatDateTime(time: string | number): string {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0)
    return '0秒'

  const hour = Math.floor(seconds / 3600)
  const minute = Math.floor((seconds % 3600) / 60)
  const second = Math.floor(seconds % 60)

  if (hour > 0)
    return `${hour}小时${minute}分钟${second}秒`

  if (minute > 0)
    return `${minute}分钟${second}秒`

  return `${second}秒`
}

export function formatTransferSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0)
    return '0 B/s'

  return `${formatFileSize(bytesPerSec)}/s`
}
