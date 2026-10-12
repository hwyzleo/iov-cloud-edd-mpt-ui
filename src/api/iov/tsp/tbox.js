import request from '@/utils/request'

// 分页查询 TBOX 列表（TSP-DSN-CR-009）
export function listTbox(query) {
  return request({
    url: '/iov-tsp/api/mpt/tbox/v1/list',
    method: 'get',
    params: query
  })
}

// 查询 TBOX 运营详情
export function getTbox(sn) {
  return request({
    url: '/iov-tsp/api/mpt/tbox/v1/' + sn,
    method: 'get'
  })
}

// 查询 TBOX 生命周期时间线
export function getTboxTimeline(sn) {
  return request({
    url: '/iov-tsp/api/mpt/tbox/v1/' + sn + '/timeline',
    method: 'get'
  })
}

// 导出 TBOX 列表（沿用列表过滤与脱敏结果，GET 二进制流）
export function exportTbox(query) {
  return request({
    url: '/iov-tsp/api/mpt/tbox/v1/export',
    method: 'get',
    params: query,
    responseType: 'blob'
  })
}
