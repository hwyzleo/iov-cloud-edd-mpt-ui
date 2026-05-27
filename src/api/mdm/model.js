import request from '@/utils/request'

// 查询车型列表
export function listModel(query) {
  return request({
    url: '/edd-mdm/api/mpt/model/v1/list',
    method: 'get',
    params: query
  })
}

// 查询车型详细
export function getModel(code) {
  return request({
    url: '/edd-mdm/api/mpt/model/v1/' + code,
    method: 'get'
  })
}

// 新增车型
export function addModel(data) {
  return request({
    url: '/edd-mdm/api/mpt/model/v1/create',
    method: 'post',
    data: data
  })
}

// 修改车型
export function updateModel(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/model/v1/' + code,
    method: 'put',
    data: data
  })
}

// 删除车型
export function delModel(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/model/v1/' + code,
    method: 'delete',
    params: { modifyBy }
  })
}

// 停用车型
export function deactivateModel(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/model/v1/' + code + '/deactivate',
    method: 'post',
    params: { modifyBy }
  })
}

// 查询车型历史版本
export function listModelHistory(code) {
  return request({
    url: '/edd-mdm/api/mpt/model/v1/' + code + '/history',
    method: 'get'
  })
}
