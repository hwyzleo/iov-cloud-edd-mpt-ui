import request from '@/utils/request'

// 分页查询证书申请记录
export function listVehicleCertificate(query) {
  return request({
    url: '/edd-vmd/api/mpt/vehicleCertificate/v1/list',
    method: 'get',
    params: query
  })
}

// 查询证书申请详情与操作审计时间线
export function getVehicleCertificate(id) {
  return request({
    url: '/edd-vmd/api/mpt/vehicleCertificate/v1/' + id,
    method: 'get'
  })
}

// 人工补申请证书（MES请求未达VMD）
export function compensateVehicleCertificate(data) {
  return request({
    url: '/edd-vmd/api/mpt/vehicleCertificate/v1/compensate',
    method: 'post',
    data: data
  })
}

// 对已有申请继续/对账
export function reconcileVehicleCertificate(id, data) {
  return request({
    url: '/edd-vmd/api/mpt/vehicleCertificate/v1/' + id + '/reconcile',
    method: 'post',
    data: data
  })
}

// 安装结果补录（原因与工单必填）
export function confirmInstalledVehicleCertificate(id, data) {
  return request({
    url: '/edd-vmd/api/mpt/vehicleCertificate/v1/' + id + '/confirmInstalled',
    method: 'post',
    data: data
  })
}

// 获取已签发证书本体（只读，供再次获取注入设备）
export function queryVehicleCertificateBody(id) {
  return request({
    url: '/edd-vmd/api/mpt/vehicleCertificate/v1/' + id + '/certificate',
    method: 'get'
  })
}
