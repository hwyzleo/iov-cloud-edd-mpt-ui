import request from '@/utils/request'

// 查询选项族列表
export function listOptionFamily(query) {
  return request({
    url: '/edd-mdm/api/mpt/optionFamily/v1/list',
    method: 'get',
    params: query
  })
}

// 查询选项族详细
export function getOptionFamily(code) {
  return request({
    url: '/edd-mdm/api/mpt/optionFamily/v1/' + code,
    method: 'get'
  })
}

// 新增选项族
export function addOptionFamily(data) {
  return request({
    url: '/edd-mdm/api/mpt/optionFamily/v1/create',
    method: 'post',
    data: data
  })
}

// 修改选项族
export function updateOptionFamily(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/optionFamily/v1/' + code,
    method: 'put',
    data: data
  })
}

// 删除选项族
export function delOptionFamily(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/optionFamily/v1/' + code,
    method: 'delete',
    params: { modifyBy }
  })
}

// 停用选项族
export function deactivateOptionFamily(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/optionFamily/v1/' + code + '/deactivate',
    method: 'post',
    params: { modifyBy }
  })
}

// 查询选项族历史版本
export function listOptionFamilyHistory(code) {
  return request({
    url: '/edd-mdm/api/mpt/optionFamily/v1/' + code + '/history',
    method: 'get'
  })
}
