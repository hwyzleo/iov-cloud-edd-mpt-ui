/**
 * 营销图片上传规则单元测试（OTD-VSO-DSN-CR-004 §6.1）
 * 仓库未内置测试框架，这里使用 Node 自带 test runner + 已安装的 @babel/plugin-transform-modules-commonjs，
 * 把 src/utils/otd/marketingImage.js（ESM）转成 CJS 后在内存中加载，不新增任何依赖。
 * 执行：npm run test:unit
 */
const path = require('path')
const test = require('node:test')
const assert = require('node:assert')
const babel = require('@babel/core')

const modulePath = path.resolve(__dirname, '../../src/utils/otd/marketingImage.js')
const transpiled = babel.transformFileSync(modulePath, {
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs']
})

const rulesModule = { exports: {} }
// eslint-disable-next-line no-new-func
new Function('module', 'exports', 'require', transpiled.code)(rulesModule, rulesModule.exports, require)

const {
  MAX_IMAGE_SIZE,
  ALLOWED_EXTENSIONS,
  UPLOAD_STAGE,
  resolveContentType,
  validateImageFile,
  isPreviewableUrl
} = rulesModule.exports

function fakeFile(name, type, size) {
  return { name, type, size }
}

test('常量：图片上限为 10 MiB，仅允许 JPEG/PNG/WebP', () => {
  assert.strictEqual(MAX_IMAGE_SIZE, 10 * 1024 * 1024)
  assert.deepStrictEqual(Object.keys(ALLOWED_EXTENSIONS).sort(), ['image/jpeg', 'image/png', 'image/webp'])
  assert.deepStrictEqual(ALLOWED_EXTENSIONS['image/jpeg'], ['jpg', 'jpeg'])
})

test('上传阶段常量可区分申请凭证、直传 COS 与完成确认', () => {
  assert.strictEqual(UPLOAD_STAGE.TICKET, '申请上传凭证')
  assert.strictEqual(UPLOAD_STAGE.COS, '图片直传 COS')
  assert.strictEqual(UPLOAD_STAGE.COMPLETE, '完成确认')
})

test('resolveContentType：合法 MIME 与扩展名', () => {
  assert.strictEqual(resolveContentType(fakeFile('a.jpg', 'image/jpeg', 1)), 'image/jpeg')
  assert.strictEqual(resolveContentType(fakeFile('a.JPEG', 'image/jpeg', 1)), 'image/jpeg')
  assert.strictEqual(resolveContentType(fakeFile('a.png', 'image/png', 1)), 'image/png')
  assert.strictEqual(resolveContentType(fakeFile('a.webp', 'image/webp', 1)), 'image/webp')
})

test('resolveContentType：浏览器未给 MIME 时按扩展名推断', () => {
  assert.strictEqual(resolveContentType(fakeFile('photo.webp', '', 1)), 'image/webp')
  assert.strictEqual(resolveContentType(fakeFile('photo.png', '', 1)), 'image/png')
})

test('resolveContentType：MIME 与扩展名不一致、非法类型、无扩展名均拒绝', () => {
  assert.strictEqual(resolveContentType(fakeFile('a.jpg', 'image/png', 1)), null)
  assert.strictEqual(resolveContentType(fakeFile('a.gif', 'image/gif', 1)), null)
  assert.strictEqual(resolveContentType(fakeFile('a.svg', 'image/svg+xml', 1)), null)
  assert.strictEqual(resolveContentType(fakeFile('a.exe', 'application/octet-stream', 1)), null)
  assert.strictEqual(resolveContentType(fakeFile('noext', 'image/jpeg', 1)), null)
  assert.strictEqual(resolveContentType(null), null)
})

test('validateImageFile：合法文件返回 ok 与 MIME', () => {
  const result = validateImageFile(fakeFile('a.png', 'image/png', 1024))
  assert.deepStrictEqual(result, { ok: true, contentType: 'image/png' })
})

test('validateImageFile：零字节与超限拒绝，边界值放行', () => {
  assert.strictEqual(validateImageFile(fakeFile('a.png', 'image/png', 0)).ok, false)
  assert.strictEqual(validateImageFile(fakeFile('a.png', 'image/png', MAX_IMAGE_SIZE + 1)).ok, false)
  assert.strictEqual(validateImageFile(fakeFile('a.png', 'image/png', MAX_IMAGE_SIZE)).ok, true)
})

test('validateImageFile：非法类型与空文件给出可读提示', () => {
  const invalidType = validateImageFile(fakeFile('a.gif', 'image/gif', 1024))
  assert.strictEqual(invalidType.ok, false)
  assert.ok(invalidType.message.indexOf('JPEG') >= 0)
  const empty = validateImageFile(null)
  assert.strictEqual(empty.ok, false)
  assert.ok(empty.message.length > 0)
})

test('isPreviewableUrl：http(s)、协议相对与 data:image 可预览', () => {
  assert.strictEqual(isPreviewableUrl('https://cos.example.com/a.png'), true)
  assert.strictEqual(isPreviewableUrl('http://cos.example.com/a'), true)
  assert.strictEqual(isPreviewableUrl('//cos.example.com/a.webp'), true)
  assert.strictEqual(isPreviewableUrl('data:image/png;base64,AAAA'), true)
})

test('isPreviewableUrl：空值与非法协议不预览', () => {
  assert.strictEqual(isPreviewableUrl(''), false)
  assert.strictEqual(isPreviewableUrl('   '), false)
  assert.strictEqual(isPreviewableUrl(undefined), false)
  assert.strictEqual(isPreviewableUrl(null), false)
  assert.strictEqual(isPreviewableUrl('javascript:alert(1)'), false)
  assert.strictEqual(isPreviewableUrl('ftp://cos.example.com/a.png'), false)
})
