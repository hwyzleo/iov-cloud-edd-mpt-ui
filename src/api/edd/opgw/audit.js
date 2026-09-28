import request from '@/utils/request'

// 查询配置审计记录
export function listAudit(query) {
  return request({
    url: '/edd-opgw/api/mpt/opgw/audit/v1/list',
    method: 'get',
    params: query
  })
}
