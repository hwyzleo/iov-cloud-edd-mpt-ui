const BINDING_STATUS_LABELS = {
  BOUND: '已绑定',
  UNBOUND: '未绑定'
}

const FIRST_ACTIVATION_LABELS = {
  RECORDED: '已激活',
  PENDING: '激活处理中',
  NOT_RECORDED: '未激活',
  UNKNOWN: '激活状态未知'
}

const IVI_LOGIN_LABELS = {
  SUCCEEDED: '登录成功',
  FAILED: '登录失败',
  PENDING: '登录待完成'
}

const REVOCATION_STATUS_LABELS = {
  SUCCEEDED: '撤销成功',
  PENDING: '撤销处理中',
  FAILED: '撤销失败'
}

export function bindingStatusLabel(status) {
  return BINDING_STATUS_LABELS[status] || status || '未知'
}

export function firstActivationLabel(state) {
  return FIRST_ACTIVATION_LABELS[state] || state || '未知'
}

export function iviLoginLabel(state) {
  return IVI_LOGIN_LABELS[state] || state || '暂无登录回执'
}

export function revocationStatusLabel(status) {
  return REVOCATION_STATUS_LABELS[status] || status || '未知'
}

// CR-015：详情字段已是生效展示时区的无偏移墙钟，只排版，不追加 Z、不 new Date、不再本地化。
export function formatUserVehicleTime(value) {
  return value ? String(value).replace('T', ' ') : '-'
}

// 幂等键仅用于请求去重，不作为认证或安全凭据；同一次表单重试保持不变。
export function createUnbindIdempotencyKey(now = Date.now, random = Math.random) {
  return 'mpt-unbind-' + now() + '-' + random().toString(36).slice(2, 12)
}
