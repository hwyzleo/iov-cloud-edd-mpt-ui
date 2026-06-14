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
