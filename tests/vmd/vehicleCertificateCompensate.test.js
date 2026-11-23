/**
 * 车辆证书人工补申请（TBOX/IVI）页面契约测试（SEC-VIAM-DSN-CR-004 / T25）。
 * 仓库未内置组件测试框架，按既有做法：对治理常量模块做行为断言 + 对源文件做契约断言。
 * 执行：npm run test:unit
 */
const path = require('path')
const fs = require('fs')
const test = require('node:test')
const assert = require('node:assert')
const babel = require('@babel/core')

const read = (...segments) => fs.readFileSync(path.resolve(__dirname, '../..', ...segments), 'utf8')

const profilesPath = path.resolve(__dirname, '../../src/views/vmd/vehicleCertificate/certificateProfiles.js')
const transpiled = babel.transformFileSync(profilesPath, {
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs']
})
const profilesModule = { exports: {} }
// eslint-disable-next-line no-new-func
new Function('module', 'exports', 'require', transpiled.code)(
  profilesModule, profilesModule.exports, require)
const {
  DEVICE_CATEGORY_OPTIONS,
  DEFAULT_DEVICE_CATEGORY,
  PROFILE_BY_CATEGORY,
  COMPENSATE_HINT,
  profileForCategory,
  profileOptionsFor,
  defaultCompensateForm
} = profilesModule.exports

const view = read('src/views/vmd/vehicleCertificate/index.vue')
const api = read('src/api/viam/certificate.js')

test('T25 设备类别选项：TBOX 保留且新增 IVI，TBOX 为默认', () => {
  assert.deepStrictEqual(DEVICE_CATEGORY_OPTIONS.map(item => item.value), ['TBOX', 'IVI'])
  assert.deepStrictEqual(DEVICE_CATEGORY_OPTIONS.map(item => item.label), ['TBOX', 'IVI'])
  assert.strictEqual(DEFAULT_DEVICE_CATEGORY, 'TBOX')
})

test('T25 类别—Profile 一一对应：TBOX→TBOX_TSP_CLIENT，IVI→IVI_DEVICE_IDENTITY', () => {
  assert.deepStrictEqual(PROFILE_BY_CATEGORY, {
    TBOX: 'TBOX_TSP_CLIENT',
    IVI: 'IVI_DEVICE_IDENTITY'
  })
  assert.strictEqual(profileForCategory('TBOX'), 'TBOX_TSP_CLIENT')
  assert.strictEqual(profileForCategory('IVI'), 'IVI_DEVICE_IDENTITY')
  assert.strictEqual(profileForCategory('CGW'), undefined)
  assert.strictEqual(profileForCategory(undefined), undefined)
})

test('T25 Profile 仅按类别联动唯一值，不提供多选或任意输入', () => {
  assert.deepStrictEqual(profileOptionsFor('TBOX'),
    [{ value: 'TBOX_TSP_CLIENT', label: 'TBOX_TSP_CLIENT' }])
  assert.deepStrictEqual(profileOptionsFor('IVI'),
    [{ value: 'IVI_DEVICE_IDENTITY', label: 'IVI_DEVICE_IDENTITY' }])
  assert.deepStrictEqual(profileOptionsFor('UNKNOWN'), [])
})

test('T25 默认表单：TBOX/TBOX_TSP_CLIENT，其余业务字段不预填', () => {
  const form = defaultCompensateForm()
  assert.strictEqual(form.deviceCategory, 'TBOX')
  assert.strictEqual(form.certificateProfile, 'TBOX_TSP_CLIENT')
  ;['vin', 'deviceSn', 'csrDerBase64', 'requestId', 'originalRequestId',
    'facilityNo', 'lineCode', 'ticketNo', 'reason'].forEach(field => {
    assert.strictEqual(form[field], undefined, field + ' 不应预填')
  })
  assert.ok(!Object.prototype.hasOwnProperty.call(form, 'operatorId'), '操作人不得由前端提交')
})

test('T25 通用提示：受信工位 CSR、唯一 CN=目标 hsmUid、明确 IVI 不用 deviceSn', () => {
  assert.match(COMPENSATE_HINT, /受信工位/)
  assert.match(COMPENSATE_HINT, /HSM UID/i)
  assert.match(COMPENSATE_HINT, /非设备SN/)
  assert.match(COMPENSATE_HINT, /IVI/)
  assert.ok(!/仅\s*TBOX/.test(COMPENSATE_HINT), '提示不得仍限定 TBOX')
})

test('T25 页面：引用治理常量模块并用通用提示替换 TBOX 专用文案', () => {
  assert.match(view, /from '\.\/certificateProfiles'/)
  assert.match(view, /:title="compensateHint"/)
  assert.ok(!/CSR必须来自目标TBOX\/安全芯片/.test(view), '旧的 TBOX 专用提示应移除')
  assert.match(view, /deviceCategoryOptions: DEVICE_CATEGORY_OPTIONS/)
})

test('T25 页面：Profile 按类别联动并在切换时重置，默认仍为 TBOX', () => {
  assert.match(view, /profileOptions\(\)\s*{\s*return profileOptionsFor\(this\.compensateForm\.deviceCategory\)/)
  assert.match(view, /'compensateForm\.deviceCategory'\(value\)/)
  assert.match(view, /this\.compensateForm\.certificateProfile = profile/)
  assert.match(view, /this\.compensateForm = defaultCompensateForm\(\)/)
  assert.ok(!/profileOptions:\s*\[\s*\{\s*value:\s*'TBOX_TSP_CLIENT'/.test(view),
    'Profile 不应再写死单一选项')
})

test('T25 契约不变：仍复用 compensate API 与既有权限点，不新增字段/路径', () => {
  assert.match(view, /compensateCertificate/)
  assert.match(view, /v-hasPermi="\['viam:certificate:compensate'\]"/)
  assert.match(api, /url: '\/sec-viam\/api\/mpt\/viam\/certificate\/compensate'/)
  const compensateCalls = api.match(/url: '\/sec-viam\/api\/mpt\/viam\/certificate\/compensate'/g) || []
  assert.strictEqual(compensateCalls.length, 1, '不得新增第二条 compensate 路径')
})
