import request from '@/utils/request'

// 查询车辆的用户绑定、车机登录与首次激活详情
export function getUserVehicleRelation(vin) {
  return request({
    url: '/iov-tsp/api/mpt/userVehicle/v1/relation',
    method: 'get',
    params: { vin }
  })
}

// 人工解绑指定用户车辆关系（rowVersion 防过期页面，idempotencyKey 防重复提交）
export function unbindUserVehicleRelation(relationId, data) {
  return request({
    url: '/iov-tsp/api/mpt/userVehicle/v1/relation/' + relationId + '/unbind',
    method: 'post',
    data
  })
}

// 人工重试凭证撤销，沿用原解绑操作ID
export function retryUserVehicleRevocation(operationId) {
  return request({
    url: '/iov-tsp/api/mpt/userVehicle/v1/unbind/operations/' + operationId + '/retry-revocation',
    method: 'post'
  })
}
