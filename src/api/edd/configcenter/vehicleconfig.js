import request from '@/utils/request'

// 查询车辆配置列表
export function listVehicleConfig(query) {
  return request({
    url: '/edd-vmd/api/mpt/vehicleConfig/v1/list',
    method: 'get',
    params: query
  })
}

// 查询车辆配置项列表
export function listVehicleConfigItem(vin, query) {
  return request({
    url: '/edd-vmd/api/mpt/vehicleConfig/v1/' + vin + '/configItem/list',
    method: 'get',
    params: query
  })
}

// 查询车辆配置详细
export function getVehicleConfig(id) {
  return request({
    url: '/edd-vmd/api/mpt/vehicleConfig/v1/' + id,
    method: 'get'
  })
}

// 查询车辆配置详细
export function getVehicleConfigItem(vin, id) {
  return request({
    url: '/edd-vmd/api/mpt/vehicleConfig/v1/' + vin + '/configItem/' + id,
    method: 'get'
  })
}
