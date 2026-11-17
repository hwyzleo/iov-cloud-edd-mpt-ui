import request from '@/utils/request'

// 查询入库单列表
export function listInboundOrder(query) {
  query.warehouseLevel = "PDC";
  return request({
    url: '/otd-wms/mpt/inboundOrder/list',
    method: 'get',
    params: query
  })
}

// 查询入库单详细
export function getInboundOrder(inboundOrderId) {
  return request({
    url: '/otd-wms/mpt/inboundOrder/' + inboundOrderId,
    method: 'get'
  })
}

// 说明：入库单是已完成的不可变事实，服务端不提供通用新增／修改／删除，
// 状态流转通过预入库单的到货确认、入库确认、取消动作完成。
