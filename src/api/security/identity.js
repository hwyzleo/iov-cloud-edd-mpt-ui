import request from '@/utils/request'

// 身份目录分页查询（EIAM：SEC-EIAM-DSN-CR-002 原地修订·第二次）
export function listIdentity(query) {
  return request({
    url: '/auth/identity/list',
    method: 'get',
    params: {
      key: query.key,
      status: query.status,
      page: query.pageNum,
      size: query.pageSize
    }
  })
}

// 管理员重置 EIAM 凭据密码（响应含一次性明文，仅展示一次）
export function resetIdentityPassword(employeeId) {
  return request({
    url: '/auth/identity/' + employeeId + '/reset-password',
    method: 'post',
    headers: {
      repeatSubmit: false
    }
  })
}

// 启用登录账号（清凭据锁定 + 联动 MPT 启用）
export function enableIdentity(employeeId) {
  return request({
    url: '/auth/identity/' + employeeId + '/enable',
    method: 'post'
  })
}

// 停用登录账号（联动 MPT 停用并撤销在线会话）
export function disableIdentity(employeeId) {
  return request({
    url: '/auth/identity/' + employeeId + '/disable',
    method: 'post'
  })
}

// 解锁（清空失败计数与锁定时间）
export function unlockIdentity(employeeId) {
  return request({
    url: '/auth/identity/' + employeeId + '/unlock',
    method: 'post'
  })
}
