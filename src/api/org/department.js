import request from '@/utils/request'

// 查询部门列表
export function listDept(query) {
  return request({
    url: '/mpt/department/list',
    method: 'get',
    params: query
  })
}

// 查询部门树
export function getDeptTree(query) {
  return request({
    url: '/mpt/department/tree',
    method: 'get',
    params: query
  })
}

// 查询部门列表（排除节点）
export function listDeptExcludeChild(deptId) {
  return request({
    url: '/mpt/department/list/exclude/' + deptId,
    method: 'get'
  })
}

// 查询部门详细
export function getDept(deptId) {
  return request({
    url: '/mpt/department/' + deptId,
    method: 'get'
  })
}

// 新增部门
export function addDept(data) {
  return request({
    url: '/mpt/department',
    method: 'post',
    data: data
  })
}

// 修改部门
export function updateDept(data) {
  return request({
    url: '/mpt/department',
    method: 'put',
    data: data
  })
}

// 删除部门
export function delDept(deptId) {
  return request({
    url: '/mpt/department/' + deptId,
    method: 'delete'
  })
}

// 查询部门下拉树结构
export function deptTreeSelect(query) {
  return request({
    url: '/mpt/department/deptTree',
    method: 'get',
    params: query
  })
}