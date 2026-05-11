import request from '@/utils/request'

// 查询车系列表
export function listSeries(query) {
  return request({
    url: '/edd-vmd/api/mpt/series/v1/list',
    method: 'get',
    params: query
  })
}

// 查询品牌下车系列表
export function listSeriesByBrandCode(brandCode) {
  const params = {
    brandCode: brandCode
  }
  return request({
    url: '/edd-vmd/api/mpt/series/v1/listByBrandCode',
    method: 'get',
    params: params
  })
}

// 查询车系详细
export function getSeries(seriesId) {
  return request({
    url: '/edd-vmd/api/mpt/series/v1/' + seriesId,
    method: 'get'
  })
}

// 新增车系
export function addSeries(data) {
  return request({
    url: '/edd-vmd/api/mpt/series/v1',
    method: 'post',
    data: data
  })
}

// 修改车系
export function updateSeries(data) {
  return request({
    url: '/edd-vmd/api/mpt/series/v1',
    method: 'put',
    data: data
  })
}

// 删除车系
export function delSeries(seriesId) {
  return request({
    url: '/edd-vmd/api/mpt/series/v1/' + seriesId,
    method: 'delete'
  })
}
