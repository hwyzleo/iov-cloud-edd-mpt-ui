/**
 * 交付人员与门店员工契约单元测试（OTD-VSO-DSN-CR-009 / EDD-ORG-DSN-CR-003）。
 * 仓库未内置 Vue 组件测试框架，这里按既有标签测试的做法直接对源文件做契约断言，
 * 防止 MPT 账号字段（userId/userName/nickName/phonenumber）回流到交付人员与门店员工页面。
 * 执行：npm run test:unit
 */
const path = require('path')
const fs = require('fs')
const test = require('node:test')
const assert = require('node:assert')

const read = (...segments) => fs.readFileSync(path.resolve(__dirname, '../..', ...segments), 'utf8')

const deliveryApi = read('src/api/otd/order/assigndeliveryperson.js')
const deliveryView = read('src/views/otd/order/assigndeliveryperson/index.vue')
const staffApi = read('src/api/org/dealership/staff.js')
const staffView = read('src/views/org/dealership/staff/index.vue')

const MPT_ACCOUNT_FIELDS = ['userName', 'nickName', 'phonenumber']

test('交付人员分配请求使用 employeeId / employeeName', () => {
  assert.match(deliveryApi, /deliveryPersonId:\s*employeeId/)
  assert.match(deliveryApi, /deliveryPersonName:\s*employeeName/)
  assert.doesNotMatch(deliveryApi, /deliveryPersonId:\s*userId/)
})

test('交付人员弹窗展示工号/姓名/手机，不再展示账号字段', () => {
  assert.match(deliveryView, /prop="employeeCode"/)
  assert.match(deliveryView, /prop="employeeName"/)
  assert.match(deliveryView, /prop="phone"/)
  assert.match(deliveryView, /bindingDeliveryPerson\(row\.employeeId,\s*row\.employeeName/)
  for (const field of MPT_ACCOUNT_FIELDS) {
    assert.ok(!deliveryView.includes(`prop="${field}"`), `交付人员弹窗不得再使用 ${field}`)
  }
})

test('门店员工候选接口改为 searchEmployee，不再调用 searchUser', () => {
  assert.match(staffApi, /dealershipStaff\/v1\/searchEmployee/)
  assert.ok(!staffApi.includes('/searchUser'), '门店员工候选人不得继续调用 /searchUser')
})

test('门店员工页面按员工字段展示与检索，选择后回填 employeeId', () => {
  assert.match(staffView, /prop="employeeCode"/)
  assert.match(staffView, /prop="employeeName"/)
  assert.match(staffView, /prop="phone"/)
  assert.match(staffView, /this\.form\.employeeId = item\.label/)
  assert.match(staffView, /queryParams\.employeeCode/)
  for (const field of MPT_ACCOUNT_FIELDS) {
    assert.ok(!staffView.includes(`prop="${field}"`), `门店员工页面不得再使用 ${field}`)
  }
  assert.ok(!staffView.includes('prop="userId"'), '门店员工页面不得以 MPT userId 作为列或表单项')
})
