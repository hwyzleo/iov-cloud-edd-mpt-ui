import request from '@/utils/request'

// 查询基线信息列表
export function listBaseline(query) {
  return request({
    url: '/iov-ota/api/mpt/baseline/v1/list',
    method: 'get',
    params: query
  })
}

// 分页查询基线下软件内部版本
export function listBaselineSoftwareBuildVersion(baselineId, query) {
  return request({
    url: '/iov-ota/api/mpt/baseline/v1/' + baselineId + '/listSoftwareBuildVersion',
    method: 'get',
    params: query
  })
}

// 查询基线信息详细
export function getBaseline(baselineId) {
  return request({
    url: '/iov-ota/api/mpt/baseline/v1/' + baselineId,
    method: 'get'
  })
}

// 新增基线信息
export function addBaseline(data) {
  return request({
    url: '/iov-ota/api/mpt/baseline/v1',
    method: 'post',
    data: data
  })
}

// 新增关联的软件内部版本
export function addBaselineSoftwareBuildVersion(baselineId, softwareBuildVersionIds) {
  return request({
    url: '/iov-ota/api/mpt/baseline/v1/' + baselineId + '/action/addSoftwareBuildVersion/' + softwareBuildVersionIds,
    method: 'post'
  })
}

// 修改基线信息
export function updateBaseline(data) {
  return request({
    url: '/iov-ota/api/mpt/baseline/v1',
    method: 'put',
    data: data
  })
}

// 修改关联的软件内部版本是否关键
export function updateBaselineSoftwareBuildVersionCritical(baselineId, softwareBuildVersionIds, critical) {
  return request({
    url: '/iov-ota/api/mpt/baseline/v1/' + baselineId + '/action/editSoftwareBuildVersion/' + softwareBuildVersionIds + '?critical=' + critical,
    method: 'post'
  })
}

// 修改关联的软件内部版本是否支持OTA
export function updateBaselineSoftwareBuildVersionOta(baselineId, softwareBuildVersionIds, ota) {
  return request({
    url: '/iov-ota/api/mpt/baseline/v1/' + baselineId + '/action/editSoftwareBuildVersion/' + softwareBuildVersionIds + '?ota=' + ota,
    method: 'post'
  })
}

// 删除基线信息
export function delBaseline(baselineIds) {
  return request({
    url: '/iov-ota/api/mpt/baseline/v1/' + baselineIds,
    method: 'delete'
  })
}

// 删除关联的软件内部版本
export function delBaselineSoftwareBuildVersion(baselineId, softwareBuildVersionIds) {
  return request({
    url: '/iov-ota/api/mpt/baseline/v1/' + baselineId + '/action/removeSoftwareBuildVersion/' + softwareBuildVersionIds,
    method: 'post'
  })
}

// 重排序基线关联的软件内部版本
export function resortBaselineSoftwareBuildVersion(baselineId, data) {
  return request({
    url: '/iov-ota/api/mpt/baseline/v1/' + baselineId + '/action/resortSoftwareBuildVersion',
    method: 'post',
    data: data
  })
}
