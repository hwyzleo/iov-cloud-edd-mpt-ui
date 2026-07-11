import request from '@/utils/request'

// 查询兼容软件零件号列表
export function listCompatibleSoftwarePn(query) {
  return request({
    url: '/ota-fota/mpt/compatibleSoftwarePn/list',
    method: 'get',
    params: query
  })
}

// 查询兼容软件零件号详细
export function getCompatibleSoftwarePn(compatibleSoftwarePnId) {
  return request({
    url: '/ota-fota/mpt/compatibleSoftwarePn/' + compatibleSoftwarePnId,
    method: 'get'
  })
}

// 新增兼容软件零件号
export function addCompatibleSoftwarePn(data) {
  return request({
    url: '/ota-fota/mpt/compatibleSoftwarePn',
    method: 'post',
    data: data
  })
}

// 修改兼容软件零件号
export function updateCompatibleSoftwarePn(data) {
  return request({
    url: '/ota-fota/mpt/compatibleSoftwarePn',
    method: 'put',
    data: data
  })
}

// 删除兼容软件零件号
export function delCompatibleSoftwarePn(compatibleSoftwarePnIds) {
  return request({
    url: '/ota-fota/mpt/compatibleSoftwarePn/' + compatibleSoftwarePnIds,
    method: 'delete'
  })
}
