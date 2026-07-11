import request from '@/utils/request'

// 查询兼容零件号列表
export function listCompatiblePn(query) {
  return request({
    url: '/iov-ota/api/mpt/compatiblePn/v1/list',
    method: 'get',
    params: query
  })
}

// 查询兼容零件号详细
export function getCompatiblePn(compatiblePnId) {
  return request({
    url: '/iov-ota/api/mpt/compatiblePn/v1/' + compatiblePnId,
    method: 'get'
  })
}

// 新增兼容零件号
export function addCompatiblePn(data) {
  return request({
    url: '/iov-ota/api/mpt/compatiblePn/v1',
    method: 'post',
    data: data
  })
}

// 修改兼容零件号
export function updateCompatiblePn(data) {
  return request({
    url: '/iov-ota/api/mpt/compatiblePn/v1',
    method: 'put',
    data: data
  })
}

// 删除兼容零件号
export function delCompatiblePn(compatiblePnIds) {
  return request({
    url: '/iov-ota/api/mpt/compatiblePn/v1/' + compatiblePnIds,
    method: 'delete'
  })
}
