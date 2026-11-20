const test = require('node:test')
const assert = require('node:assert/strict')

const {
  emptyToUndefined,
  buildScopeParams,
  buildAgreementSearchParams,
  buildDraftCreatePayload,
  buildDraftUpdatePayload,
  buildPublishPayload,
  nextRequestId,
  carLinesOfBrand,
  canPublish,
  agreementTypeLabel,
  localeLabel,
  DEFAULT_SCENE
} = require('../src/utils/cms/agreement')

test('空串与空白条件不传给后端', () => {
  assert.equal(emptyToUndefined('  '), undefined)
  assert.equal(emptyToUndefined(null), undefined)
  assert.equal(emptyToUndefined(' zh-CN '), 'zh-CN')
})

test('范围参数：场景必传、其他维度空值不传', () => {
  const params = buildScopeParams({ scene: 'IVI_ACTIVATION', locale: ' ', market: null })
  assert.deepEqual(params, { scene: DEFAULT_SCENE })
})

test('列表参数：分页默认值与已发布过滤', () => {
  const params = buildAgreementSearchParams({
    locale: 'zh-CN',
    title: ' 隐私 ',
    agreementType: '',
    published: true
  })
  assert.equal(params.pageNum, 1)
  assert.equal(params.pageSize, 10)
  assert.equal(params.locale, 'zh-CN')
  assert.equal(params.title, '隐私')
  assert.equal(params.agreementType, undefined)
  assert.equal(params.published, true)
})

test('新建草稿：范围省略时不提交空维度，正文与元信息保留', () => {
  const payload = buildDraftCreatePayload({
    agreementType: 'PRIVACY_POLICY',
    scene: '',
    locale: '',
    title: ' 隐私政策 ',
    version: ' 1.0 ',
    agreementDate: '2026-11-20',
    body: '<p>正文</p>'
  })
  assert.equal(payload.scene, DEFAULT_SCENE)
  assert.equal(payload.title, '隐私政策')
  assert.equal(payload.version, '1.0')
  assert.equal(payload.body, '<p>正文</p>')
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'locale'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'market'), false)
})

test('修改草稿：必须携带乐观锁版本，范围与类型不可变', () => {
  const payload = buildDraftUpdatePayload({
    agreementType: 'PRIVACY_POLICY',
    locale: 'zh-CN',
    title: '新标题',
    version: '2.0',
    agreementDate: '2026-11-20',
    body: '<p>新正文</p>',
    lockVersion: 3
  })
  assert.deepEqual(Object.keys(payload).sort(), ['agreementDate', 'body', 'lockVersion', 'title', 'version'])
  assert.equal(payload.lockVersion, 3)
})

test('发布载荷：expectedBundleId 字段必须出现（首次发布为 null）', () => {
  const payload = buildPublishPayload({
    scene: 'IVI_ACTIVATION',
    locale: 'zh-CN',
    privacyRevisionId: 'REV-P',
    userAgreementRevisionId: 'REV-U',
    requestId: 'req-1'
  })
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'expectedBundleId'), true)
  assert.equal(payload.expectedBundleId, null)
  assert.equal(payload.locale, 'zh-CN')

  const nextPayload = buildPublishPayload({
    scene: 'IVI_ACTIVATION',
    privacyRevisionId: 'REV-P',
    userAgreementRevisionId: 'REV-U',
    requestId: 'req-2',
    expectedBundleId: 'BDL-1'
  })
  assert.equal(nextPayload.expectedBundleId, 'BDL-1')
})

test('发布前校验：两份修订必须存在且类型不同', () => {
  assert.equal(canPublish({}), false)
  assert.equal(canPublish({ privacyRevisionId: 'REV-1' }), false)
  assert.equal(canPublish({ privacyRevisionId: 'REV-1', userAgreementRevisionId: 'REV-1' }), false)
  assert.equal(canPublish({ privacyRevisionId: 'REV-1', userAgreementRevisionId: 'REV-2' }), true)
})

test('幂等请求标识：前缀稳定且两次生成不同', () => {
  const fixedNow = () => 1763000000000
  const random = (() => {
    let seed = 0
    return () => {
      seed += 1
      return seed / 10
    }
  })()
  const first = nextRequestId('MPT-AGREEMENT-', fixedNow, random)
  const second = nextRequestId('MPT-AGREEMENT-', fixedNow, random)
  assert.match(first, /^MPT-AGREEMENT-1763000000000-/)
  assert.notEqual(first, second)
})

test('品牌车系联动：未配置归属时回退全部车系', () => {
  const metadata = { brands: ['DEFAULT', 'BM'], carLines: ['DEFAULT', 'CL1'], carLinesByBrand: { BM: ['CL1'] } }
  assert.deepEqual(carLinesOfBrand(metadata, 'BM'), ['CL1'])
  assert.deepEqual(carLinesOfBrand(metadata, 'DEFAULT'), ['DEFAULT', 'CL1'])
})

test('内容语言与类型展示', () => {
  assert.equal(localeLabel('zh-CN'), '简体中文 (zh-CN)')
  assert.equal(localeLabel('en-US'), 'en-US')
  assert.equal(localeLabel(undefined), '-')
  assert.equal(agreementTypeLabel('PRIVACY_POLICY'), '隐私政策')
  assert.equal(agreementTypeLabel('USER_AGREEMENT'), '用户协议')
})
