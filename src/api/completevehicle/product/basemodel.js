import request from '@/utils/request'

// 查询基础车型列表
export function listBaseModel(query) {
  return request({
    url: '/edd-vmd/api/mpt/baseModel/v1/list',
    method: 'get',
    params: query
  })
}

// 查询基础车型列表
export function listBaseModelFeatureCode(baseModelCode, query) {
  return request({
    url: '/edd-vmd/api/mpt/baseModel/v1/' + baseModelCode + '/featureCode/list',
    method: 'get',
    params: query
  })
}

// 查询车型平台及车系及车型下基础车型列表
export function listBaseModelByPlatformCodeAndSeriesCodeAndModelCode(platformCode, seriesCode, modelCode) {
  const params = {
    platformCode: platformCode,
    seriesCode: seriesCode,
    modelCode: modelCode
  }
  return request({
    url: '/edd-vmd/api/mpt/baseModel/v1/listByPlatformCodeAndSeriesCodeAndModelCode',
    method: 'get',
    params: params
  })
}

// 查询基础车型详细
export function getBaseModel(basicModelId) {
  return request({
    url: '/edd-vmd/api/mpt/baseModel/v1/' + basicModelId,
    method: 'get'
  })
}

// 查询基础车型详细
export function getBaseModelFeatureCode(baseModelCode, baseModelFeatureCodeId) {
  return request({
    url: '/edd-vmd/api/mpt/baseModel/v1/' + baseModelCode + '/featureCode/' + baseModelFeatureCodeId,
    method: 'get'
  })
}

// 新增基础车型
export function addBaseModel(data) {
  return request({
    url: '/edd-vmd/api/mpt/baseModel/v1',
    method: 'post',
    data: data
  })
}

// 新增基础车型
export function addBaseModelFeatureCode(baseModelCode, data) {
  return request({
    url: '/edd-vmd/api/mpt/baseModel/v1/' + baseModelCode + '/featureCode',
    method: 'post',
    data: data
  })
}

// 修改基础车型
export function updateBaseModel(data) {
  return request({
    url: '/edd-vmd/api/mpt/baseModel/v1',
    method: 'put',
    data: data
  })
}

// 修改基础车型
export function updateBaseModelFeatureCode(baseModelCode, data) {
  return request({
    url: '/edd-vmd/api/mpt/baseModel/v1/' + baseModelCode + '/featureCode',
    method: 'put',
    data: data
  })
}

// 删除基础车型
export function delBaseModel(baseModelIds) {
  return request({
    url: '/edd-vmd/api/mpt/baseModel/v1/' + baseModelIds,
    method: 'delete'
  })
}

// 删除基础车型
export function delBaseModelFeatureCode(baseModelCode, baseModelIds) {
  return request({
    url: '/edd-vmd/api/mpt/baseModel/v1/' + baseModelCode + '/featureCode/' + baseModelIds,
    method: 'delete'
  })
}
