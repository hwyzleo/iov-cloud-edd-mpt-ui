import request from '@/utils/request'

// 查询账号列表
export function listAccount(query) {
  return request({
    url: '/sec-ciam/api/mp/admin/v1/accounts',
    method: 'get',
    params: query
  })
}

// 查询账号详细
export function getAccount(userId) {
  return request({
    url: '/sec-ciam/api/mp/admin/v1/accounts/detail',
    method: 'get',
    params: { userId }
  })
}

// 新增账号
export function addAccount(data) {
  return request({
    url: '/sec-ciam/api/mp/admin/v1/accounts',
    method: 'post',
    data: {
      identityType: data.identityType || 'mobile',
      mobile: data.mobile,
      email: data.email,
      password: data.password,
      nickname: data.nickname,
      gender: data.gender,
      registerSource: data.registerSource,
      remark: data.remark,
      adminId: data.adminId
    }
  })
}

// 修改账号
export function updateAccount(data) {
  return request({
    url: '/sec-ciam/api/mp/admin/v1/accounts',
    method: 'put',
    data: {
      userId: data.userId,
      identityType: data.identityType,
      mobile: data.mobile,
      email: data.email,
      nickname: data.nickname,
      gender: data.gender,
      enabled: data.enabled,
      remark: data.remark,
      adminId: data.adminId
    }
  })
}

// 删除账号（批量）
export function delAccount(userIds) {
  const ids = Array.isArray(userIds) ? userIds : [userIds]
  return request({
    url: '/sec-ciam/api/mp/admin/v1/accounts',
    method: 'delete',
    data: {
      userId: ids
    }
  })
}
