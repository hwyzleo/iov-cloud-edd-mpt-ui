import request from '@/utils/request'

// 查询移库信息列表
export function listInventoryTransfer(query) {
  query.warehouseLevel = "PDC";
  return request({
    url: '/otd-wms/mpt/inventoryTransfer/list',
    method: 'get',
    params: query
  })
}

// 查询移库信息详细
export function getInventoryTransfer(inventoryTransferId) {
  return request({
    url: '/otd-wms/mpt/inventoryTransfer/' + inventoryTransferId,
    method: 'get'
  })
}

// 同库移库执行（原位置由服务端按当前库存权威判定）
// data: { requestId, vin, warehouseCode, newStorageAreaCode, newStorageLocationCode, expectedVersion }
export function transferInventory(data) {
  return request({
    url: '/otd-wms/mpt/inventoryTransfer',
    method: 'post',
    data: data
  })
}

// 说明：移库记录是已完成的不可变事实，服务端不提供通用修改／删除。
