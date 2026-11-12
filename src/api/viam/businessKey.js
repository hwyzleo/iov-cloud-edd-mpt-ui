import request from '@/utils/request'

/**
 * 业务密钥开通批次治理（MPT）——SEC-VIAM-DSN-CR-002
 *
 * 接口由 iov-cloud-sec-viam 提供：
 *   - POST /api/mpt/viam/businessKey/provisioningQuery
 *   - GET  /api/mpt/viam/businessKey/provisioning/by-certificate-request/{certificateRequestId}
 *   - GET  /api/mpt/viam/businessKey/provisioning/{requestId}/blocking-diagnosis
 *   - POST /api/mpt/viam/businessKey/provisioning/{requestId}/clear-blocking
 *
 * 注意：证书申请 requestId（MPT-CERT-* / MPT-REISSUE-*）与开通批次 requestId（kp-*）
 * 是两套独立标识；诊断与清理只接受真实批次 requestId，需先经 by-certificate-request 寻址。
 * 清理为唯一破坏性入口，必须携带 maintenanceRequestId + expectedState + expectedModifyTime。
 */

// 按开通批次 requestId 查询批次治理视图（含用途明细、目录状态、最近租约、阻塞判定、modifyTime 锚点）
export function queryProvisioning(requestId, businessDomain) {
  return request({
    url: '/sec-viam/api/mpt/viam/businessKey/provisioningQuery',
    method: 'post',
    data: { requestId: requestId, businessDomain: businessDomain }
  })
}

// 证书维度寻址开通批次（只读桥接）
export function resolveByCertificateRequest(certificateRequestId, businessDomain, includeTerminal) {
  return request({
    url: '/sec-viam/api/mpt/viam/businessKey/provisioning/by-certificate-request/' + certificateRequestId,
    method: 'get',
    params: {
      businessDomain: businessDomain || 'V2C_COMM',
      includeTerminal: includeTerminal === true
    }
  })
}

// 阻塞诊断（只读、脱敏；含阻塞层级、证据与可清理性判断）
export function getBlockingDiagnosis(requestId) {
  return request({
    url: '/sec-viam/api/mpt/viam/businessKey/provisioning/' + requestId + '/blocking-diagnosis',
    method: 'get'
  })
}

// 批次级一键清阻断（唯一破坏性入口；服务端重做全部门禁）
// data: { maintenanceRequestId, expectedState, expectedModifyTime, reasonCode, reason, ticketNo }
export function clearBlocking(requestId, data) {
  return request({
    url: '/sec-viam/api/mpt/viam/businessKey/provisioning/' + requestId + '/clear-blocking',
    method: 'post',
    data: data
  })
}
