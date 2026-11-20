import request from '@/utils/request'

// MKT-CMS 协议内容管理（MPT）
// 权限点：mkt:cms:agreement:query / add / edit / freeze / publish
const BASE = '/mkt-cms/api/mpt/agreement/v1'

// 管理元数据（受支持语言/市场/品牌/车系、清洗策略与大小上限）
export function getAgreementMetadata() {
  return request({
    url: BASE + '/agreement-metadata',
    method: 'get'
  })
}

// 草稿分页检索
export function listAgreementDraft(query) {
  return request({
    url: BASE + '/agreement-drafts/list',
    method: 'get',
    params: query
  })
}

// 草稿详情（含清洗后的正文）
export function getAgreementDraft(draftId) {
  return request({
    url: BASE + '/agreement-drafts/' + draftId,
    method: 'get'
  })
}

// 新建草稿
export function createAgreementDraft(data) {
  return request({
    url: BASE + '/agreement-drafts',
    method: 'post',
    data: data
  })
}

// 修改草稿（必须携带 lockVersion，冲突不覆盖）
export function updateAgreementDraft(draftId, data) {
  return request({
    url: BASE + '/agreement-drafts/' + draftId,
    method: 'put',
    data: data
  })
}

// 定稿（对指定 lockVersion 生成不可变修订，重复定稿幂等）
export function freezeAgreementDraft(draftId, lockVersion) {
  return request({
    url: BASE + '/agreement-drafts/' + draftId + '/action/freeze',
    method: 'post',
    data: { lockVersion: lockVersion }
  })
}

// 修订分页检索（published=true 时仅返回已发布修订）
export function listAgreementRevision(query) {
  return request({
    url: BASE + '/agreement-revisions/list',
    method: 'get',
    params: query
  })
}

// 修订详情（含正文与摘要）
export function getAgreementRevision(revisionId) {
  return request({
    url: BASE + '/agreement-revisions/' + revisionId,
    method: 'get'
  })
}

// 历史发布包分页检索
export function listAgreementBundle(query) {
  return request({
    url: BASE + '/agreement-bundles/list',
    method: 'get',
    params: query
  })
}

// 指定范围当前发布包（无当前包时后端返回 404 + 105002）
export function getCurrentAgreementBundle(query) {
  return request({
    url: BASE + '/agreement-bundles/current',
    method: 'get',
    params: query
  })
}

// 立即发布完整协议包（requestId 幂等，expectedBundleId 为发布前提）
export function publishAgreementBundle(data) {
  return request({
    url: BASE + '/agreement-bundles/action/publish',
    method: 'post',
    data: data
  })
}
