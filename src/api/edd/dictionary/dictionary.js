import request from '@/utils/request'

export function listDictionary(query) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionary/v1/list',
    method: 'get',
    params: query
  })
}

export function getDictionary(id) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionary/v1/' + id,
    method: 'get'
  })
}

export function addDictionary(data) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionary/v1',
    method: 'post',
    data: data
  })
}

export function updateDictionary(data) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionary/v1',
    method: 'put',
    data: data
  })
}

export function delDictionary(ids) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionary/v1/' + ids,
    method: 'delete'
  })
}