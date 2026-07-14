import request from '@/utils/request'

// 查询型式批准基线分页列表
export function listTypeApprovalBaseline(query) {
  return request({
    url: '/edd-mdm/api/mpt/typeApprovalBaseline/v1/list',
    method: 'get',
    params: query
  })
}

// 触发卷积生成/刷新（DRAFT）
export function projectTypeApprovalBaseline(data) {
  return request({
    url: '/edd-mdm/api/mpt/typeApprovalBaseline/v1/action/project',
    method: 'post',
    data: data
  })
}

// 发布基线 DRAFT -> RELEASED
export function releaseTypeApprovalBaseline(code) {
  return request({
    url: '/edd-mdm/api/mpt/typeApprovalBaseline/v1/' + code + '/action/release',
    method: 'post'
  })
}

// 冻结基线 RELEASED -> FROZEN（型批通过）
export function freezeTypeApprovalBaseline(code) {
  return request({
    url: '/edd-mdm/api/mpt/typeApprovalBaseline/v1/' + code + '/action/freeze',
    method: 'post'
  })
}

// 删除基线
export function delTypeApprovalBaseline(code, forceDelete) {
  return request({
    url: '/edd-mdm/api/mpt/typeApprovalBaseline/v1/' + code,
    method: 'delete',
    params: { forceDelete: forceDelete || false }
  })
}
