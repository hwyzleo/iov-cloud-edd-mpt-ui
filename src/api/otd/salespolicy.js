import request from '@/utils/request'

// ==================== Model 销售策略 ====================

// 获取 Model 销售策略列表
export function getModelPolicy(saleModelCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/modelPolicy',
    method: 'get'
  })
}

// 获取单个 Model 销售策略详情
export function getModelPolicyDetail(saleModelCode, modelCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/modelPolicy/' + modelCode,
    method: 'get'
  })
}

// 创建/更新 Model 销售策略
export function createModelPolicy(saleModelCode, data) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/modelPolicy',
    method: 'post',
    data: data
  })
}

// 删除 Model 销售策略
export function deleteModelPolicy(saleModelCode, modelCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/modelPolicy/' + modelCode,
    method: 'delete'
  })
}

// ==================== Variant 销售策略 ====================

// 获取 Variant 销售策略列表
export function getVariantPolicy(saleModelCode, modelCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/variantPolicy',
    method: 'get',
    params: { modelCode }
  })
}

// 获取单个 Variant 销售策略详情
export function getVariantPolicyDetail(saleModelCode, variantCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/variantPolicy/' + variantCode,
    method: 'get'
  })
}

// 创建/更新 Variant 销售策略
export function createVariantPolicy(saleModelCode, data) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/variantPolicy',
    method: 'post',
    data: data
  })
}

// 删除 Variant 销售策略
export function deleteVariantPolicy(saleModelCode, variantCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/variantPolicy/' + variantCode,
    method: 'delete'
  })
}

// ==================== Configuration 白名单 ====================

// 获取Configuration白名单
export function getConfigPolicy(saleModelCode, variantCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/configPolicy',
    method: 'get',
    params: { variantCode }
  })
}

// 获取可用的Configuration列表（MDM投影 + 白名单状态）
export function getAvailableConfigPolicies(saleModelCode, variantCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/configPolicy/available',
    method: 'get',
    params: { variantCode }
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
export function deleteConfigPolicy(saleModelCode, variantCode, configurationCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/configPolicy/' + configurationCode,
    method: 'delete',
    params: { variantCode }
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

// 获取单条OptionCode销售策略详情
export function getOptionPolicyDetail(saleModelCode, id) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/optionPolicy/' + id,
    method: 'get'
  })
}

// 获取可用的OptionCode列表（按OptionFamily分组）
export function getAvailableOptionPolicies(saleModelCode, variantCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/optionPolicy/available',
    method: 'get',
    params: { variantCode }
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
