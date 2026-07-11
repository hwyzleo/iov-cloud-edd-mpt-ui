import request from '@/utils/request'

// 查询软件内部版本信息列表
export function listSoftwareBuildVersion(query) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/list',
    method: 'get',
    params: query
  })
}

// 查询软件内部版本下软件包
export function listSoftwareBuildVersionPackage(softwareBuildVersionId, query) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/' + softwareBuildVersionId + '/listSoftwarePackage',
    method: 'get',
    params: query
  })
}

// 查询软件内部版本下依赖
export function listSoftwareBuildVersionDependency(softwareBuildVersionId, query) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/' + softwareBuildVersionId + '/listDependency',
    method: 'get',
    params: query
  })
}

// 查询软件内部版本信息详细
export function getSoftwareBuildVersion(softwareBuildVersionId) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/' + softwareBuildVersionId,
    method: 'get'
  })
}

// 新增软件内部版本信息
export function addSoftwareBuildVersion(data) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1',
    method: 'post',
    data: data
  })
}

// 新增关联的软件包
export function addSoftwareBuildVersionPackage(softwareBuildVersionId, softwarePackageIds) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/' + softwareBuildVersionId + '/action/addSoftwarePackage/' + softwarePackageIds,
    method: 'post'
  })
}

// 新增依赖的软件内部版本
export function addSoftwareBuildVersionDependency(softwareBuildVersionId, softwareBuildVersionIds, adaptiveLevel) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/' + softwareBuildVersionId + '/action/addDependency/' + softwareBuildVersionIds + '?adaptiveLevel=' + adaptiveLevel,
    method: 'post'
  })
}

// 修改软件内部版本信息
export function updateSoftwareBuildVersion(data) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1',
    method: 'put',
    data: data
  })
}

// 修改依赖的软件内部版本
export function updateSoftwareBuildVersionDependency(softwareBuildVersionId, softwareBuildVersionIds, adaptiveLevel) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/' + softwareBuildVersionId + '/action/editDependency/' + softwareBuildVersionIds + '?adaptiveLevel=' + adaptiveLevel,
    method: 'post'
  })
}

// 删除软件内部版本信息
export function delSoftwareBuildVersion(softwareBuildVersionIds) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/' + softwareBuildVersionIds,
    method: 'delete'
  })
}

// 删除关联的软件包
export function delSoftwareBuildVersionPackage(softwareBuildVersionId, softwarePackageIds) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/' + softwareBuildVersionId + '/action/removeSoftwarePackage/' + softwarePackageIds,
    method: 'post'
  })
}

// 删除依赖的软件内部版本
export function delSoftwareBuildVersionDependency(softwareBuildVersionId, softwarePartVersionIds) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/' + softwareBuildVersionId + '/action/removeDependency/' + softwarePartVersionIds,
    method: 'post'
  })
}
