import request from '@/utils/request'

// 统一导入操作门面（CR-071）
// 重导(REIMPORT)必须走此门面，普通导入接口会因 handle=true 幂等跳过

// 预检：候选识别 + 计划摘要
// data: { domain: 'PART'|'VEHICLE', importDataId, mode: 'REIMPORT'|'REPLAY', scope?, repairPolicy? }
export function previewImportOperation(data) {
  return request({
    url: '/edd-vmd/api/mpt/importOperation/v1/preview',
    method: 'post',
    data: data
  })
}

// 执行（REIMPORT/REPLAY）
// data: { domain, importDataId, mode, scope?, repairPolicy?, planDigest, reason?, operationId? }
export function executeImportOperation(data) {
  return request({
    url: '/edd-vmd/api/mpt/importOperation/v1/execute',
    method: 'post',
    data: data
  })
}

// 重试操作
export function retryImportOperation(operationId) {
  return request({
    url: '/edd-vmd/api/mpt/importOperation/v1/' + operationId + '/retry',
    method: 'post'
  })
}

// 查询操作
export function getImportOperation(operationId) {
  return request({
    url: '/edd-vmd/api/mpt/importOperation/v1/' + operationId,
    method: 'get'
  })
}

// 查询操作明细（游标分页）
// params: { status?, cursor?, limit? }
export function listImportOperationItems(operationId, params) {
  return request({
    url: '/edd-vmd/api/mpt/importOperation/v1/' + operationId + '/items',
    method: 'get',
    params: params
  })
}
