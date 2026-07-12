import request from '@/utils/request'

// 查询软件包信息列表
export function listSoftwarePackage(query) {
  return request({
    url: '/iov-ota/api/mpt/softwarePackage/v1/list',
    method: 'get',
    params: query
  })
}

// 查询软件包信息详细
export function getSoftwarePackage(softwarePackageId) {
  return request({
    url: '/iov-ota/api/mpt/softwarePackage/v1/' + softwarePackageId,
    method: 'get'
  })
}

// 新增软件包信息
export function addSoftwarePackage(data) {
  return request({
    url: '/iov-ota/api/mpt/softwarePackage/v1',
    method: 'post',
    data: data
  })
}

// 修改软件包信息
export function updateSoftwarePackage(data) {
  return request({
    url: '/iov-ota/api/mpt/softwarePackage/v1',
    method: 'put',
    data: data
  })
}

// 删除软件包信息
export function delSoftwarePackage(softwarePackageIds) {
  return request({
    url: '/iov-ota/api/mpt/softwarePackage/v1/' + softwarePackageIds,
    method: 'delete'
  })
}

// 停用软件包
export function deprecateSoftwarePackage(softwarePackageId) {
  return request({
    url: '/iov-ota/api/mpt/softwarePackage/v1/' + softwarePackageId + '/action/deprecate',
    method: 'post'
  })
}

// 吊销软件包
export function revokeSoftwarePackage(softwarePackageId) {
  return request({
    url: '/iov-ota/api/mpt/softwarePackage/v1/' + softwarePackageId + '/action/revoke',
    method: 'post'
  })
}

// 退役软件包
export function retireSoftwarePackage(softwarePackageId) {
  return request({
    url: '/iov-ota/api/mpt/softwarePackage/v1/' + softwarePackageId + '/action/retire',
    method: 'post'
  })
}
