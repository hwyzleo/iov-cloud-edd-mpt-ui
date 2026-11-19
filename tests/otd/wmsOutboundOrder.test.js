/**
 * 出库管理页面契约单元测试（OTD-WMS 出库 MPT 动作的前端落地）。
 * 仓库未内置组件测试框架，按既有做法对源文件做契约断言 + 对状态字典做行为断言。
 * 执行：npm run test:unit
 */
const path = require('path')
const fs = require('fs')
const test = require('node:test')
const assert = require('node:assert')
const babel = require('@babel/core')

const read = (...segments) => fs.readFileSync(path.resolve(__dirname, '../..', ...segments), 'utf8')

const outboundApi = read('src/api/completevehicle/warehouse/outboundorder.js')
const outboundView = read('src/views/completevehicle/warehouse/outboundorder/index.vue')

const labelsPath = path.resolve(__dirname, '../../src/views/completevehicle/warehouse/wmsLabels.js')
const transpiled = babel.transformFileSync(labelsPath, {
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs']
})
const labelsModule = { exports: {} }
// eslint-disable-next-line no-new-func
new Function('module', 'exports', 'require', transpiled.code)(labelsModule, labelsModule.exports, require)
const {
  OUTBOUND_ORDER_STATE_LABELS,
  OUTBOUND_ORDER_STATE_OPTIONS,
  outboundOrderStateLabel,
  OUTBOUND_DETAIL_STATE_LABELS,
  outboundDetailStateLabel
} = labelsModule.exports

test('出库单接口：列表/详情/明细走 /otd-wms/mpt/outboundOrder', () => {
  assert.match(outboundApi, /url: '\/otd-wms\/mpt\/outboundOrder\/list'/)
  assert.match(outboundApi, /url: '\/otd-wms\/mpt\/outboundOrder\/' \+ outboundOrderId/)
  assert.match(outboundApi, /\/detail'/)
})

test('出库单接口：按 VIN 装车/出库与整单取消走服务端约定路径', () => {
  assert.match(outboundApi, /\/vins\/' \+ vin \+ '\/loading'/)
  assert.match(outboundApi, /\/vins\/' \+ vin \+ '\/outbound'/)
  assert.match(outboundApi, /\/cancellation'/)
})

test('出库单接口：不提供通用新增/修改/删除，也不做导出', () => {
  assert.ok(!/method: 'put'/.test(outboundApi), '出库单不得提供通用修改')
  assert.ok(!/method: 'delete'/.test(outboundApi), '出库单不得提供通用删除')
  assert.ok(!outboundApi.includes('outboundOrder/export'), '服务端 export 尚未实现，前端不得提供导出接口')
})

test('出库单状态：枚举值与中文标签一一对应（与后端 OutboundOrderState 一致）', () => {
  assert.deepStrictEqual(OUTBOUND_ORDER_STATE_OPTIONS.map(item => item.value),
    ['RESERVED', 'PARTIALLY_LOADED', 'LOADED', 'PARTIALLY_OUTBOUND', 'COMPLETED', 'CANCELLED'])
  assert.strictEqual(OUTBOUND_ORDER_STATE_LABELS.RESERVED, '已预留')
  assert.strictEqual(outboundOrderStateLabel('PARTIALLY_LOADED'), '部分装车')
  assert.strictEqual(outboundOrderStateLabel('COMPLETED'), '已完成')
  assert.strictEqual(outboundOrderStateLabel('CANCELLED'), '已取消')
})

test('出库明细状态：枚举值与中文标签一一对应（与后端 OutboundDetailState 一致）', () => {
  assert.deepStrictEqual(OUTBOUND_DETAIL_STATE_LABELS,
    {RESERVED: '已预留', LOADED: '已装车', OUTBOUND: '已出库', RELEASED: '已释放'})
  assert.strictEqual(outboundDetailStateLabel('LOADED'), '已装车')
  assert.strictEqual(outboundDetailStateLabel('OUTBOUND'), '已出库')
})

test('出库状态：未知值与空值降级展示', () => {
  assert.strictEqual(outboundOrderStateLabel('NEW_STATE'), 'NEW_STATE')
  assert.strictEqual(outboundOrderStateLabel(null), '-')
  assert.strictEqual(outboundDetailStateLabel(undefined), '-')
  assert.strictEqual(outboundDetailStateLabel(''), '-')
})

test('出库页面：列表按 data.items / data.total 读取分页结果', () => {
  assert.match(outboundView, /response\.data\.items/)
  assert.match(outboundView, /response\.data\.total/)
  assert.ok(!/response\.rows/.test(outboundView), '不得使用 RuoYi 旧分页形态 response.rows')
})

test('出库页面：装车/出库按钮按明细状态显示且携带 requestId 与 expectedVersion', () => {
  assert.match(outboundView, /v-if="scope\.row\.state === 'RESERVED'"/, '仅已预留明细显示装车确认')
  assert.match(outboundView, /v-if="scope\.row\.state === 'LOADED'"/, '仅已装车明细显示出库确认')
  assert.match(outboundView, /expectedVersion: detail\.rowVersion/)
  assert.match(outboundView, /requestId: this\.genRequestId\(\)/)
})

test('出库页面：取消仅在装车前可用并携带订单预期版本', () => {
  assert.match(outboundView, /cancellable\(\)/)
  assert.match(outboundView, /detailList\.every\(item => item\.state === 'RESERVED'\)/)
  assert.match(outboundView, /expectedVersion: this\.cancelForm\.expectedVersion/)
  assert.match(outboundView, /reason: this\.cancelForm\.reason/)
})

test('出库页面：按钮权限与服务端 @RequiresPermissions 一致', () => {
  for (const permission of [
    'completeVehicle:warehouse:outboundOrder:query',
    'completeVehicle:warehouse:outboundOrder:load',
    'completeVehicle:warehouse:outboundOrder:outbound',
    'completeVehicle:warehouse:outboundOrder:cancel'
  ]) {
    assert.ok(outboundView.includes(permission), `缺少权限点 ${permission}`)
  }
})

test('出库页面：不展示无效导出入口（服务端 export 未实现）', () => {
  assert.ok(!outboundView.includes('handleExport'), '不得保留导出处理方法')
  assert.ok(!outboundView.includes("outboundOrder:export"), '不得保留导出按钮权限')
})
