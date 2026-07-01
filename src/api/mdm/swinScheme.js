import request from '@/utils/request'

// 查询编码方案列表
export function listSwinScheme(query) {
  return request({
    url: '/edd-mdm/api/mpt/mdm/eead/swinScheme/v1/list',
    method: 'get',
    params: query
  })
}

// 查询所有编码方案（下拉选项）
export function listAllSwinScheme() {
  return request({
    url: '/edd-mdm/api/mpt/mdm/eead/swinScheme/v1/listAll',
    method: 'get'
  })
}

// 查询编码方案详情
export function getSwinScheme(code) {
  return request({
    url: '/edd-mdm/api/mpt/mdm/eead/swinScheme/v1/' + code,
    method: 'get'
  })
}

// 新增编码方案
export function addSwinScheme(data) {
  return request({
    url: '/edd-mdm/api/mpt/mdm/eead/swinScheme/v1/create',
    method: 'post',
    data: data
  })
}

// 修改编码方案
export function updateSwinScheme(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/mdm/eead/swinScheme/v1/' + code,
    method: 'put',
    data: data
  })
}

// 删除编码方案
export function delSwinScheme(code) {
  return request({
    url: '/edd-mdm/api/mpt/mdm/eead/swinScheme/v1/' + code,
    method: 'delete'
  })
}

// 停用编码方案
export function deactivateSwinScheme(code) {
  return request({
    url: '/edd-mdm/api/mpt/mdm/eead/swinScheme/v1/' + code + '/deactivate',
    method: 'post'
  })
}

// 启用编码方案
export function activateSwinScheme(code) {
  return request({
    url: '/edd-mdm/api/mpt/mdm/eead/swinScheme/v1/' + code + '/activate',
    method: 'post'
  })
}

// 查询编码方案历史版本
export function swinSchemeHistory(code) {
  return request({
    url: '/edd-mdm/api/mpt/mdm/eead/swinScheme/v1/' + code + '/history',
    method: 'get'
  })
}

// 导出编码方案
export function exportSwinScheme(query) {
  return request({
    url: '/edd-mdm/api/mpt/mdm/eead/swinScheme/v1/export',
    method: 'get',
    params: query,
    responseType: 'blob'
  })
}
