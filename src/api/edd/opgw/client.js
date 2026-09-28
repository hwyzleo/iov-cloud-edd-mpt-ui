import request from '@/utils/request'

// 查询调用方列表
export function listClient(query) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/client/v1/list',
    method: 'get',
    params: query
  })
}

// 根据ID获取调用方
export function getClient(clientId) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/client/v1/' + clientId,
    method: 'get'
  })
}

// 新增调用方
export function addClient(data) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/client/v1',
    method: 'post',
    data: data
  })
}

// 修改调用方
export function updateClient(data) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/client/v1',
    method: 'put',
    data: data
  })
}

// 启用调用方
export function enableClient(clientId) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/client/v1/' + clientId + '/enable',
    method: 'put'
  })
}

// 停用调用方
export function disableClient(clientId) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/client/v1/' + clientId + '/disable',
    method: 'put'
  })
}

// 删除调用方
export function delClient(clientId) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/client/v1/' + clientId,
    method: 'delete'
  })
}
