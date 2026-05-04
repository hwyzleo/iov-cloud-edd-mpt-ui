import request from '@/utils/request'

// 查询生产配置列表
export function listBuildConfig(query) {
  return request({
    url: '/edd-vmd/api/mpt/buildConfig/v1/list',
    method: 'get',
    params: query
  })
}

// 查询生产配置特征值列表
export function listBuildConfigFeatureCode(buildConfigCode, query) {
  return request({
    url: '/edd-vmd/api/mpt/buildConfig/v1/' + buildConfigCode + '/featureCode/list',
    method: 'get',
    params: query
  })
}

// 查询生产配置详细
export function getBuildConfig(buildConfigId) {
  return request({
    url: '/edd-vmd/api/mpt/buildConfig/v1/' + buildConfigId,
    method: 'get'
  })
}

// 查询生产配置特征值详细
export function getBuildConfigFeatureCode(buildConfigCode, buildConfigFeatureCodeId) {
  return request({
    url: '/edd-vmd/api/mpt/buildConfig/v1/' + buildConfigCode + '/featureCode/' + buildConfigFeatureCodeId,
    method: 'get'
  })
}

// 新增生产配置
export function addBuildConfig(data) {
  return request({
    url: '/edd-vmd/api/mpt/buildConfig/v1',
    method: 'post',
    data: data
  })
}

// 新增生产配置特征值
export function addBuildConfigFeatureCode(buildConfigCode, data) {
  return request({
    url: '/edd-vmd/api/mpt/buildConfig/v1/' + buildConfigCode + '/featureCode',
    method: 'post',
    data: data
  })
}

// 修改生产配置
export function updateBuildConfig(data) {
  return request({
    url: '/edd-vmd/api/mpt/buildConfig/v1',
    method: 'put',
    data: data
  })
}

// 修改生产配置特征值
export function updateBuildConfigFeatureCode(buildConfigCode, data) {
  return request({
    url: '/edd-vmd/api/mpt/buildConfig/v1/' + buildConfigCode + '/featureCode',
    method: 'put',
    data: data
  })
}

// 删除生产配置
export function delBuildConfig(buildConfigIds) {
  return request({
    url: '/edd-vmd/api/mpt/buildConfig/v1/' + buildConfigIds,
    method: 'delete'
  })
}

// 删除生产配置特征值
export function delBuildConfigFeatureCode(buildConfigCode, buildConfigFeatureCodeIds) {
  return request({
    url: '/edd-vmd/api/mpt/buildConfig/v1/' + buildConfigCode + '/featureCode/' + buildConfigFeatureCodeIds,
    method: 'delete'
  })
}
