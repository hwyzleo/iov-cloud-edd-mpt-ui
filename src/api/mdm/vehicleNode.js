import request from '@/utils/request'

// 查询车载节点列表
export function listVehicleNode(query) {
  return request({
    url: '/edd-mdm/api/mpt/vehicleNode/v1/list',
    method: 'get',
    params: query
  })
}

// 查询车载节点详细
export function getVehicleNode(nodeCode) {
  return request({
    url: '/edd-mdm/api/mpt/vehicleNode/v1/' + nodeCode,
    method: 'get'
  })
}

// 新增车载节点
export function addVehicleNode(data) {
  return request({
    url: '/edd-mdm/api/mpt/vehicleNode/v1/create',
    method: 'post',
    data: data
  })
}

// 修改车载节点
export function updateVehicleNode(nodeCode, data) {
  return request({
    url: '/edd-mdm/api/mpt/vehicleNode/v1/' + nodeCode,
    method: 'put',
    data: data
  })
}

// 删除车载节点
export function delVehicleNode(nodeCode, operator) {
  return request({
    url: '/edd-mdm/api/mpt/vehicleNode/v1/' + nodeCode,
    method: 'delete',
    params: { operator }
  })
}

// 停用车载节点
export function deactivateVehicleNode(nodeCode, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/vehicleNode/v1/' + nodeCode + '/deactivate',
    method: 'post',
    params: { modifyBy }
  })
}

// 查询车载节点历史版本
export function listVehicleNodeHistory(nodeCode) {
  return request({
    url: '/edd-mdm/api/mpt/vehicleNode/v1/' + nodeCode + '/history',
    method: 'get'
  })
}
