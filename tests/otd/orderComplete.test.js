/**
 * 订单人工办结（650 → 900）前端契约单元测试（OTD-VSO-DSN-CR-016）。
 * 覆盖：700 已退出状态映射、650 完成订单入口与权限点、请求仅携带可选办结备注，900 隐藏入口。
 * 执行：npm run test:unit
 */
const path = require('path')
const fs = require('fs')
const test = require('node:test')
const assert = require('node:assert')
const babel = require('@babel/core')

const modulePath = path.resolve(__dirname, '../../src/utils/otd/orderState.js')
const transpiled = babel.transformFileSync(modulePath, {
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs']
})

const rulesModule = { exports: {} }
// eslint-disable-next-line no-new-func
new Function('module', 'exports', 'require', transpiled.code)(rulesModule, rulesModule.exports, require)

const { ORDER_STATE_LABELS, orderStateLabel, orderStateOptions } = rulesModule.exports

const read = (...segments) => fs.readFileSync(path.resolve(__dirname, '../..', ...segments), 'utf8')
const infoView = read('src/views/otd/order/info/index.vue')
const detailView = read('src/views/otd/order/info/detail.vue')
const infoApi = read('src/api/otd/order/info.js')

test('700 已激活退出订单状态映射，900 保持已完成', () => {
  assert.strictEqual(ORDER_STATE_LABELS[700], undefined)
  assert.strictEqual(ORDER_STATE_LABELS[650], '已交付')
  assert.strictEqual(ORDER_STATE_LABELS[900], '已完成')
  assert.strictEqual(orderStateLabel(900, []), '已完成')
})

test('状态筛选选项不再提供 700，保留 900', () => {
  const values = orderStateOptions([]).map(item => Number(item.value))
  assert.strictEqual(values.indexOf(700), -1)
  assert.ok(values.indexOf(900) >= 0)
})

test('完成订单接口：POST /{orderId}/complete，仅携带可选办结备注', () => {
  assert.match(infoApi, /export function completeOrder\(orderId, completionRemark\)/)
  assert.match(infoApi, /url:\s*BASE \+ '\/' \+ orderId \+ '\/complete'/)
  assert.match(infoApi, /data:\s*completionRemark \? \{ completionRemark: completionRemark \} : \{\}/)
  assert.ok(!/operatorId|operatorRole|operateSource|targetState|completionTime/.test(
    infoApi.split('export function completeOrder')[1] || ''
  ), '请求不得携带操作人/角色/来源/目标状态/办结时间')
})

test('列表页 650 展示完成订单入口，复用 CR-016 权限点', () => {
  assert.match(infoView, /v-if="isDelivered\(scope\.row\)"/)
  assert.match(infoView, /completeVehicle:order:info:complete/)
  assert.match(infoView, /completeOrder\(this\.completeDialog\.orderId/)
  assert.match(infoView, /Number\(row\.orderState\) === 650/)
  assert.match(infoView, /maxlength="255"/)
})

test('详情页仅 650 展示完成订单，900 隐藏入口', () => {
  assert.match(detailView, /canCompleteOrder\(\)\s*\{\s*return Number\(this\.detail\.orderState\) === 650/)
  assert.match(detailView, /v-if="canCompleteOrder"/)
  assert.match(detailView, /import \{ completeOrder \} from '@\/api\/otd\/order\/info'/)
  assert.match(detailView, /completeOrder\(this\.orderId, \(this\.completeDialog\.remark \|\| ''\)\.trim\(\)\)/)
})
