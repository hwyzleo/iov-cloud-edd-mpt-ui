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

// 发布软件内部版本
export function releaseSoftwareBuildVersion(softwareBuildVersionId) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/' + softwareBuildVersionId + '/action/release',
    method: 'post'
  })
}

// 停用软件内部版本
export function deprecateSoftwareBuildVersion(softwareBuildVersionId) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/' + softwareBuildVersionId + '/action/deprecate',
    method: 'post'
  })
}

// 退役软件内部版本
export function retireSoftwareBuildVersion(softwareBuildVersionId) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/' + softwareBuildVersionId + '/action/retire',
    method: 'post'
  })
}

// 查询软件内部版本测试报告列表
export function listTestReport(softwareBuildVersionId) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/' + softwareBuildVersionId + '/listTestReport',
    method: 'get'
  })
}

// 新增软件内部版本测试报告
export function addTestReport(softwareBuildVersionId, data) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/' + softwareBuildVersionId + '/action/addTestReport',
    method: 'post',
    data: data
  })
}

// 删除软件内部版本测试报告
export function delTestReport(softwareBuildVersionId, testReportIds) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/' + softwareBuildVersionId + '/testReport/' + testReportIds,
    method: 'delete'
  })
}

// 查询软件内部版本适配矩阵
export function listAdaptation(softwareBuildVersionId) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/' + softwareBuildVersionId + '/listAdaptation',
    method: 'get'
  })
}

// 保存软件内部版本适配矩阵
export function saveAdaptation(softwareBuildVersionId, data) {
  return request({
    url: '/iov-ota/api/mpt/softwareBuildVersion/v1/' + softwareBuildVersionId + '/action/saveAdaptation',
    method: 'post',
    data: data
  })
}
