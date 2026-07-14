import request from '@/utils/request'

// ==================== 升级活动基础 ====================

// 查询升级活动列表
export function listActivity(query) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/list',
    method: 'get',
    params: query
  })
}

// 获取所有升级活动状态
export function listAllActivityState() {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/listAllActivityState',
    method: 'get'
  })
}

// 查询升级活动详细
export function getActivity(activityId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId,
    method: 'get'
  })
}

// 新增升级活动
export function addActivity(data) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1',
    method: 'post',
    data: data
  })
}

// 修改升级活动
export function updateActivity(data) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1',
    method: 'put',
    data: data
  })
}

// 提交升级活动
export function submitActivity(activityId, data) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/submit',
    method: 'post',
    data: data
  })
}

// 审核升级任务
export function auditActivity(activityId, data) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/audit',
    method: 'post',
    data: data
  })
}

// 发布升级活动
export function releaseActivity(activityId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/release',
    method: 'post'
  })
}

// 取消升级活动
export function cancelActivity(activityId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/cancel',
    method: 'post'
  })
}

// 删除升级活动
export function delActivity(activityIds) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityIds,
    method: 'delete'
  })
}

// ==================== 升级对象管理 ====================

// 查询升级对象列表
export function listUpgradeTarget(activityId, group) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/listUpgradeTarget',
    method: 'get',
    params: { group }
  })
}

// 新增升级对象（非基线活动，关联软件版本）
export function addUpgradeTarget(activityId, softwareBuildVersionIds) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/addUpgradeTarget/' + softwareBuildVersionIds,
    method: 'post'
  })
}

// 删除升级对象
export function removeUpgradeTarget(activityId, softwareBuildVersionIds) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/removeUpgradeTarget/' + softwareBuildVersionIds,
    method: 'post'
  })
}

// 调整升级对象分组
export function regroupUpgradeTarget(activityId, data) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/regroupUpgradeTarget',
    method: 'post',
    data: data
  })
}

// 重排序升级对象
export function resortUpgradeTarget(activityId, data) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/resortUpgradeTarget',
    method: 'post',
    data: data
  })
}

// 修改升级对象（目标软件版本、强制升级等）
export function editUpgradeTarget(activityId, data) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/editUpgradeTarget',
    method: 'post',
    data: data
  })
}

// ==================== 组策略管理 ====================

// 查询组策略列表
export function listGroupPolicy(activityId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/listGroupPolicy',
    method: 'get'
  })
}

// 保存组策略
export function saveGroupPolicy(activityId, data) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/saveGroupPolicy',
    method: 'post',
    data: data
  })
}

// 删除组策略
export function deleteGroupPolicy(activityId, id) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/deleteGroupPolicy/' + id,
    method: 'delete'
  })
}

// ==================== 兼容零件号管理 ====================

// 列出升级活动下兼容零件号
export function listActivityCompatiblePn(activityId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/listCompatiblePn',
    method: 'get'
  })
}

// 新增关联的兼容零件号
export function addActivityCompatiblePn(activityId, compatiblePnIds) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/addCompatiblePn/' + compatiblePnIds,
    method: 'post'
  })
}

// 删除关联的兼容零件号
export function delActivityCompatiblePn(activityId, compatiblePnIds) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/removeCompatiblePn/' + compatiblePnIds,
    method: 'post'
  })
}

// ==================== 固定配置字管理 ====================

// 列出升级活动下固定配置字
export function listActivityFixedConfigWord(activityId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/listFixedConfigWord',
    method: 'get'
  })
}

// 新增关联的固定配置字
export function addActivityFixedConfigWord(activityId, fixedConfigWordIds) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/addFixedConfigWord/' + fixedConfigWordIds,
    method: 'post'
  })
}

// 删除关联的固定配置字
export function delActivityFixedConfigWord(activityId, fixedConfigWordIds) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/removeFixedConfigWord/' + fixedConfigWordIds,
    method: 'post'
  })
}

// ==================== 审批管理 ====================

// 查询活动多级审批记录
export function listActivityApproval(activityId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/listApproval',
    method: 'get'
  })
}

// 多级审批
export function approveActivity(activityId, approvalStage, result, comment) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/approve',
    method: 'post',
    params: { approvalStage, result, comment }
  })
}

// 型式批准影响评估
export function impactAssessment(activityId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/impactAssessment',
    method: 'post'
  })
}

// ==================== 型批版本组合快照 ====================

// 查询型批版本组合快照
export function listManifest(activityId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/listManifest',
    method: 'get'
  })
}

// 查询型批版本组合快照详情
export function getManifest(activityId, manifestId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/manifest/' + manifestId,
    method: 'get'
  })
}

// ==================== 监管备案 ====================

// 查询监管备案
export function listRegulatoryFiling(activityId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/listRegulatoryFiling',
    method: 'get'
  })
}

// 查询监管备案详情
export function getRegulatoryFiling(activityId, filingId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/regulatoryFiling/' + filingId,
    method: 'get'
  })
}

// 保存监管备案
export function saveRegulatoryFiling(activityId, data) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/saveRegulatoryFiling',
    method: 'post',
    data: data
  })
}

// 删除监管备案
export function deleteRegulatoryFiling(activityId, filingId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/deleteRegulatoryFiling/' + filingId,
    method: 'delete'
  })
}
