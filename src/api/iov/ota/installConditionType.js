import request from '@/utils/request'

// 查询所有安装条件类型
export function listInstallConditionType() {
  return request({
    url: '/iov-ota/api/mpt/install-condition-type/v1/list',
    method: 'get'
  })
}

// 查询指定阶段的安装条件类型
export function listInstallConditionTypeByPhase(phase) {
  return request({
    url: '/iov-ota/api/mpt/install-condition-type/v1/listByPhase/' + phase,
    method: 'get'
  })
}

// 查询必选的安装条件类型
export function listMandatoryInstallConditionType() {
  return request({
    url: '/iov-ota/api/mpt/install-condition-type/v1/listMandatory',
    method: 'get'
  })
}
