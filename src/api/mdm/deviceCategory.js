import request from '@/utils/request'

export function listDeviceCategory(query) {
  return request({
    url: '/edd-mdm/api/mpt/deviceCategory/v1/list',
    method: 'get',
    params: query
  })
}

export function getDeviceCategory(code) {
  return request({
    url: '/edd-mdm/api/mpt/deviceCategory/v1/' + code,
    method: 'get'
  })
}

export function addDeviceCategory(data) {
  return request({
    url: '/edd-mdm/api/mpt/deviceCategory/v1/create',
    method: 'post',
    data: data
  })
}

export function updateDeviceCategory(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/deviceCategory/v1/' + code,
    method: 'put',
    data: data
  })
}

export function delDeviceCategory(code, operator) {
  return request({
    url: '/edd-mdm/api/mpt/deviceCategory/v1/' + code,
    method: 'delete',
    params: { operator }
  })
}

export function deactivateDeviceCategory(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/deviceCategory/v1/' + code + '/deactivate',
    method: 'post',
    params: { modifyBy }
  })
}

export function listAllDeviceCategory() {
  return request({
    url: '/edd-mdm/api/mpt/deviceCategory/v1/listAll',
    method: 'get'
  })
}

export function listDeviceCategoryHistory(code) {
  return request({
    url: '/edd-mdm/api/mpt/deviceCategory/v1/' + code + '/history',
    method: 'get'
  })
}

// 标准目录预检（CR-037）：返回目录版本、标准设备族数量及冲突
// GET /api/mpt/deviceCategory/v1/catalog/preview
export function previewDeviceCategoryCatalog() {
  return request({
    url: '/edd-mdm/api/mpt/deviceCategory/v1/catalog/preview',
    method: 'get'
  })
}

// 标准目录初始化（CR-037）：受控幂等导入 24 个标准设备族为 ACTIVE，不覆盖已有业务数据
// POST /api/mpt/deviceCategory/v1/catalog/bootstrap
export function bootstrapDeviceCategory() {
  return request({
    url: '/edd-mdm/api/mpt/deviceCategory/v1/catalog/bootstrap',
    method: 'post'
  })
}
