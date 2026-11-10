import request from '@/utils/request'

// OTD-VSO 管理后台订单域（MPT）基地址（原 /api/mpt/order/v1 已废弃）
const BASE = '/otd-vso/api/mpt/vso/v1'

// 分页查询车辆销售订单（beginTime/endTime 由 addDateRange 传入，后端按“下单时间”过滤）
export function listOrder(query) {
  return request({
    url: BASE + '/list',
    method: 'get',
    params: query
  })
}

// 车辆销售订单详情
// 注意：路径参数为业务 orderId（vso_order.order_id），不是数据库主键 id
export function getOrder(orderId) {
  return request({
    url: BASE + '/' + orderId,
    method: 'get'
  })
}

// 物理删除订单及其关联数据（按业务 orderId）
export function physicalDeleteOrder(orderId, data) {
  return request({
    url: BASE + '/physical/' + orderId,
    method: 'delete',
    data: data || {}
  })
}

// 审核通过：操作人由后端从登录上下文获取，前端不再传 X-Operator-Id
export function auditPass(orderId) {
  return request({
    url: BASE + '/' + orderId + '/audit/pass',
    method: 'post'
  })
}

// 审核驳回：rejectCategory 与 rejectReason 均为必填 query 参数
export function auditReject(orderId, rejectCategory, rejectReason) {
  return request({
    url: BASE + '/' + orderId + '/audit/reject',
    method: 'post',
    params: {
      rejectCategory: rejectCategory,
      rejectReason: rejectReason
    }
  })
}

// 审核重提
export function resubmitAudit(orderId) {
  return request({
    url: BASE + '/' + orderId + '/audit/resubmit',
    method: 'post'
  })
}

// 锁单
export function lockOrder(orderId) {
  return request({
    url: BASE + '/' + orderId + '/lock',
    method: 'post'
  })
}

// 关闭订单
export function closeOrder(orderId, reason) {
  return request({
    url: BASE + '/' + orderId + '/close',
    method: 'post',
    params: {
      reason: reason
    }
  })
}
