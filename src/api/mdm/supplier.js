import request from '@/utils/request'

// 查询供应商列表
export function listSupplier(query) {
  return request({
    url: '/edd-mdm/api/mpt/supplier/v1/list',
    method: 'get',
    params: query
  })
}

// 查询供应商详细
export function getSupplier(code) {
  return request({
    url: '/edd-mdm/api/mpt/supplier/v1/' + code,
    method: 'get'
  })
}

// 新增供应商
export function addSupplier(data) {
  return request({
    url: '/edd-mdm/api/mpt/supplier/v1/create',
    method: 'post',
    data: data
  })
}

// 修改供应商
export function updateSupplier(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/supplier/v1/' + code,
    method: 'put',
    data: data
  })
}

// 删除供应商
export function delSupplier(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/supplier/v1/' + code,
    method: 'delete',
    params: { modifyBy }
  })
}

// 停用供应商
export function deactivateSupplier(code, modifyBy) {
  return request({
    url: '/edd-mdm/api/mpt/supplier/v1/' + code + '/deactivate',
    method: 'post',
    params: { modifyBy }
  })
}

// 查询供应商历史版本
export function listSupplierHistory(code) {
  return request({
    url: '/edd-mdm/api/mpt/supplier/v1/' + code + '/history',
    method: 'get'
  })
}
