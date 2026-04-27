import request from '@/utils/request'

// 查询车辆零件列表
export function listVehiclePart(query) {
  return request({
    url: '/edd-vmd/api/mpt/vehiclePart/v1/list',
    method: 'get',
    params: query
  })
}

// 查询车辆零件详细
export function getVehiclePart(vehiclePartId) {
  return request({
    url: '/edd-vmd/api/mpt/vehiclePart/v1/' + vehiclePartId,
    method: 'get'
  })
}

// 新增车辆零件
export function addVehiclePart(data) {
  return request({
    url: '/edd-vmd/api/mpt/vehiclePart/v1',
    method: 'post',
    data: data
  })
}

// 修改车辆零件
export function updateVehiclePart(data) {
  return request({
    url: '/edd-vmd/api/mpt/vehiclePart/v1',
    method: 'put',
    data: data
  })
}

// 删除车辆零件
export function delVehiclePart(vehiclePartIds) {
  return request({
    url: '/edd-vmd/api/mpt/vehiclePart/v1/' + vehiclePartIds,
    method: 'delete'
  })
}
