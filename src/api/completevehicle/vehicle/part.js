import request from '@/utils/request'

// 查询零件信息列表
export function listPart(query) {
  return request({
    url: '/edd-vmd/api/mpt/part/v1/list',
    method: 'get',
    params: query
  })
}

// 查询零件信息详细
export function getPart(partId) {
  return request({
    url: '/edd-vmd/api/mpt/part/v1/' + partId,
    method: 'get'
  })
}

// 新增零件信息
export function addPart(data) {
  return request({
    url: '/edd-vmd/api/mpt/part/v1',
    method: 'post',
    data: data
  })
}

// 修改零件信息
export function updatePart(data) {
  return request({
    url: '/edd-vmd/api/mpt/part/v1',
    method: 'put',
    data: data
  })
}

// 删除零件信息
export function delPart(partIds) {
  return request({
    url: '/edd-vmd/api/mpt/part/v1/' + partIds,
    method: 'delete'
  })
}
