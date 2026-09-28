import request from '@/utils/request'

// 发布新版本
export function publishConfig() {
  return request({
    url: '/edd-opgw/api/mpt/opgw/publish/v1',
    method: 'post'
  })
}

// 查询当前生效版本
export function getCurrentVersion() {
  return request({
    url: '/edd-opgw/api/mpt/opgw/publish/v1/current',
    method: 'get'
  })
}

// 查询版本列表
export function listVersion() {
  return request({
    url: '/edd-opgw/api/mpt/opgw/publish/v1/list',
    method: 'get'
  })
}

// 回滚到指定版本
export function rollbackConfig(version) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/publish/v1/' + version + '/rollback',
    method: 'post'
  })
}
