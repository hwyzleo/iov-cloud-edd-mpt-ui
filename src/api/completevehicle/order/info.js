import request from '@/utils/request'

export function listOrder(query) {
  return request({
    url: '/otd-vso/api/mpt/order/v1/list',
    method: 'get',
    params: query
  })
}

export function getOrder(orderId) {
  return request({
    url: '/otd-vso/api/mpt/order/v1/' + orderId,
    method: 'get'
  })
}

export function delOrder(orderNo) {
  return request({
    url: '/otd-vso/api/mpt/order/v1/' + orderNo,
    method: 'delete'
  })
}

export function physicalDeleteOrder(orderId, data) {
  return request({
    url: '/otd-vso/api/mpt/order/v1/physical/' + orderId,
    method: 'delete',
    data: data
  })
}

export function auditPass(orderId, operatorId) {
  return request({
    url: '/otd-vso/api/mpt/order/v1/' + orderId + '/audit/pass',
    method: 'post',
    headers: {
      'X-Operator-Id': operatorId
    }
  })
}

export function auditReject(orderId, reason, operatorId) {
  return request({
    url: '/otd-vso/api/mpt/order/v1/' + orderId + '/audit/reject',
    method: 'post',
    params: { reason },
    headers: {
      'X-Operator-Id': operatorId
    }
  })
}

export function lockOrder(orderId, operatorId) {
  return request({
    url: '/otd-vso/api/mpt/order/v1/' + orderId + '/lock',
    method: 'post',
    headers: {
      'X-Operator-Id': operatorId
    }
  })
}

export function closeOrder(orderId, reason, operatorId) {
  return request({
    url: '/otd-vso/api/mpt/order/v1/' + orderId + '/close',
    method: 'post',
    params: { reason },
    headers: {
      'X-Operator-Id': operatorId
    }
  })
}