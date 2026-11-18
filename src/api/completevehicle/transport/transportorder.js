import request from '@/utils/request'

// 查询运输单列表
export function listTransportOrder(query) {
  return request({
    url: '/otd-tms/mpt/transportOrder/list',
    method: 'get',
    params: query
  })
}

// 查询运输单详情（含 VIN 明细）
export function getTransportOrder(orderNum) {
  return request({
    url: '/otd-tms/mpt/transportOrder/' + orderNum,
    method: 'get'
  })
}

// 查询运输单 VIN 明细（含 WMS 状态快照）
export function listTransportOrderDetail(orderNum) {
  return request({
    url: '/otd-tms/mpt/transportOrder/' + orderNum + '/detail',
    method: 'get'
  })
}

// 调度：承运商/线路/发车接车据点/车牌/司机 + 预计装车到达时间，成功后下发出库指令并回写订单 500
export function dispatchTransportOrder(data) {
  return request({
    url: '/otd-tms/mpt/transportOrder/action/dispatch',
    method: 'post',
    data: data
  })
}

// 确认发车（全部 VIN 已出库），回写订单 550
export function departTransportOrder(data) {
  return request({
    url: '/otd-tms/mpt/transportOrder/action/depart',
    method: 'post',
    data: data
  })
}

// 交车（全部交车时回写订单 600）
export function handoverTransportOrder(data) {
  return request({
    url: '/otd-tms/mpt/transportOrder/action/handover',
    method: 'post',
    data: data
  })
}

// 接车
export function receiptTransportOrder(data) {
  return request({
    url: '/otd-tms/mpt/transportOrder/action/receipt',
    method: 'post',
    data: data
  })
}

// 取消运单（仅未装车可取消）
export function cancelTransportOrder(data) {
  return request({
    url: '/otd-tms/mpt/transportOrder/action/cancel',
    method: 'post',
    data: data
  })
}

// 手工结束
export function manualCloseTransportOrder(data) {
  return request({
    url: '/otd-tms/mpt/transportOrder/action/manualClose',
    method: 'post',
    data: data
  })
}
