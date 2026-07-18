import request from '@/utils/request'

// 查询车辆列表
export function listVehicle(query) {
  return request({
    url: '/edd-vmd/api/mpt/vehicle/v1/list',
    method: 'get',
    params: query
  })
}

// 查询可分配车辆列表
export function listAssignableVehicle(query) {
  return request({
    url: '/edd-vmd/api/mpt/vehicle/v1/listAssignable',
    method: 'get',
    params: query
  })
}

// 查询车辆详细
export function getVehicle(vin) {
  return request({
    url: '/edd-vmd/api/mpt/vehicle/v1/' + vin,
    method: 'get'
  })
}

// 查询车辆生命周期列表
export function listVehicleLifecycle(vin) {
  return request({
    url: '/edd-vmd/api/mpt/vehicleLifecycle/v1/' + vin + '/timeline',
    method: 'get'
  })
}

// 新增车辆
export function addVehicle(data) {
  return request({
    url: '/edd-vmd/api/mpt/vehicle/v1',
    method: 'post',
    data: data
  })
}

// 删除车辆
export function delVehicle(vehicleIds) {
  return request({
    url: '/edd-vmd/api/mpt/vehicle/v1/' + vehicleIds,
    method: 'delete'
  })
}
