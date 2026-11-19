/**
 * 交付库待入库页面契约单元测试（OTD-WMS-DSN-CR-003）。
 * 仓库未内置组件测试框架，按既有做法对源文件做契约断言 + 状态字典行为断言。
 * 执行：npm run test:unit
 */
const path = require('path')
const fs = require('fs')
const test = require('node:test')
const assert = require('node:assert')
const babel = require('@babel/core')

const read = (...segments) => fs.readFileSync(path.resolve(__dirname, '../..', ...segments), 'utf8')

const inboundApi = read('src/api/completevehicle/warehouse/inboundtask.js')
const inboundView = read('src/views/completevehicle/warehouse/inboundtask/index.vue')
const inventoryApi = read('src/api/completevehicle/warehouse/pdcinventory.js')

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
  INBOUND_TASK_STATE_LABELS,
  INBOUND_TASK_STATE_OPTIONS,
  inboundTaskStateLabel
} = labelsModule.exports

test('待入库接口：列表/详情/到货/入库/取消走 /otd-wms/mpt/inboundTask', () => {
  assert.match(inboundApi, /url: '\/otd-wms\/mpt\/inboundTask\/list'/)
  assert.match(inboundApi, /\/arrival'/)
  assert.match(inboundApi, /\/inbound'/)
  assert.match(inboundApi, /\/cancellation'/)
})

test('待入库接口：不提供通用新增/修改/删除', () => {
  assert.ok(!/method: 'put'/.test(inboundApi), '待入库任务不得提供通用修改')
  assert.ok(!/method: 'delete'/.test(inboundApi), '待入库任务不得提供通用删除')
})

test('待入库任务状态：枚举值与中文标签一一对应（与后端 InboundTaskState 一致）', () => {
  assert.deepStrictEqual(INBOUND_TASK_STATE_OPTIONS.map(item => item.value),
    ['PENDING', 'ARRIVED', 'COMPLETED', 'CANCELLED'])
  assert.strictEqual(INBOUND_TASK_STATE_LABELS.PENDING, '待到达')
  assert.strictEqual(inboundTaskStateLabel('ARRIVED'), '已到达')
  assert.strictEqual(inboundTaskStateLabel('COMPLETED'), '已入库')
  assert.strictEqual(inboundTaskStateLabel('CANCELLED'), '已取消')
  assert.strictEqual(inboundTaskStateLabel('UNKNOWN'), 'UNKNOWN')
  assert.strictEqual(inboundTaskStateLabel(null), '-')
})

test('待入库页面：列表按 data.items / data.total 读取分页结果', () => {
  assert.match(inboundView, /response\.data\.items/)
  assert.match(inboundView, /response\.data\.total/)
  assert.ok(!/response\.rows/.test(inboundView))
})

test('待入库页面：动作按状态显示且携带 requestId 与 expectedVersion', () => {
  assert.match(inboundView, /v-if="scope\.row\.state === 'PENDING'"/)
  assert.match(inboundView, /v-if="scope\.row\.state === 'ARRIVED'"/)
  assert.match(inboundView, /expectedVersion: row\.rowVersion/)
  assert.match(inboundView, /requestId: this\.genRequestId\(\)/)
})

test('待入库页面：入库确认必须选择储区与储位', () => {
  assert.match(inboundView, /storageAreaCode: \[\s*\{required: true/)
  assert.match(inboundView, /storageLocationCode: \[\s*\{required: true/)
  assert.match(inboundView, /inboundInboundTask\(/)
})

test('待入库页面：取消必须填写原因并回退提示', () => {
  assert.match(inboundView, /reason: \[\s*\{required: true/)
  assert.match(inboundView, /cancelInboundTask\(/)
  assert.match(inboundView, /回退为已出库/)
})

test('待入库页面：按钮权限与服务端 @RequiresPermissions 一致', () => {
  for (const permission of [
    'completeVehicle:warehouse:inboundTask:arrival',
    'completeVehicle:warehouse:inboundTask:inbound',
    'completeVehicle:warehouse:inboundTask:cancel'
  ]) {
    assert.ok(inboundView.includes(permission), `缺少权限点 ${permission}`)
  }
})

test('库存查询不再硬编码 PDC：接口与页面均按仓库筛选', () => {
  assert.ok(!/warehouseLevel = "PDC"/.test(inventoryApi), '库存接口不得写死 PDC')
  assert.ok(!inventoryApi.includes('warehouseLevel'), '库存查询不再传 warehouseLevel')
})
