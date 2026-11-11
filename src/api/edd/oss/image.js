import request from '@/utils/request'

// 分页查询图片对象（EDD-OSS-DSN-CR-001 §10.2.1）
export function listImageObject(query) {
  return request({
    url: '/edd-oss/api/mpt/image/v1/objects/list',
    method: 'get',
    params: query
  })
}

// 查询图片对象完整详情（EDD-OSS-DSN-CR-001 §10.2.2）
export function getImageObject(objectId) {
  return request({
    url: '/edd-oss/api/mpt/image/v1/objects/' + objectId,
    method: 'get'
  })
}

// 获取图片预览信息（EDD-OSS-DSN-CR-001 §10.2.3）
export function previewImageObject(objectId) {
  return request({
    url: '/edd-oss/api/mpt/image/v1/objects/' + objectId + '/preview',
    method: 'get'
  })
}

// 删除已上传图片对象（EDD-OSS-DSN-CR-001 §10.2.4）
export function delImageObject(objectId) {
  return request({
    url: '/edd-oss/api/mpt/image/v1/objects/' + objectId,
    method: 'delete'
  })
}

// 申请默认素材上传（EDD-OSS-DSN-CR-002 §10.3.1）
export function generateDefaultAsset(data) {
  return request({
    url: '/edd-oss/api/mpt/image/v1/objects/uploads',
    method: 'post',
    data: data
  })
}

// 完成默认素材上传（EDD-OSS-DSN-CR-002 §10.3.2）
export function completeDefaultAsset(objectId) {
  return request({
    url: '/edd-oss/api/mpt/image/v1/objects/uploads/' + objectId + '/complete',
    method: 'post'
  })
}

// 编辑默认素材名称与备注（EDD-OSS-DSN-CR-002 §10.3.3）
export function updateImageAsset(objectId, data) {
  return request({
    url: '/edd-oss/api/mpt/image/v1/objects/' + objectId + '/asset',
    method: 'put',
    data: data
  })
}

// 创建替换任务（EDD-OSS-DSN-CR-002 §10.3.4）
export function generateImageReplacement(objectId, data) {
  return request({
    url: '/edd-oss/api/mpt/image/v1/objects/' + objectId + '/replacements',
    method: 'post',
    data: data
  })
}

// 完成或恢复替换（EDD-OSS-DSN-CR-002 §10.3.5）
export function completeImageReplacement(objectId, replacementId) {
  return request({
    url: '/edd-oss/api/mpt/image/v1/objects/' + objectId + '/replacements/' + replacementId + '/complete',
    method: 'post'
  })
}
