/**
 * 车辆升级过程展示字典与格式化单元测试（IOV-OTA-DSN-CR-026 §8）。
 * 仓库未内置测试框架：使用 Node 自带 test runner + Babel CommonJS 转换加载 ESM 模块。
 * 执行：npm run test:unit
 */
const path = require('path')
const test = require('node:test')
const assert = require('node:assert')
const babel = require('@babel/core')

const modulePath = path.resolve(__dirname, '../../../src/views/iov/ota/taskvehicle/processLabels.js')
const transpiled = babel.transformFileSync(modulePath, {
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs']
})

const labelsModule = { exports: {} }
// eslint-disable-next-line no-new-func
new Function('module', 'exports', 'require', transpiled.code)(labelsModule, labelsModule.exports, require)

const {
  RETRY_ACTION_OPTIONS,
  LOG_UPLOAD_STATE_OPTIONS,
  DOWNLOAD_STATE_OPTIONS,
  downloadStateLabel,
  downloadStateType,
  retryActionLabel,
  logUploadStateLabel,
  logUploadStateType,
  formatDuration,
  formatBytes,
  shortDigest
} = labelsModule.exports

test('下载状态：已知值中文、未知值原样、空值占位', () => {
  assert.strictEqual(downloadStateLabel('COMPLETED'), '字节完成')
  assert.strictEqual(downloadStateLabel('RESET_OFFSET'), '重置偏移')
  assert.strictEqual(downloadStateLabel('NEW_STATE'), 'NEW_STATE')
  assert.strictEqual(downloadStateLabel(null), '-')
  assert.strictEqual(downloadStateType('FAILED'), 'danger')
  assert.strictEqual(downloadStateType('UNKNOWN'), 'info')
})

test('重试动作与日志状态映射', () => {
  assert.strictEqual(retryActionLabel('RESET_OFFSET'), '重置偏移')
  assert.strictEqual(retryActionLabel('EXECUTION_CREATED'), '执行创建')
  assert.strictEqual(retryActionLabel(undefined), '-')
  assert.strictEqual(logUploadStateLabel('UPLOADED'), '核验通过')
  assert.strictEqual(logUploadStateType('FAILED'), 'danger')
  assert.deepStrictEqual(LOG_UPLOAD_STATE_OPTIONS, ['AUTHORIZED', 'UPLOADED', 'FAILED', 'EXPIRED'])
  assert.deepStrictEqual(RETRY_ACTION_OPTIONS.map(item => item.value),
    ['RETRY', 'RESUME', 'RESET_OFFSET', 'EXECUTION_CREATED'])
  assert.ok(DOWNLOAD_STATE_OPTIONS.includes('RESET_OFFSET'))
})

test('耗时：未知/负值显示未知，正常值可读', () => {
  assert.strictEqual(formatDuration(null), '未知')
  assert.strictEqual(formatDuration(undefined), '未知')
  assert.strictEqual(formatDuration(-1), '未知')
  assert.strictEqual(formatDuration(0), '0s')
  assert.strictEqual(formatDuration(90 * 1000), '1m 30s')
  assert.strictEqual(formatDuration((3600 + 125) * 1000), '1h 2m 5s')
})

test('字节格式化：未知不显示 0，单位递进正确', () => {
  assert.strictEqual(formatBytes(null), '-')
  assert.strictEqual(formatBytes(undefined), '-')
  assert.strictEqual(formatBytes(-1), '-')
  assert.strictEqual(formatBytes(0), '0 B')
  assert.strictEqual(formatBytes(1024), '1.0 KB')
  assert.strictEqual(formatBytes(1024 * 1024), '1.0 MB')
  assert.strictEqual(formatBytes(1536 * 1024 * 1024), '1.50 GB')
})

test('摘要短展示：短值原样、长值截断并保留省略号', () => {
  assert.strictEqual(shortDigest(null), '-')
  assert.strictEqual(shortDigest('abc123'), 'abc123')
  const digest = '0123456789abcdef0123456789abcdef'
  assert.strictEqual(shortDigest(digest), '0123456789abcdef…')
})
