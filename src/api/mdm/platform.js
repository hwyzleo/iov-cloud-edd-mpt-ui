import request from '@/utils/request'

// 查询平台列表
export function listPlatform(query) {
  return request({
    url: '/edd-mdm/api/mpt/platform/v1/list',
    method: 'get',
    params: query
  })
}

// 查询平台详细
export function getPlatform(code) {
  return request({
    url: '/edd-mdm/api/mpt/platform/v1/' + code,
    method: 'get'
  })
}

// 新增平台
export function addPlatform(data) {
  return request({
    url: '/edd-mdm/api/mpt/platform/v1/create',
    method: 'post',
    data: data
  })
}

// 修改平台
export function updatePlatform(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/platform/v1/' + code,
    method: 'put',
    data: data
  })
}

// 删除平台
export function delPlatform(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/platform/v1/' + code,
    method: 'delete',
    params: { modifyBy }
  })
}

// 停用平台
export function deactivatePlatform(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/platform/v1/' + code + '/deactivate',
    method: 'post',
    params: { modifyBy }
  })
}

// 查询平台历史版本
export function listPlatformHistory(code) {
  return request({
    url: '/edd-mdm/api/mpt/platform/v1/' + code + '/history',
    method: 'get'
  })
}
