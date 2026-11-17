/**
 * EIAM 单点登录与账号-员工绑定契约测试（SEC-EIAM-DSN-CR-002 / EDD-MPT-DSN-CR-002）。
 * 仓库未内置组件测试框架，按既有做法对源文件做契约断言。
 * 执行：npm run test:unit
 */
const path = require('path')
const fs = require('fs')
const test = require('node:test')
const assert = require('node:assert')

const read = (...segments) => fs.readFileSync(path.resolve(__dirname, '../..', ...segments), 'utf8')

const loginView = read('src/views/login.vue')
const loginApi = read('src/api/login.js')
const ssoCallback = read('src/views/sso/callback.vue')
const router = read('src/router/index.js')
const userView = read('src/views/system/user/index.vue')
const userApi = read('src/api/system/user.js')

test('登录页提供 EIAM 单点登录入口，跳转授权端点并携带 state', () => {
  assert.match(loginView, /handleSsoLogin/)
  assert.match(loginView, /\/auth\/oauth2\/authorize\?client_id=mpt/)
  assert.match(loginView, /encodeURIComponent\(redirectUri\)/)
  assert.match(loginView, /eiam_sso_state/)
})

test('SSO 回调页用授权码换令牌并校验 state', () => {
  assert.match(loginApi, /url: '\/auth\/oauth2\/token'/)
  assert.match(loginApi, /grant_type: 'authorization_code'/)
  assert.match(ssoCallback, /ssoToken\(code, CLIENT_ID, this\.redirectUri\(\)\)/)
  assert.match(ssoCallback, /state !== expectedState/)
  assert.match(ssoCallback, /SET_TOKEN/)
  assert.match(router, /path: '\/sso\/callback'/)
})

test('用户管理支持绑定员工与解绑', () => {
  assert.match(userView, /searchEmployeeOptions/)
  assert.match(userView, /form\.employeeId/)
  assert.match(userView, /unbindEmployee\(this\.form\.userId\)/)
  assert.match(userApi, /url: '\/system\/user\/employee\/options'/)
  assert.match(userApi, /\/employee\/unbind/)
})
