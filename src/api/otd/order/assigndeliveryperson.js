import request from '@/utils/request'

// OTD-VSO 管理后台订单域（MPT）基地址（原 /api/mpt/order/v1 已废弃）
const BASE = '/otd-vso/api/mpt/vso/v1'

// 查询没有交付人员的订单列表（响应已批量带出当前有效交付预约 appointmentNo/appointmentTime/appointmentStatus）
export function listOrderWithoutDeliveryPerson(query) {
  return request({
    url: BASE + '/listWithoutDeliveryPerson',
    method: 'get',
    params: query
  })
}

// 查询交付中心人员
export function listDeliveryCenterStaff(query) {
  return request({
    url: BASE + '/listDeliveryCenterStaff',
    method: 'get',
    params: query
  })
}

// 分配交付人员
export function bindingDeliveryPerson(userId, nickName, orderNo) {
  return request({
    url: BASE + '/action/assignDeliveryPerson',
    method: 'post',
    data: {
      deliveryPersonId: userId,
      deliveryPersonName: nickName,
      orderNo: orderNo
    }
  })
}
