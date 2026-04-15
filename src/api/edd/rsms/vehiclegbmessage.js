import request from '@/utils/request'

// 查询车辆国标消息列表
export function listVehicleGbMessage(query) {
  return request({
    url: '/tsp-rsms/mpt/vehicleGbMessage/list',
    method: 'get',
    params: query
  })
}

// 列出所有命令标识
export function listAllCommandFlag() {
  return request({
    url: '/tsp-rsms/mpt/vehicleGbMessage/listAllCommandFlag',
    method: 'get'
  })
}

// 查询车辆国标消息详细
export function getVehicleGbMessage(vehicleGbMessageId) {
  return request({
    url: '/tsp-rsms/mpt/vehicleGbMessage/' + vehicleGbMessageId,
    method: 'get'
  })
}

// 解析车辆国标消息
export function parseVehicleGbMessage(vehicleGbMessageId) {
  return request({
    url: '/tsp-rsms/mpt/vehicleGbMessage/' + vehicleGbMessageId + '/action/parse',
    method: 'post'
  })
}

// 新增车辆国标消息
export function addVehicleGbMessage(data) {
  return request({
    url: '/tsp-rsms/mpt/vehicleGbMessage',
    method: 'post',
    data: data
  })
}

// 修改车辆国标消息
export function updateVehicleGbMessage(data) {
  return request({
    url: '/tsp-rsms/mpt/vehicleGbMessage',
    method: 'put',
    data: data
  })
}

// 删除车辆国标消息
export function delVehicleGbMessage(vehicleGbMessageIds) {
  return request({
    url: '/tsp-rsms/mpt/vehicleGbMessage/' + vehicleGbMessageIds,
    method: 'delete'
  })
}
