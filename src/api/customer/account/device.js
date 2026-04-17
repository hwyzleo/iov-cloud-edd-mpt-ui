import request from '@/utils/request'

// 查询设备列表
export function listDevice(query) {
  return request({
    url: '/sec-ciam/api/mp/device/v1/devices',
    method: 'get',
    params: {
      ...query,
      page: query.pageNum ? query.pageNum - 1 : 0,
      size: query.pageSize || 20
    }
  })
}

// 查询设备详细
export function getDevice(deviceId) {
  return request({
    url: '/sec-ciam/api/mp/device/v1/devices/detail',
    method: 'get',
    params: { deviceId }
  })
}

// 查询用户的设备列表
export function getUserDevices(userId) {
  return request({
    url: '/sec-ciam/api/mp/device/v1/devices/user',
    method: 'get',
    params: { userId }
  })
}
