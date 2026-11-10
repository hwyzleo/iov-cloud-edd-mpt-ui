import request from '@/utils/request'

// OTD-VSO 购车协议模板管理（MPT）
// 权限点：completeVehicle:order:agreement:list / :edit / :remove
const BASE = '/otd-vso/api/mpt/vso/v1/purchaseAgreement'

// 分页查询协议模板
export function listPurchaseAgreement(query) {
  return request({
    url: BASE + '/list',
    method: 'get',
    params: query
  })
}

// 新增或修改协议模板（返回 agreementId）
export function savePurchaseAgreement(data) {
  return request({
    url: BASE + '/action/save',
    method: 'post',
    data: data
  })
}

// 下架协议模板（agreementId 为 query 参数）
export function offShelfPurchaseAgreement(agreementId) {
  return request({
    url: BASE + '/action/offShelf',
    method: 'post',
    params: { agreementId: agreementId }
  })
}
