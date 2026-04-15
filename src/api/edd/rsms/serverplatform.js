import request from '@/utils/request'

// 查询服务端平台列表
export function listServerPlatform(query) {
  return request({
    url: '/tsp-rsms/mpt/serverPlatform/list',
    method: 'get',
    params: query
  })
}

// 查询所有服务端平台列表
export function listAllServerPlatform() {
  return request({
    url: '/tsp-rsms/mpt/serverPlatform/listAll',
    method: 'get'
  })
}

// 查询服务端平台详细
export function getServerPlatform(serverPlatformId) {
  return request({
    url: '/tsp-rsms/mpt/serverPlatform/' + serverPlatformId,
    method: 'get'
  })
}

// 新增服务端平台
export function addServerPlatform(data) {
  return request({
    url: '/tsp-rsms/mpt/serverPlatform',
    method: 'post',
    data: data
  })
}

// 修改服务端平台
export function updateServerPlatform(data) {
  return request({
    url: '/tsp-rsms/mpt/serverPlatform',
    method: 'put',
    data: data
  })
}

// 删除服务端平台
export function delServerPlatform(serverPlatformIds) {
  return request({
    url: '/tsp-rsms/mpt/serverPlatform/' + serverPlatformIds,
    method: 'delete'
  })
}

// 同步服务端平台信息
export function syncServerPlatformInfo(serverPlatformId) {
  return request({
    url: '/tsp-rsms/mpt/serverPlatform/' + serverPlatformId + '/action/syncPlatform',
    method: 'post'
  })
}
