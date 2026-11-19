import request from '@/utils/request'

// 查询待入库任务列表
export function listInboundTask(query) {
  return request({
    url: '/otd-wms/mpt/inboundTask/list',
    method: 'get',
    params: query
  })
}

// 查询待入库任务详细
export function getInboundTask(inboundTaskId) {
  return request({
    url: '/otd-wms/mpt/inboundTask/' + inboundTaskId,
    method: 'get'
  })
}

// 确认到货（PENDING → ARRIVED）
export function arrivalInboundTask(orderNum, data) {
  return request({
    url: '/otd-wms/mpt/inboundTask/' + orderNum + '/arrival',
    method: 'post',
    data: data
  })
}

// 确认入库（ARRIVED → COMPLETED，需储区/储位）
export function inboundInboundTask(orderNum, data) {
  return request({
    url: '/otd-wms/mpt/inboundTask/' + orderNum + '/inbound',
    method: 'post',
    data: data
  })
}

// 取消待入库任务（PENDING/ARRIVED → CANCELLED，库存回退已出库）
export function cancelInboundTask(orderNum, data) {
  return request({
    url: '/otd-wms/mpt/inboundTask/' + orderNum + '/cancellation',
    method: 'post',
    data: data
  })
}

// 说明：待入库任务由外部请求方（本期 TMS 确认交车）通过 Kafka 通用到货命令生成，
// 服务端不提供通用新增/修改/删除。
