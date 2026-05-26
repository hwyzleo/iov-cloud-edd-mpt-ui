import request from '@/utils/request'

// 查询车系列表
export function listSeries(query) {
  return request({
    url: '/edd-mdm/api/mpt/series/v1/list',
    method: 'get',
    params: query
  })
}

// 查询车系详细
export function getSeries(code) {
  return request({
    url: '/edd-mdm/api/mpt/series/v1/' + code,
    method: 'get'
  })
}

// 新增车系
export function addSeries(data) {
  return request({
    url: '/edd-mdm/api/mpt/series/v1/create',
    method: 'post',
    data: data
  })
}

// 修改车系
export function updateSeries(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/series/v1/' + code,
    method: 'put',
    data: data
  })
}

// 删除车系
export function delSeries(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/series/v1/' + code,
    method: 'delete',
    params: { modifyBy }
  })
}

// 停用车系
export function deactivateSeries(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/series/v1/' + code + '/deactivate',
    method: 'post',
    params: { modifyBy }
  })
}
