import request from '@/utils/request'

// 查询零件导入数据列表
export function listPartImportData(query) {
  return request({
    url: '/edd-vmd/api/mpt/partImportData/v1/list',
    method: 'get',
    params: query
  })
}

// 查询零件导入数据
export function getPartImportData(id) {
  return request({
    url: '/edd-vmd/api/mpt/partImportData/v1/' + id,
    method: 'get'
  })
}

// 新增零件导入数据
export function addPartImportData(data) {
  return request({
    url: '/edd-vmd/api/mpt/partImportData/v1',
    method: 'post',
    data: data
  })
}

// 修改零件导入数据
export function updatePartImportData(data) {
  return request({
    url: '/edd-vmd/api/mpt/partImportData/v1',
    method: 'put',
    data: data
  })
}

// 删除零件导入数据
export function delPartImportData(ids) {
  return request({
    url: '/edd-vmd/api/mpt/partImportData/v1/' + ids,
    method: 'delete'
  })
}

// 零件导入后置处理补发（重放）
export function replayPartImportPostProcess(id, data) {
  return request({
    url: '/edd-vmd/api/mpt/partImportData/v1/' + id + '/replayPostProcess',
    method: 'post',
    data: data
  })
}

// 查询零件导入后置处理补发任务及动作明细
export function getPartImportPostProcessReplay(replayId) {
  return request({
    url: '/edd-vmd/api/mpt/partImportData/v1/replays/' + replayId,
    method: 'get'
  })
}
