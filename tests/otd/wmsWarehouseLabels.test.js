/**
 * 仓储管理（OTD-WMS）状态字典展示映射单元测试。
 * 仓库未内置测试框架：使用 Node 自带 test runner + Babel CommonJS 转换加载 ESM 模块。
 * 执行：npm run test:unit
 */
const path = require('path')
const test = require('node:test')
const assert = require('node:assert')
const babel = require('@babel/core')

const modulePath = path.resolve(__dirname, '../../src/views/completevehicle/warehouse/wmsLabels.js')
const transpiled = babel.transformFileSync(modulePath, {
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs']
})

const labelsModule = { exports: {} }
// eslint-disable-next-line no-new-func
new Function('module', 'exports', 'require', transpiled.code)(labelsModule, labelsModule.exports, require)

const {
  PRE_INBOUND_STATE_LABELS,
  PRE_INBOUND_STATE_OPTIONS,
  preInboundStateLabel,
  INVENTORY_STATE_LABELS,
  INVENTORY_STATE_OPTIONS,
  inventoryStateLabel
} = labelsModule.exports

test('预入库单状态：枚举值与中文标签一一对应', () => {
  assert.deepStrictEqual(PRE_INBOUND_STATE_OPTIONS.map(item => item.value),
    ['PENDING_ARRIVAL', 'ARRIVED', 'COMPLETED', 'CANCELLED'])
  assert.strictEqual(PRE_INBOUND_STATE_LABELS.COMPLETED, '已入库')
  assert.strictEqual(preInboundStateLabel('PENDING_ARRIVAL'), '待到达')
  assert.strictEqual(preInboundStateLabel('ARRIVED'), '已到达')
  assert.strictEqual(preInboundStateLabel('COMPLETED'), '已入库')
  assert.strictEqual(preInboundStateLabel('CANCELLED'), '已取消')
})

test('预入库单状态：未知值与空值降级展示', () => {
  assert.strictEqual(preInboundStateLabel('NEW_STATE'), 'NEW_STATE')
  assert.strictEqual(preInboundStateLabel(null), '-')
  assert.strictEqual(preInboundStateLabel(undefined), '-')
  assert.strictEqual(preInboundStateLabel(''), '-')
})

test('库存状态：数值与中文标签一一对应（与后端 InventoryState 一致）', () => {
  assert.deepStrictEqual(INVENTORY_STATE_OPTIONS.map(item => item.value), [1, 2, 3])
  assert.strictEqual(INVENTORY_STATE_LABELS[1], '在库')
  assert.strictEqual(inventoryStateLabel(1), '在库')
  assert.strictEqual(inventoryStateLabel(2), '已出库')
  assert.strictEqual(inventoryStateLabel(3), '已预留')
})

test('库存状态：未知值回退枚举名，空值占位', () => {
  assert.strictEqual(inventoryStateLabel(9), '9')
  assert.strictEqual(inventoryStateLabel(9, 'UNKNOWN'), 'UNKNOWN')
  assert.strictEqual(inventoryStateLabel(null, 'AVAILABLE'), '-')
  assert.strictEqual(inventoryStateLabel(undefined), '-')
})
