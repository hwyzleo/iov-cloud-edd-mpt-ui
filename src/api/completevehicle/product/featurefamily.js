import request from '@/utils/request'

// 查询车辆特征族列表
export function listFeatureFamily(query) {
  return request({
    url: '/edd-vmd/api/mpt/featureFamily/v1/list',
    method: 'get',
    params: query
  })
}

// 查询所有车辆特征族列表
export function listAllFeatureFamily() {
  return request({
    url: '/edd-vmd/api/mpt/featureFamily/v1/listAllFeatureFamily',
    method: 'get'
  })
}

// 查询所有车辆特征族列表
export function listAllFeatureCode(familyCode) {
  return request({
    url: '/edd-vmd/api/mpt/featureFamily/v1/listAllFeatureCode?familyCode=' + familyCode,
    method: 'get'
  })
}

// 查询车辆特征值列表
export function listFeatureCode(familyId, query) {
  return request({
    url: '/edd-vmd/api/mpt/featureFamily/v1/' + familyId + '/featureCode/list',
    method: 'get',
    params: query
  })
}

// 查询车辆特征族详细
export function getFeatureFamily(featureFamilyId) {
  return request({
    url: '/edd-vmd/api/mpt/featureFamily/v1/' + featureFamilyId,
    method: 'get'
  })
}

// 查询车辆特征值详细
export function getFeatureCode(familyId, featureCodeId) {
  return request({
    url: '/edd-vmd/api/mpt/featureFamily/v1/' + familyId + '/featureCode/' + featureCodeId,
    method: 'get'
  })
}

// 新增车辆特征族
export function addFeatureFamily(data) {
  return request({
    url: '/edd-vmd/api/mpt/featureFamily/v1',
    method: 'post',
    data: data
  })
}

// 新增车辆特征值
export function addFeatureCode(familyId, data) {
  return request({
    url: '/edd-vmd/api/mpt/featureFamily/v1/' + familyId + '/featureCode',
    method: 'post',
    data: data
  })
}

// 修改车辆特征族
export function updateFeatureFamily(data) {
  return request({
    url: '/edd-vmd/api/mpt/featureFamily/v1',
    method: 'put',
    data: data
  })
}

// 修改车辆特征值
export function updateFeatureCode(familyId, data) {
  return request({
    url: '/edd-vmd/api/mpt/featureFamily/v1/' + familyId + '/featureCode',
    method: 'put',
    data: data
  })
}

// 删除车辆特征族
export function delFeatureFamily(featureFamilyIds) {
  return request({
    url: '/edd-vmd/api/mpt/featureFamily/v1/' + featureFamilyIds,
    method: 'delete'
  })
}

// 删除车辆特征值
export function delFeatureCode(familyId, featureCodeIds) {
  return request({
    url: '/edd-vmd/api/mpt/featureFamily/v1/' + familyId + '/featureCode/' + featureCodeIds,
    method: 'delete'
  })
}
