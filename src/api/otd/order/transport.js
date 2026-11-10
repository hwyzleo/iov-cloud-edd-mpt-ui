import request from '@/utils/request'

// OTD-VSO 管理后台订单域（MPT）基地址（原 /api/mpt/order/v1 已废弃）
const BASE = '/otd-vso/api/mpt/vso/v1'

// 查询运输相关订单列表（ALLOCATION_VEHICLE / APPLY_TRANSPORT / PREPARE_TRANSPORT）
export function listTransportOrder(query) {
  return request({
    url: BASE + '/listTransport',
    method: 'get',
    params: query
  })
}

// 申请发运：后端强校验订单为 ALLOCATION_VEHICLE，操作人取自登录上下文，无需前端传
export function applyTransport(orderNo) {
  return request({
    url: BASE + '/action/applyTransport',
    method: 'post',
    data: {
      orderNo: orderNo
    }
  })
}
