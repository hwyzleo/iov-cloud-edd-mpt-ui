import request from '@/utils/request'

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

// 列出升级活动下软件内部版本
export function listActivitySoftwareBuildVersion(activityId, group) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/listSoftwareBuildVersion?group=' + group,
    method: 'get'
  })
}

// 列出升级活动下兼容零件号
export function listActivityCompatiblePn(activityId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/listCompatiblePn',
    method: 'get'
  })
}

// 列出升级活动下固定配置字
export function listActivityFixedConfigWord(activityId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/listFixedConfigWord',
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

// 新增关联的软件内部版本
export function addActivitySoftwareBuildVersion(activityId, softwareBuildVersionIds) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/addSoftwareBuildVersion/' + softwareBuildVersionIds,
    method: 'post'
  })
}

// 新增关联的兼容零件号
export function addActivityCompatiblePn(activityId, compatiblePnIds) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/addCompatiblePn/' + compatiblePnIds,
    method: 'post'
  })
}

// 新增关联的固定配置字
export function addActivityFixedConfigWord(activityId, fixedConfigWordIds) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/addFixedConfigWord/' + fixedConfigWordIds,
    method: 'post'
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

// 删除关联的软件内部版本
export function delActivitySoftwareBuildVersion(activityId, softwareBuildVersionIds) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/removeSoftwareBuildVersion/' + softwareBuildVersionIds,
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

// 删除关联的固定配置字
export function delActivityFixedConfigWord(activityId, fixedConfigWordIds) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/removeFixedConfigWord/' + fixedConfigWordIds,
    method: 'post'
  })
}

// 更新关联的软件内部版本组
export function regroupSoftwareBuildVersion(activityId, data) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/regroupSoftwareBuildVersion',
    method: 'post',
    data: data
  })
}

// 重排序关联的软件内部版本
export function resortSoftwareBuildVersion(activityId, data) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/resortSoftwareBuildVersion',
    method: 'post',
    data: data
  })
}

// 修改关联的软件内部版本
export function editActivitySoftwareBuildVersion(activityId, softwareBuildVersionIds, sorts, groups) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/editSoftwareBuildVersion/' + softwareBuildVersionIds,
    method: 'post',
    params: { sorts, groups }
  })
}

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

// ==================== 目标版本组合 ====================

// 查询目标版本组合
export function listTargetVersion(activityId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/listTargetVersion',
    method: 'get'
  })
}

// 保存目标版本组合
export function saveTargetVersion(activityId, data) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/saveTargetVersion',
    method: 'post',
    data: data
  })
}

// 删除目标版本
export function deleteTargetVersion(activityId, id) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/deleteTargetVersion/' + id,
    method: 'delete'
  })
}

// ==================== 安装顺序 ====================

// 查询安装顺序
export function listInstallOrder(activityId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/listInstallOrder',
    method: 'get'
  })
}

// 保存安装顺序
export function saveInstallOrder(activityId, data) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/saveInstallOrder',
    method: 'post',
    data: data
  })
}

// 删除安装顺序
export function deleteInstallOrder(activityId, id) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/deleteInstallOrder/' + id,
    method: 'delete'
  })
}

// ==================== 同升同降依赖组 ====================

// 查询同升同降依赖组
export function listDependencyGroup(activityId) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/listDependencyGroup',
    method: 'get'
  })
}

// 保存同升同降依赖组
export function saveDependencyGroup(activityId, data) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/saveDependencyGroup',
    method: 'post',
    data: data
  })
}

// 删除同升同降依赖组
export function deleteDependencyGroup(activityId, id) {
  return request({
    url: '/iov-ota/api/mpt/activity/v1/' + activityId + '/action/deleteDependencyGroup/' + id,
    method: 'delete'
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
