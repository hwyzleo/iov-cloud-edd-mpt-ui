import request from '@/utils/request'

export function listOrderWithoutDeliveryPerson(query) {
  return request({
    url: '/otd-vso/api/mpt/order/v1/listWithoutDeliveryPerson',
    method: 'get',
    params: query
  })
}

export function listDeliveryCenterStaff(query) {
  return request({
    url: '/otd-vso/api/mpt/order/v1/listDeliveryCenterStaff',
    method: 'get',
    params: query
  })
}

export function bindingDeliveryPerson(userId, nickName, orderNo) {
  const data = {
    deliveryPersonId: userId,
    deliveryPersonName: nickName,
    orderNo: orderNo
  }
  return request({
    url: '/otd-vso/api/mpt/order/v1/action/assignDeliveryPerson',
    method: 'post',
    data: data
  })
}