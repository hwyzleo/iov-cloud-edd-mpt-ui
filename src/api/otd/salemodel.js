import request from '@/utils/request'

// 查询销售车型列表
export function listSaleModel(query) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/list',
    method: 'get',
    params: query
  })
}

// 查询销售车型详细（按ID）
export function getSaleModel(id) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + id,
    method: 'get'
  })
}

// 查询销售车型详细（按saleModelCode）
export function getSaleModelByCode(saleModelCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/code/' + saleModelCode,
    method: 'get'
  })
}

// 新增销售车型
export function addSaleModel(data) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1',
    method: 'post',
    data: data
  })
}

// 修改销售车型
export function updateSaleModel(data) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1',
    method: 'put',
    data: data
  })
}

// 删除销售车型
export function delSaleModel(ids) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1',
    method: 'delete',
    params: { ids: ids.join(',') }
  })
}

// 同步MDM数据
export function syncMdmData(saleModelCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/syncMdm',
    method: 'post'
  })
}

// 申请销售车型图片上传凭证（OTD-VSO-DSN-CR-003 §4.1）
export function createSaleModelImageTicket(data) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/upload/tickets',
    method: 'post',
    data: data
  })
}

// 完成销售车型图片上传确认（OTD-VSO-DSN-CR-003 §4.2）
export function completeSaleModelImage(objectId, data) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/upload/tickets/' + objectId + '/complete',
    method: 'post',
    data: data
  })
}
