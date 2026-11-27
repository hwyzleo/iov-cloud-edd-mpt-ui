/**
 * 探索页专题跳转模式与图集（MKT-CMS-DSN-CR-004 §3.1 / §7）。
 *
 * 与后端保持一致：
 * - 专题详情（默认）= target 为空，卡片打开本专题详情页，允许维护多篇文章；
 * - 文章详情 / H5 / 原生 = target 明确，禁止维护文章列表；
 * - 历史 TOPIC(self) 目标归一为专题详情模式。
 */

export const TOPIC_DETAIL = 'TOPIC'

export const TOPIC_MODES = ['TOPIC', 'ARTICLE', 'H5', 'NATIVE']

export const TOPIC_MODE_LABELS = {
  TOPIC: '专题详情',
  ARTICLE: '文章详情',
  H5: 'H5 页面',
  NATIVE: '原生页面'
}

/**
 * 跳转类型标签
 *
 * @param {string} mode 跳转模式
 * @returns {string} 标签
 */
export function topicModeLabel(mode) {
  return TOPIC_MODE_LABELS[mode] || mode || '-'
}

/**
 * 编辑回显：把服务端 target 归一为表单模式
 *
 * @param {object|null} target 服务端跳转目标
 * @returns {object} 表单跳转目标
 */
export function normalizeTopicTarget(target) {
  if (!target || !target.type) {
    return { type: TOPIC_DETAIL }
  }
  if (target.type === 'ARTICLE') {
    return {
      type: 'ARTICLE',
      articleId: target.articleId || target.refId || '',
      revisionId: target.revisionId || ''
    }
  }
  if (target.type === 'TOPIC') {
    // 历史 TOPIC(self) 与空目标统一为专题详情模式
    return { type: TOPIC_DETAIL }
  }
  if (target.type === 'H5') {
    return { type: 'H5', url: target.url || '' }
  }
  return { type: 'NATIVE', routeCode: target.routeCode || '', params: target.params || {}}
}

/**
 * 当前模式是否允许维护文章列表
 *
 * @param {string} mode 跳转模式
 * @returns {boolean} 是否允许
 */
export function isArticleListAllowed(mode) {
  return (mode || TOPIC_DETAIL) === TOPIC_DETAIL
}

/**
 * 提交载荷中的 target：专题详情模式必须为空
 *
 * @param {object|null} target 表单跳转目标
 * @returns {object|null} 提交目标
 */
export function buildTopicTargetPayload(target) {
  if (!target || !target.type || target.type === TOPIC_DETAIL) {
    return null
  }
  if (target.type === 'ARTICLE') {
    return { type: 'ARTICLE', articleId: target.articleId, revisionId: target.revisionId }
  }
  if (target.type === 'H5') {
    return { type: 'H5', url: target.url }
  }
  return { type: 'NATIVE', routeCode: target.routeCode, params: target.params || {}}
}

/**
 * 编辑回显：图集归一（兼容只有封面的历史专题）
 * MKT-CMS-DSN-CR-005 §7.2：保留显式 showInDetail，缺省按 true 回显。
 *
 * @param {object} form 服务端专题视图
 * @returns {Array} 有序图集
 */
export function normalizeTopicImages(form) {
  const images = (form && form.images) || []
  const source = images.length > 0
    ? images.slice()
    : (form && form.cover && form.cover.url) ? [form.cover] : []
  return source.map(image => ({
    ...image,
    showInDetail: image.showInDetail !== false
  }))
}

/**
 * 构造专题保存草稿载荷
 *
 * @param {object} form 专题表单
 * @param {Array} items 已选文章（按人工顺序）
 * @param {object|null} target 表单跳转目标
 * @returns {object} 请求载荷
 */
export function buildTopicSavePayload(form, items, target) {
  const mode = (target && target.type) || TOPIC_DETAIL
  return {
    name: form.name,
    summary: form.summary,
    images: normalizeTopicImages(form),
    target: buildTopicTargetPayload(target),
    articleRevisionIds: isArticleListAllowed(mode)
      ? (items || []).map(item => item.articleRevisionId)
      : [],
    lockVersion: form.lockVersion
  }
}
