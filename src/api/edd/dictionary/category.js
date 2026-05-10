import request from '@/utils/request'

export function listCategory(query) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionaryCategory/v1/list',
    method: 'get',
    params: query
  })
}

export function getCategoryById(id) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionaryCategory/v1/' + id,
    method: 'get'
  })
}

// 兼容方法：根据ID获取分类
export function getCategory(id) {
  return getCategoryById(id);
}

export function getCategoryByCode(code) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionaryCategory/v1/code/' + code,
    method: 'get'
  })
}

export function addCategory(data) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionaryCategory/v1',
    method: 'post',
    data: data
  })
}

export function updateCategory(data) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionaryCategory/v1',
    method: 'put',
    data: data
  })
}

export function delCategory(ids) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionaryCategory/v1/' + ids,
    method: 'delete'
  })
}
