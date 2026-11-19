import request from '@/utils/request'

// 查询库存列表
export function listInventory(query) {
  return request({
    url: '/otd-wms/mpt/inventory/list',
    method: 'get',
    params: query
  })
}

// 查询库存详细
export function getInventory(inventoryId) {
  return request({
    url: '/otd-wms/mpt/inventory/' + inventoryId,
    method: 'get'
  })
}

// 说明：库存由入库／移库／出库业务动作维护，服务端不提供通用新增／修改／删除。
