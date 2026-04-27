import request from '@/utils/request'

// 查询生产配置列表
export function listBuildConfig(query) {
  return request({
    url: '/edd-vmd/api/mpt/buildConfig/v1/list',
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

// 新增生产配置
export function addBuildConfig(data) {
  return request({
    url: '/edd-vmd/api/mpt/buildConfig/v1',
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

// 删除生产配置
export function delBuildConfig(buildConfigIds) {
  return request({
    url: '/edd-vmd/api/mpt/buildConfig/v1/' + buildConfigIds,
    method: 'delete'
  })
}
