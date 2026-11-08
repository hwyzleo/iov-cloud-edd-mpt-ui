/**
 * 升级车辆详情 / 关联查询展示字典（IOV-OTA-DSN-CR-023 §8）
 *
 * 后端关联查询返回 ActivityState / TaskPhase / TaskState / VehicleTaskStatus 枚举名，
 * 前端统一映射为中文文案与标签样式，避免各页面重复硬编码。
 */
export const ACTIVITY_STATE_MAP = {
  PENDING: { label: '待提交', type: 'info' },
  SUBMITTED: { label: '待审核', type: 'warning' },
  APPROVED: { label: '已审核', type: 'success' },
  REJECTED: { label: '未通过', type: 'danger' },
  RELEASED: { label: '已发布', type: 'success' },
  FINISHED: { label: '已结束', type: 'info' },
  CANCELLED: { label: '已取消', type: 'info' }
}

export const TASK_PHASE_MAP = {
  VALIDATION: '验证阶段',
  CANARY: '灰度阶段',
  RELEASE: '发布阶段'
}

export const TASK_STATE_MAP = {
  DRAFT: '草稿',
  PENDING_APPROVAL: '待审批',
  APPROVED: '已审批',
  REJECTED: '已驳回',
  SCHEDULED: '已排程',
  RELEASED: '已发布',
  PAUSED: '已暂停',
  COMPLETED: '已完成',
  CANCELED: '已取消',
  SUPERSEDED: '已取代',
  IN_PROGRESS: '执行中'
}

export const VEHICLE_TASK_STATUS_MAP = {
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

/** 任务状态筛选项（与 TaskState.value 对应，供详情页下拉） */
export const TASK_STATE_OPTIONS = [
  { value: 1, label: '草稿' },
  { value: 2, label: '待审批' },
  { value: 3, label: '已审批' },
  { value: 4, label: '已驳回' },
  { value: 5, label: '已排程' },
  { value: 6, label: '已发布' },
  { value: 7, label: '已暂停' },
  { value: 8, label: '已完成' },
  { value: 9, label: '已取消' },
  { value: 10, label: '已取代' },
  { value: 11, label: '执行中' }
]

/** VehicleTask 状态筛选项（与 VehicleTaskStatus.name() 对应） */
export const VEHICLE_TASK_STATUS_OPTIONS = Object.keys(VEHICLE_TASK_STATUS_MAP)
  .map(value => ({ value, label: VEHICLE_TASK_STATUS_MAP[value] }))

export function activityStateLabel(state) {
  return (ACTIVITY_STATE_MAP[state] || {}).label || state || '--'
}

export function activityStateType(state) {
  return (ACTIVITY_STATE_MAP[state] || {}).type || 'info'
}

export function taskPhaseLabel(phase) {
  return TASK_PHASE_MAP[phase] || phase || '--'
}

export function taskStateLabel(state) {
  return TASK_STATE_MAP[state] || state || '--'
}

export function vehicleTaskStatusLabel(status) {
  return VEHICLE_TASK_STATUS_MAP[status] || status || '--'
}

export function partStatusLabel(association) {
  if (!association || !association.status) return '未关联'
  if (association.status === 'MATCHED') return '已匹配'
  if (association.status === 'AMBIGUOUS') return '多候选'
  return '未找到'
}

export function partStatusType(association) {
  if (!association || !association.status) return 'info'
  if (association.status === 'MATCHED') return 'success'
  if (association.status === 'AMBIGUOUS') return 'warning'
  return 'info'
}

export function partConfigWord(configWord) {
  return configWord === null || configWord === undefined || configWord === '' ? '--' : configWord
}
