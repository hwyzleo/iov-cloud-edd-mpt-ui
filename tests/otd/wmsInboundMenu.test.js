/**
 * 入库管理容器页契约测试（OTD-WMS-DSN-CR-003 术语更正）。
 * 执行：npm run test:unit
 */
const path = require('path')
const fs = require('fs')
const test = require('node:test')
const assert = require('node:assert')

const container = fs.readFileSync(
  path.resolve(__dirname, '../../src/views/completevehicle/warehouse/inbound/index.vue'), 'utf8')

test('入库管理容器聚合“入库预报”与“到货通知”两个页签', () => {
  assert.match(container, /label="入库预报"/)
  assert.match(container, /label="到货通知"/)
  assert.match(container, /@\/views\/completevehicle\/warehouse\/pdcpreinboundorder\/index/)
  assert.match(container, /@\/views\/completevehicle\/warehouse\/inboundtask\/index/)
})

test('页签按各自权限点控制可见性', () => {
  assert.match(container, /completeVehicle:warehouse:preInboundOrder:list/)
  assert.match(container, /completeVehicle:warehouse:inboundTask:list/)
})

test('到货通知能力命名不再限定交付库', () => {
  assert.ok(!container.includes('交付库待入库'), '容器页不得再出现“交付库待入库”')
})
