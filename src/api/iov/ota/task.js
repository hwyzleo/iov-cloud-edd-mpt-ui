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
    url: '/iov-ota/mpt/task/v1/' + taskId + '/action/submit',
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

// 删除升级任务
export function delTask(taskIds) {
  return request({
    url: '/iov-ota/api/mpt/task/v1/' + taskIds,
    method: 'delete'
  })
}
