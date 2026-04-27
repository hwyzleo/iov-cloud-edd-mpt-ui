import request from '@/utils/request'

// 查询设备信息列表
export function listDevice(query) {
  return request({
    url: '/edd-vmd/api/mpt/device/v1/list',
    method: 'get',
    params: query
  })
}

// 查询所有设备项
export function listAllDeviceItem() {
  return request({
    url: '/edd-vmd/api/mpt/device/v1/listAllDeviceItem',
    method: 'get'
  })
}

// 查询所有设备
export function listAllDevice() {
  return request({
    url: '/edd-vmd/api/mpt/device/v1/listAllDevice',
    method: 'get'
  })
}

// 查询设备信息详细
export function getDevice(deviceId) {
  return request({
    url: '/edd-vmd/api/mpt/device/v1/' + deviceId,
    method: 'get'
  })
}

// 新增设备信息
export function addDevice(data) {
  return request({
    url: '/edd-vmd/api/mpt/device/v1',
    method: 'post',
    data: data
  })
}

// 修改设备信息
export function updateDevice(data) {
  return request({
    url: '/edd-vmd/api/mpt/device/v1',
    method: 'put',
    data: data
  })
}

// 删除设备信息
export function delDevice(deviceIds) {
  return request({
    url: '/edd-vmd/api/mpt/device/v1/' + deviceIds,
    method: 'delete'
  })
}
