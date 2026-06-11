import request from '@/utils/request'

// 查询零件列表
export function listPart(query) {
  return request({
    url: '/edd-mdm/api/mpt/material/part/v1/list',
    method: 'get',
    params: query
  })
}

// 查询零件详细
export function getPart(code) {
  return request({
    url: '/edd-mdm/api/mpt/material/part/v1/' + code,
    method: 'get'
  })
}

// 新增零件
export function addPart(data) {
  return request({
    url: '/edd-mdm/api/mpt/material/part/v1/create',
    method: 'post',
    data: data
  })
}

// 修改零件
export function updatePart(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/material/part/v1/' + code,
    method: 'put',
    data: data
  })
}

// 删除零件
export function delPart(code, operator) {
  return request({
    url: '/edd-mdm/api/mpt/material/part/v1/' + code,
    method: 'delete',
    params: { operator }
  })
}

// 强制删除零件
export function forceDelPart(code, operator) {
  return request({
    url: '/edd-mdm/api/mpt/material/part/v1/' + code + '/force',
    method: 'delete',
    params: { operator }
  })
}

// 停用零件
export function deactivatePart(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/material/part/v1/' + code + '/deactivate',
    method: 'post',
    params: { modifyBy }
  })
}

// 查询所有ACTIVE零件
export function listAllParts() {
  return request({
    url: '/edd-mdm/api/mpt/material/part/v1/listAll',
    method: 'get'
  })
}

// 导出零件
export function exportPart() {
  return request({
    url: '/edd-mdm/api/mpt/material/part/v1/export',
    method: 'get'
  })
}

// 查询零件历史版本
export function listPartHistory(code) {
  return request({
    url: '/edd-mdm/api/mpt/material/part/v1/' + code + '/history',
    method: 'get'
  })
}

// 手动指定code创建
export function createWithCode(data) {
  return request({
    url: '/edd-mdm/api/mpt/material/part/v1/createWithCode',
    method: 'post',
    data: data
  })
}

// 存量批量导入
export function importPart(data) {
  return request({
    url: '/edd-mdm/api/mpt/material/part/v1/import',
    method: 'post',
    data: data
  })
}

// 代次升级
export function upgradeGeneration(code, operator) {
  return request({
    url: '/edd-mdm/api/mpt/material/part/v1/' + code + '/upgradeGeneration',
    method: 'post',
    params: { operator }
  })
}

// 小修订
export function minorRevision(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/material/part/v1/' + code + '/minorRevision',
    method: 'put',
    data: data
  })
}
