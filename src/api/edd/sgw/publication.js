import request from '@/utils/request'

// 分页查询发布记录
export function listPublications(query) {
  return request({
    url: '/system/sgw/publications/list',
    method: 'get',
    params: query
  })
}

// 查询发布记录与逐实例结果
export function getPublication(publicationId) {
  return request({
    url: '/system/sgw/publications/' + publicationId,
    method: 'get'
  })
}

// 重试失败的发布
export function retryPublication(publicationId) {
  return request({
    url: '/system/sgw/publications',
    method: 'post',
    data: { publicationId: publicationId }
  })
}
