import request from '@/utils/request'

// 查询配置列表
export function listConfiguration(query) {
  return request({
    url: '/edd-mdm/api/mpt/configuration/v1/list',
    method: 'get',
    params: query
  })
}

// 查询配置详细
export function getConfiguration(code) {
  return request({
    url: '/edd-mdm/api/mpt/configuration/v1/' + code,
    method: 'get'
  })
}

// 新增配置
export function addConfiguration(data) {
  return request({
    url: '/edd-mdm/api/mpt/configuration/v1/create',
    method: 'post',
    data: data
  })
}

// 修改配置
export function updateConfiguration(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/configuration/v1/' + code,
    method: 'put',
    data: data
  })
}

// 删除配置
export function delConfiguration(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/configuration/v1/' + code,
    method: 'delete',
    params: { modifyBy }
  })
}

// 停用配置
export function deactivateConfiguration(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/configuration/v1/' + code + '/deactivate',
    method: 'post',
    params: { modifyBy }
  })
}

// 查询配置历史版本
export function listConfigurationHistory(code) {
  return request({
    url: '/edd-mdm/api/mpt/configuration/v1/' + code + '/history',
    method: 'get'
  })
}

// 配置绑定选项码
export function bindConfigurationOptionCode(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/configuration/v1/' + code + '/bind',
    method: 'post',
    data: data
  })
}

// 配置解绑选项码
export function unbindConfigurationOptionCode(code, optionCodeCode, operator) {
  return request({
    url: '/edd-mdm/api/mpt/configuration/v1/' + code + '/unbind',
    method: 'post',
    params: { optionCodeCode, operator }
  })
}

// 查询配置已绑定的选项码列表
export function listConfigurationOptionCodes(code) {
  return request({
    url: '/edd-mdm/api/mpt/configuration/v1/' + code + '/optionCodes',
    method: 'get'
  })
}
