/**
 * 身份目录管理页契约测试（SEC-EIAM-DSN-CR-002 原地修订·第二次）。
 * 仓库未内置组件测试框架，按既有做法对源文件做契约断言。
 * 执行：npm run test:unit
 */
const path = require('path')
const fs = require('fs')
const test = require('node:test')
const assert = require('node:assert')

const read = (...segments) => fs.readFileSync(path.resolve(__dirname, '../..', ...segments), 'utf8')

const identityApi = read('src/api/security/identity.js')
const identityView = read('src/views/security/identity/index.vue')
const router = read('src/router/index.js')

test('身份目录接口走网关 /prod-api/auth/identity/**（EIAM）', () => {
  assert.match(identityApi, /url: '\/auth\/identity\/list'/)
  assert.match(identityApi, /\/auth\/identity\/' \+ employeeId \+ '\/reset-password'/)
  assert.match(identityApi, /\/enable'/)
  assert.match(identityApi, /\/disable'/)
  assert.match(identityApi, /\/unlock'/)
})

test('列表页展示工号/姓名/手机/状态/凭据状态/须改密', () => {
  assert.match(identityView, /prop="employeeCode"/)
  assert.match(identityView, /prop="displayName"/)
  assert.match(identityView, /prop="phone"/)
  assert.match(identityView, /prop="status"/)
  assert.match(identityView, /credentialEnabled/)
  assert.match(identityView, /pwdResetRequired/)
  assert.match(identityView, /scope\.row\.locked/)
})

test('重置密码弹窗展示一次性明文并提示线下告知、须改密', () => {
  assert.match(identityView, /oneTimePassword = response\.data\.password/)
  assert.match(identityView, /该密码仅显示这一次/)
  assert.match(identityView, /线下告知员工/)
  assert.match(identityView, /要求其设置新密码/)
  assert.match(identityView, /copyPassword/)
})

test('启用/停用/解锁调用对应接口并刷新列表', () => {
  assert.match(identityView, /enableIdentity\(row\.employeeId\)/)
  assert.match(identityView, /disableIdentity\(row\.employeeId\)/)
  assert.match(identityView, /unlockIdentity\(row\.employeeId\)/)
  assert.match(identityView, /this\.getList\(\)/)
})

test('未登记权限中心时不使用 v-hasPermi（避免 403）', () => {
  assert.equal(identityView.includes('v-hasPermi'), false)
})

test('路由挂载「安全 → 身份目录」静态路由', () => {
  assert.match(router, /path: '\/security'/)
  assert.match(router, /name: 'EiamIdentity'/)
  assert.match(router, /views\/security\/identity\/index/)
  assert.match(router, /title: '身份目录'/)
})
