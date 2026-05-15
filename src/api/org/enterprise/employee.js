import request from '@/utils/request'

// 查询员工列表
export function listEmployee(query) {
  return request({
    url: '/edd-org/api/mpt/employee/v1/list',
    method: 'get',
    params: query
  })
}

// 查询员工详细
export function getEmployee(employeeId) {
  return request({
    url: '/edd-org/api/mpt/employee/v1/' + employeeId,
    method: 'get'
  })
}

// 新增员工
export function addEmployee(data) {
  return request({
    url: '/edd-org/api/mpt/employee/v1',
    method: 'post',
    data: data
  })
}

// 修改员工
export function updateEmployee(data) {
  return request({
    url: '/edd-org/api/mpt/employee/v1',
    method: 'put',
    data: data
  })
}

// 删除员工
export function delEmployee(employeeId) {
  return request({
    url: '/edd-org/api/mpt/employee/v1/' + employeeId,
    method: 'delete'
  })
}
