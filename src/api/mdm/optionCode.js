import request from '@/utils/request'

// 查询选项码列表
export function listOptionCode(query) {
  return request({
    url: '/edd-mdm/api/mpt/optionCode/v1/list',
    method: 'get',
    params: query
  })
}

// 查询选项码详细
export function getOptionCode(code) {
  return request({
    url: '/edd-mdm/api/mpt/optionCode/v1/' + code,
    method: 'get'
  })
}

// 新增选项码
export function addOptionCode(data) {
  return request({
    url: '/edd-mdm/api/mpt/optionCode/v1/create',
    method: 'post',
    data: data
  })
}

// 修改选项码
export function updateOptionCode(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/optionCode/v1/' + code,
    method: 'put',
    data: data
  })
}

// 删除选项码
export function delOptionCode(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/optionCode/v1/' + code,
    method: 'delete',
    params: { modifyBy }
  })
}

// 停用选项码
export function deactivateOptionCode(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/optionCode/v1/' + code + '/deactivate',
    method: 'post',
    params: { modifyBy }
  })
}

// 查询选项码历史版本
export function listOptionCodeHistory(code) {
  return request({
    url: '/edd-mdm/api/mpt/optionCode/v1/' + code + '/history',
    method: 'get'
  })
}
