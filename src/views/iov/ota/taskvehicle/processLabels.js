/**
 * 车辆升级过程展示字典与格式化（IOV-OTA-DSN-CR-026 §8）。
 *
 * 只做展示层映射：未知值原样/占位显示，不把 NULL 当 0、不把 0 当已知时间，
 * 也不补造后端未返回的事实。
 */

export const RETRY_ACTION_OPTIONS = [
  { value: 'RETRY', label: '业务重试' },
  { value: 'RESUME', label: '断点续传' },
  { value: 'RESET_OFFSET', label: '重置偏移' },
  { value: 'EXECUTION_CREATED', label: '执行创建' }
]

export const LOG_UPLOAD_STATE_OPTIONS = ['AUTHORIZED', 'UPLOADED', 'FAILED', 'EXPIRED']

export const DOWNLOAD_STATE_OPTIONS = [
  'STARTED', 'PROGRESS', 'PAUSED', 'RESUMED', 'RESET_OFFSET', 'FAILED', 'COMPLETED'
]

const DOWNLOAD_STATE_LABELS = {
  STARTED: '已开始',
  PROGRESS: '下载中',
  PAUSED: '已暂停',
  RESUMED: '已续传',
  RESET_OFFSET: '重置偏移',
  FAILED: '失败',
  COMPLETED: '字节完成'
}

const DOWNLOAD_STATE_TYPES = {
  STARTED: 'info',
  PROGRESS: '',
  PAUSED: 'warning',
  RESUMED: 'info',
  RESET_OFFSET: 'warning',
  FAILED: 'danger',
  COMPLETED: 'success'
}

const RETRY_ACTION_LABELS = {
  RETRY: '业务重试',
  RESUME: '断点续传',
  RESET_OFFSET: '重置偏移',
  EXECUTION_CREATED: '执行创建'
}

const LOG_UPLOAD_STATE_LABELS = {
  AUTHORIZED: '已授权',
  UPLOADED: '核验通过',
  FAILED: '失败',
  EXPIRED: '已过期'
}

const LOG_UPLOAD_STATE_TYPES = {
  AUTHORIZED: 'info',
  UPLOADED: 'success',
  FAILED: 'danger',
  EXPIRED: 'warning'
}

/** 下载状态文案（未知值原样返回，空值占位） */
export function downloadStateLabel(state) {
  return DOWNLOAD_STATE_LABELS[state] || state || '-'
}

/** 下载状态标签类型 */
export function downloadStateType(state) {
  return DOWNLOAD_STATE_TYPES[state] || 'info'
}

/** 重试动作文案 */
export function retryActionLabel(action) {
  return RETRY_ACTION_LABELS[action] || action || '-'
}

/** 日志登记状态文案（只表达登记事实，不代表可下载） */
export function logUploadStateLabel(state) {
  return LOG_UPLOAD_STATE_LABELS[state] || state || '-'
}

/** 日志登记状态标签类型 */
export function logUploadStateType(state) {
  return LOG_UPLOAD_STATE_TYPES[state] || 'info'
}

/**
 * 耗时：起止任一未知或负值显示“未知”（禁止 1970/负耗时展示）。
 */
export function formatDuration(durationMs) {
  if (durationMs === null || durationMs === undefined || durationMs < 0) {
    return '未知'
  }
  const totalSeconds = Math.floor(Number(durationMs) / 1000)
  if (!Number.isFinite(totalSeconds)) {
    return '未知'
  }
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return hours + 'h ' + minutes + 'm ' + seconds + 's'
  if (minutes > 0) return minutes + 'm ' + seconds + 's'
  return seconds + 's'
}

/**
 * 字节格式化：null/undefined/负数显示 '-'（未知不等于 0）。
 */
export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return '-'
  const value = Number(bytes)
  if (!Number.isFinite(value) || value < 0) return '-'
  if (value < 1024) return value + ' B'
  if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB'
  if (value < 1024 * 1024 * 1024) return (value / 1024 / 1024).toFixed(1) + ' MB'
  return (value / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

/** 摘要短展示：完整值由调用方放在 title，不省略事实 */
export function shortDigest(digest) {
  if (!digest) return '-'
  return digest.length <= 16 ? digest : digest.substring(0, 16) + '…'
}
