import request from '@/utils/request'

// 查询SIM信息列表
export function listSim(query) {
  return request({
    url: '/iov-ccs/api/mpt/simInfo/v1/list',
    method: 'get',
    params: query
  })
}

// 查询SIM信息详情
export function getSim(iccid) {
  return request({
    url: '/iov-ccs/api/mpt/simInfo/v1/' + iccid,
    method: 'get'
  })
}

// 新增SIM信息
export function addSim(data) {
  return request({
    url: '/iov-ccs/api/mpt/simInfo/v1',
    method: 'post',
    data: data
  })
}

// 批量新增SIM信息
export function batchAddSim(data) {
  return request({
    url: '/iov-ccs/api/mpt/simInfo/v1/batch',
    method: 'post',
    data: data
  })
}

// 修改SIM信息
export function updateSim(iccid, data) {
  return request({
    url: '/iov-ccs/api/mpt/simInfo/v1/' + iccid,
    method: 'put',
    data: data
  })
}

// 删除SIM信息
export function delSim(iccid) {
  return request({
    url: '/iov-ccs/api/mpt/simInfo/v1/' + iccid,
    method: 'delete'
  })
}

// 批量删除SIM信息
export function batchDelSim(iccids) {
  return request({
    url: '/iov-ccs/api/mpt/simInfo/v1/batch/' + iccids.join(','),
    method: 'delete'
  })
}

// 同步SIM数据
export function syncSimData(data) {
  return request({
    url: '/iov-ccs/api/mpt/simInfo/v1/sync',
    method: 'post',
    data: data
  })
}
