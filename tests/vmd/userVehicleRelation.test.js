const path = require('path')
const fs = require('fs')
const test = require('node:test')
const assert = require('node:assert')
const babel = require('@babel/core')

const read = (...segments) => fs.readFileSync(path.resolve(__dirname, '../..', ...segments), 'utf8')

const helperPath = path.resolve(__dirname, '../../src/views/vmd/vehicleInfo/userVehicleDisplay.js')
const transpiled = babel.transformFileSync(helperPath, {
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs']
})
const helperModule = { exports: {}}
// eslint-disable-next-line no-new-func
new Function('module', 'exports', 'require', transpiled.code)(
  helperModule, helperModule.exports, require)
const {
  bindingStatusLabel,
  firstActivationLabel,
  iviLoginLabel,
  revocationStatusLabel,
  formatUserVehicleTime,
  createUnbindIdempotencyKey
} = helperModule.exports

const view = read('src/views/vmd/vehicleInfo/index.vue')
const api = read('src/api/iov/tsp/userVehicle.js')

test('用户绑定、首次激活、登录和撤销状态分别展示，未知值不伪造业务事实', () => {
  assert.strictEqual(bindingStatusLabel('BOUND'), '已绑定')
  assert.strictEqual(bindingStatusLabel('UNBOUND'), '未绑定')
  assert.strictEqual(firstActivationLabel('RECORDED'), '已激活')
  assert.strictEqual(firstActivationLabel('NOT_RECORDED'), '未激活')
  assert.strictEqual(firstActivationLabel('UNKNOWN'), '激活状态未知')
  assert.strictEqual(iviLoginLabel('FAILED'), '登录失败')
  assert.strictEqual(iviLoginLabel(undefined), '暂无登录回执')
  assert.strictEqual(revocationStatusLabel('FAILED'), '撤销失败')
  assert.strictEqual(revocationStatusLabel('PENDING'), '撤销处理中')
})

test('MPT 展示墙钟只排版，不追加时区或二次转换', () => {
  assert.strictEqual(formatUserVehicleTime('2026-11-25T10:00:00'), '2026-11-25 10:00:00')
  assert.strictEqual(formatUserVehicleTime(null), '-')
  assert.doesNotMatch(read('src/views/vmd/vehicleInfo/userVehicleDisplay.js'), /\bnew\s+Date\s*\(/)
})

test('解绑幂等键符合 TSP 契约，同一次表单重试可复用', () => {
  const key = createUnbindIdempotencyKey(() => 1760000000000, () => 0.5)
  assert.match(key, /^[A-Za-z0-9_.:-]{1,128}$/)
  assert.strictEqual(key, createUnbindIdempotencyKey(() => 1760000000000, () => 0.5))
})

test('前端 API 使用既有 CR-021 端点，不新增后端路由', () => {
  assert.match(api, /url: '\/iov-tsp\/api\/mpt\/userVehicle\/v1\/relation'/)
  assert.match(api, /url: '\/iov-tsp\/api\/mpt\/userVehicle\/v1\/relation\/history'/)
  assert.match(api, /relation\/' \+ relationId \+ '\/unbind'/)
  assert.match(api, /operations\/' \+ operationId \+ '\/retry-revocation'/)
})

test('车辆信息页面提供绑定激活入口、状态区域和权限控制的解绑按钮', () => {
  assert.match(view, /v-hasPermi="\['tsp:user-vehicle:query'\]"/)
  assert.match(view, /@click="handleUserVehicle\(scope\.row\)"/)
  assert.match(view, />绑定\/激活/)
  assert.match(view, /v-hasPermi="\['tsp:user-vehicle:unbind'\]"/)
  assert.match(view, /handleOpenUnbind/)
  assert.match(view, /handleRevocationRetry/)
  assert.match(view, /userVehicle\.relation\.rowVersion/)
  assert.match(view, /rowVersion: relation\.rowVersion/)
  assert.match(view, /idempotencyKey: createUnbindIdempotencyKey\(\)/)
})

test('绑定激活窗口提供历史记录页签，并使用服务端数据库分页契约', () => {
  assert.match(view, /<el-tab-pane label="历史记录" name="history"/)
  assert.match(view, /@tab-click="handleUserVehicleTabChange"/)
  assert.match(view, /listUserVehicleHistory\(query\)/)
  assert.match(view, /:page\.sync="userVehicleHistoryQuery\.pageNo"/)
  assert.match(view, /:limit\.sync="userVehicleHistoryQuery\.pageSize"/)
  assert.match(view, /@pagination="getUserVehicleHistory"/)
  assert.match(view, /const query = \{ \.\.\.this\.userVehicleHistoryQuery, vin \}/)
  assert.doesNotMatch(view, /userVehicleHistory\.(subList|slice)/)
})

test('车辆生命周期显示 VEHICLE_ACTIVE，详情加载失败不伪造 UNBOUND', () => {
  assert.match(view, /'VEHICLE_ACTIVE': '车辆激活'/)
  assert.match(view, /this\.userVehicle = \{ vin, firstActivation: \{ state: 'UNKNOWN' \}\}/)
  assert.doesNotMatch(view, /this\.userVehicle = \{ vin, bindingStatus: 'UNBOUND', firstActivation/)
})
