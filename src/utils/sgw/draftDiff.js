/**
 * 待发布配置变更预览展示纯函数（EDD-SGW-DSN-CR-004）。
 *
 * 设计要点：
 * - 差异一律由 SGW 计算，MPT-UI 只做分组、计数与展示，不重新比较配置；
 * - 对象按 ROUTE、AUTH_POLICY、TRAFFIC_POLICY、CANARY_POLICY 固定顺序分组；
 * - `/rowVersion` 仅用于乐观锁，不作为业务变更展示（后端契约保留该字段）。
 */

export const DIFF_GROUPS = [
  { objectType: 'ROUTE', label: '路由' },
  { objectType: 'AUTH_POLICY', label: '认证授权策略' },
  { objectType: 'TRAFFIC_POLICY', label: '流量治理策略' },
  { objectType: 'CANARY_POLICY', label: '灰度策略' }
]

export const DIFF_CHANGE_TYPES = {
  ADDED: '新增',
  MODIFIED: '修改',
  REMOVED: '删除'
}

// 乐观锁版本号变化不作为业务变更展示
export const HIDDEN_FIELD_PATHS = ['/rowVersion']

export const EMPTY_DIFF_TEXT = '当前没有待发布变更'

export function safeArray(value) {
  return Array.isArray(value) ? value : []
}

export function isHiddenFieldPath(path) {
  return HIDDEN_FIELD_PATHS.indexOf(path) >= 0
}

// 仅保留业务可见字段差异（过滤 rowVersion）
export function visibleFieldDiffs(fields) {
  return safeArray(fields).filter(field => field && !isHiddenFieldPath(field.path))
}

export function fieldDiffCount(item) {
  if (!item || item.changeType !== 'MODIFIED') {
    return 0
  }
  return visibleFieldDiffs(item.fields).length
}

export function changeTypeLabel(changeType) {
  return DIFF_CHANGE_TYPES[changeType] || changeType
}

export function changeTagType(changeType) {
  if (changeType === 'ADDED') {
    return 'success'
  }
  if (changeType === 'REMOVED') {
    return 'danger'
  }
  return 'warning'
}

// 变更数量统计：按变化类型计数
export function summarizeChanges(items) {
  const summary = { ADDED: 0, MODIFIED: 0, REMOVED: 0, total: 0 }
  safeArray(items).forEach(item => {
    if (!item) {
      return
    }
    if (summary[item.changeType] !== undefined) {
      summary[item.changeType] += 1
    }
    summary.total += 1
  })
  return summary
}

// 按四类对象固定顺序分组，空分组保留以便页面展示
export function groupDiffItems(items) {
  const source = safeArray(items)
  return DIFF_GROUPS.map(group => {
    const groupItems = source.filter(item => item && item.objectType === group.objectType)
    return {
      objectType: group.objectType,
      label: group.label,
      items: groupItems,
      summary: summarizeChanges(groupItems)
    }
  })
}

export function isDiffEmpty(items) {
  return safeArray(items).length === 0
}

export function baseVersionLabel(baseVersionNo) {
  if (baseVersionNo === null || baseVersionNo === undefined || baseVersionNo === '') {
    return '尚未发布'
  }
  return 'v' + baseVersionNo
}

// 字段前后值展示：标量原样展示，对象/数组使用紧凑 JSON，缺失显示（无）
export function formatDiffValue(value) {
  if (value === null || value === undefined) {
    return '（无）'
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return JSON.stringify(value)
}

// 新增/删除对象内容展示：格式化为可读 JSON
export function formatDiffContent(value) {
  if (value === null || value === undefined) {
    return ''
  }
  return JSON.stringify(value, null, 2)
}

// 修改项展开内容取用：仅保留业务字段，若全部字段都被隐藏则提示仅版本号变化
export function modifiedHint(item) {
  if (!item || item.changeType !== 'MODIFIED') {
    return ''
  }
  return fieldDiffCount(item) === 0 ? '仅记录版本号变化' : ''
}

// 发布冲突错误判断：沿用现有 SGW-409001 语义
export function isDraftConflict(error) {
  const data = error && error.response && error.response.data
  return !!data && data.code === 'SGW-409001'
}
