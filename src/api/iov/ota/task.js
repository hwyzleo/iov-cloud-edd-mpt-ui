import request from '@/utils/request'

// 查询升级任务列表
export function listTask(query) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/list',
    method: 'get',
    params: query
  })
}

// 获取所有升级任务状态
export function listAllTaskState() {
  return request({
    url: '/iov-ota/api/mpt/task/v1/listAllTaskState',
    method: 'get'
  })
}

// 查询升级任务详细
export function getTask(taskId) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId,
    method: 'get'
  })
}

// 新增升级任务
export function addTask(data) {
  return request({
    url: '/iov-ota/api/mpt/task/v1',
    method: 'post',
    data: data
  })
}

// 修改升级任务
export function updateTask(data) {
  return request({
    url: '/iov-ota/api/mpt/task/v1',
    method: 'put',
    data: data
  })
}

// 提交升级任务
export function submitTask(taskId, data) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/action/submit',
    method: 'post',
    data: data
  })
}

// 审核升级任务
export function auditTask(taskId, data) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/action/audit',
    method: 'post',
    data: data
  })
}

// 查询任务多级审批记录
export function listTaskApproval(taskId) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/listApproval',
    method: 'get'
  })
}

// 发布升级任务
export function releaseTask(taskId) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/action/release',
    method: 'post'
  })
}

// 暂停升级任务
export function pauseTask(taskId) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/action/pause',
    method: 'post'
  })
}

// 带原因暂停升级任务
export function pauseTaskWithReason(taskId, data) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/action/pauseWithReason',
    method: 'post',
    data: data
  })
}

// 恢复升级任务
export function resumeTask(taskId) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/action/resume',
    method: 'post'
  })
}

// 取消升级任务
export function cancelTask(taskId) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/action/cancel',
    method: 'post'
  })
}

// 带原因取消升级任务
export function cancelTaskWithReason(taskId, data) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/action/cancelWithReason',
    method: 'post',
    data: data
  })
}

// 排程升级任务
export function scheduleTask(taskId, releaseTime) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/action/schedule',
    method: 'post',
    data: { releaseTime: releaseTime }
  })
}

// 取消排程升级任务
export function unscheduleTask(taskId) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/action/unschedule',
    method: 'post'
  })
}

// 取代升级任务
export function supersedeTask(taskId) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/action/supersede',
    method: 'post'
  })
}

// 结束升级任务
export function finishTask(taskId) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/action/finish',
    method: 'post'
  })
}

// 删除升级任务
export function delTask(taskIds) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskIds,
    method: 'delete'
  })
}

// ==================== 授权汇总（CR-016） ====================

// 查询任务授权汇总（状态分布 + 车辆授权列表）
export function listTaskConsents(taskId, query) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/consents',
    method: 'get',
    params: query
  })
}

// ==================== 管理运营闭环（CR-015） ====================

// 查询任务状态迁移审计
export function listTaskStateLogs(taskId, query) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/stateLogs',
    method: 'get',
    params: query
  })
}

// 查询任务健康指标
export function getTaskMetric(taskId) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/metric',
    method: 'get'
  })
}

// 查询任务报告（临时统计或正式报告）
export function getTaskReport(taskId) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/report',
    method: 'get'
  })
}

// 查询任务对下一任务的放行门禁
export function getTaskReleaseGate(taskId) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/releaseGate',
    method: 'get'
  })
}

// 人工放行门禁（需权限、原因与审批引用）
export function overrideTaskReleaseGate(taskId, data) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskId + '/releaseGate/override',
    method: 'post',
    data: data
  })
}
