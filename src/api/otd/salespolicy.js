import request from '@/utils/request'

// 获取Configuration白名单
export function getConfigPolicy(saleModelCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/configPolicy',
    method: 'get'
  })
}

// 获取可用的Configuration列表（MDM投影 + 白名单状态）
export function getAvailableConfigPolicies(saleModelCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/configPolicy/available',
    method: 'get'
  })
}

// 创建Configuration白名单
export function createConfigPolicy(saleModelCode, data) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/configPolicy',
    method: 'post',
    data: data
  })
}

// 删除Configuration白名单
export function deleteConfigPolicy(saleModelCode, configurationCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/configPolicy/' + configurationCode,
    method: 'delete'
  })
}

// 批量导入Configuration白名单
export function importConfigPolicy(saleModelCode, file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/configPolicy/import',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 获取OptionCode销售策略列表
export function getOptionPolicy(saleModelCode, query) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/optionPolicy',
    method: 'get',
    params: query
  })
}

// 获取可用的OptionCode列表（按OptionFamily分组）
export function getAvailableOptionPolicies(saleModelCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/optionPolicy/available',
    method: 'get'
  })
}

// 创建OptionCode销售策略
export function createOptionPolicy(saleModelCode, data) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/optionPolicy',
    method: 'post',
    data: data
  })
}

// 更新OptionCode销售策略
export function updateOptionPolicy(saleModelCode, id, data) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/optionPolicy/' + id,
    method: 'put',
    data: data
  })
}

// 删除OptionCode销售策略
export function deleteOptionPolicy(saleModelCode, id) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/optionPolicy/' + id,
    method: 'delete'
  })
}
