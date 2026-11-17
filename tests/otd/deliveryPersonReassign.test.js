/**
 * 交付人员改派入口契约单元测试（OTD-VSO-DSN-CR-011）。
 * 仓库未内置 Vue 组件测试框架，沿用 CR-009 做法直接对源文件做契约断言：
 * 分配页必须能按分配状态筛选、展示交付人员列，并对已分配订单提供改派入口；
 * 查询参数必须透传到后端 `listWithoutDeliveryPerson`（hasDeliveryPerson）。
 * 执行：npm run test:unit
 */
const path = require('path')
const fs = require('fs')
const test = require('node:test')
const assert = require('node:assert')

const read = (...segments) => fs.readFileSync(path.resolve(__dirname, '../..', ...segments), 'utf8')

const deliveryApi = read('src/api/otd/order/assigndeliveryperson.js')
const deliveryView = read('src/views/otd/order/assigndeliveryperson/index.vue')

test('列表接口原样透传查询参数（含 hasDeliveryPerson）', () => {
  assert.match(deliveryApi, /url:\s*BASE \+ '\/listWithoutDeliveryPerson'/)
  assert.match(deliveryApi, /params:\s*query/)
  assert.match(deliveryApi, /hasDeliveryPerson/)
})

test('分配页提供未分配/已分配筛选，默认未分配', () => {
  assert.match(deliveryView, /v-model="queryParams\.hasDeliveryPerson"/)
  assert.match(deliveryView, /label="未分配"/)
  assert.match(deliveryView, /label="已分配"/)
  assert.match(deliveryView, /hasDeliveryPerson:\s*false/)
  assert.match(deliveryView, /this\.queryParams\.hasDeliveryPerson = false/)
})

test('分配页展示交付人员列，缺省回退员工标识', () => {
  assert.match(deliveryView, /label="交付人员"/)
  assert.match(deliveryView, /scope\.row\.deliveryPersonName \|\| scope\.row\.deliveryPersonId/)
})

test('已分配订单操作文案为改派交付人员，未分配保持分配文案', () => {
  assert.match(deliveryView, /queryParams\.hasDeliveryPerson \? '改派交付人员' : '分配交付人员'/)
})

test('改派复用现有写接口与权限点，不新增账号字段', () => {
  assert.match(deliveryApi, /url:\s*BASE \+ '\/action\/assignDeliveryPerson'/)
  assert.match(deliveryApi, /deliveryPersonId:\s*employeeId/)
  assert.match(deliveryApi, /deliveryPersonName:\s*employeeName/)
  assert.match(deliveryView, /completeVehicle:order:assignDeliveryPerson:assign/)
  for (const field of ['userName', 'nickName', 'phonenumber']) {
    assert.ok(!deliveryView.includes(`prop="${field}"`), `分配页不得引入 MPT 账号字段 ${field}`)
  }
})
