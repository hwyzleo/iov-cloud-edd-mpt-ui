/**
 * 仓储管理（OTD-WMS）状态字典与展示映射。
 *
 * 后端权威枚举：
 * - 预入库单：net.hwyz.iov.cloud.otd.wms.service.common.enums.PreInboundState
 * - 库存：net.hwyz.iov.cloud.otd.wms.service.common.enums.InventoryState（数值与库表一致）
 *
 * 说明：管理后台页面只做"枚举值 → 中文标签"的展示映射，不改变后端权威状态语义。
 */

/** 预入库单状态 → 中文标签 */
export const PRE_INBOUND_STATE_LABELS = {
  PENDING_ARRIVAL: '待到达',
  ARRIVED: '已到达',
  COMPLETED: '已入库',
  CANCELLED: '已取消'
}

/** 预入库单状态下拉选项（保持后端枚举顺序） */
export const PRE_INBOUND_STATE_OPTIONS = Object.keys(PRE_INBOUND_STATE_LABELS).map(value => ({
  value,
  label: PRE_INBOUND_STATE_LABELS[value]
}))

/**
 * 预入库单状态中文标签
 *
 * @param {string} state 权威状态枚举值
 * @returns {string} 中文标签；未知值原样返回，空值返回占位符
 */
export function preInboundStateLabel(state) {
  if (state === null || state === undefined || state === '') {
    return '-'
  }
  return PRE_INBOUND_STATE_LABELS[state] || state
}

/** 出库单状态 → 中文标签（与后端 OutboundOrderState 一致） */export const OUTBOUND_ORDER_STATE_LABELS = {
  RESERVED: '已预留',
  PARTIALLY_LOADED: '部分装车',
  LOADED: '已装车',
  PARTIALLY_OUTBOUND: '部分出库',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
}

/** 出库单状态下拉选项（保持后端枚举顺序） */
export const OUTBOUND_ORDER_STATE_OPTIONS = Object.keys(OUTBOUND_ORDER_STATE_LABELS).map(value => ({
  value,
  label: OUTBOUND_ORDER_STATE_LABELS[value]
}))

/**
 * 出库单状态中文标签
 *
 * @param {string} state 权威状态枚举值
 * @returns {string} 中文标签；未知值原样返回，空值返回占位符
 */
export function outboundOrderStateLabel(state) {
  if (state === null || state === undefined || state === '') {
    return '-'
  }
  return OUTBOUND_ORDER_STATE_LABELS[state] || state
}

/** 出库单明细状态 → 中文标签（与后端 OutboundDetailState 一致） */
export const OUTBOUND_DETAIL_STATE_LABELS = {
  RESERVED: '已预留',
  LOADED: '已装车',
  OUTBOUND: '已出库',
  RELEASED: '已释放'
}

/**
 * 出库单明细状态中文标签
 *
 * @param {string} state 权威明细状态枚举值
 * @returns {string} 中文标签；未知值原样返回，空值返回占位符
 */
export function outboundDetailStateLabel(state) {
  if (state === null || state === undefined || state === '') {
    return '-'
  }
  return OUTBOUND_DETAIL_STATE_LABELS[state] || state
}


/** 待入库任务状态 → 中文标签（与后端 InboundTaskState 一致） */
export const INBOUND_TASK_STATE_LABELS = {
  PENDING: '待到达',
  ARRIVED: '已到达',
  COMPLETED: '已入库',
  CANCELLED: '已取消'
}

/** 待入库任务状态下拉选项（保持后端枚举顺序） */
export const INBOUND_TASK_STATE_OPTIONS = Object.keys(INBOUND_TASK_STATE_LABELS).map(value => ({
  value,
  label: INBOUND_TASK_STATE_LABELS[value]
}))

/**
 * 待入库任务状态中文标签
 *
 * @param {string} state 权威状态枚举值
 * @returns {string} 中文标签；未知值原样返回，空值返回占位符
 */
export function inboundTaskStateLabel(state) {
  if (state === null || state === undefined || state === '') {
    return '-'
  }
  return INBOUND_TASK_STATE_LABELS[state] || state
}

/** 库存状态（数值）→ 中文标签 */
export const INVENTORY_STATE_LABELS = {
  1: '在库',
  2: '已出库',
  3: '已预留'
}

/** 库存状态下拉选项（数值与库表一致） */
export const INVENTORY_STATE_OPTIONS = Object.keys(INVENTORY_STATE_LABELS).map(value => ({
  value: Number(value),
  label: INVENTORY_STATE_LABELS[value]
}))

/**
 * 库存状态中文标签
 *
 * @param {number} state 库存状态数值
 * @param {string} [stateName] 后端返回的枚举名（AVAILABLE/OUTBOUND/RESERVED）
 * @returns {string} 中文标签；未知值回退枚举名，最后回退原始值
 */
export function inventoryStateLabel(state, stateName) {
  if (state === null || state === undefined || state === '') {
    return '-'
  }
  return INVENTORY_STATE_LABELS[state] || stateName || String(state)
}
