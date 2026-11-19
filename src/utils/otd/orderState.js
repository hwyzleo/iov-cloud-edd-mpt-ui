/**
 * VSO 订单状态前端兜底映射
 *
 * 说明：订单状态优先使用 EDD 字典 iov_vehicle_sale_order_state；
 * 字典缺少新增状态（如 CR-014 引入的 620/630/650）时，用本映射兜底，
 * 避免管理后台直接显示数字状态值。
 * 枚举来源：iov-cloud-otd-vso OrderState。
 */
export const ORDER_STATE_LABELS = {
  100: '心愿单',
  200: '意向金待付款',
  210: '意向金已付款',
  300: '定金待付款',
  310: '定金已付款',
  350: '待审核',
  360: '审核通过',
  370: '审核驳回',
  400: '已锁单，安排生产',
  450: '已分配车辆',
  470: '发运申请',
  500: '待运输',
  550: '运输中',
  600: '验收入库，待交付',
  620: '尾款已付款',
  630: '已开票',
  650: '已交付',
  800: '退车申请',
  820: '退车入库',
  840: '退车审核',
  860: '退车完成',
  900: '已完成',
  920: '退款申请',
  925: '退款完成',
  950: '已取消',
  960: '已失效',
  970: '已关闭'
}

/**
 * 解析订单状态文案：字典优先，缺失时回退本地枚举映射。
 *
 * @param {string|number} state 状态值
 * @param {Array} dictList EDD 字典项
 * @returns {string}
 */
export function orderStateLabel(state, dictList) {
  if (state === null || state === undefined || state === '') {
    return '-'
  }
  const key = String(state)
  const dictItem = (dictList || []).find(item => String(item.value) === key)
  if (dictItem && dictItem.label) {
    return dictItem.label
  }
  return ORDER_STATE_LABELS[key] || key
}

/**
 * 合并字典与本地兜底后的状态下拉选项，按状态值升序。
 *
 * @param {Array} dictList EDD 字典项
 * @returns {Array<{value: string|number, label: string}>}
 */
export function orderStateOptions(dictList) {
  const list = (dictList || []).map(item => ({ value: item.value, label: item.label }))
  const existing = new Set(list.map(item => String(item.value)))
  Object.keys(ORDER_STATE_LABELS)
    .filter(value => !existing.has(value))
    .forEach(value => list.push({ value: Number(value), label: ORDER_STATE_LABELS[value] }))
  return list.sort((a, b) => Number(a.value) - Number(b.value))
}
