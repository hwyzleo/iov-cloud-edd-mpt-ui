import request from '@/utils/request'

// 查询物流据点列表
export function listLogisticsNode(query) {
  return request({
    url: '/otd-tms/mpt/logisticsNode/list',
    method: 'get',
    params: query
  })
}

// 查询物流据点详细
export function getLogisticsNode(logisticsNodeId) {
  return request({
    url: '/otd-tms/mpt/logisticsNode/' + logisticsNodeId,
    method: 'get'
  })
}

// 新增物流据点
export function addLogisticsNode(data) {
  return request({
    url: '/otd-tms/mpt/logisticsNode',
    method: 'post',
    data: data
  })
}

// 修改物流据点
export function updateLogisticsNode(data) {
  return request({
    url: '/otd-tms/mpt/logisticsNode',
    method: 'put',
    data: data
  })
}

// 删除物流据点
export function delLogisticsNode(logisticsNodeIds) {
  return request({
    url: '/otd-tms/mpt/logisticsNode/' + logisticsNodeIds,
    method: 'delete'
  })
}

// 查询所有物流据点列表
export function listAllLogisticsNode() {
  return request({
    url: '/otd-tms/mpt/logisticsNode/listAll',
    method: 'get'
  })
}
