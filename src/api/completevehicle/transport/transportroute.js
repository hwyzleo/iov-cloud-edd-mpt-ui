import request from '@/utils/request'

// 查询运输线路列表
export function listTransportRoute(query) {
  return request({
    url: '/otd-tms/mpt/transportRoute/list',
    method: 'get',
    params: query
  })
}

// 查询运输线路详细
export function getTransportRoute(transportRouteId) {
  return request({
    url: '/otd-tms/mpt/transportRoute/' + transportRouteId,
    method: 'get'
  })
}

// 新增运输线路
export function addTransportRoute(data) {
  return request({
    url: '/otd-tms/mpt/transportRoute',
    method: 'post',
    data: data
  })
}

// 修改运输线路
export function updateTransportRoute(data) {
  return request({
    url: '/otd-tms/mpt/transportRoute',
    method: 'put',
    data: data
  })
}

// 删除运输线路
export function delTransportRoute(transportRouteIds) {
  return request({
    url: '/otd-tms/mpt/transportRoute/' + transportRouteIds,
    method: 'delete'
  })
}

// 查询所有运输线路列表
export function listAllTransportRoute() {
  return request({
    url: '/otd-tms/mpt/transportRoute/listAll',
    method: 'get'
  })
}
