import request from '@/utils/request'

// 查询车辆升级任务列表
export function listTaskVehicle(query) {
  return request({
    url: '/iov-ota/api/mpt/taskVehicle/v1/list',
    method: 'get',
    params: query
  })
}

// 查询车辆升级任务详细
export function getTaskVehicle(taskVehicleId) {
  return request({
    url: '/iov-ota/api/mpt/taskVehicle/v1/' + taskVehicleId,
    method: 'get'
  })
}

// 获取车辆升级任务过程
export function listTaskVehicleProcess(taskVehicleId) {
  return request({
    url: '/iov-ota/api/mpt/taskVehicle/v1/' + taskVehicleId + '/process',
    method: 'get'
  })
}
