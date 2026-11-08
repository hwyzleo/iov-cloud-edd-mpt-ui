import request from '@/utils/request'

// 查询当前草稿修订号与目标版本
export function getWorkspace() {
  return request({
    url: '/system/sgw/config-versions/workspace',
    method: 'get'
  })
}

// 分页查询版本历史
export function listConfigVersions(query) {
  return request({
    url: '/system/sgw/config-versions/list',
    method: 'get',
    params: query
  })
}

// 查询版本详情
export function getConfigVersion(versionNo) {
  return request({
    url: '/system/sgw/config-versions/' + versionNo,
    method: 'get'
  })
}

// 版本差异
export function diffConfigVersions(from, to) {
  return request({
    url: '/system/sgw/config-versions/diff',
    method: 'get',
    params: { from: from, to: to }
  })
}

// 发布当前草稿修订
export function publishConfig(data) {
  return request({
    url: '/system/sgw/config-versions',
    method: 'post',
    data: data
  })
}

// 回滚到历史版本
export function rollbackConfig(versionNo, data) {
  return request({
    url: '/system/sgw/config-versions/' + versionNo + '/rollback',
    method: 'post',
    data: data
  })
}
