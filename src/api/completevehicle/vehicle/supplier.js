import request from '@/utils/request'

// 查询供应商列表
export function listSupplier(query) {
  return request({
    url: '/edd-vmd/api/mpt/supplier/v1/list',
    method: 'get',
    params: query
  })
}

// 查询供应商详细
export function getSupplier(supplierId) {
  return request({
    url: '/edd-vmd/api/mpt/supplier/v1/' + supplierId,
    method: 'get'
  })
}

// 新增供应商
export function addSupplier(data) {
  return request({
    url: '/edd-vmd/api/mpt/supplier/v1',
    method: 'post',
    data: data
  })
}

// 修改供应商
export function updateSupplier(data) {
  return request({
    url: '/edd-vmd/api/mpt/supplier/v1',
    method: 'put',
    data: data
  })
}

// 删除供应商
export function delSupplier(supplierIds) {
  return request({
    url: '/edd-vmd/api/mpt/supplier/v1/' + supplierIds,
    method: 'delete'
  })
}
