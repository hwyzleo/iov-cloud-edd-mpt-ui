import request from '@/utils/request'

// 查询上报车辆列表
export function listReportVehicle(query) {
  return request({
    url: '/tsp-rsms/mpt/reportVehicle/list',
    method: 'get',
    params: query
  })
}

// 查询上报车辆详细
export function getReportVehicle(reportVehicleId) {
  return request({
    url: '/tsp-rsms/mpt/reportVehicle/' + reportVehicleId,
    method: 'get'
  })
}

// 新增上报车辆
export function addReportVehicle(data) {
  return request({
    url: '/tsp-rsms/mpt/reportVehicle',
    method: 'post',
    data: data
  })
}

// 修改上报车辆
export function updateReportVehicle(data) {
  return request({
    url: '/tsp-rsms/mpt/reportVehicle',
    method: 'put',
    data: data
  })
}

// 删除上报车辆
export function delReportVehicle(reportVehicleIds) {
  return request({
    url: '/tsp-rsms/mpt/reportVehicle/' + reportVehicleIds,
    method: 'delete'
  })
}
