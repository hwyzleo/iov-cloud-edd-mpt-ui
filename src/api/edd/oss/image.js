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
