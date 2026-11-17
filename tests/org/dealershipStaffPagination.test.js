/**
 * 门店员工列表分页形态单元测试（EDD-ORG-DSN-CR-003 验收回归）。
 * ORG 管理接口统一返回 ApiResponse<PageResult>，分页字段在 data.items / data.total；
 * 页面若继续沿用 RuoYi 旧形态 response.rows / response.total 会出现「新增成功但列表永远为空」。
 * 执行：npm run test:unit
 */
const path = require('path')
const fs = require('fs')
const test = require('node:test')
const assert = require('node:assert')

const staffView = fs.readFileSync(
  path.resolve(__dirname, '../../src/views/org/dealership/staff/index.vue'), 'utf8')

test('门店员工列表按 data.items / data.total 读取分页结果', () => {
  assert.match(staffView, /response\.data\.items/, '必须从 data.items 读取列表')
  assert.match(staffView, /response\.data\.total/, '必须从 data.total 读取总数')
  assert.ok(!/response\.rows/.test(staffView), '不得继续使用 RuoYi 旧形态 response.rows')
  assert.ok(!/this\.total = response\.total/.test(staffView), '不得继续使用 response.total')
})

test('门店员工列表请求失败时清空列表与总数，不保留旧数据', () => {
  assert.match(staffView, /this\.dealershipStaffList = \[\]/, '失败时应清空列表')
  assert.match(staffView, /this\.total = 0/, '失败时应将总数置 0')
})
