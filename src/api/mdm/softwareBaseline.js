import request from '@/utils/request'

// 查询软件基线列表
export function listSoftwareBaseline(query) {
  return request({
    url: '/edd-mdm/api/mpt/material/softwareBaseline/v1/list',
    method: 'get',
    params: query
  })
}

// 查询软件基线详细
export function getSoftwareBaseline(code) {
  return request({
    url: '/edd-mdm/api/mpt/material/softwareBaseline/v1/' + code,
    method: 'get'
  })
}

// 新增软件基线
export function addSoftwareBaseline(data) {
  return request({
    url: '/edd-mdm/api/mpt/material/softwareBaseline/v1/create',
    method: 'post',
    data: data
  })
}

// 修改软件基线
export function updateSoftwareBaseline(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/material/softwareBaseline/v1/' + code,
    method: 'put',
    data: data
  })
}

// 删除软件基线
export function delSoftwareBaseline(code, operator) {
  return request({
    url: '/edd-mdm/api/mpt/material/softwareBaseline/v1/' + code,
    method: 'delete',
    params: { operator }
  })
}

// 强制删除软件基线
export function forceDelSoftwareBaseline(code, operator) {
  return request({
    url: '/edd-mdm/api/mpt/material/softwareBaseline/v1/' + code + '/force',
    method: 'delete',
    params: { operator }
  })
}

// 绑定基线项
export function bindSoftwareBaselineItem(code, data) {
  return request({
    url: '/edd-mdm/api/mpt/material/softwareBaseline/v1/' + code + '/items/bind',
    method: 'post',
    data: data
  })
}

// 解绑基线项
export function unbindSoftwareBaselineItem(code, partCode, operator) {
  return request({
    url: '/edd-mdm/api/mpt/material/softwareBaseline/v1/' + code + '/items/unbind',
    method: 'post',
    params: { partCode, operator }
  })
}

// 发布软件基线
export function releaseSoftwareBaseline(code, releasedBy) {
  return request({
    url: '/edd-mdm/api/mpt/material/softwareBaseline/v1/' + code + '/release',
    method: 'post',
    params: { releasedBy }
  })
}

// 取代软件基线
export function supersedeSoftwareBaseline(code, supersededByCode, operator) {
  return request({
    url: '/edd-mdm/api/mpt/material/softwareBaseline/v1/' + code + '/supersede',
    method: 'post',
    params: { supersededByCode, operator }
  })
}

// 查询软件基线历史版本
export function listSoftwareBaselineHistory(code) {
  return request({
    url: '/edd-mdm/api/mpt/material/softwareBaseline/v1/' + code + '/history',
    method: 'get'
  })
}

// 导出软件基线
export function exportSoftwareBaseline() {
  return request({
    url: '/edd-mdm/api/mpt/material/softwareBaseline/v1/export',
    method: 'get'
  })
}
