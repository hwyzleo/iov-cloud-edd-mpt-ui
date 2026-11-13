/**
 * 个人中心头像上传规则单元测试（EDD-MPT-DSN-CR-001 §4.3、US-004）
 * 仓库未内置测试框架，这里使用 Node 自带 test runner + 已安装的 @babel/plugin-transform-modules-commonjs，
 * 把 src/views/system/user/profile/avatarUpload.js（ESM）转成 CJS 后在内存中加载，不新增任何依赖。
 * 执行：npm run test:unit
 */
const path = require('path')
const test = require('node:test')
const assert = require('node:assert')
const babel = require('@babel/core')

const modulePath = path.resolve(__dirname, '../../src/views/system/user/profile/avatarUpload.js')
const transpiled = babel.transformFileSync(modulePath, {
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs']
})

const rulesModule = { exports: {}}
// eslint-disable-next-line no-new-func
new Function('module', 'exports', 'require', transpiled.code)(rulesModule, rulesModule.exports, require)

const {
  MAX_AVATAR_SIZE,
  ALLOWED_CONTENT_TYPES,
  AVATAR_FILENAME,
  AVATAR_CONTENT_TYPE,
  UPLOAD_STAGE,
  validateAvatarFile,
  putAvatarToCos,
  stageFailureMessage
} = rulesModule.exports

function fakeFile(name, type, size) {
  return { name, type, size }
}

test('常量：上限 10 MiB，MIME 白名单与裁剪输出固定 PNG', () => {
  assert.strictEqual(MAX_AVATAR_SIZE, 10 * 1024 * 1024)
  assert.deepStrictEqual(ALLOWED_CONTENT_TYPES, ['image/jpeg', 'image/png', 'image/webp'])
  assert.strictEqual(AVATAR_FILENAME, 'avatar.png')
  assert.strictEqual(AVATAR_CONTENT_TYPE, 'image/png')
})

test('上传阶段常量能区分申请凭证、直传 COS 与完成确认', () => {
  assert.strictEqual(UPLOAD_STAGE.TICKET, '申请上传凭证')
  assert.strictEqual(UPLOAD_STAGE.COS, '头像直传 COS')
  assert.strictEqual(UPLOAD_STAGE.COMPLETE, '完成确认')
})

test('validateAvatarFile：image/* 且不超过上限放行', () => {
  assert.deepStrictEqual(validateAvatarFile(fakeFile('a.jpg', 'image/jpeg', 1024)), { ok: true })
  assert.deepStrictEqual(validateAvatarFile(fakeFile('a.png', 'image/png', MAX_AVATAR_SIZE)), { ok: true })
})

test('validateAvatarFile：空文件、非图片、超限拒绝并给出可读提示', () => {
  const missing = validateAvatarFile(null)
  assert.strictEqual(missing.ok, false)
  assert.ok(missing.message.length > 0)

  const notImage = validateAvatarFile(fakeFile('a.pdf', 'application/pdf', 1024))
  assert.strictEqual(notImage.ok, false)
  assert.ok(notImage.message.indexOf('图片') >= 0)

  const empty = validateAvatarFile(fakeFile('a.png', 'image/png', 0))
  assert.strictEqual(empty.ok, false)

  const tooLarge = validateAvatarFile(fakeFile('a.png', 'image/png', MAX_AVATAR_SIZE + 1))
  assert.strictEqual(tooLarge.ok, false)
  assert.ok(tooLarge.message.indexOf('10 MiB') >= 0)
})

test('putAvatarToCos：仅携带 Content-Type，不携带平台凭证或 Cookie', async() => {
  const calls = []
  const fakeFetch = (url, options) => {
    calls.push({ url, options })
    return Promise.resolve({ ok: true, status: 200 })
  }
  const blob = { size: 32768 }
  await putAvatarToCos('https://bucket.cos/put', blob, 'image/png', fakeFetch)

  assert.strictEqual(calls.length, 1)
  assert.strictEqual(calls[0].url, 'https://bucket.cos/put')
  assert.strictEqual(calls[0].options.method, 'PUT')
  assert.deepStrictEqual(calls[0].options.headers, { 'Content-Type': 'image/png' })
  assert.strictEqual(calls[0].options.body, blob)
  assert.strictEqual(calls[0].options.credentials, 'omit')
})

test('putAvatarToCos：未声明 contentType 时按 PNG 兜底', async() => {
  let captured
  const fakeFetch = (url, options) => {
    captured = options
    return Promise.resolve({ ok: true, status: 200 })
  }
  await putAvatarToCos('https://bucket.cos/put', { size: 1 }, '', fakeFetch)
  assert.deepStrictEqual(captured.headers, { 'Content-Type': 'image/png' })
})

test('putAvatarToCos：COS 返回非 2xx 时以 HTTP 状态失败', async() => {
  const fakeFetch = () => Promise.resolve({ ok: false, status: 400 })
  await assert.rejects(
    () => putAvatarToCos('https://bucket.cos/put', { size: 1 }, 'image/png', fakeFetch),
    /COS 返回 HTTP 400/
  )
})

test('putAvatarToCos：缺少预签名地址或浏览器不支持时直接失败', async() => {
  await assert.rejects(
    () => putAvatarToCos('', { size: 1 }, 'image/png', () => Promise.resolve({ ok: true })),
    /上传凭证缺少直传地址/
  )
  const originalFetch = global.fetch
  delete global.fetch
  try {
    await assert.rejects(() => putAvatarToCos('https://bucket.cos/put', { size: 1 }, 'image/png'), /不支持直传/)
  } finally {
    if (originalFetch) {
      global.fetch = originalFetch
    }
  }
})

test('stageFailureMessage：直传失败提示 CORS、Content-Type 与预签名有效期', () => {
  const failure = stageFailureMessage(UPLOAD_STAGE.COS, new Error('COS 返回 HTTP 403'))
  assert.strictEqual(failure.alreadyNotified, false)
  assert.ok(failure.message.indexOf('CORS') >= 0)
  assert.ok(failure.message.indexOf('Content-Type') >= 0)
  assert.ok(failure.message.indexOf('过期') >= 0)
  assert.ok(failure.message.indexOf('COS 返回 HTTP 403') >= 0)
})

test('stageFailureMessage：申请/完成阶段已由拦截器提示，不重复弹框', () => {
  const notified = stageFailureMessage(UPLOAD_STAGE.TICKET, { response: { status: 500 }, message: 'Request failed' })
  assert.strictEqual(notified.alreadyNotified, true)

  const notNotified = stageFailureMessage(UPLOAD_STAGE.COMPLETE, new Error('Network Error'))
  assert.strictEqual(notNotified.alreadyNotified, false)
  assert.ok(notNotified.message.indexOf(UPLOAD_STAGE.COMPLETE) === 0)
})
