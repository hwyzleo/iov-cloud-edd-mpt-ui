import request from '@/utils/request'

// 查询升级车辆列表
export function listVehicle(query) {
  return request({
    url: '/iov-ota/api/mpt/vehicle/v1/list',
    method: 'get',
    params: query
  })
}

// 查询升级车辆详细
export function getVehicle(vin) {
  return request({
    url: '/iov-ota/api/mpt/vehicle/v1/' + vin,
    method: 'get'
  })
}

// 查询车辆关联升级活动（CR-023 §4.1）
export function listVehicleActivities(vin, query) {
  return request({
    url: '/iov-ota/api/mpt/vehicle/v1/' + vin + '/activities',
    method: 'get',
    params: query
  })
}

// 查询车辆关联升级任务（CR-023 §4.2）
export function listVehicleTasks(vin, query) {
  return request({
    url: '/iov-ota/api/mpt/vehicle/v1/' + vin + '/tasks',
    method: 'get',
    params: query
  })
}

// 查询车辆设备软件清单（含零件关联富化，CR-023 §4.3）
export function getVehicleInventory(vin) {
  return request({
    url: '/iov-ota/api/mpt/vehicle/v1/' + vin + '/inventory',
    method: 'get'
  })
}
