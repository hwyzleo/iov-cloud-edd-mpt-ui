<template>
  <el-dialog
    :title="dialogTitle"
    :visible="visible"
    width="960px"
    append-to-body
    :close-on-click-modal="false"
    @close="close"
  >
    <el-form ref="form" v-loading="loading" :model="form" :rules="rules" label-width="150px" size="small">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="策略编码" prop="policyCode">
            <el-input v-model="form.policyCode" :disabled="isEdit" placeholder="不可变，永不复用" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="策略名称" prop="policyName">
            <el-input v-model="form.policyName" placeholder="请输入策略名称" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="说明">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选" />
      </el-form-item>
      <el-form-item label="启用状态">
        <el-switch v-model="form.enabled" active-text="启用" inactive-text="停用" />
      </el-form-item>

      <template v-if="type === 'auth'">
        <el-divider content-position="left">访问模式与授权</el-divider>
        <el-form-item label="访问模式">
          <el-radio-group v-model="form.accessMode">
            <el-radio v-for="item in accessModes" :key="item.value" :label="item.value">{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="允许客户端类型">
          <el-select v-model="form.allowedClientTypes" multiple clearable style="width: 100%">
            <el-option v-for="item in clientTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="必需 scope">
          <el-select
            v-model="form.requiredScopes"
            multiple
            filterable
            allow-create
            default-first-option
            :disabled="anonymous"
            placeholder="回车创建，如 vehicle.read"
            style="width: 100%"
          >
            <el-option v-for="scope in form.requiredScopes" :key="scope" :label="scope" :value="scope" />
          </el-select>
        </el-form-item>
        <el-form-item label="必需权限点">
          <el-select
            v-model="form.requiredPermissions"
            multiple
            filterable
            allow-create
            default-first-option
            :disabled="anonymous"
            placeholder="回车创建，如 edd:vehicle:read"
            style="width: 100%"
          >
            <el-option v-for="item in form.requiredPermissions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-alert
          v-if="anonymous"
          type="info"
          :closable="false"
          show-icon
          title="匿名访问策略不允许声明 scope 或权限点要求"
        />
      </template>

      <template v-else-if="type === 'traffic'">
        <el-divider content-position="left">超时与并发</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="连接超时(ms)">
              <el-input-number v-model="form.connectTimeoutMillis" :min="1" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="响应超时(ms)">
              <el-input-number v-model="form.responseTimeoutMillis" :min="1" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最大并发数">
              <el-input-number v-model="form.maxConcurrentRequests" :min="1" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">限流规则</el-divider>
        <div v-for="(rule, index) in form.rateLimits" :key="'rate-' + index" class="sgw-card">
          <el-row :gutter="8">
            <el-col :span="7">
              <el-form-item label="维度" label-width="60px">
                <el-select v-model="rule.dimension">
                  <el-option v-for="item in rateDimensions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="每秒" label-width="60px">
                <el-input-number v-model="rule.replenishPerSecond" :min="1" controls-position="right" />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="桶容量" label-width="70px">
                <el-input-number v-model="rule.burstCapacity" :min="1" controls-position="right" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="失败模式" label-width="80px">
                <el-select v-model="rule.failureMode">
                  <el-option v-for="item in failureModes" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="1">
              <el-button type="text" icon="el-icon-delete" @click="form.rateLimits.splice(index, 1)" />
            </el-col>
          </el-row>
        </div>
        <el-button type="text" icon="el-icon-plus" @click="addRateLimit">添加限流规则</el-button>

        <el-divider content-position="left">熔断</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="滑动窗口大小">
              <el-input-number v-model="form.circuitBreaker.slidingWindowSize" :min="1" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最小调用数">
              <el-input-number v-model="form.circuitBreaker.minimumNumberOfCalls" :min="1" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="失败率阈值(%)">
              <el-input-number
                v-model="form.circuitBreaker.failureRateThreshold"
                :min="1"
                :max="100"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="慢调用率阈值(%)">
              <el-input-number
                v-model="form.circuitBreaker.slowCallRateThreshold"
                :min="1"
                :max="100"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="慢调用时长(ms)">
              <el-input-number
                v-model="form.circuitBreaker.slowCallDurationMillis"
                :min="1"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="打开等待(ms)">
              <el-input-number
                v-model="form.circuitBreaker.waitDurationInOpenStateMillis"
                :min="0"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="半开允许调用数">
          <el-input-number
            v-model="form.circuitBreaker.permittedCallsInHalfOpenState"
            :min="1"
            controls-position="right"
          />
        </el-form-item>

        <el-divider content-position="left">安全重试</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="最大尝试次数">
              <el-input-number v-model="form.retry.maxAttempts" :min="1" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="退避时长(ms)">
              <el-input-number v-model="form.retry.backoffMillis" :min="0" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="可重试方法">
          <el-select v-model="form.retry.methods" multiple style="width: 100%">
            <el-option v-for="method in safeMethods" :key="method" :label="method" :value="method" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发状态码">
          <el-select
            v-model="form.retry.statuses"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="回车创建，如 502"
            style="width: 100%"
          >
            <el-option v-for="status in form.retry.statuses" :key="status" :label="String(status)" :value="status" />
          </el-select>
        </el-form-item>
      </template>

      <template v-else>
        <el-divider content-position="left">灰度规则</el-divider>
        <el-form-item label="稳定灰度键">
          <el-select v-model="form.stableKey" style="width: 100%">
            <el-option v-for="item in stableKeys" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <div v-for="(rule, ruleIndex) in form.rules" :key="'rule-' + ruleIndex" class="sgw-card">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="规则优先级" label-width="90px">
                <el-input-number v-model="rule.priority" :min="0" controls-position="right" />
              </el-form-item>
            </el-col>
            <el-col :span="14">
              <el-form-item label="权重合计" label-width="90px">
                <el-tag :type="weightSum(rule) === 100 ? 'success' : 'danger'" size="mini">
                  {{ weightSum(rule) }} / 100
                </el-tag>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-button type="text" icon="el-icon-delete" @click="form.rules.splice(ruleIndex, 1)">删除规则</el-button>
            </el-col>
          </el-row>

          <el-divider content-position="left">匹配条件</el-divider>
          <el-form-item label="客户端类型" label-width="110px">
            <el-select v-model="rule.conditions.clientTypes" multiple clearable style="width: 100%">
              <el-option v-for="item in clientTypes" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="认证用户" label-width="110px">
            <el-select
              v-model="rule.conditions.userIds"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="回车创建用户ID"
              style="width: 100%"
            >
              <el-option v-for="item in rule.conditions.userIds" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="车辆标识" label-width="110px">
            <el-select
              v-model="rule.conditions.vehicleIds"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="回车创建车辆标识"
              style="width: 100%"
            >
              <el-option v-for="item in rule.conditions.vehicleIds" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="请求头条件" label-width="110px">
            <div class="sgw-row-list">
              <el-row v-for="(header, headerIndex) in rule.conditions.headers" :key="'ch-' + headerIndex" :gutter="8" class="sgw-row">
                <el-col :span="7">
                  <el-input v-model="header.name" placeholder="请求头名称" />
                </el-col>
                <el-col :span="6">
                  <el-select v-model="header.matchType">
                    <el-option v-for="item in matchTypes" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-col>
                <el-col :span="9">
                  <el-input v-model="header.value" placeholder="匹配值" />
                </el-col>
                <el-col :span="2">
                  <el-button type="text" icon="el-icon-delete" @click="rule.conditions.headers.splice(headerIndex, 1)" />
                </el-col>
              </el-row>
              <el-button type="text" icon="el-icon-plus" @click="rule.conditions.headers.push({ name: '', matchType: 'EXACT', value: '' })">
                添加请求头条件
              </el-button>
            </div>
          </el-form-item>

          <el-divider content-position="left">加权目标</el-divider>
          <el-row v-for="(target, targetIndex) in rule.targets" :key="'ct-' + targetIndex" :gutter="8" class="sgw-row">
            <el-col :span="4">
              <el-select v-model="target.type">
                <el-option v-for="item in targetTypes" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-select
                v-if="target.type === 'SERVICE'"
                v-model="target.serviceId"
                filterable
                clearable
                allow-create
                default-first-option
                placeholder="选择或输入服务ID"
                style="width: 100%"
              >
                <el-option v-for="service in services" :key="service.serviceId" :label="service.serviceId" :value="service.serviceId" />
              </el-select>
              <el-input v-else v-model="target.uri" :placeholder="directPlaceholder" />
            </el-col>
            <el-col :span="4">
              <el-input-number v-model="target.weight" :min="1" :max="100" controls-position="right" />
            </el-col>
            <el-col :span="2">
              <el-button type="text" icon="el-icon-delete" @click="rule.targets.splice(targetIndex, 1)" />
            </el-col>
          </el-row>
          <el-button type="text" icon="el-icon-plus" @click="addTarget(rule)">添加灰度目标</el-button>
        </div>
        <el-button type="text" icon="el-icon-plus" @click="addRule">添加灰度规则</el-button>
      </template>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button size="small" icon="el-icon-check" :loading="validateLoading" @click="handleValidate">校 验</el-button>
      <el-button type="primary" size="small" :loading="submitLoading" @click="submitForm">确 定</el-button>
      <el-button size="small" @click="close">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { addPolicy, getPolicy, updatePolicy, validatePolicy } from '@/api/edd/sgw/policy'
import { getUpstreamOptions } from '@/api/edd/sgw/upstream'
import {
  ACCESS_MODES,
  CLIENT_TYPES,
  FAILURE_MODES,
  MATCH_TYPES,
  RATE_DIMENSIONS,
  STABLE_KEYS,
  TARGET_TYPES,
  safeArray,
  toNumberOrNull
} from '@/views/edd/sgw/sgw-options'

function defaultAuthForm() {
  return {
    policyCode: '',
    policyName: '',
    description: '',
    accessMode: 'AUTHENTICATED',
    allowedClientTypes: [],
    requiredScopes: [],
    requiredPermissions: [],
    enabled: true,
    rowVersion: null
  }
}

function defaultTrafficForm() {
  return {
    policyCode: '',
    policyName: '',
    description: '',
    connectTimeoutMillis: 1000,
    responseTimeoutMillis: 5000,
    maxConcurrentRequests: 200,
    rateLimits: [],
    circuitBreaker: {
      slidingWindowSize: 100,
      minimumNumberOfCalls: 20,
      failureRateThreshold: 50,
      slowCallRateThreshold: 50,
      slowCallDurationMillis: 2000,
      waitDurationInOpenStateMillis: 30000,
      permittedCallsInHalfOpenState: 5
    },
    retry: {
      maxAttempts: 2,
      backoffMillis: 100,
      methods: ['GET', 'HEAD', 'OPTIONS'],
      statuses: [502, 503, 504]
    },
    enabled: true,
    rowVersion: null
  }
}

function defaultCanaryRule() {
  return {
    priority: 10,
    conditions: {
      clientTypes: [],
      userIds: [],
      vehicleIds: [],
      headers: []
    },
    targets: []
  }
}

function defaultCanaryForm() {
  return {
    policyCode: '',
    policyName: '',
    description: '',
    stableKey: 'SOURCE_IP',
    rules: [defaultCanaryRule()],
    enabled: true,
    rowVersion: null
  }
}

export default {
  name: 'SgwPolicyEditor',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'auth'
    },
    policyCode: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      loading: false,
      submitLoading: false,
      validateLoading: false,
      form: defaultAuthForm(),
      services: [],
      directHosts: [],
      accessModes: ACCESS_MODES,
      clientTypes: CLIENT_TYPES,
      matchTypes: MATCH_TYPES,
      rateDimensions: RATE_DIMENSIONS,
      failureModes: FAILURE_MODES,
      stableKeys: STABLE_KEYS,
      targetTypes: TARGET_TYPES,
      safeMethods: ['GET', 'HEAD', 'OPTIONS'],
      rules: {
        policyCode: [{ required: true, message: '策略编码不能为空', trigger: 'blur' }],
        policyName: [{ required: true, message: '策略名称不能为空', trigger: 'blur' }]
      }
    }
  },
  computed: {
    isEdit() {
      return !!this.policyCode
    },
    anonymous() {
      return this.type === 'auth' && this.form.accessMode === 'ANONYMOUS'
    },
    dialogTitle() {
      const label = { auth: '认证授权策略', traffic: '流量治理策略', canary: '灰度策略' }[this.type]
      return (this.isEdit ? '修改' : '新增') + label + '草稿'
    },
    directPlaceholder() {
      const host = this.directHosts.length ? this.directHosts[0] : 'internal-host:8080'
      return '如 http://' + host + '/v2'
    }
  },
  watch: {
    visible(value) {
      if (value) {
        this.open()
      }
    }
  },
  methods: {
    open() {
      if (this.type === 'auth') {
        this.form = defaultAuthForm()
      } else if (this.type === 'traffic') {
        this.form = defaultTrafficForm()
      } else {
        this.form = defaultCanaryForm()
      }
      this.loadServices()
      this.$nextTick(() => {
        this.$refs.form && this.$refs.form.clearValidate()
      })
      if (this.policyCode) {
        this.loadDetail()
      }
    },
    loadServices() {
      this.services = []
      this.directHosts = []
      if (this.$auth.hasPermi('edd:sgw:upstream:list')) {
        getUpstreamOptions().then(response => {
          this.services = safeArray(response.data && response.data.services)
          this.directHosts = safeArray(response.data && response.data.directHosts)
        }).catch(() => {})
      }
    },
    loadDetail() {
      this.loading = true
      getPolicy(this.type, this.policyCode).then(response => {
        const data = response.data || {}
        if (this.type === 'auth') {
          this.form = {
            policyCode: data.policyCode,
            policyName: data.policyName,
            description: data.description,
            accessMode: data.accessMode,
            allowedClientTypes: safeArray(data.allowedClientTypes),
            requiredScopes: safeArray(data.requiredScopes),
            requiredPermissions: safeArray(data.requiredPermissions),
            enabled: data.enabled,
            rowVersion: data.rowVersion
          }
        } else if (this.type === 'traffic') {
          this.form = {
            policyCode: data.policyCode,
            policyName: data.policyName,
            description: data.description,
            connectTimeoutMillis: data.connectTimeoutMillis,
            responseTimeoutMillis: data.responseTimeoutMillis,
            maxConcurrentRequests: data.maxConcurrentRequests,
            rateLimits: safeArray(data.rateLimits),
            circuitBreaker: data.circuitBreaker || defaultTrafficForm().circuitBreaker,
            retry: data.retry || defaultTrafficForm().retry,
            enabled: data.enabled,
            rowVersion: data.rowVersion
          }
        } else {
          this.form = {
            policyCode: data.policyCode,
            policyName: data.policyName,
            description: data.description,
            stableKey: data.stableKey,
            rules: safeArray(data.rules).map(rule => ({
              priority: rule.priority,
              conditions: {
                clientTypes: safeArray(rule.conditions && rule.conditions.clientTypes),
                userIds: safeArray(rule.conditions && rule.conditions.userIds),
                vehicleIds: safeArray(rule.conditions && rule.conditions.vehicleIds),
                headers: safeArray(rule.conditions && rule.conditions.headers)
              },
              targets: safeArray(rule.targets).map(target => ({
                type: target.type,
                serviceId: target.serviceId,
                uri: target.uri,
                weight: target.weight
              }))
            })),
            enabled: data.enabled,
            rowVersion: data.rowVersion
          }
        }
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    addRateLimit() {
      this.form.rateLimits.push({
        dimension: 'AUTHENTICATED_SUBJECT',
        replenishPerSecond: 20,
        burstCapacity: 40,
        failureMode: 'FAIL_CLOSED'
      })
    },
    addRule() {
      this.form.rules.push(defaultCanaryRule())
    },
    addTarget(rule) {
      rule.targets.push({ type: 'SERVICE', serviceId: '', uri: '', weight: 100 })
    },
    weightSum(rule) {
      return safeArray(rule.targets).reduce((sum, target) => sum + (Number(target.weight) || 0), 0)
    },
    buildPayload() {
      let payload
      if (this.type === 'auth') {
        payload = {
          policyCode: this.form.policyCode,
          policyName: this.form.policyName,
          description: this.form.description,
          accessMode: this.form.accessMode,
          allowedClientTypes: safeArray(this.form.allowedClientTypes),
          requiredScopes: this.anonymous ? [] : safeArray(this.form.requiredScopes),
          requiredPermissions: this.anonymous ? [] : safeArray(this.form.requiredPermissions),
          enabled: this.form.enabled
        }
      } else if (this.type === 'traffic') {
        payload = {
          policyCode: this.form.policyCode,
          policyName: this.form.policyName,
          description: this.form.description,
          connectTimeoutMillis: toNumberOrNull(this.form.connectTimeoutMillis),
          responseTimeoutMillis: toNumberOrNull(this.form.responseTimeoutMillis),
          maxConcurrentRequests: toNumberOrNull(this.form.maxConcurrentRequests),
          rateLimits: safeArray(this.form.rateLimits).map(rule => ({
            dimension: rule.dimension,
            replenishPerSecond: toNumberOrNull(rule.replenishPerSecond),
            burstCapacity: toNumberOrNull(rule.burstCapacity),
            failureMode: rule.failureMode
          })),
          circuitBreaker: this.form.circuitBreaker
            ? {
              slidingWindowSize: toNumberOrNull(this.form.circuitBreaker.slidingWindowSize),
              minimumNumberOfCalls: toNumberOrNull(this.form.circuitBreaker.minimumNumberOfCalls),
              failureRateThreshold: toNumberOrNull(this.form.circuitBreaker.failureRateThreshold),
              slowCallRateThreshold: toNumberOrNull(this.form.circuitBreaker.slowCallRateThreshold),
              slowCallDurationMillis: toNumberOrNull(this.form.circuitBreaker.slowCallDurationMillis),
              waitDurationInOpenStateMillis: toNumberOrNull(this.form.circuitBreaker.waitDurationInOpenStateMillis),
              permittedCallsInHalfOpenState: toNumberOrNull(this.form.circuitBreaker.permittedCallsInHalfOpenState)
            }
            : null,
          retry: this.form.retry
            ? {
              maxAttempts: toNumberOrNull(this.form.retry.maxAttempts),
              backoffMillis: toNumberOrNull(this.form.retry.backoffMillis),
              methods: safeArray(this.form.retry.methods),
              statuses: safeArray(this.form.retry.statuses).map(status => Number(status))
            }
            : null,
          enabled: this.form.enabled
        }
      } else {
        payload = {
          policyCode: this.form.policyCode,
          policyName: this.form.policyName,
          description: this.form.description,
          stableKey: this.form.stableKey,
          rules: safeArray(this.form.rules).map(rule => ({
            priority: toNumberOrNull(rule.priority),
            conditions: {
              clientTypes: safeArray(rule.conditions.clientTypes),
              userIds: safeArray(rule.conditions.userIds),
              vehicleIds: safeArray(rule.conditions.vehicleIds),
              headers: safeArray(rule.conditions.headers).filter(header => header.name)
            },
            targets: safeArray(rule.targets).map(target => ({
              type: target.type,
              serviceId: target.type === 'SERVICE' ? target.serviceId : null,
              uri: target.type === 'SERVICE' ? null : target.uri,
              weight: toNumberOrNull(target.weight)
            }))
          })),
          enabled: this.form.enabled
        }
      }
      if (this.isEdit) {
        payload.rowVersion = this.form.rowVersion
      }
      return payload
    },
    checkCanaryWeights() {
      if (this.type !== 'canary') {
        return true
      }
      const invalid = safeArray(this.form.rules).some(rule => this.weightSum(rule) !== 100)
      if (invalid) {
        this.$modal.msgWarning('每条灰度规则的权重合计必须为 100')
        return false
      }
      return true
    },
    handleValidate() {
      this.$refs.form.validate(valid => {
        if (!valid || !this.checkCanaryWeights()) {
          return
        }
        this.validateLoading = true
        validatePolicy(this.type, this.buildPayload()).then(response => {
          this.validateLoading = false
          const result = response.data || {}
          if (result.valid) {
            this.$modal.msgSuccess('校验通过')
          } else {
            const lines = safeArray(result.errors).map(item => item.field + '：' + item.message)
            this.$alert(lines.join('<br/>'), '校验未通过', {
              dangerouslyUseHTMLString: true,
              confirmButtonText: '知道了'
            })
          }
        }).catch(() => {
          this.validateLoading = false
        })
      })
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (!valid || !this.checkCanaryWeights()) {
          return
        }
        const payload = this.buildPayload()
        this.submitLoading = true
        const request = this.isEdit
          ? updatePolicy(this.type, this.policyCode, payload)
          : addPolicy(this.type, payload)
        request.then(() => {
          this.submitLoading = false
          this.$modal.msgSuccess(this.isEdit ? '修改成功（草稿）' : '新增成功（草稿）')
          this.$emit('success')
          this.close()
        }).catch(() => {
          this.submitLoading = false
        })
      })
    },
    close() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped>
.sgw-card {
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
}

.sgw-row {
  margin-bottom: 8px;
}

.sgw-row-list {
  width: 100%;
}
</style>
