import request from '@/utils/request'

// 查询装载车列表
export function listLoadingVehicle(query) {
  return request({
    url: '/otd-tms/mpt/loadingVehicle/list',
    method: 'get',
    params: query
  })
}

// 查询装载车详细
export function getLoadingVehicle(loadingVehicleId) {
  return request({
    url: '/otd-tms/mpt/loadingVehicle/' + loadingVehicleId,
    method: 'get'
  })
}

// 新增装载车
export function addLoadingVehicle(data) {
  return request({
    url: '/otd-tms/mpt/loadingVehicle',
    method: 'post',
    data: data
  })
}

// 修改装载车
export function updateLoadingVehicle(data) {
  return request({
    url: '/otd-tms/mpt/loadingVehicle',
    method: 'put',
    data: data
  })
}

// 删除装载车
export function delLoadingVehicle(loadingVehicleIds) {
  return request({
    url: '/otd-tms/mpt/loadingVehicle/' + loadingVehicleIds,
    method: 'delete'
  })
}

// 查询所有装载车列表
export function listAllLoadingVehicle() {
  return request({
    url: '/otd-tms/mpt/loadingVehicle/listAll',
    method: 'get'
  })
}
