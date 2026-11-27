const test = require('node:test')
const assert = require('node:assert/strict')

const {
  TOPIC_DETAIL,
  normalizeTopicTarget,
  isArticleListAllowed,
  buildTopicTargetPayload,
  normalizeTopicImages,
  buildTopicSavePayload,
  topicModeLabel
} = require('../src/utils/cms/exploreTopic')

test('跳转类型标签：专题详情默认', () => {
  assert.equal(topicModeLabel('TOPIC'), '专题详情')
  assert.equal(topicModeLabel('ARTICLE'), '文章详情')
  assert.equal(topicModeLabel('H5'), 'H5 页面')
  assert.equal(topicModeLabel('NATIVE'), '原生页面')
})

test('回显：空目标与历史 TOPIC(self) 归一为专题详情', () => {
  assert.deepEqual(normalizeTopicTarget(null), { type: TOPIC_DETAIL })
  assert.deepEqual(normalizeTopicTarget({ type: 'TOPIC', topicId: 'tp_1', revisionId: 'tr_1' }),
    { type: TOPIC_DETAIL })
})

test('回显：文章详情与 H5 目标保持字段', () => {
  assert.deepEqual(normalizeTopicTarget({ type: 'ARTICLE', articleId: 'at_1', revisionId: 'arv_1' }),
    { type: 'ARTICLE', articleId: 'at_1', revisionId: 'arv_1' })
  assert.deepEqual(normalizeTopicTarget({ type: 'H5', url: 'https://h5.example/a' }),
    { type: 'H5', url: 'https://h5.example/a' })
})

test('提交：专题详情提交空 target，其余模式按判别字段提交', () => {
  assert.equal(buildTopicTargetPayload({ type: TOPIC_DETAIL }), null)
  assert.equal(buildTopicTargetPayload(null), null)
  assert.deepEqual(buildTopicTargetPayload({ type: 'ARTICLE', articleId: 'at_1', revisionId: 'arv_1' }),
    { type: 'ARTICLE', articleId: 'at_1', revisionId: 'arv_1' })
  assert.deepEqual(buildTopicTargetPayload({ type: 'NATIVE', routeCode: 'articleDetail', params: { id: '1' } }),
    { type: 'NATIVE', routeCode: 'articleDetail', params: { id: '1' }})
})

test('文章列表仅在专题详情模式参与载荷', () => {
  assert.equal(isArticleListAllowed(TOPIC_DETAIL), true)
  assert.equal(isArticleListAllowed('ARTICLE'), false)
  assert.equal(isArticleListAllowed('H5'), false)
  assert.equal(isArticleListAllowed('NATIVE'), false)

  const items = [{ articleRevisionId: 'arv_1' }, { articleRevisionId: 'arv_2' }]
  const detail = buildTopicSavePayload({ name: '专题', summary: '摘要', images: [], lockVersion: 3 },
    items, { type: TOPIC_DETAIL })
  assert.deepEqual(detail.articleRevisionIds, ['arv_1', 'arv_2'])
  assert.equal(detail.target, null)

  const article = buildTopicSavePayload({ name: '专题', summary: '摘要', images: [], lockVersion: 3 },
    items, { type: 'ARTICLE', articleId: 'at_1', revisionId: 'arv_1' })
  assert.deepEqual(article.articleRevisionIds, [])
  assert.equal(article.target.type, 'ARTICLE')
})

test('图集回显：优先 images，兼容旧封面', () => {
  const image = { url: 'https://assets.example/a.png', width: 1, height: 1, mime: 'image/png', size: 1 }
  assert.deepEqual(normalizeTopicImages({ images: [image] }), [image])
  assert.deepEqual(normalizeTopicImages({ images: [], cover: image }), [image])
  assert.deepEqual(normalizeTopicImages({ images: [], cover: null }), [])
})

test('保存载荷不再发送独立封面字段', () => {
  const image = { url: 'https://assets.example/a.png', width: 1, height: 1, mime: 'image/png', size: 1 }
  const payload = buildTopicSavePayload(
    { name: '专题', summary: '摘要', images: [image], cover: image, lockVersion: 0 },
    [],
    { type: TOPIC_DETAIL }
  )
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'cover'), false)
  assert.deepEqual(payload.images, [image])
})
