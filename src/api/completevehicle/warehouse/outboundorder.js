import request from '@/utils/request'

// 查询出库单列表
export function listOutboundOrder(query) {
  return request({
    url: '/otd-wms/mpt/outboundOrder/list',
    method: 'get',
    params: query
  })
}

// 查询出库单详细
export function getOutboundOrder(outboundOrderId) {
  return request({
    url: '/otd-wms/mpt/outboundOrder/' + outboundOrderId,
    method: 'get'
  })
}

// 查询出库单 VIN 明细
export function listOutboundOrderDetail(outboundOrderId) {
  return request({
    url: '/otd-wms/mpt/outboundOrder/' + outboundOrderId + '/detail',
    method: 'get'
  })
}

// 按 VIN 确认装车（明细 RESERVED → LOADED，库存保持 RESERVED 并占用储位）
export function loadingOutboundVin(orderNum, vin, data) {
  return request({
    url: '/otd-wms/mpt/outboundOrder/' + orderNum + '/vins/' + vin + '/loading',
    method: 'post',
    data: data
  })
}

// 按 VIN 确认出库（明细 LOADED → OUTBOUND，库存改 OUTBOUND 并释放储位）
export function outboundOutboundVin(orderNum, vin, data) {
  return request({
    url: '/otd-wms/mpt/outboundOrder/' + orderNum + '/vins/' + vin + '/outbound',
    method: 'post',
    data: data
  })
}

// 取消出库单（仅装车前可用，取消后全部预留车辆释放为在库）
export function cancelOutboundOrder(orderNum, data) {
  return request({
    url: '/otd-wms/mpt/outboundOrder/' + orderNum + '/cancellation',
    method: 'post',
    data: data
  })
}

// 说明：出库单由外部请求方（如 TMS 调度）通过 Kafka 通用命令原子预留生成，
// 服务端不提供通用新增／修改／删除，也不提供导出实现。
