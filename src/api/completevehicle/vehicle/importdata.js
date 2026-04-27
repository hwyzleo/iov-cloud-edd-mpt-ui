import request from '@/utils/request'

// 查询车辆导入数据列表
export function listVehicleImportData(query) {
  return request({
    url: '/edd-vmd/api/mpt/vehicleImportData/v1/list',
    method: 'get',
    params: query
  })
}

// 查询车辆导入数据
export function getVehicleImportData(id) {
  return request({
    url: '/edd-vmd/api/mpt/vehicleImportData/v1/' + id,
    method: 'get'
  })
}

// 新增车辆导入数据
export function addVehicleImportData(data) {
  return request({
    url: '/edd-vmd/api/mpt/vehicleImportData/v1',
    method: 'post',
    data: data
  })
}

// 修改车辆导入数据
export function updateVehicleImportData(data) {
  return request({
    url: '/edd-vmd/api/mpt/vehicleImportData/v1',
    method: 'put',
    data: data
  })
}

// 删除车辆导入数据
export function delVehicleImportData(ids) {
  return request({
    url: '/edd-vmd/api/mpt/vehicleImportData/v1/' + ids,
    method: 'delete'
  })
}
