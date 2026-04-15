import request from '@/utils/request'

// 查询路由列表
export function listRoute(query) {
  return request({
    url: '/system/tsp-sgw-route/list',
    method: 'get',
    params: query
  })
}

// 查询路由详细
export function getRoute(routeId) {
  return request({
    url: '/system/tsp-sgw-route/' + routeId,
    method: 'get'
  })
}

// 新增路由
export function addRoute(data) {
  return request({
    url: '/system/tsp-sgw-route',
    method: 'post',
    data: data
  })
}

// 修改路由
export function updateRoute(data) {
  return request({
    url: '/system/tsp-sgw-route',
    method: 'put',
    data: data
  })
}

// 删除路由
export function delRoute(routeId) {
  return request({
    url: '/system/tsp-sgw-route/' + routeId,
    method: 'delete'
  })
}

// 刷新路由
export function refreshRoute() {
  return request({
    url: '/system/tsp-sgw-route/refresh',
    method: 'post'
  })
}
