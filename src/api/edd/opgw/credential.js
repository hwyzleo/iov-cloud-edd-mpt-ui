import request from '@/utils/request'

// 查询调用方凭证列表
export function listCredential(clientId) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/credential/v1/list/' + clientId,
    method: 'get'
  })
}

// 根据ID获取凭证
export function getCredential(credentialId) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/credential/v1/' + credentialId,
    method: 'get'
  })
}

// 创建凭证（密钥仅展示一次）
export function addCredential(data) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/credential/v1',
    method: 'post',
    data: data
  })
}

// 重置凭证（密钥仅展示一次）
export function resetCredential(credentialId) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/credential/v1/' + credentialId + '/reset',
    method: 'post'
  })
}

// 停用凭证
export function disableCredential(credentialId) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/credential/v1/' + credentialId,
    method: 'delete'
  })
}
