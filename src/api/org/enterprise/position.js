import request from '@/utils/request'

// 查询岗位列表
export function listPosition(query) {
  return request({
    url: '/edd-org/api/mpt/position/v1/list',
    method: 'get',
    params: query
  })
}

// 查询岗位详细
export function getPosition(positionId) {
  return request({
    url: '/edd-org/api/mpt/position/v1/' + positionId,
    method: 'get'
  })
}

// 新增岗位
export function addPosition(data) {
  return request({
    url: '/edd-org/api/mpt/position/v1',
    method: 'post',
    data: data
  })
}

// 修改岗位
export function updatePosition(data) {
  return request({
    url: '/edd-org/api/mpt/position/v1',
    method: 'put',
    data: data
  })
}

// 删除岗位
export function delPosition(positionId) {
  return request({
    url: '/edd-org/api/mpt/position/v1/' + positionId,
    method: 'delete'
  })
}
