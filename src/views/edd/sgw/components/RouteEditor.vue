<template>
  <el-dialog
    :title="isEdit ? '修改路由草稿' : '新增路由草稿'"
    :visible="visible"
    width="960px"
    append-to-body
    :close-on-click-modal="false"
    @close="close"
  >
    <el-form ref="form" v-loading="loading" :model="form" :rules="rules" label-width="130px" size="small">
      <el-divider content-position="left">基本信息</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="路由编码" prop="routeCode">
            <el-input v-model="form.routeCode" :disabled="isEdit" placeholder="不可变，永不复用" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="路由名称" prop="routeName">
            <el-input v-model="form.routeName" placeholder="请输入路由名称" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="优先级" prop="priority">
            <el-input-number v-model="form.priority" :min="0" controls-position="right" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="启用状态">
            <el-switch v-model="form.enabled" active-text="启用" inactive-text="停用" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="说明">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选" />
      </el-form-item>

      <el-divider content-position="left">匹配条件</el-divider>
      <el-form-item label="路径" prop="match.paths">
        <el-select
          v-model="form.match.paths"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="如 /vehicle/profile/**"
          style="width: 100%"
        >
          <el-option v-for="path in form.match.paths" :key="path" :label="path" :value="path" />
        </el-select>
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="HTTP 方法">
            <el-select v-model="form.match.methods" multiple clearable style="width: 100%">
              <el-option v-for="method in methods" :key="method" :label="method" :value="method" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户端类型">
            <el-select v-model="form.match.clientTypes" multiple clearable style="width: 100%">
              <el-option v-for="item in clientTypes" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="主机名">
        <el-select
          v-model="form.match.hosts"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="如 *.openiov.top"
          style="width: 100%"
        >
          <el-option v-for="host in form.match.hosts" :key="host" :label="host" :value="host" />
        </el-select>
      </el-form-item>

      <el-form-item label="请求头条件">
        <div class="sgw-row-list">
          <el-row v-for="(row, index) in headerRows" :key="'header-' + index" :gutter="8" class="sgw-row">
            <el-col :span="7">
              <el-input v-model="row.name" placeholder="请求头名称" />
            </el-col>
            <el-col :span="6">
              <el-select v-model="row.matchType">
                <el-option v-for="item in matchTypes" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-input v-model="row.value" placeholder="匹配值（正则或精确值）" />
            </el-col>
            <el-col :span="3">
              <el-button type="text" icon="el-icon-delete" @click="headerRows.splice(index, 1)" />
            </el-col>
          </el-row>
          <el-button type="text" icon="el-icon-plus" @click="addHeaderRow">添加请求头条件</el-button>
        </div>
      </el-form-item>

      <el-form-item label="查询参数条件">
        <div class="sgw-row-list">
          <el-row v-for="(row, index) in queryRows" :key="'query-' + index" :gutter="8" class="sgw-row">
            <el-col :span="7">
              <el-input v-model="row.name" placeholder="参数名称" />
            </el-col>
            <el-col :span="6">
              <el-select v-model="row.matchType">
                <el-option v-for="item in matchTypes" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-input v-model="row.value" placeholder="匹配值" />
            </el-col>
            <el-col :span="3">
              <el-button type="text" icon="el-icon-delete" @click="queryRows.splice(index, 1)" />
            </el-col>
          </el-row>
          <el-button type="text" icon="el-icon-plus" @click="addQueryRow">添加查询参数条件</el-button>
        </div>
      </el-form-item>

      <el-divider content-position="left">目标</el-divider>
      <el-form-item label="目标类型" prop="target.type">
        <el-radio-group v-model="form.target.type" @change="onTargetTypeChange">
          <el-radio v-for="item in targetTypes" :key="item.value" :label="item.value">{{ item.label }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.target.type === 'SERVICE'" label="服务ID" prop="target.serviceId">
        <el-select
          v-model="form.target.serviceId"
          filterable
          clearable
          allow-create
          default-first-option
          placeholder="选择注册中心服务，或直接输入服务ID"
          style="width: 100%"
        >
          <el-option
            v-for="service in services"
            :key="service.serviceId"
            :label="service.serviceId + '（实例 ' + service.instanceCount + '）'"
            :value="service.serviceId"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-else label="直连 URI" prop="target.uri">
        <el-input v-model="form.target.uri" :placeholder="directPlaceholder" />
        <div class="sgw-hint">获批直连主机：{{ directHosts.join(', ') || '未配置' }}</div>
      </el-form-item>

      <el-divider content-position="left">请求变换（可选）</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="重写路径正则">
            <el-input v-model="form.rewritePath.pattern" placeholder="如 /vehicle/profile/(?<segment>.*)" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="替换表达式">
            <el-input v-model="form.rewritePath.replacement" placeholder="如 /api/${segment}" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="添加/覆盖请求头">
        <div class="sgw-row-list">
          <el-row v-for="(row, index) in headerAddRows" :key="'add-' + index" :gutter="8" class="sgw-row">
            <el-col :span="10">
              <el-input v-model="row.name" placeholder="请求头名称" />
            </el-col>
            <el-col :span="11">
              <el-input v-model="row.value" placeholder="请求头值" />
            </el-col>
            <el-col :span="3">
              <el-button type="text" icon="el-icon-delete" @click="headerAddRows.splice(index, 1)" />
            </el-col>
          </el-row>
          <el-button type="text" icon="el-icon-plus" @click="headerAddRows.push({ name: '', value: '' })">
            添加请求头
          </el-button>
        </div>
      </el-form-item>
      <el-form-item label="移除请求头">
        <el-select
          v-model="form.headersToRemove"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="如 X-Internal-Debug"
          style="width: 100%"
        >
          <el-option v-for="name in form.headersToRemove" :key="name" :label="name" :value="name" />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">策略引用（可选）</el-divider>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="认证授权策略">
            <el-select
              v-model="form.authPolicyCode"
              clearable
              filterable
              allow-create
              default-first-option
              placeholder="选择或输入策略编码"
              style="width: 100%"
            >
              <el-option
                v-for="policy in policyOptions.auth"
                :key="policy.policyCode"
                :label="policy.policyCode + '（' + policy.policyName + '）'"
                :value="policy.policyCode"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="流量治理策略">
            <el-select
              v-model="form.trafficPolicyCode"
              clearable
              filterable
              allow-create
              default-first-option
              placeholder="选择或输入策略编码"
              style="width: 100%"
            >
              <el-option
                v-for="policy in policyOptions.traffic"
                :key="policy.policyCode"
                :label="policy.policyCode + '（' + policy.policyName + '）'"
                :value="policy.policyCode"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="灰度策略">
            <el-select
              v-model="form.canaryPolicyCode"
              clearable
              filterable
              allow-create
              default-first-option
              placeholder="选择或输入策略编码"
              style="width: 100%"
            >
              <el-option
                v-for="policy in policyOptions.canary"
                :key="policy.policyCode"
                :label="policy.policyCode + '（' + policy.policyName + '）'"
                :value="policy.policyCode"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button size="small" icon="el-icon-check" :loading="validateLoading" @click="handleValidate">校 验</el-button>
      <el-button type="primary" size="small" :loading="submitLoading" @click="submitForm">确 定</el-button>
      <el-button size="small" @click="close">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { addRoute, getRoute, updateRoute, validateRoute } from '@/api/edd/sgw/route'
import { listPolicy } from '@/api/edd/sgw/policy'
import { getUpstreamOptions } from '@/api/edd/sgw/upstream'
import {
  CLIENT_TYPES,
  HTTP_METHODS,
  MATCH_TYPES,
  TARGET_TYPES,
  safeArray,
  toNumberOrNull
} from '@/views/edd/sgw/sgw-options'

function defaultForm() {
  return {
    routeCode: '',
    routeName: '',
    description: '',
    priority: 100,
    enabled: true,
    match: {
      paths: [],
      methods: [],
      hosts: [],
      clientTypes: []
    },
    target: {
      type: 'SERVICE',
      serviceId: '',
      uri: ''
    },
    rewritePath: {
      pattern: '',
      replacement: ''
    },
    headersToRemove: [],
    authPolicyCode: null,
    trafficPolicyCode: null,
    canaryPolicyCode: null,
    rowVersion: null
  }
}

export default {
  name: 'SgwRouteEditor',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    routeCode: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      loading: false,
      submitLoading: false,
      validateLoading: false,
      form: defaultForm(),
      headerRows: [],
      queryRows: [],
      headerAddRows: [],
      services: [],
      directHosts: [],
      policyOptions: {
        auth: [],
        traffic: [],
        canary: []
      },
      methods: HTTP_METHODS,
      clientTypes: CLIENT_TYPES,
      matchTypes: MATCH_TYPES,
      targetTypes: TARGET_TYPES,
      rules: {
        routeCode: [{ required: true, message: '路由编码不能为空', trigger: 'blur' }],
        routeName: [{ required: true, message: '路由名称不能为空', trigger: 'blur' }],
        priority: [{ required: true, message: '优先级不能为空', trigger: 'blur' }],
        'match.paths': [{ type: 'array', required: true, min: 1, message: '至少需要一个路径匹配规则', trigger: 'change' }],
        'target.type': [{ required: true, message: '目标类型不能为空', trigger: 'change' }]
      }
    }
  },
  computed: {
    isEdit() {
      return !!this.routeCode
    },
    directPlaceholder() {
      const host = this.directHosts.length ? this.directHosts[0] : 'internal-host:8080'
      return '如 http://' + host + '/api'
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
      this.form = defaultForm()
      this.headerRows = []
      this.queryRows = []
      this.headerAddRows = []
      this.$nextTick(() => {
        this.$refs.form && this.$refs.form.clearValidate()
      })
      this.loadOptions()
      if (this.routeCode) {
        this.loadDetail()
      }
    },
    loadOptions() {
      this.services = []
      this.directHosts = []
      this.policyOptions = { auth: [], traffic: [], canary: [] }
      // 选项加载按权限降级：无读取权限时保留手工输入，不阻断路由编辑
      if (this.$auth.hasPermi('edd:sgw:upstream:list')) {
        getUpstreamOptions().then(response => {
          this.services = safeArray(response.data && response.data.services)
          this.directHosts = safeArray(response.data && response.data.directHosts)
        }).catch(() => {})
      }
      if (this.$auth.hasPermi('edd:sgw:policy:list')) {
        Promise.all([
          listPolicy('auth', { page: 1, size: 200 }),
          listPolicy('traffic', { page: 1, size: 200 }),
          listPolicy('canary', { page: 1, size: 200 })
        ]).then(results => {
          this.policyOptions = {
            auth: safeArray(results[0] && results[0].data && results[0].data.items),
            traffic: safeArray(results[1] && results[1].data && results[1].data.items),
            canary: safeArray(results[2] && results[2].data && results[2].data.items)
          }
        }).catch(() => {
          this.policyOptions = { auth: [], traffic: [], canary: [] }
        })
      }
    },
    loadDetail() {
      this.loading = true
      getRoute(this.routeCode).then(response => {
        const data = response.data || {}
        const match = data.match || {}
        const transform = data.transform || {}
        const rewritePath = transform.rewritePath || {}
        this.form = {
          routeCode: data.routeCode,
          routeName: data.routeName,
          description: data.description,
          priority: data.priority,
          enabled: data.enabled,
          match: {
            paths: safeArray(match.paths),
            methods: safeArray(match.methods),
            hosts: safeArray(match.hosts),
            clientTypes: safeArray(match.clientTypes)
          },
          target: {
            type: data.target ? data.target.type : 'SERVICE',
            serviceId: data.target ? data.target.serviceId : '',
            uri: data.target ? data.target.uri : ''
          },
          rewritePath: {
            pattern: rewritePath.pattern || '',
            replacement: rewritePath.replacement || ''
          },
          headersToRemove: safeArray(transform.headersToRemove),
          authPolicyCode: data.authPolicyCode,
          trafficPolicyCode: data.trafficPolicyCode,
          canaryPolicyCode: data.canaryPolicyCode,
          rowVersion: data.rowVersion
        }
        this.headerRows = safeArray(match.headers).map(item => ({
          name: item.name,
          matchType: item.matchType || 'EXACT',
          value: item.value
        }))
        this.queryRows = safeArray(match.queryParams).map(item => ({
          name: item.name,
          matchType: item.matchType || 'EXACT',
          value: item.value
        }))
        this.headerAddRows = Object.keys(transform.headersToAdd || {}).map(name => ({
          name: name,
          value: transform.headersToAdd[name]
        }))
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    addHeaderRow() {
      this.headerRows.push({ name: '', matchType: 'EXACT', value: '' })
    },
    addQueryRow() {
      this.queryRows.push({ name: '', matchType: 'EXACT', value: '' })
    },
    onTargetTypeChange(type) {
      if (type === 'SERVICE') {
        this.form.target.uri = ''
      } else {
        this.form.target.serviceId = ''
      }
    },
    buildPayload() {
      const headersToAdd = {}
      this.headerAddRows.forEach(row => {
        if (row.name) {
          headersToAdd[row.name] = row.value || ''
        }
      })
      const hasRewrite = this.form.rewritePath.pattern && this.form.rewritePath.replacement
      const payload = {
        routeCode: this.form.routeCode,
        routeName: this.form.routeName,
        description: this.form.description,
        priority: toNumberOrNull(this.form.priority),
        enabled: this.form.enabled,
        match: {
          paths: safeArray(this.form.match.paths),
          methods: safeArray(this.form.match.methods),
          hosts: safeArray(this.form.match.hosts),
          headers: this.headerRows
            .filter(row => row.name)
            .map(row => ({ name: row.name, matchType: row.matchType, value: row.value })),
          queryParams: this.queryRows
            .filter(row => row.name)
            .map(row => ({ name: row.name, matchType: row.matchType, value: row.value })),
          clientTypes: safeArray(this.form.match.clientTypes)
        },
        target: {
          type: this.form.target.type,
          serviceId: this.form.target.type === 'SERVICE' ? this.form.target.serviceId : null,
          uri: this.form.target.type === 'SERVICE' ? null : this.form.target.uri
        },
        transform: {
          rewritePath: hasRewrite
            ? { pattern: this.form.rewritePath.pattern, replacement: this.form.rewritePath.replacement }
            : null,
          headersToAdd: headersToAdd,
          headersToRemove: safeArray(this.form.headersToRemove)
        },
        authPolicyCode: this.form.authPolicyCode || null,
        trafficPolicyCode: this.form.trafficPolicyCode || null,
        canaryPolicyCode: this.form.canaryPolicyCode || null
      }
      if (this.isEdit) {
        payload.rowVersion = this.form.rowVersion
      }
      return payload
    },
    checkTarget() {
      if (this.form.target.type === 'SERVICE' && !this.form.target.serviceId) {
        this.$modal.msgWarning('请选择服务发现目标的服务ID')
        return false
      }
      if (this.form.target.type !== 'SERVICE' && !this.form.target.uri) {
        this.$modal.msgWarning('请填写直连目标 URI')
        return false
      }
      return true
    },
    handleValidate() {
      this.$refs.form.validate(valid => {
        if (!valid || !this.checkTarget()) {
          return
        }
        this.validateLoading = true
        validateRoute(this.buildPayload()).then(response => {
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
        if (!valid || !this.checkTarget()) {
          return
        }
        const payload = this.buildPayload()
        this.submitLoading = true
        const request = this.isEdit ? updateRoute(this.routeCode, payload) : addRoute(payload)
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
.sgw-row-list {
  width: 100%;
}

.sgw-row {
  margin-bottom: 8px;
}

.sgw-hint {
  color: #909399;
  font-size: 12px;
  line-height: 18px;
  margin-top: 4px;
}
</style>
