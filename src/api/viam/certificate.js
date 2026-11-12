import request from '@/utils/request'

/**
 * 车辆设备证书管理（MPT）——SEC-VIAM-DSN-CR-002
 *
 * 接口由 iov-cloud-sec-viam 提供（网关前缀 /sec-viam，MPT 命名空间 /api/mpt/viam）：
 *   - GET  /api/mpt/viam/certificate/list
 *   - GET  /api/mpt/viam/certificate/request/{requestId}
 *   - POST /api/mpt/viam/certificate/compensate
 *   - POST /api/mpt/viam/certificate/request/{requestId}/reconcile
 *   - POST /api/mpt/viam/certificate/request/{requestId}/confirmInstalled
 *   - GET  /api/mpt/viam/certificate/request/{requestId}/certificate
 *   - POST /api/mpt/viam/certificate/request/{requestId}/reissue
 *
 * 约定：
 *   - 一律以 requestId 寻址（数据库自增 id 不出现在契约中）；
 *   - 响应统一 ApiResponse（payload 在 response.data）；
 *   - 证书本体现取现用（GET .../certificate），补偿/对账/补录/重签不返回证书本体；
 *   - 操作人由服务端取 EIAM 会话，前端不传 operatorId。
 */

// 分页查询证书申请记录
export function listCertificate(query) {
  return request({
    url: '/sec-viam/api/mpt/viam/certificate/list',
    method: 'get',
    params: query
  })
}

// 查询证书申请详情与操作审计时间线
export function getCertificateDetail(requestId) {
  return request({
    url: '/sec-viam/api/mpt/viam/certificate/request/' + requestId,
    method: 'get'
  })
}

// 人工补申请证书（MES 请求未达；CSR 必须来自受信工位回读）
export function compensateCertificate(data) {
  return request({
    url: '/sec-viam/api/mpt/viam/certificate/compensate',
    method: 'post',
    data: data
  })
}

// 对已有申请继续/对账
export function reconcileCertificate(requestId, data) {
  return request({
    url: '/sec-viam/api/mpt/viam/certificate/request/' + requestId + '/reconcile',
    method: 'post',
    data: data
  })
}

// 安装结果补录（原因与工单必填）
export function confirmInstalledCertificate(requestId, data) {
  return request({
    url: '/sec-viam/api/mpt/viam/certificate/request/' + requestId + '/confirmInstalled',
    method: 'post',
    data: data
  })
}

// 获取已签发证书本体（只读，不落库不缓存）
export function queryCertificateMaterial(requestId) {
  return request({
    url: '/sec-viam/api/mpt/viam/certificate/request/' + requestId + '/certificate',
    method: 'get'
  })
}

// 重新签发/续期（新 CSR；旧证进入 SUPERSEDED，新记录独立 requestId）
export function reissueCertificate(requestId, data) {
  return request({
    url: '/sec-viam/api/mpt/viam/certificate/request/' + requestId + '/reissue',
    method: 'post',
    data: data
  })
}
