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

/** 执行状态文案（与 iov-ota-api ExecutionStatus 枚举一致） */
const EXECUTION_STATUS_LABELS = {
  PERMITTED: '已许可',
  INSTALLING: '安装中',
  PAUSED: '已暂停',
  ROLLING_BACK: '回滚中',
  SUCCEEDED: '已成功',
  FAILED: '已失败',
  ROLLED_BACK: '已回滚',
  CANCELED: '已取消',
  TIMED_OUT: '已超时'
}

const EXECUTION_STATUS_TYPES = {
  PERMITTED: 'warning',
  INSTALLING: '',
  PAUSED: 'warning',
  ROLLING_BACK: 'warning',
  SUCCEEDED: 'success',
  FAILED: 'danger',
  ROLLED_BACK: 'info',
  CANCELED: 'info',
  TIMED_OUT: 'danger'
}

/** 车辆任务/历史行状态文案（含重置后的 SUPERSEDED） */
const VEHICLE_TASK_STATUS_LABELS = {
  CREATED: '已创建',
  VISIBLE: '已可见',
  CONSENT_PENDING: '待授权',
  DOWNLOAD_PENDING: '待下载',
  READY_TO_INSTALL: '就绪可安装',
  EXECUTING: '执行中',
  RETRY_PENDING: '待重试',
  ROLLBACK_PENDING: '待回滚',
  SUCCEEDED: '已成功',
  ROLLED_BACK: '已回滚',
  PAUSED: '已暂停',
  CANCELED: '已取消',
  SUPERSEDED: '已取代'
}

/** 阶段文案（包阶段与安装事件共用） */
const STAGE_LABELS = {
  DOWNLOAD: '下载',
  VERIFY: '校验',
  DECRYPT: '解密',
  INSTALL: '安装',
  INSTALL_STARTED: '开始安装',
  REBOOT: '重启',
  POST_CHECK: '安装后校验',
  ROLLBACK: '回滚'
}

const RESULT_LABELS = { SUCCESS: '成功', FAILED: '失败', PENDING: '待定' }

export const STAGE_OPTIONS = ['DOWNLOAD', 'VERIFY', 'DECRYPT']

export function executionStatusLabel(status) {
  return EXECUTION_STATUS_LABELS[status] || status || '-'
}

export function executionStatusType(status) {
  return EXECUTION_STATUS_TYPES[status] || 'info'
}

export function vehicleStatusLabel(status) {
  return VEHICLE_TASK_STATUS_LABELS[status] || status || '-'
}

export function stageLabel(stage) {
  return STAGE_LABELS[stage] || stage || '-'
}

export function resultLabel(result) {
  return RESULT_LABELS[result] || result || '-'
}

export function resultType(result) {
  if (result === 'SUCCESS') return 'success'
  if (result === 'FAILED') return 'danger'
  return 'info'
}

/** 时间：有效值走 parseTime，缺失统一显示占位（不显示"未知"） */
export function timeOrDash(parseTimeFn, value) {
  if (value === null || value === undefined || value === '') return '-'
  const text = parseTimeFn(value)
  return text || '-'
}
