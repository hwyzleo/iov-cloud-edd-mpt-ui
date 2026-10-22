import request from '@/utils/request'

/**
 * 业务密钥开通批次——运维"一键清理阻塞"（VMD-DSN-CR-065）
 *
 * 接口由 edd-vmd 提供：
 *   - POST /api/mpt/businessKey/v1/provisioningQuery（CR-058，按 requestId 查批次状态）
 *   - GET  /api/mpt/business-key/provisioning/{requestId}/blocking-diagnosis（CR-065 §6.2，只读诊断）
 *   - POST /api/mpt/business-key/provisioning/{requestId}/clear-blocking（CR-065 §6.3，唯一破坏性入口）
 */

// 查询业务密钥开通批次状态（按 requestId，CR-058）
export function queryProvisioning(requestId) {
  return request({
    url: '/edd-vmd/api/mpt/businessKey/v1/provisioningQuery',
    method: 'post',
    data: { requestId: requestId }
  })
}

// 查询业务密钥开通批次阻塞诊断（CR-065 §6.2，只读，供页面展示）
export function getBlockingDiagnosis(requestId) {
  return request({
    url: '/edd-vmd/api/mpt/business-key/provisioning/' + requestId + '/blocking-diagnosis',
    method: 'get'
  })
}

// 一键清理业务密钥阻塞（CR-065 §6.3，唯一破坏性入口；服务端执行时重做全部门禁）
// data: { maintenanceRequestId, expectedState, expectedModifyTime, reasonCode, reason, ticketNo }
export function clearBlocking(requestId, data) {
  return request({
    url: '/edd-vmd/api/mpt/business-key/provisioning/' + requestId + '/clear-blocking',
    method: 'post',
    data: data
  })
}
