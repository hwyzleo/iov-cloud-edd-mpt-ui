import request from '@/utils/request'

// MPT 订单详情域只读接口（OTD-VSO-DSN-CR-002 / US-011，设计 §5.4.2）
// 路径参数统一为业务 orderId（vso_order.order_id），不是数据库主键 id；
// 写操作（审核/锁单/关闭/配车/发运）仍按 orderNo，见 info.js / assignvehicle.js。
const BASE = '/otd-vso/api/mpt/vso/v1/'

// 订单详情
export function getOrderDetail(orderId) {
  return request({
    url: BASE + orderId,
    method: 'get'
  })
}

// 订单时间线（按事件时间正序，operatorId/operatorRole/operateSource 为操作来源）
export function listOrderTimeline(orderId) {
  return request({
    url: BASE + orderId + '/timeline',
    method: 'get'
  })
}

// 支付记录（含 paymentStage 支付阶段、expireTime 支付截止时间）
export function listOrderPayments(orderId) {
  return request({
    url: BASE + orderId + '/payments',
    method: 'get'
  })
}

// 补款任务（意向金转定金的差额补款）
export function listOrderSupplements(orderId) {
  return request({
    url: BASE + orderId + '/supplements',
    method: 'get'
  })
}

// 退款记录（含退款场景、手续费与按原支付单拆分的退款明细）
export function listOrderRefunds(orderId) {
  return request({
    url: BASE + orderId + '/refunds',
    method: 'get'
  })
}

// 协议确认快照
export function listOrderAgreements(orderId) {
  return request({
    url: BASE + orderId + '/agreements',
    method: 'get'
  })
}

// 交付信息：当前有效预约 + 最近交付记录；未预约时后端返回 data=null
export function getOrderDelivery(orderId) {
  return request({
    url: BASE + orderId + '/delivery',
    method: 'get'
  })
}
