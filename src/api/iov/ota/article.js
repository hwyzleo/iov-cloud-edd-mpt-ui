import request from '@/utils/request'

// 查询文章列表
export function listArticle(query) {
  return request({
    url: '/iov-ota/api/mpt/article/v1/list',
    method: 'get',
    params: query
  })
}

// 查询文章详细
export function getArticle(articleId) {
  return request({
    url: '/iov-ota/api/mpt/article/v1/' + articleId,
    method: 'get'
  })
}

// 新增文章
export function addArticle(data) {
  return request({
    url: '/iov-ota/api/mpt/article/v1',
    method: 'post',
    data: data
  })
}

// 修改文章
export function updateArticle(data) {
  return request({
    url: '/iov-ota/api/mpt/article/v1',
    method: 'put',
    data: data
  })
}

// 删除文章
export function delArticle(articleIds) {
  return request({
    url: '/iov-ota/api/mpt/article/v1/' + articleIds,
    method: 'delete'
  })
}
