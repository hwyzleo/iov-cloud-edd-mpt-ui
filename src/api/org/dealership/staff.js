import request from '@/utils/request'
import {parseStrEmpty} from "@/utils/ruoyi";

// 查询门店员工列表
export function listDealershipStaff(query) {
  return request({
    url: '/edd-org/mpt/dealershipStaff/list',
    method: 'get',
    params: query
  })
}

// 查询员工
export function searchUserList(key) {
  return request({
    url: '/edd-org/mpt/dealershipStaff/searchUser',
    method: 'get',
    params: {'key': key}
  })
}

// 查询门店
export function searchDealershipList(key) {
  return request({
    url: '/edd-org/mpt/dealershipStaff/searchDealership',
    method: 'get',
    params: {'key': key}
  })
}

// 查询门店员工详细
export function getDealershipStaff(dealershipStaffId) {
  return request({
    url: '/edd-org/mpt/dealershipStaff/' + dealershipStaffId,
    method: 'get'
  })
}

// 新增门店员工
export function addDealershipStaff(data) {
  return request({
    url: '/edd-org/mpt/dealershipStaff',
    method: 'post',
    data: data
  })
}

// 修改门店员工
export function updateDealershipStaff(data) {
  return request({
    url: '/edd-org/mpt/dealershipStaff',
    method: 'put',
    data: data
  })
}

// 删除门店员工
export function delDealershipStaff(dealershipStaffId) {
  return request({
    url: '/edd-org/mpt/dealershipStaff/' + dealershipStaffId,
    method: 'delete'
  })
}

// 查询用户个人信息
export function getUserProfile() {
  return request({
    url: '/system/user/profile',
    method: 'get'
  })
}

// 修改用户个人信息
export function updateUserProfile(data) {
  return request({
    url: '/system/user/profile',
    method: 'put',
    data: data
  })
}

// 用户密码重置
export function updateUserPwd(oldPassword, newPassword) {
  const data = {
    oldPassword: oldPassword,
    newPassword: newPassword
  }
  return request({
    url: '/system/user/profile/updatePwd',
    method: 'put',
    data: data
  })
}

// 用户头像上传
export function uploadAvatar(data) {
  return request({
    url: '/system/user/profile/avatar',
    method: 'post',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    data: data
  })
}

// 查询授权角色
export function getAuthRole(userId) {
  return request({
    url: '/system/user/authRole/' + userId,
    method: 'get'
  })
}

// 保存授权角色
export function updateAuthRole(data) {
  return request({
    url: '/system/user/authRole',
    method: 'put',
    params: data
  })
}

// 查询组织下拉树结构
export function orgTreeSelect(query) {
  return request({
    url: '/edd-org/mpt/dealership/orgTree',
    method: 'get',
    params: query
  })
}
