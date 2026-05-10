import request from '@/utils/request'

export function listColumn(categoryId, query) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionaryCategory/v1/' + categoryId + '/column/list',
    method: 'get',
    params: query
  })
}

export function getColumn(categoryId, id) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionaryCategory/v1/' + categoryId + '/column/' + id,
    method: 'get'
  })
}

export function addColumn(categoryId, data) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionaryCategory/v1/' + categoryId + '/column',
    method: 'post',
    data: data
  })
}

export function updateColumn(categoryId, data) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionaryCategory/v1/' + categoryId + '/column',
    method: 'put',
    data: data
  })
}

export function delColumn(categoryId, ids) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionaryCategory/v1/' + categoryId + '/column/' + ids,
    method: 'delete'
  })
}

export function generateTable(categoryId) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionaryCategory/v1/' + categoryId + '/column/generateTable',
    method: 'post'
  })
}