import request from '@/utils/request'

// 查询路由分页（物理分页）
export function listRoute(query) {
  return request({
    url: '/system/sgw/routes/list',
    method: 'get',
    params: query
  })
}

// 查询路由详情
export function getRoute(routeCode) {
  return request({
    url: '/system/sgw/routes/' + routeCode,
    method: 'get'
  })
}

// 新增路由草稿
export function addRoute(data) {
  return request({
    url: '/system/sgw/routes',
    method: 'post',
    data: data
  })
}

// 更新路由草稿
export function updateRoute(routeCode, data) {
  return request({
    url: '/system/sgw/routes/' + routeCode,
    method: 'put',
    data: data
  })
}

// 复制路由草稿
export function copyRoute(routeCode, data) {
  return request({
    url: '/system/sgw/routes/' + routeCode + '/copy',
    method: 'post',
    data: data
  })
}

// 删除路由草稿
export function delRoute(routeCode) {
  return request({
    url: '/system/sgw/routes/' + routeCode,
    method: 'delete'
  })
}

// 校验路由配置
export function validateRoute(data) {
  return request({
    url: '/system/sgw/routes/validate',
    method: 'post',
    data: data
  })
}
