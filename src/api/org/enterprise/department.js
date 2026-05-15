import request from '@/utils/request'

// 查询部门列表
export function listDept(query) {
  return request({
    url: '/edd-org/api/mpt/department/v1/list',
    method: 'get',
    params: query
  })
}

// 查询部门树
export function getDeptTree(query) {
  return request({
    url: '/edd-org/api/mpt/department/v1/tree',
    method: 'get',
    params: query
  })
}

// 查询部门列表（排除节点）
export function listDeptExcludeChild(deptId) {
  return request({
    url: '/edd-org/api/mpt/department/v1/list/exclude/' + deptId,
    method: 'get'
  })
}

// 查询部门详细
export function getDept(deptId) {
  return request({
    url: '/edd-org/api/mpt/department/v1/' + deptId,
    method: 'get'
  })
}

// 新增部门
export function addDept(data) {
  return request({
    url: '/edd-org/api/mpt/department/v1',
    method: 'post',
    data: data
  })
}

// 修改部门
export function updateDept(data) {
  return request({
    url: '/edd-org/api/mpt/department/v1',
    method: 'put',
    data: data
  })
}

// 删除部门
export function delDept(deptId) {
  return request({
    url: '/edd-org/api/mpt/department/v1/' + deptId,
    method: 'delete'
  })
}

// 查询部门下拉树结构
export function deptTreeSelect(query) {
  return request({
    url: '/edd-org/api/mpt/department/v1/deptTree',
    method: 'get',
    params: query
  })
}
