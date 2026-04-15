import request from '@/utils/request'

// 查询配置项列表
export function listConfigItem(query) {
  return request({
    url: '/tsp-vmd/mpt/configItem/list',
    method: 'get',
    params: query
  })
}

// 查询配置项枚举值列表
export function listConfigItemOption(configItemCode, query) {
  return request({
    url: '/tsp-vmd/mpt/configItem/' + configItemCode + '/option/list',
    method: 'get',
    params: query
  })
}

// 查询配置项映射列表
export function listConfigItemMapping(configItemCode, query) {
  return request({
    url: '/tsp-vmd/mpt/configItem/' + configItemCode + '/mapping/list',
    method: 'get',
    params: query
  })
}

// 查询配置项详细
export function getConfigItem(id) {
  return request({
    url: '/tsp-vmd/mpt/configItem/' + id,
    method: 'get'
  })
}

// 查询配置项枚举值详细
export function getConfigItemOption(configItemCode, id) {
  return request({
    url: '/tsp-vmd/mpt/configItem/' + configItemCode + '/option/' + id,
    method: 'get'
  })
}

// 查询配置项枚举值详细
export function getConfigItemMapping(configItemCode, id) {
  return request({
    url: '/tsp-vmd/mpt/configItem/' + configItemCode + '/mapping/' + id,
    method: 'get'
  })
}

// 新增配置项
export function addConfigItem(data) {
  return request({
    url: '/tsp-vmd/mpt/configItem',
    method: 'post',
    data: data
  })
}

// 新增配置项枚举值
export function addConfigItemOption(configItemCode, data) {
  return request({
    url: '/tsp-vmd/mpt/configItem/' + configItemCode + '/option',
    method: 'post',
    data: data
  })
}

// 新增配置项映射
export function addConfigItemMapping(configItemCode, data) {
  return request({
    url: '/tsp-vmd/mpt/configItem/' + configItemCode + '/mapping',
    method: 'post',
    data: data
  })
}

// 修改配置项
export function updateConfigItem(data) {
  return request({
    url: '/tsp-vmd/mpt/configItem',
    method: 'put',
    data: data
  })
}

// 修改配置项枚举值
export function updateConfigItemOption(configItemCode, data) {
  return request({
    url: '/tsp-vmd/mpt/configItem/' + configItemCode + '/option',
    method: 'put',
    data: data
  })
}

// 修改配置项映射
export function updateConfigItemMapping(configItemCode, data) {
  return request({
    url: '/tsp-vmd/mpt/configItem/' + configItemCode + '/mapping',
    method: 'put',
    data: data
  })
}

// 删除配置项
export function delConfigItem(ids) {
  return request({
    url: '/tsp-vmd/mpt/configItem/' + ids,
    method: 'delete'
  })
}

// 删除配置项枚举值
export function delConfigItemOption(configItemCode, ids) {
  return request({
    url: '/tsp-vmd/mpt/configItem/' + configItemCode + '/option/' + ids,
    method: 'delete'
  })
}

// 删除配置项映射
export function delConfigItemMapping(configItemCode, ids) {
  return request({
    url: '/tsp-vmd/mpt/configItem/' + configItemCode + '/mapping/' + ids,
    method: 'delete'
  })
}
