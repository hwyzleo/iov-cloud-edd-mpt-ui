import request from '@/utils/request'

// 查询门店列表
export function listDealership(query) {
  return request({
    url: '/edd-org/mpt/dealership/list',
    method: 'get',
    params: query
  })
}

// 查询门店详细
export function getDealership(dealershipId) {
  return request({
    url: '/edd-org/mpt/dealership/' + dealershipId,
    method: 'get'
  })
}

// 新增门店
export function addDealership(data) {
  return request({
    url: '/edd-org/mpt/dealership',
    method: 'post',
    data: data
  })
}

// 修改门店
export function updateDealership(data) {
  return request({
    url: '/edd-org/mpt/dealership',
    method: 'put',
    data: data
  })
}

// 删除门店
export function delDealership(dealershipIds) {
  return request({
    url: '/edd-org/mpt/dealership/' + dealershipIds,
    method: 'delete'
  })
}

// 查询组织下拉树结构
export function orgTreeSelect(query) {
  return request({
    url: '/edd-org/mpt/dealership/orgTree',
    method: 'get',
    params: query
  })
}
