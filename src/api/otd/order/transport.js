import request from '@/utils/request'

export function listTransportOrder(query) {
  return request({
    url: '/otd-vso/api/mpt/order/v1/listTransport',
    method: 'get',
    params: query
  })
}

export function applyTransport(orderNo) {
  const data = {
    orderNo: orderNo
  }
  return request({
    url: '/otd-vso/api/mpt/order/v1/action/applyTransport',
    method: 'post',
    data: data
  })
}
