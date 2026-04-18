import request from '@/utils/request'

// 查询令牌列表
export function listToken(query) {
  return request({
    url: '/sec-ciam/api/mp/token/v1/tokens',
    method: 'get',
    params: {
      ...query,
      page: query.pageNum ? query.pageNum - 1 : 0,
      size: query.pageSize || 20
    }
  })
}

// 查询令牌详细
export function getToken(refreshTokenId) {
  return request({
    url: '/sec-ciam/api/mp/token/v1/tokens/detail',
    method: 'get',
    params: { refreshTokenId }
  })
}

// 查询用户令牌列表
export function getUserTokens(userId) {
  return request({
    url: '/sec-ciam/api/mp/token/v1/tokens/user',
    method: 'get',
    params: { userId }
  })
}

// 查询会话令牌列表
export function getSessionTokens(sessionId) {
  return request({
    url: '/sec-ciam/api/mp/token/v1/tokens/session',
    method: 'get',
    params: { sessionId }
  })
}
