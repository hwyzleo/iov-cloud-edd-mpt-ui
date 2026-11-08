import request from '@/utils/request'

// 分页查询策略
export function listPolicy(type, query) {
  return request({
    url: '/system/sgw/policies/' + type + '/list',
    method: 'get',
    params: query
  })
}

// 查询策略详情
export function getPolicy(type, policyCode) {
  return request({
    url: '/system/sgw/policies/' + type + '/' + policyCode,
    method: 'get'
  })
}

// 新增策略草稿
export function addPolicy(type, data) {
  return request({
    url: '/system/sgw/policies/' + type,
    method: 'post',
    data: data
  })
}

// 更新策略草稿
export function updatePolicy(type, policyCode, data) {
  return request({
    url: '/system/sgw/policies/' + type + '/' + policyCode,
    method: 'put',
    data: data
  })
}

// 复制策略草稿
export function copyPolicy(type, policyCode, data) {
  return request({
    url: '/system/sgw/policies/' + type + '/' + policyCode + '/copy',
    method: 'post',
    data: data
  })
}

// 删除未被引用的策略
export function delPolicy(type, policyCode) {
  return request({
    url: '/system/sgw/policies/' + type + '/' + policyCode,
    method: 'delete'
  })
}

// 校验策略配置
export function validatePolicy(type, data) {
  return request({
    url: '/system/sgw/policies/' + type + '/validate',
    method: 'post',
    data: data
  })
}
