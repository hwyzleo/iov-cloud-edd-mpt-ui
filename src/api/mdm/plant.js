import request from '@/utils/request'

// 查询工厂列表
export function listPlant(query) {
  return request({
    url: '/edd-mdm/api/mpt/plant/v1/list',
    method: 'get',
    params: query
  })
}

// 查询工厂详细
export function getPlant(code) {
  return request({
    url: '/edd-mdm/api/mpt/plant/v1/' + code,
    method: 'get'
  })
}

// 新增工厂
export function addPlant(data) {
  return request({
    url: '/edd-mdm/api/mpt/plant/v1/create',
    method: 'post',
    data: data
  })
}

// 修改工厂
export function updatePlant(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/plant/v1/' + code,
    method: 'put',
    data: data
  })
}

// 删除工厂
export function delPlant(code, operator) {
  return request({
    url: '/edd-mdm/api/mpt/plant/v1/' + code,
    method: 'delete',
    params: { operator }
  })
}

// 停用工厂
export function deactivatePlant(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/plant/v1/' + code + '/deactivate',
    method: 'post',
    params: { modifyBy }
  })
}

// 查询工厂历史版本
export function listPlantHistory(code) {
  return request({
    url: '/edd-mdm/api/mpt/plant/v1/' + code + '/history',
    method: 'get'
  })
}

// 导出工厂
export function exportPlant() {
  return request({
    url: '/edd-mdm/api/mpt/plant/v1/export',
    method: 'get'
  })
}
