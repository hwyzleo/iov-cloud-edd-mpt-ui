import request from '@/utils/request'

// 获取OptionFamily营销列表
export function getOptionFamilyPolicyList(saleModelCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/optionFamilyPolicy',
    method: 'get'
  })
}

// 创建/更新OptionFamily营销信息
export function saveOptionFamilyPolicy(saleModelCode, data) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/optionFamilyPolicy',
    method: 'post',
    data: data
  })
}

// 删除OptionFamily营销信息
export function deleteOptionFamilyPolicy(saleModelCode, optionFamilyCode) {
  return request({
    url: '/otd-vso/api/mpt/saleModel/v1/' + saleModelCode + '/optionFamilyPolicy/' + optionFamilyCode,
    method: 'delete'
  })
}
