import request from '@/utils/request'

// 查询车型列表
export function listModel(query) {
  return request({
    url: '/edd-vmd/api/mpt/model/v1/list',
    method: 'get',
    params: query
  })
}

// 查询车型平台及车系下车型列表
export function listModelByPlatformCodeAndSeriesCode(platformCode, seriesCode) {
  const params = {
    platformCode: platformCode,
    seriesCode: seriesCode
  }
  return request({
    url: '/edd-vmd/api/mpt/model/v1/listByPlatformCodeAndSeriesCode',
    method: 'get',
    params: params
  })
}

// 查询车型详细
export function getModel(modelId) {
  return request({
    url: '/edd-vmd/api/mpt/model/v1/' + modelId,
    method: 'get'
  })
}

// 新增车型
export function addModel(data) {
  return request({
    url: '/edd-vmd/api/mpt/model/v1',
    method: 'post',
    data: data
  })
}

// 修改车型
export function updateModel(data) {
  return request({
    url: '/edd-vmd/api/mpt/model/v1',
    method: 'put',
    data: data
  })
}

// 删除车型
export function delModel(modelIds) {
  return request({
    url: '/edd-vmd/api/mpt/model/v1/' + modelIds,
    method: 'delete'
  })
}
