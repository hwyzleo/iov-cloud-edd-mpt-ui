import request from '@/utils/request'

// 查询授权列表
export function listPermission(query) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/permission/v1/list',
    method: 'get',
    params: query
  })
}

// 授予调用方开放接口权限
export function grantPermission(data) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/permission/v1',
    method: 'post',
    data: data
  })
}

// 撤销调用方开放接口权限
export function revokePermission(clientId, openApiId) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/permission/v1/' + clientId + '/' + openApiId,
    method: 'delete'
  })
}
