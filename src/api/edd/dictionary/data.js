import request from '@/utils/request'

export function getDictionaryData(dictionaryId) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionary/v1/' + dictionaryId + '/data',
    method: 'get'
  })
}

export function getDataInfo(dictionaryId, dataId) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionary/v1/' + dictionaryId + '/data/' + dataId,
    method: 'get'
  })
}

export function addData(dictionaryId, data) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionary/v1/' + dictionaryId + '/data',
    method: 'post',
    data: data
  })
}

export function updateData(dictionaryId, dataId, data) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionary/v1/' + dictionaryId + '/data/' + dataId,
    method: 'put',
    data: data
  })
}

export function delData(dictionaryId, dataId) {
  return request({
    url: '/edd-dictionary/api/mpt/dictionary/v1/' + dictionaryId + '/data/' + dataId,
    method: 'delete'
  })
}