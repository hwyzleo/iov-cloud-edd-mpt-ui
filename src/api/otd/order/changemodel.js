import request from '@/utils/request'

// OTD-VSO 管理后台订单域（MPT）基地址（原 /api/mpt/order/v1 已废弃）
const BASE = '/otd-vso/api/mpt/vso/v1'
// 销售车型域基地址（原 /mpt/saleModel 已废弃为 /api/mpt/saleModel/v1）
const SALE_MODEL_BASE = '/otd-vso/api/mpt/saleModel/v1'

// 查询可改配订单列表（EARNEST_MONEY_PAID / DOWN_PAYMENT_PAID / ARRANGE_PRODUCTION）
export function listModelConfigChangeableOrder(query) {
  return request({
    url: BASE + '/listModelConfigChangeable',
    method: 'get',
    params: query
  })
}

// 查询销售车型详细（按主键 ID）
export function getSaleModel(saleModelId) {
  return request({
    url: SALE_MODEL_BASE + '/' + saleModelId,
    method: 'get'
  })
}

// 查询销售车型详细（按销售车型编码）
export function getSaleModelByCode(saleModelCode) {
  return request({
    url: SALE_MODEL_BASE + '/code/' + saleModelCode,
    method: 'get'
  })
}

// 查询销售车型配置列表
export function listSaleModelConfig(saleModelId) {
  return request({
    url: SALE_MODEL_BASE + '/' + saleModelId + '/config',
    method: 'get'
  })
}

// 查询销售车型配置详细
export function getSaleModelConfig(saleModelId, saleModelConfigId) {
  return request({
    url: SALE_MODEL_BASE + '/' + saleModelId + '/config/' + saleModelConfigId,
    method: 'get'
  })
}

// 修改销售车型
export function updateSaleModel(data) {
  return request({
    url: SALE_MODEL_BASE,
    method: 'put',
    data: data
  })
}

// 修改销售车型配置
export function updateSaleModelConfig(saleModelId, data) {
  return request({
    url: SALE_MODEL_BASE + '/' + saleModelId + '/config',
    method: 'put',
    data: data
  })
}

// 运营改配提交（variantCode 为空表示仅调整选装；optionCodes 必填）
// 仅允许 EARNEST_MONEY_PAID / DOWN_PAYMENT_UNPAID / DOWN_PAYMENT_PAID
// 差额为正创建补款任务，为负创建退款任务，并记录 mpt 来源时间线
export function modifyOrderConfig(orderId, data) {
  return request({
    url: BASE + '/' + orderId + '/modifyConfig',
    method: 'post',
    data: data
  })
}
