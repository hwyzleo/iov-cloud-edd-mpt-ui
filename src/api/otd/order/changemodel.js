import request from '@/utils/request'

export function listModelConfigChangeableOrder(query) {
  return request({
    url: '/otd-vso/api/mpt/order/v1/listModelConfigChangeable',
    method: 'get',
    params: query
  })
}

export function getSaleModel(saleModelId) {
  return request({
    url: '/otd-vso/mpt/saleModel/' + saleModelId,
    method: 'get'
  })
}

export function listSaleModelConfig(saleModelId) {
  return request({
    url: '/otd-vso/mpt/saleModel/' + saleModelId + '/config',
    method: 'get'
  })
}

export function getSaleModelConfig(saleModelId, saleModelConfigId) {
  return request({
    url: '/otd-vso/mpt/saleModel/' + saleModelId + '/config/' + saleModelConfigId,
    method: 'get'
  })
}

export function updateSaleModel(data) {
  return request({
    url: '/otd-vso/mpt/saleModel',
    method: 'put',
    data: data
  })
}

export function updateSaleModelImages(data) {
  return request({
    url: '/otd-vso/mpt/saleModel/images',
    method: 'put',
    data: data
  })
}

export function updateSaleModelConfig(saleModelId, data) {
  return request({
    url: '/otd-vso/mpt/saleModel/' + saleModelId + '/config',
    method: 'put',
    data: data
  })
}
