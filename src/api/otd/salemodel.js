import request from '@/utils/request'

// 查询销售车型列表
export function listSaleModel(query) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/list',
    method: 'get',
    params: query
  })
}

// 查询销售车型详细
export function getSaleModel(id) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + id,
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
