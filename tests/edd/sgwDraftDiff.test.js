const test = require('node:test')
const assert = require('node:assert/strict')

const {
  baseVersionLabel,
  changeTagType,
  changeTypeLabel,
  DIFF_GROUPS,
  EMPTY_DIFF_TEXT,
  fieldDiffCount,
  formatDiffContent,
  formatDiffValue,
  groupDiffItems,
  isDiffEmpty,
  isDraftConflict,
  isHiddenFieldPath,
  modifiedHint,
  summarizeChanges,
  visibleFieldDiffs
} = require('../../src/utils/sgw/draftDiff.js')

const items = [
  { objectType: 'ROUTE', code: 'r1', changeType: 'MODIFIED', fields: [
    { path: '/priority', changeType: 'MODIFIED', beforeValue: 100, afterValue: 200 },
    { path: '/rowVersion', changeType: 'MODIFIED', beforeValue: 1, afterValue: 2 }
  ] },
  { objectType: 'CANARY_POLICY', code: 'c1', changeType: 'ADDED', fields: [] },
  { objectType: 'ROUTE', code: 'r2', changeType: 'REMOVED', fields: [] },
  { objectType: 'AUTH_POLICY', code: 'a1', changeType: 'ADDED', fields: [] }
]

test('按四类对象固定顺序分组并保留空分组', () => {
  const groups = groupDiffItems(items)
  assert.deepEqual(groups.map(group => group.objectType), DIFF_GROUPS.map(group => group.objectType))
  assert.deepEqual(groups.map(group => group.label), ['路由', '认证授权策略', '流量治理策略', '灰度策略'])
  assert.deepEqual(groups[0].items.map(item => item.code), ['r1', 'r2'])
  assert.deepEqual(groups[1].items.map(item => item.code), ['a1'])
  assert.deepEqual(groups[2].items, [])
  assert.deepEqual(groups[3].items.map(item => item.code), ['c1'])
  assert.equal(groups[0].summary.ADDED, 0)
  assert.equal(groups[0].summary.MODIFIED, 1)
  assert.equal(groups[0].summary.REMOVED, 1)
  assert.equal(groups[0].summary.total, 2)
})

test('空差异与未知对象类型不破坏分组', () => {
  assert.equal(isDiffEmpty([]), true)
  assert.equal(isDiffEmpty(null), true)
  assert.equal(isDiffEmpty(items), false)
  const groups = groupDiffItems([{ objectType: 'UNKNOWN', code: 'x', changeType: 'ADDED', fields: [] }])
  assert.deepEqual(groups.map(group => group.items.length), [0, 0, 0, 0])
})

test('变更统计按变化类型计数', () => {
  assert.deepEqual(summarizeChanges(items), { ADDED: 2, MODIFIED: 1, REMOVED: 1, total: 4 })
  assert.deepEqual(summarizeChanges(null), { ADDED: 0, MODIFIED: 0, REMOVED: 0, total: 0 })
})

test('rowVersion 字段差异在页面上隐藏，仅在必要时提示', () => {
  assert.equal(isHiddenFieldPath('/rowVersion'), true)
  assert.equal(isHiddenFieldPath('/match/rowVersion'), false)
  const route = items[0]
  assert.deepEqual(visibleFieldDiffs(route.fields).map(field => field.path), ['/priority'])
  assert.equal(fieldDiffCount(route), 1)
  assert.equal(modifiedHint(route), '')

  const onlyRowVersion = {
    objectType: 'ROUTE',
    code: 'r3',
    changeType: 'MODIFIED',
    fields: [{ path: '/rowVersion', changeType: 'MODIFIED', beforeValue: 1, afterValue: 2 }]
  }
  assert.equal(fieldDiffCount(onlyRowVersion), 0)
  assert.equal(modifiedHint(onlyRowVersion), '仅记录版本号变化')

  assert.equal(fieldDiffCount(items[1]), 0)
  assert.equal(modifiedHint(items[1]), '')
})

test('基准版本与空态文案', () => {
  assert.equal(baseVersionLabel(null), '尚未发布')
  assert.equal(baseVersionLabel(undefined), '尚未发布')
  assert.equal(baseVersionLabel(''), '尚未发布')
  assert.equal(baseVersionLabel(5), 'v5')
  assert.equal(EMPTY_DIFF_TEXT, '当前没有待发布变更')
})

test('字段前后值保留原始类型，缺失显示（无）', () => {
  assert.equal(formatDiffValue(null), '（无）')
  assert.equal(formatDiffValue(undefined), '（无）')
  assert.equal(formatDiffValue('MOBILE'), 'MOBILE')
  assert.equal(formatDiffValue(200), '200')
  assert.equal(formatDiffValue(false), 'false')
  assert.equal(formatDiffValue(['/v1', '/v2']), '["/v1","/v2"]')
  assert.equal(formatDiffValue({ type: 'SERVICE', serviceId: 'edd-vmd-service' }),
    '{"type":"SERVICE","serviceId":"edd-vmd-service"}')
})

test('新增删除对象内容格式化为可读 JSON', () => {
  assert.equal(formatDiffContent(null), '')
  assert.equal(formatDiffContent({ routeCode: 'r1', priority: 100 }),
    '{\n  "routeCode": "r1",\n  "priority": 100\n}')
})

test('变化类型标签与颜色', () => {
  assert.equal(changeTypeLabel('ADDED'), '新增')
  assert.equal(changeTypeLabel('MODIFIED'), '修改')
  assert.equal(changeTypeLabel('REMOVED'), '删除')
  assert.equal(changeTagType('ADDED'), 'success')
  assert.equal(changeTagType('REMOVED'), 'danger')
  assert.equal(changeTagType('MODIFIED'), 'warning')
})

test('发布冲突按既有 SGW-409001 语义识别', () => {
  assert.equal(isDraftConflict({ response: { data: { code: 'SGW-409001' } } }), true)
  assert.equal(isDraftConflict({ response: { data: { code: 'SGW-400001' } } }), false)
  assert.equal(isDraftConflict(null), false)
  assert.equal(isDraftConflict(new Error('network')), false)
})
