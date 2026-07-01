import request from '@/utils/request'

// 查询SWIN定义列表
export function listSwinDefinition(query) {
  return request({
    url: '/edd-mdm/api/mpt/swinDefinition/v1/list',
    method: 'get',
    params: query
  })
}

// 查询SWIN定义详情
export function getSwinDefinition(swinCode) {
  return request({
    url: '/edd-mdm/api/mpt/swinDefinition/v1/' + swinCode,
    method: 'get'
  })
}

// 新增SWIN定义
export function addSwinDefinition(data) {
  return request({
    url: '/edd-mdm/api/mpt/swinDefinition/v1/create',
    method: 'post',
    data: data
  })
}

// 修改SWIN定义
export function updateSwinDefinition(swinCode, data) {
  return request({
    url: '/edd-mdm/api/mpt/swinDefinition/v1/' + swinCode,
    method: 'put',
    data: data
  })
}

// 删除SWIN定义
export function delSwinDefinition(swinCode) {
  return request({
    url: '/edd-mdm/api/mpt/swinDefinition/v1/' + swinCode,
    method: 'delete'
  })
}

// 强制删除SWIN定义
export function forceDelSwinDefinition(swinCode, data) {
  return request({
    url: '/edd-mdm/api/mpt/swinDefinition/v1/' + swinCode + '/force',
    method: 'delete',
    data: data
  })
}

// 停用SWIN定义
export function deactivateSwinDefinition(swinCode) {
  return request({
    url: '/edd-mdm/api/mpt/swinDefinition/v1/' + swinCode + '/deactivate',
    method: 'post'
  })
}

// 绑定受管系统
export function bindManagedSystem(swinCode, data) {
  return request({
    url: '/edd-mdm/api/mpt/swinDefinition/v1/' + swinCode + '/managedSystems/bind',
    method: 'post',
    data: data
  })
}

// 解绑受管系统
export function unbindManagedSystem(swinCode, data) {
  return request({
    url: '/edd-mdm/api/mpt/swinDefinition/v1/' + swinCode + '/managedSystems/unbind',
    method: 'post',
    data: data
  })
}

// 查询SWIN定义历史版本
export function swinDefinitionHistory(swinCode) {
  return request({
    url: '/edd-mdm/api/mpt/swinDefinition/v1/' + swinCode + '/history',
    method: 'get'
  })
}

// 导出SWIN定义
export function exportSwinDefinition(query) {
  return request({
    url: '/edd-mdm/api/mpt/swinDefinition/v1/export',
    method: 'get',
    params: query,
    responseType: 'blob'
  })
}
