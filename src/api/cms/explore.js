import request from '@/utils/request'

// MKT-CMS 探索页内容运营（MPT）
// 权限点：mkt:cms:explore:query / add / edit / publish / offline
const BASE = '/mkt-cms/api/mpt/explore/v1'

// 管理元数据（组件/来源/目标类型、素材/H5/NATIVE 白名单与约束）
export function getExploreMetadata() {
  return request({
    url: BASE + '/explore-metadata',
    method: 'get'
  })
}

// ---------------- 频道 ----------------
export function listExploreChannels() {
  return request({
    url: BASE + '/channels',
    method: 'get'
  })
}

export function updateExploreChannel(channelCode, data) {
  return request({
    url: BASE + '/channels/' + channelCode,
    method: 'put',
    data: data
  })
}

// ---------------- 文章 ----------------
export function listExploreArticles(query) {
  return request({
    url: BASE + '/articles/list',
    method: 'get',
    params: query
  })
}

export function getExploreArticle(articleId) {
  return request({
    url: BASE + '/articles/' + articleId,
    method: 'get'
  })
}

export function createExploreArticle(data) {
  return request({
    url: BASE + '/articles',
    method: 'post',
    data: data
  })
}

export function updateExploreArticle(articleId, data) {
  return request({
    url: BASE + '/articles/' + articleId,
    method: 'put',
    data: data
  })
}

export function publishExploreArticle(articleId, revisionId) {
  return request({
    url: BASE + '/articles/' + articleId + '/action/publish',
    method: 'post',
    data: revisionId ? { revisionId: revisionId } : {}
  })
}

export function offlineExploreArticle(articleId) {
  return request({
    url: BASE + '/articles/' + articleId + '/action/offline',
    method: 'post'
  })
}

// ---------------- 专题 ----------------
export function listExploreTopics(query) {
  return request({
    url: BASE + '/topics/list',
    method: 'get',
    params: query
  })
}

export function getExploreTopic(topicId) {
  return request({
    url: BASE + '/topics/' + topicId,
    method: 'get'
  })
}

export function createExploreTopic(data) {
  return request({
    url: BASE + '/topics',
    method: 'post',
    data: data
  })
}

export function updateExploreTopic(topicId, data) {
  return request({
    url: BASE + '/topics/' + topicId,
    method: 'put',
    data: data
  })
}

export function publishExploreTopic(topicId, revisionId) {
  return request({
    url: BASE + '/topics/' + topicId + '/action/publish',
    method: 'post',
    data: revisionId ? { revisionId: revisionId } : {}
  })
}

export function offlineExploreTopic(topicId) {
  return request({
    url: BASE + '/topics/' + topicId + '/action/offline',
    method: 'post'
  })
}

// ---------------- Banner ----------------
export function listExploreBanners(query) {
  return request({
    url: BASE + '/banners/list',
    method: 'get',
    params: query
  })
}

export function getExploreBanner(bannerId) {
  return request({
    url: BASE + '/banners/' + bannerId,
    method: 'get'
  })
}

export function createExploreBanner(data) {
  return request({
    url: BASE + '/banners',
    method: 'post',
    data: data
  })
}

export function updateExploreBanner(bannerId, data) {
  return request({
    url: BASE + '/banners/' + bannerId,
    method: 'put',
    data: data
  })
}

export function publishExploreBanner(bannerId, revisionId) {
  return request({
    url: BASE + '/banners/' + bannerId + '/action/publish',
    method: 'post',
    data: revisionId ? { revisionId: revisionId } : {}
  })
}

export function offlineExploreBanner(bannerId) {
  return request({
    url: BASE + '/banners/' + bannerId + '/action/offline',
    method: 'post'
  })
}

// ---------------- 页面编排/发布 ----------------
export function getExplorePage(channelCode) {
  return request({
    url: BASE + '/pages/' + channelCode,
    method: 'get'
  })
}

export function saveExplorePage(channelCode, data) {
  return request({
    url: BASE + '/pages/' + channelCode,
    method: 'put',
    data: data
  })
}

export function getExploreCurrentPage(channelCode) {
  return request({
    url: BASE + '/pages/' + channelCode + '/current',
    method: 'get'
  })
}

export function publishExplorePage(channelCode, data) {
  return request({
    url: BASE + '/pages/' + channelCode + '/action/publish',
    method: 'post',
    data: data
  })
}

export function cancelExploreSchedule(channelCode) {
  return request({
    url: BASE + '/pages/' + channelCode + '/action/cancel-schedule',
    method: 'post'
  })
}

export function offlineExplorePage(channelCode) {
  return request({
    url: BASE + '/pages/' + channelCode + '/action/offline',
    method: 'post'
  })
}

export function listExploreReleases(channelCode, query) {
  return request({
    url: BASE + '/pages/' + channelCode + '/releases/list',
    method: 'get',
    params: query
  })
}

export function getExploreRelease(releaseId) {
  return request({
    url: BASE + '/page-releases/' + releaseId,
    method: 'get'
  })
}

export function copyExploreReleaseToDraft(releaseId) {
  return request({
    url: BASE + '/page-releases/' + releaseId + '/action/copy-to-draft',
    method: 'post'
  })
}

export function previewExploreDraft(pageId) {
  return request({
    url: BASE + '/page-drafts/' + pageId + '/preview',
    method: 'get'
  })
}

// ---------------- 素材上传（CMS 调用 EDD-OSS） ----------------
export function generateExploreAsset(data) {
  return request({
    url: BASE + '/assets/uploads',
    method: 'post',
    data: data
  })
}

export function completeExploreAsset(objectId) {
  return request({
    url: BASE + '/assets/uploads/' + objectId + '/complete',
    method: 'post'
  })
}
