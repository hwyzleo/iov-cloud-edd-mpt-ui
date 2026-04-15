import request from '@/utils/request'

// 查询SIM卡列表
export function listSim(query) {
  return request({
    url: '/tsp-mno/mpt/sim/list',
    method: 'get',
    params: query
  })
}

// 查询SIM卡详细
export function getSim(simId) {
  return request({
    url: '/tsp-mno/mpt/sim/' + simId,
    method: 'get'
  })
}

// 新增SIM卡
export function addSim(data) {
  return request({
    url: '/tsp-mno/mpt/sim',
    method: 'post',
    data: data
  })
}

// 修改SIM卡
export function updateSim(data) {
  return request({
    url: '/tsp-vmd/mpt/sim',
    method: 'put',
    data: data
  })
}

// 删除SIM卡
export function delSim(simIds) {
  return request({
    url: '/tsp-mno/mpt/sim/' + simIds,
    method: 'delete'
  })
}
