/**
 * 订单状态映射与确认交付入口契约单元测试（OTD-VSO-DSN-CR-015 修复）。
 * 覆盖：EDD 字典缺失 620/630/650 时的前端兜底、状态筛选选项补齐，
 * 以及列表页 620 确认交付入口、审核/锁单按状态收敛。
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
const detailApi = read('src/api/otd/order/detail.js')

test('本地兜底映射覆盖 CR-014 引入的 600/620/630/650', () => {
  assert.strictEqual(ORDER_STATE_LABELS[600], '验收入库，待交付')
  assert.strictEqual(ORDER_STATE_LABELS[620], '尾款已付款')
  assert.strictEqual(ORDER_STATE_LABELS[630], '已开票')
  assert.strictEqual(ORDER_STATE_LABELS[650], '已交付')
})

test('字典命中优先，字典缺失时回退本地映射，不再直接显示数字', () => {
  const dict = [{ value: '620', label: '尾款已支付（字典）' }]
  assert.strictEqual(orderStateLabel(620, dict), '尾款已支付（字典）')
  assert.strictEqual(orderStateLabel(650, dict), '已交付')
  assert.strictEqual(orderStateLabel(999, []), '999')
  assert.strictEqual(orderStateLabel(null, []), '-')
})

test('状态筛选选项合并字典与本地兜底，去重且按状态值升序', () => {
  const dict = [{ value: '350', label: '待审核' }, { value: '600', label: '待交付（字典）' }]
  const options = orderStateOptions(dict)
  const values = options.map(item => Number(item.value))
  assert.strictEqual(values.filter(value => value === 600).length, 1)
  assert.ok(values.indexOf(600) >= 0 && values.indexOf(620) >= 0 && values.indexOf(650) >= 0)
  assert.deepStrictEqual(values, values.slice().sort((a, b) => a - b))
})

test('列表页订单号列收窄，操作列容纳确认交付', () => {
  assert.match(infoView, /label="订单号"[^>]*width="150"/)
  assert.match(infoView, /label="操作"[^>]*width="300"/)
})

test('列表页 620 展示确认交付按钮并复用 CR-015 权限点与接口', () => {
  assert.match(infoView, /isFinalPaymentPaid\(scope\.row\)/)
  assert.match(infoView, /completeVehicle:order:delivery:complete/)
  assert.match(infoView, /completeOrderDelivery\(this\.deliveryDialog\.orderId/)
  assert.match(detailApi, /url:\s*BASE \+ orderId \+ '\/delivery\/complete'/)
})

test('审核仅 350、锁单仅 310/360，620 不再出现无关操作', () => {
  assert.match(infoView, /Number\(row\.orderState\) === 350/)
  assert.match(infoView, /\[310, 360\]\.indexOf\(Number\(row\.orderState\)\) >= 0/)
  assert.match(infoView, /v-if="canAudit\(scope\.row\)" command="auditPass"/)
  assert.match(infoView, /v-if="canAudit\(scope\.row\)" command="auditReject"/)
  assert.match(infoView, /v-if="canLock\(scope\.row\)" command="lock"/)
})

test('详情页头部 620 展示确认交付，状态文案使用完整映射', () => {
  assert.match(detailView, /v-if="canCompleteDelivery"/)
  assert.match(detailView, /openCompleteDelivery/)
  assert.match(detailView, /orderStateLabel\(state, dictList\)/)
})
