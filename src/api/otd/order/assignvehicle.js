import request from '@/utils/request'

// OTD-VSO 管理后台订单域（MPT）基地址。
// 注意：后端 5 月起已把 /api/mpt/order/v1 重构为 /api/mpt/vso/v1，勿再使用旧路径。
const BASE = '/otd-vso/api/mpt/vso/v1'

// 查询可配车订单列表（仅 ARRANGE_PRODUCTION）
export function listAssignableOrder(query) {
  return request({
    url: BASE + '/listAssignable',
    method: 'get',
    params: query
  })
}

// 配车（分配 VIN）：后端会做状态校验、VIN 占用与时间线记录，失败时返回明确业务错误
export function bindingVehicle(vin, orderNo) {
  return request({
    url: BASE + '/action/assignVehicle',
    method: 'post',
    data: {
      vin: vin,
      orderNo: orderNo
    }
  })
}

// 换绑 VIN
export function reassignVehicle(orderNo, newVin) {
  return request({
    url: BASE + '/action/reassignVehicle',
    method: 'post',
    data: {
      orderNo: orderNo,
      newVin: newVin
    }
  })
}

// 解绑 VIN
export function unbindVehicle(orderNo, unbindReason) {
  return request({
    url: BASE + '/action/unbindVehicle',
    method: 'post',
    data: {
      orderNo: orderNo,
      unbindReason: unbindReason
    }
  })
}

// 查询订单当前配车信息（按订单号）
export function getVehicleAssignment(orderNo) {
  return request({
    url: BASE + '/vehicleAssignment/' + orderNo,
    method: 'get'
  })
}
