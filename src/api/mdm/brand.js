import request from '@/utils/request'

// 查询品牌列表
export function listBrand(query) {
  return request({
    url: '/edd-mdm/api/mpt/brand/v1/list',
    method: 'get',
    params: query
  })
}

// 查询品牌详细
export function getBrand(code) {
  return request({
    url: '/edd-mdm/api/mpt/brand/v1/' + code,
    method: 'get'
  })
}

// 新增品牌
export function addBrand(data) {
  return request({
    url: '/edd-mdm/api/mpt/brand/v1/create',
    method: 'post',
    data: data
  })
}

// 修改品牌
export function updateBrand(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/brand/v1/' + code,
    method: 'put',
    data: data
  })
}

// 删除品牌
export function delBrand(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/brand/v1/' + code,
    method: 'delete',
    params: { modifyBy }
  })
}

// 停用品牌
export function deactivateBrand(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/brand/v1/' + code + '/deactivate',
    method: 'post',
    params: { modifyBy }
  })
}

// 查询品牌历史版本
export function listBrandHistory(code) {
  return request({
    url: '/edd-mdm/api/mpt/brand/v1/' + code + '/history',
    method: 'get'
  })
}
