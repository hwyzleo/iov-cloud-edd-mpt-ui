import request from '@/utils/request'

// 查询开放接口列表
export function listOpenApi(query) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/openApi/v1/list',
    method: 'get',
    params: query
  })
}

// 根据ID获取开放接口
export function getOpenApi(openApiId) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/openApi/v1/' + openApiId,
    method: 'get'
  })
}

// 新增开放接口
export function addOpenApi(data) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/openApi/v1',
    method: 'post',
    data: data
  })
}

// 修改开放接口（仅草稿）
export function updateOpenApi(data) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/openApi/v1',
    method: 'put',
    data: data
  })
}

// 启用开放接口（回到草稿，需重新发布）
export function enableOpenApi(openApiId) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/openApi/v1/' + openApiId + '/enable',
    method: 'put'
  })
}

// 停用开放接口
export function disableOpenApi(openApiId) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/openApi/v1/' + openApiId + '/disable',
    method: 'put'
  })
}

// 删除开放接口
export function delOpenApi(openApiId) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/openApi/v1/' + openApiId,
    method: 'delete'
  })
}
