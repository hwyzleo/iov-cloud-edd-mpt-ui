import request from '@/utils/request'

// 查询版本列表
export function listVariant(query) {
  return request({
    url: '/edd-mdm/api/mpt/variant/v1/list',
    method: 'get',
    params: query
  })
}

// 查询版本详细
export function getVariant(code) {
  return request({
    url: '/edd-mdm/api/mpt/variant/v1/' + code,
    method: 'get'
  })
}

// 新增版本
export function addVariant(data) {
  return request({
    url: '/edd-mdm/api/mpt/variant/v1/create',
    method: 'post',
    data: data
  })
}

// 修改版本
export function updateVariant(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/variant/v1/' + code,
    method: 'put',
    data: data
  })
}

// 删除版本
export function delVariant(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/variant/v1/' + code,
    method: 'delete',
    params: { modifyBy }
  })
}

// 停用版本
export function deactivateVariant(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/variant/v1/' + code + '/deactivate',
    method: 'post',
    params: { modifyBy }
  })
}

// 查询版本历史版本
export function listVariantHistory(code) {
  return request({
    url: '/edd-mdm/api/mpt/variant/v1/' + code + '/history',
    method: 'get'
  })
}

// 版本绑定选项码
export function bindVariantOptionCode(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/variant/v1/' + code + '/bind',
    method: 'post',
    data: data
  })
}

// 版本解绑选项码
export function unbindVariantOptionCode(code, optionCodeCode, operator) {
  return request({
    url: '/edd-mdm/api/mpt/variant/v1/' + code + '/unbind',
    method: 'post',
    params: { optionCodeCode, operator }
  })
}

// 查询版本已绑定的选项码列表
export function listVariantOptionCodes(code) {
  return request({
    url: '/edd-mdm/api/mpt/variant/v1/' + code + '/optionCodes',
    method: 'get'
  })
}
