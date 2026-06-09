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
export function getSaleModel(saleModelId) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelId,
    method: 'get'
  })
}

// 查询销售车型配置列表
export function listSaleModelConfig(saleModelId) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelId + '/config',
    method: 'get'
  })
}

// 查询销售车型配置详细
export function getSaleModelConfig(saleModelId, saleModelConfigId) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelId + '/config/' + saleModelConfigId,
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

// 修改销售车型图片集
export function updateSaleModelImages(data) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/images',
    method: 'put',
    data: data
  })
}

// 新增销售车型配置
export function addSaleModelConfig(saleModelId, data) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelId + '/config',
    method: 'post',
    data: data
  })
}

// 修改销售车型配置
export function updateSaleModelConfig(saleModelId, data) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelId + '/config',
    method: 'put',
    data: data
  })
}

// 删除销售车型
export function delSaleModel(saleModelId) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelId,
    method: 'delete'
  })
}

// 删除销售车型配置
export function delSaleModelConfig(saleModelId, saleModelConfigId) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelId + '/config/' + saleModelConfigId,
    method: 'delete'
  })
}

// 查询销售车型生产配置关联列表（分页）
export function listSaleModelBuildConfig(saleModelId, query) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelId + '/buildConfig',
    method: 'get',
    params: query
  })
}

// 查询销售车型聚合后的特征值范围
export function getSaleModelFeatureCodeRanges(saleModelId) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelId + '/featureCodeRanges',
    method: 'get'
  })
}

// 新增销售车型生产配置关联
export function addSaleModelBuildConfig(saleModelId, data) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelId + '/buildConfig',
    method: 'post',
    data: data
  })
}

// 修改销售车型生产配置关联
export function updateSaleModelBuildConfig(saleModelId, data) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelId + '/buildConfig',
    method: 'put',
    data: data
  })
}

// 删除销售车型生产配置关联
export function delSaleModelBuildConfig(saleModelId, ids) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelId + '/buildConfig',
    method: 'delete',
    params: { ids: ids.join(',') }
  })
}

// 手动同步销售车型配置
export function syncSaleModelConfig(saleModelId) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelId + '/syncConfigs',
    method: 'post'
  })
}

// 更新销售车型配置排序
export function updateConfigSort(saleModelId, data) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelId + '/config/sort',
    method: 'put',
    data: data
  })
}
