/**
 * 门店员工页面契约单元测试（EDD-ORG-DSN-CR-003 验收回归）。
 * 覆盖三类历史缺陷：分页形态读取错误、备注字段未持久化、导入/导出指向 RuoYi 遗留接口。
 * 执行：npm run test:unit
 */
const path = require('path')
const fs = require('fs')
const test = require('node:test')
const assert = require('node:assert')

const staffView = fs.readFileSync(
  path.resolve(__dirname, '../../src/views/org/dealership/staff/index.vue'), 'utf8')

test('列表按 data.items / data.total 读取分页结果', () => {
  assert.match(staffView, /response\.data\.items/, '必须从 data.items 读取列表')
  assert.match(staffView, /response\.data\.total/, '必须从 data.total 读取总数')
  assert.ok(!/response\.rows/.test(staffView), '不得继续使用 RuoYi 旧形态 response.rows')
  assert.ok(!/this\.total = response\.total/.test(staffView), '不得继续使用 response.total')
})

test('列表请求失败时清空列表与总数，不保留旧数据', () => {
  assert.match(staffView, /this\.dealershipStaffList = \[\]/, '失败时应清空列表')
  assert.match(staffView, /this\.total = 0/, '失败时应将总数置 0')
})

test('备注绑定后端契约字段 description', () => {
  assert.match(staffView, /v-model="form\.description"/, '备注必须绑定 form.description')
  assert.ok(!/v-model="form\.remark"/.test(staffView), '不得继续绑定不存在的 form.remark')
})

test('导出调用 ORG 门店员工导出接口，不再使用 RuoYi 用户导出', () => {
  assert.match(staffView, /dealershipStaff\/v1\/export/, '导出必须调用 ORG 门店员工导出接口')
  assert.ok(!staffView.includes('system/user/export'), '不得继续调用 RuoYi 用户导出接口')
  assert.ok(!staffView.includes('system/user/importData'), '不得继续调用 RuoYi 用户导入接口')
})

test('移除无后端实现的导入入口', () => {
  assert.ok(!staffView.includes('handleImport'), '不得保留导入按钮与处理方法')
  assert.ok(!staffView.includes("org:dealership:staff:import"), '不得保留导入权限按钮')
})
