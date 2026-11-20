/**
 * 协议内容管理纯函数（便于单元测试，不依赖 Vue/axios）。
 *
 * 设计要点（MKT-CMS-DSN-CR-002）：
 * - 内容语言（locale）是协议身份维度，与界面语言无关，所有查询都显式带 locale；
 * - 空串/空白条件不传给后端（后端把缺失维度用于“不过滤”，但显式空串在发布/创建时会被拒绝）；
 * - 发布命令必须显式包含 expectedBundleId 字段（首次发布传 null）。
 */

// 默认场景（首版只开放车端激活场景）
export const DEFAULT_SCENE = 'IVI_ACTIVATION'

// 协议类型
export const AGREEMENT_TYPES = ['PRIVACY_POLICY', 'USER_AGREEMENT']

// 协议类型展示名
export const AGREEMENT_TYPE_LABELS = {
  PRIVACY_POLICY: '隐私政策',
  USER_AGREEMENT: '用户协议'
}

// 空串/空白转 undefined，便于“不传该条件”
export function emptyToUndefined(value) {
  if (value === null || value === undefined) {
    return undefined
  }
  const trimmed = typeof value === 'string' ? value.trim() : value
  return trimmed === '' ? undefined : trimmed
}

// 范围查询参数（当前包读取、发布回显）
export function buildScopeParams(scope = {}) {
  const params = {
    scene: emptyToUndefined(scope.scene) || DEFAULT_SCENE
  }
  const dimensions = ['market', 'locale', 'brandCode', 'carLineCode']
  dimensions.forEach((field) => {
    const value = emptyToUndefined(scope[field])
    if (value !== undefined) {
      params[field] = value
    }
  })
  return params
}

// 列表查询参数
export function buildAgreementSearchParams(query = {}) {
  const params = {
    pageNum: query.pageNum || 1,
    pageSize: query.pageSize || 10
  }
  const fields = ['agreementType', 'scene', 'market', 'locale', 'brandCode', 'carLineCode', 'title', 'version']
  fields.forEach((field) => {
    const value = emptyToUndefined(query[field])
    if (value !== undefined) {
      params[field] = value
    }
  })
  if (typeof query.published === 'boolean') {
    params.published = query.published
  }
  return params
}

// 新建草稿请求体（范围四维省略时由后端补默认并显式返回）
export function buildDraftCreatePayload(form = {}) {
  const payload = {
    agreementType: form.agreementType,
    scene: emptyToUndefined(form.scene) || DEFAULT_SCENE,
    title: emptyToUndefined(form.title),
    version: emptyToUndefined(form.version),
    agreementDate: form.agreementDate,
    body: form.body
  }
  const dimensions = ['market', 'locale', 'brandCode', 'carLineCode']
  dimensions.forEach((field) => {
    const value = emptyToUndefined(form[field])
    if (value !== undefined) {
      payload[field] = value
    }
  })
  return payload
}

// 修改草稿请求体（范围与类型不可变，只允许改标题/版本/协议日期/正文）
export function buildDraftUpdatePayload(form = {}) {
  return {
    lockVersion: form.lockVersion,
    title: emptyToUndefined(form.title),
    version: emptyToUndefined(form.version),
    agreementDate: form.agreementDate,
    body: form.body
  }
}

// 发布请求体：expectedBundleId 字段必须出现（首次发布为 null）
export function buildPublishPayload(form = {}) {
  return {
    scene: emptyToUndefined(form.scene) || DEFAULT_SCENE,
    market: emptyToUndefined(form.market),
    locale: emptyToUndefined(form.locale),
    brandCode: emptyToUndefined(form.brandCode),
    carLineCode: emptyToUndefined(form.carLineCode),
    privacyRevisionId: emptyToUndefined(form.privacyRevisionId),
    userAgreementRevisionId: emptyToUndefined(form.userAgreementRevisionId),
    requestId: emptyToUndefined(form.requestId),
    expectedBundleId: emptyToUndefined(form.expectedBundleId) || null
  }
}

// 生成幂等请求标识（同一操作重试时复用，避免重复生成发布包）
export function nextRequestId(prefix = 'MPT-AGREEMENT-', now = Date.now, random = Math.random) {
  const timestamp = now()
  const suffix = Math.floor(random() * 1e9).toString(36)
  return prefix + timestamp + '-' + suffix
}

// 品牌可选车系（未配置归属时返回全部车系）
export function carLinesOfBrand(metadata = {}, brandCode) {
  const mapping = metadata.carLinesByBrand || {}
  const owned = mapping[brandCode]
  if (owned && owned.length > 0) {
    return owned
  }
  return metadata.carLines || []
}

// 是否允许发布（必须是两份不同类型的已定稿修订）
export function canPublish(form = {}) {
  const privacy = emptyToUndefined(form.privacyRevisionId)
  const user = emptyToUndefined(form.userAgreementRevisionId)
  return Boolean(privacy && user && privacy !== user)
}

// 协议类型展示名
export function agreementTypeLabel(type) {
  return AGREEMENT_TYPE_LABELS[type] || type || '-'
}

// 内容语言展示（首版仅中文，其他语言扩展后自动展示原值）
export function localeLabel(locale) {
  if (!locale) {
    return '-'
  }
  if (locale === 'zh-CN') {
    return '简体中文 (zh-CN)'
  }
  return locale
}
