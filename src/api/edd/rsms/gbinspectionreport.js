import request from '@/utils/request'

// 查询国标检测报告列表
export function listGbInspectionReport(query) {
  return request({
    url: '/tsp-rsms/mpt/gbInspectionReport/list',
    method: 'get',
    params: query
  })
}

// 获取国标检测报告类型列表
export function listGbInspectionReportType() {
  return request({
    url: '/tsp-rsms/mpt/gbInspectionReport/listGbInspectionReportType',
    method: 'get'
  })
}

// 获取国标检测报告状态列表
export function listGbInspectionReportState() {
  return request({
    url: '/tsp-rsms/mpt/gbInspectionReport/listGbInspectionReportState',
    method: 'get'
  })
}

// 获取国标检测报告场景列表
export function listGbInspectionReportScene() {
  return request({
    url: '/tsp-rsms/mpt/gbInspectionReport/listGbInspectionReportScene',
    method: 'get'
  })
}

// 查询国标检测报告详细
export function getGbInspectionReport(gbInspectionReportId) {
  return request({
    url: '/tsp-rsms/mpt/gbInspectionReport/' + gbInspectionReportId,
    method: 'get'
  })
}

// 查询国标检测报告结果详细
export function getGbInspectionReportResult(gbInspectionReportId) {
  return request({
    url: '/tsp-rsms/mpt/gbInspectionReport/' + gbInspectionReportId + '/result',
    method: 'get'
  })
}

// 新增国标检测报告
export function addGbInspectionReport(data) {
  return request({
    url: '/tsp-rsms/mpt/gbInspectionReport',
    method: 'post',
    data: data
  })
}

// 修改国标检测报告
export function updateGbInspectionReport(data) {
  return request({
    url: '/tsp-rsms/mpt/gbInspectionReport',
    method: 'put',
    data: data
  })
}

// 删除国标检测报告
export function delGbInspectionReport(gbInspectionReportIds) {
  return request({
    url: '/tsp-rsms/mpt/gbInspectionReport/' + gbInspectionReportIds,
    method: 'delete'
  })
}
