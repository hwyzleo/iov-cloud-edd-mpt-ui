import request from '@/utils/request'

// 查询车辆升级任务列表
export function listTaskVehicle(query) {
  return request({
    url: '/iov-ota/api/mpt/taskVehicle/v1/list',
    method: 'get',
    params: query
  })
}

// 查询车辆升级任务详细
export function getTaskVehicle(taskVehicleId) {
  return request({
    url: '/iov-ota/api/mpt/taskVehicle/v1/' + taskVehicleId,
    method: 'get'
  })
}

// 获取车辆升级任务过程
export function listTaskVehicleProcess(taskVehicleId) {
  return request({
    url: '/iov-ota/api/mpt/taskVehicle/v1/' + taskVehicleId + '/process',
    method: 'get'
  })
}

// ==================== 授权记录（CR-016） ====================

// 查询车辆升级任务不可变授权历史
export function listTaskVehicleConsents(taskVehicleId, query) {
  return request({
    url: '/iov-ota/api/mpt/taskVehicle/v1/' + taskVehicleId + '/consents',
    method: 'get',
    params: query
  })
}

// 查询车辆升级任务当前权威授权状态
export function getTaskVehicleCurrentConsent(taskVehicleId) {
  return request({
    url: '/iov-ota/api/mpt/taskVehicle/v1/' + taskVehicleId + '/consents/current',
    method: 'get'
  })
}

// ==================== 管理运营闭环（CR-015） ====================

// 查询车辆任务的安装尝试列表
export function listTaskVehicleExecutions(taskVehicleId, query) {
  return request({
    url: '/iov-ota/api/mpt/taskVehicle/v1/' + taskVehicleId + '/executions',
    method: 'get',
    params: query
  })
}

// 查询单次执行的事件列表
export function listTaskVehicleExecutionEvents(taskVehicleId, executionId, query) {
  return request({
    url: '/iov-ota/api/mpt/taskVehicle/v1/' + taskVehicleId + '/executions/' + executionId + '/events',
    method: 'get',
    params: query
  })
}

// 查询车辆任务重试/续传轨迹
export function listTaskVehicleRetryLogs(taskVehicleId, query) {
  return request({
    url: '/iov-ota/api/mpt/taskVehicle/v1/' + taskVehicleId + '/retryLogs',
    method: 'get',
    params: query
  })
}

// 查询车辆任务升级日志登记
export function listTaskVehicleUpgradeLogs(taskVehicleId, query) {
  return request({
    url: '/iov-ota/api/mpt/taskVehicle/v1/' + taskVehicleId + '/upgradeLogs',
    method: 'get',
    params: query
  })
}
