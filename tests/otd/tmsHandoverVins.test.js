/**
 * TMS 运单交车 VIN 勾选契约测试（OTD-TMS-DSN-CR-002）。
 * 仓库未内置组件测试框架，按既有做法对源文件做契约断言。
 * 执行：npm run test:unit
 */
const path = require('path')
const fs = require('fs')
const test = require('node:test')
const assert = require('node:assert')

const view = fs.readFileSync(
  path.resolve(__dirname, '../../src/views/completevehicle/transport/transportorder/index.vue'), 'utf8')

test('交车弹窗提供 VIN 勾选，接车保持完成情况单选', () => {
  assert.match(view, /v-if="actionType === 'handover'" label="交车 VIN"/)
  assert.match(view, /el-checkbox-group v-model="actionForm\.vins"/)
  assert.match(view, /v-else label="完成情况"/)
})

test('打开交车弹窗时预选运单全部 VIN', () => {
  assert.match(view, /this\.actionVins = row\.vins \|\| \[\]/)
  assert.match(view, /vins: this\.actionVins\.slice\(\)/)
})

test('提交交车携带 vins，并按勾选推导 allCompleted', () => {
  assert.match(view, /payload\.vins = this\.actionForm\.vins/)
  assert.match(view, /payload\.allCompleted = this\.actionForm\.vins\.length === this\.actionVins\.length/)
})

test('交车未选择 VIN 时拒绝提交', () => {
  assert.match(view, /请至少选择一个交车 VIN/)
})

test('分批交车提示仅已出库 VIN 会生成 WMS 到货请求', () => {
  assert.match(view, /未勾选的 VIN 视为未交车/)
  assert.match(view, /已出库/)
})
