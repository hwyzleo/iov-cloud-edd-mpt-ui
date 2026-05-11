import request from '@/utils/request'

export function listAssignableOrder(query) {
  return request({
    url: '/otd-vso/api/mpt/order/v1/listAssignable',
    method: 'get',
    params: query
  })
}

export function bindingVehicle(vin, orderNo) {
  const data = {
    vin: vin,
    orderNo: orderNo
  }
  return request({
    url: '/otd-vso/api/mpt/order/v1/action/assignVehicle',
    method: 'post',
    data: data
  })
}