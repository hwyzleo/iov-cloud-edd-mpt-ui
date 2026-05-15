import request from '@/utils/request'

export function listDept(query) {
  return request({
    url: '/mpt/department/list',
    method: 'get',
    params: query
  })
}

export function getDeptTree(query) {
  return request({
    url: '/mpt/department/tree',
    method: 'get',
    params: query
  })
}

export function listDeptExcludeChild(deptId) {
  return request({
    url: '/mpt/department/list/exclude/' + deptId,
    method: 'get'
  })
}

export function getDept(deptId) {
  return request({
    url: '/mpt/department/' + deptId,
    method: 'get'
  })
}

export function addDept(data) {
  return request({
    url: '/mpt/department',
    method: 'post',
    data: data
  })
}

export function updateDept(data) {
  return request({
    url: '/mpt/department',
    method: 'put',
    data: data
  })
}

export function delDept(deptId) {
  return request({
    url: '/mpt/department/' + deptId,
    method: 'delete'
  })
}

export function deptTreeSelect(query) {
  return request({
    url: '/mpt/department/deptTree',
    method: 'get',
    params: query
  })
}