import request from '@/utils/request'

// 查询零件列表
export function listPartInfo(query) {
  return request({
    url: '/edd-vmd/api/mpt/partInfo/v1/list',
    method: 'get',
    params: query
  })
}

// 查询零件详细
export function getPartInfo(partInfoId) {
  return request({
    url: '/edd-vmd/api/mpt/partInfo/v1/' + partInfoId,
    method: 'get'
  })
}

// 新增零件
export function addPartInfo(data) {
  return request({
    url: '/edd-vmd/api/mpt/partInfo/v1',
    method: 'post',
    data: data
  })
}

// 修改零件
export function updatePartInfo(data) {
  return request({
    url: '/edd-vmd/api/mpt/partInfo/v1',
    method: 'put',
    data: data
  })
}

// 删除零件
export function delPartInfo(partInfoIds) {
  return request({
    url: '/edd-vmd/api/mpt/partInfo/v1/' + partInfoIds,
    method: 'delete'
  })
}
