import request from '@/utils/request'

// 查询车辆国标报警列表
export function listVehicleGbAlarm(query) {
  return request({
    url: '/tsp-rsms/mpt/vehicleGbAlarm/list',
    method: 'get',
    params: query
  })
}

// 查询车辆国标报警详细
export function getVehicleGbAlarm(vehicleGbAlarmId) {
  return request({
    url: '/tsp-rsms/mpt/vehicleGbAlarm/' + vehicleGbAlarmId,
    method: 'get'
  })
}

// 解析车辆国标报警
export function parseVehicleGbAlarm(vehicleGbAlarmId) {
  return request({
    url: '/tsp-rsms/mpt/vehicleGbAlarm/' + vehicleGbAlarmId + '/action/parse',
    method: 'post'
  })
}

// 新增车辆国标报警
export function addVehicleGbAlarm(data) {
  return request({
    url: '/tsp-rsms/mpt/vehicleGbAlarm',
    method: 'post',
    data: data
  })
}

// 修改车辆国标报警
export function updateVehicleGbAlarm(data) {
  return request({
    url: '/tsp-rsms/mpt/vehicleGbAlarm',
    method: 'put',
    data: data
  })
}

// 删除车辆国标报警
export function delVehicleGbAlarm(vehicleGbAlarmIds) {
  return request({
    url: '/tsp-rsms/mpt/vehicleGbAlarm/' + vehicleGbAlarmIds,
    method: 'delete'
  })
}
