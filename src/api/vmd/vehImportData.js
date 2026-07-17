import request from '@/utils/request'

// 查询车辆导入数据列表
export function listVehImportData(query) {
  return request({
    url: '/edd-vmd/api/mpt/vehImportData/v1/list',
    method: 'get',
    params: query
  })
}

// 查询车辆导入数据
export function getVehImportData(id) {
  return request({
    url: '/edd-vmd/api/mpt/vehImportData/v1/' + id,
    method: 'get'
  })
}

// 新增车辆导入数据
export function addVehImportData(data) {
  return request({
    url: '/edd-vmd/api/mpt/vehImportData/v1',
    method: 'post',
    data: data
  })
}

// 修改车辆导入数据
export function updateVehImportData(data) {
  return request({
    url: '/edd-vmd/api/mpt/vehImportData/v1',
    method: 'put',
    data: data
  })
}

// 删除车辆导入数据
export function delVehImportData(ids) {
  return request({
    url: '/edd-vmd/api/mpt/vehImportData/v1/' + ids,
    method: 'delete'
  })
}

// 补发车辆导入数据消息
export function republishVehImportData(id, data) {
  return request({
    url: '/edd-vmd/api/mpt/vehImportData/v1/' + id + '/replayEvent',
    method: 'post',
    data: data
  })
}

// 批量补发车辆导入数据消息
export function republishBatchVehImportData(data) {
  return request({
    url: '/edd-vmd/api/mpt/vehImportData/v1/replayEvent/batch',
    method: 'post',
    data: data
  })
}
