// 服务网关管理端共用枚举与展示辅助（EDD-SGW-DSN-CR-001）

export const CLIENT_TYPES = [
  { value: 'MOBILE', label: 'MOBILE' },
  { value: 'IDCM', label: 'IDCM' },
  { value: 'ADCM', label: 'ADCM' },
  { value: 'TBOX', label: 'TBOX' },
  { value: 'CCP', label: 'CCP' },
  { value: 'MPT', label: 'MPT' }
]

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

export const MATCH_TYPES = [
  { value: 'EXACT', label: '精确匹配' },
  { value: 'REGEX', label: '正则匹配' }
]

export const TARGET_TYPES = [
  { value: 'SERVICE', label: '服务发现' },
  { value: 'HTTP', label: 'HTTP 直连' },
  { value: 'HTTPS', label: 'HTTPS 直连' }
]

export const ACCESS_MODES = [
  { value: 'AUTHENTICATED', label: '需要认证' },
  { value: 'ANONYMOUS', label: '匿名访问' }
]

export const RATE_DIMENSIONS = [
  { value: 'ROUTE', label: '按路由' },
  { value: 'CLIENT_TYPE', label: '按客户端类型' },
  { value: 'CLIENT_ID', label: '按客户端ID' },
  { value: 'AUTHENTICATED_SUBJECT', label: '按认证主体' },
  { value: 'VEHICLE_ID', label: '按车辆标识' },
  { value: 'SOURCE_IP', label: '按来源IP' }
]

export const FAILURE_MODES = [
  { value: 'FAIL_CLOSED', label: 'FAIL_CLOSED（拒绝）' },
  { value: 'FAIL_OPEN', label: 'FAIL_OPEN（放行）' }
]

export const STABLE_KEYS = [
  { value: 'VEHICLE_ID', label: '车辆标识' },
  { value: 'AUTHENTICATED_SUBJECT', label: '认证主体' },
  { value: 'DEVICE_ID', label: '设备标识' },
  { value: 'CLIENT_ID', label: '客户端ID' },
  { value: 'SOURCE_IP', label: '来源IP' }
]

export const PUBLICATION_TYPES = {
  PUBLISH: '发布',
  ROLLBACK: '回滚',
  RETRY: '重试'
}

export const PUBLICATION_STATUS = {
  VALIDATING: '校验中',
  DISPATCHING: '分发中',
  WAITING_ACK: '等待实例确认',
  SUCCEEDED: '成功',
  PARTIAL_FAILED: '部分失败',
  FAILED: '失败'
}

export const INSTANCE_STATUS = {
  PENDING: '待确认',
  SUCCEEDED: '成功',
  FAILED: '失败',
  TIMEOUT: '超时'
}

export const CONFIG_OPERATIONS = {
  PUBLISH: '发布',
  ROLLBACK: '回滚'
}

export const CHANGE_TYPES = {
  ADDED: '新增',
  MODIFIED: '修改',
  REMOVED: '删除'
}

export const OBJECT_TYPES = {
  ROUTE: '路由',
  AUTH_POLICY: '认证授权策略',
  TRAFFIC_POLICY: '流量治理策略',
  CANARY_POLICY: '灰度策略'
}

export const POLICY_TYPE_LABELS = {
  auth: '认证授权策略',
  traffic: '流量治理策略',
  canary: '灰度策略'
}

export function labelOf(options, value) {
  const item = options.find(option => option.value === value)
  return item ? item.label : value
}

export function statusTagType(status) {
  if (status === 'SUCCEEDED') {
    return 'success'
  }
  if (status === 'PARTIAL_FAILED') {
    return 'warning'
  }
  if (status === 'FAILED') {
    return 'danger'
  }
  if (status === 'WAITING_ACK' || status === 'DISPATCHING' || status === 'VALIDATING') {
    return 'primary'
  }
  return 'info'
}

export function publicationStatusLabel(status) {
  return PUBLICATION_STATUS[status] || status
}

export function isActiveStatus(status) {
  return status === 'WAITING_ACK' || status === 'DISPATCHING' || status === 'VALIDATING'
}

export function isRetryableStatus(status) {
  return status === 'FAILED' || status === 'PARTIAL_FAILED'
}

export function safeArray(value) {
  return Array.isArray(value) ? value : []
}

export function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }
  const number = Number(value)
  return Number.isNaN(number) ? null : number
}
