import request from '@/utils/request'

// 查询驾驶员列表
export function listDriver(query) {
  return request({
    url: '/otd-tms/mpt/driver/list',
    method: 'get',
    params: query
  })
}

// 查询驾驶员详细
export function getDriver(driverId) {
  return request({
    url: '/otd-tms/mpt/driver/' + driverId,
    method: 'get'
  })
}

// 新增驾驶员
export function addDriver(data) {
  return request({
    url: '/otd-tms/mpt/driver',
    method: 'post',
    data: data
  })
}

// 修改驾驶员
export function updateDriver(data) {
  return request({
    url: '/otd-tms/mpt/driver',
    method: 'put',
    data: data
  })
}

// 删除驾驶员
export function delDriver(driverIds) {
  return request({
    url: '/otd-tms/mpt/driver/' + driverIds,
    method: 'delete'
  })
}

// 查询所有驾驶员列表
export function listAllDriver() {
  return request({
    url: '/otd-tms/mpt/driver/listAll',
    method: 'get'
  })
}
