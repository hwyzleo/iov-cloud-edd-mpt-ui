<template>
  <div class="blocking-governance">
    <!-- 查询区：证书维度寻址 + 开通批次直接定位 -->
    <el-card shadow="never" style="margin-bottom: 12px;">
      <div class="query-section">
        <span class="section-label">① 证书维度定位（从车辆证书入口，可选）</span>
        <el-form :inline="true" size="small" @submit.native.prevent>
          <el-form-item label="证书申请 requestId">
            <el-input
              v-model="certRequestId"
              placeholder="车辆证书申请 requestId（MPT-CERT-* / MPT-REISSUE-*）"
              clearable
              style="width: 320px"
              @keyup.enter.native="handleResolve"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              v-hasPermi="['viam:businessKey:provisioning:query']"
              type="primary"
              plain
              icon="el-icon-link"
              :loading="resolving"
              @click="handleResolve"
            >寻址开通批次
            </el-button>
            <el-checkbox v-model="includeTerminal" style="margin-left: 4px;">附带历史终结批次</el-checkbox>
          </el-form-item>
        </el-form>
      </div>
      <div class="query-section">
        <span class="section-label">② 开通批次定位（从告警/监控直接输入 kp-*）</span>
        <el-form :inline="true" size="small" @submit.native.prevent>
          <el-form-item label="开通批次 requestId">
            <el-input
              v-model="queryRequestId"
              placeholder="业务密钥开通批次 requestId（kp-*）"
              clearable
              style="width: 320px"
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              v-hasPermi="['viam:businessKey:provisioning:query']"
              type="primary"
              icon="el-icon-search"
              :loading="loading"
              @click="handleQuery"
            >查询诊断
            </el-button>
            <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 证书维度寻址结果 -->
    <el-card v-if="resolution" shadow="never" style="margin-bottom: 12px; border-left: 4px solid #409EFF;">
      <div slot="header">
        <span>证书维度寻址结果</span>
        <el-button type="text" style="float: right; padding: 0;" @click="resolution = null">收起</el-button>
      </div>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="证书申请 requestId">{{ resolution.certificateRequestId }}</el-descriptions-item>
        <el-descriptions-item label="设备SN">{{ resolution.deviceSn }}</el-descriptions-item>
        <el-descriptions-item label="业务域">{{ resolution.businessDomain }}</el-descriptions-item>
        <el-descriptions-item label="寻址结果">
          <el-tag :type="resolutionTagType(resolution.resolution)" size="mini">
            {{ resolutionLabel(resolution.resolution) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template v-if="resolution.candidates && resolution.candidates.length">
        <div style="margin: 12px 0 6px; font-weight: bold;">候选批次（按发起时间倒序）</div>
        <el-table :data="resolution.candidates" size="mini" border>
          <el-table-column label="批次 requestId" prop="requestId" min-width="240" show-overflow-tooltip />
          <el-table-column label="状态" prop="status" align="center" width="130">
            <template slot-scope="scope">
              <el-tag :type="statusTagType(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="未终结" prop="open" align="center" width="90">
            <template slot-scope="scope">
              <el-tag :type="scope.row.open ? 'warning' : 'info'" size="mini">{{ scope.row.open ? '是' : '否' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="开始时间" align="center" width="160">
            <template slot-scope="scope">{{ fmtTime(scope.row.startedAt) }}</template>
          </el-table-column>
          <el-table-column label="完成时间" align="center" width="160">
            <template slot-scope="scope">{{ fmtTime(scope.row.completedAt) }}</template>
          </el-table-column>
        </el-table>
      </template>
      <div v-if="resolution.selected" style="margin-top: 10px; text-align: right;">
        <el-button type="primary" size="mini" icon="el-icon-search" @click="jumpToBatchDiagnosis">
          定位到该批次并诊断
        </el-button>
      </div>
      <div v-else-if="resolution.resolution === 'MULTIPLE'" style="margin-top: 10px; color: #E6A23C; font-size: 12px;">
        命中多个候选批次，未自动择一。请根据候选列表人工确认目标批次 requestId 后在上方直接查询。
      </div>
      <div v-else style="margin-top: 10px; color: #67C23A; font-size: 12px;">
        该设备 + 业务域当前无可用开通批次。
      </div>
    </el-card>

    <el-alert
      title="本功能用于解除业务密钥开通批次的状态阻断（RECONCILE_REQUIRED / FAILED → PREPARING），以便设备用新 requestId 重新发起开通。不重派生密钥、不重包裹、不生成新版本，也不修改/撤销车辆证书。证书申请 requestId 与开通批次 requestId 是两套独立标识，诊断/清理仅接受真实批次 requestId（kp-*）。"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 12px;"
    />

    <!-- 批次治理视图 + 诊断证据 -->
    <div v-if="batch" v-loading="loading" class="diagnosis-body">
      <el-descriptions title="批次治理视图" :column="2" border size="small">
        <el-descriptions-item label="requestId" :span="2">{{ batch.requestId }}</el-descriptions-item>
        <el-descriptions-item label="设备SN">{{ batch.deviceSn }}</el-descriptions-item>
        <el-descriptions-item label="业务域">{{ batch.businessDomain }}</el-descriptions-item>
        <el-descriptions-item label="批次状态">
          <el-tag :type="statusTagType(batch.status)" size="mini">{{ statusLabel(batch.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="批次修改时间">{{ fmtTime(batch.modifyTime) }}</el-descriptions-item>
        <el-descriptions-item label="阻塞层级">
          <el-tag :type="blockingTagType(batch.blockingLevel)" size="mini">{{ blockingLabel(batch.blockingLevel) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="是否可清阻断">
          <el-tag :type="batch.blockingLevel === 'BATCH' && isClearableState(batch.status) ? 'success' : 'info'" size="mini">
            {{ batch.blockingLevel === 'BATCH' && isClearableState(batch.status) ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="阻塞原因" :span="2">{{ batch.blockingReason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="失败原因" :span="2">{{ batch.failReason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="KL1 标识">{{ batch.lifecycleProfile || '存量未迁移（NULL）' }}</el-descriptions-item>
        <el-descriptions-item label="终态治理">{{ batch.terminalReason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="KL1 F（首次持久化）">{{ fmtTime(batch.firstIssuedAt) }}</el-descriptions-item>
        <el-descriptions-item label="KL1 B（ACK 截止）">{{ fmtTime(batch.ackDeadlineAt) }}</el-descriptions-item>
        <el-descriptions-item label="当前租约序号">{{ batch.leaseSeq === null || batch.leaseSeq === undefined ? '-' : batch.leaseSeq }}</el-descriptions-item>
        <el-descriptions-item label="最近租约过期">{{ batch.lease ? fmtTime(batch.lease.expireAt) : '-' }}</el-descriptions-item>
      </el-descriptions>

      <template v-if="batch.items && batch.items.length">
        <div style="margin: 14px 0 6px; font-weight: bold;">用途明细与目录状态</div>
        <el-table :data="batch.items" size="mini" border>
          <el-table-column label="用途" prop="purpose" width="140" />
          <el-table-column label="业务版本" prop="businessKeyVersion" align="center" width="100" />
          <el-table-column label="设备确认" prop="deviceResult" align="center" width="110">
            <template slot-scope="scope">
              <el-tag :type="deviceResultTagType(scope.row.deviceResult)" size="mini">{{ scope.row.deviceResult }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="确认时间" align="center" width="160">
            <template slot-scope="scope">{{ fmtTime(scope.row.confirmedAt) }}</template>
          </el-table-column>
          <el-table-column label="目录行状态" prop="directoryKeyState" align="center" width="150">
            <template slot-scope="scope">
              <el-tag :type="directoryStateTagType(scope.row.directoryKeyState)" size="mini">
                {{ scope.row.directoryKeyState || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="目录版本" prop="directoryBusinessKeyVersion" align="center" width="100" />
          <el-table-column label="信封格式" prop="envelopeFormat" min-width="170" show-overflow-tooltip />
        </el-table>
      </template>

      <template v-if="diagnosis && diagnosis.evidence && diagnosis.evidence.length">
        <div style="margin: 14px 0 6px; font-weight: bold;">诊断证据（只读，非敏感）</div>
        <ul class="evidence-list">
          <li v-for="(item, idx) in diagnosis.evidence" :key="idx">{{ item }}</li>
        </ul>
      </template>

      <div v-if="clearable" style="margin-top: 18px; text-align: center;">
        <el-button
          v-hasPermi="['viam:businessKey:clearBlocking']"
          type="danger"
          size="medium"
          icon="el-icon-warning-outline"
          @click="openClearDialog"
        >清除批次阻断，允许重新发起开通
        </el-button>
      </div>
    </div>

    <!-- 清理结果 -->
    <el-card v-if="result" shadow="never" style="margin-top: 16px; border-left: 4px solid #67C23A;">
      <div slot="header">
        <span>清阻断结果（requestId：{{ result.requestId }}）</span>
        <el-button type="text" style="float: right; padding: 0;" @click="result = null">收起</el-button>
      </div>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="批次状态流转">{{ result.beforeStatus }} → {{ result.afterStatus }}</el-descriptions-item>
        <el-descriptions-item label="操作结果">
          <el-tag :type="result.result === 'SUCCESS' ? 'success' : 'info'" size="mini">
            {{ result.result === 'SUCCESS' ? '已变更' : '幂等返回（重复提交）' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="维护请求ID（幂等键）" :span="2">{{ result.operationId }}</el-descriptions-item>
        <el-descriptions-item label="操作时间" :span="2">{{ fmtTime(result.occurredAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 清阻断确认对话框（二次确认） -->
    <el-dialog title="清除批次阻断，允许重新发起开通" :visible.sync="openClear" width="620px" append-to-body>
      <template v-if="batch">
        <el-alert
          title="该操作仅解除批次状态阻断（RECONCILE_REQUIRED / FAILED → PREPARING），不重派生密钥、不重包裹、不生成新版本，也不会删除批次明细与历史证据。清理后请由车端使用新的 requestId 重新发起开通。服务端会重做全部门禁（期望状态/期望修改时间不一致即拒绝）。"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 14px;"
        />
        <el-descriptions :column="2" border size="small" style="margin-bottom: 14px;">
          <el-descriptions-item label="requestId" :span="2">{{ batch.requestId }}</el-descriptions-item>
          <el-descriptions-item label="设备SN">{{ batch.deviceSn }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="statusTagType(batch.status)" size="mini">{{ statusLabel(batch.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="期望修改时间（诊断锚点）" :span="2">{{ fmtTime(batch.modifyTime) }}</el-descriptions-item>
        </el-descriptions>
        <el-form ref="clearForm" :model="clearForm" :rules="clearRules" label-width="130px">
          <el-form-item label="原因码" prop="reasonCode">
            <el-select v-model="clearForm.reasonCode" placeholder="请选择原因码" style="width: 100%">
              <el-option
                v-for="item in reasonCodeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="原因说明" prop="reason">
            <el-input v-model="clearForm.reason" type="textarea" :rows="2" placeholder="请填写清理原因（进入审计，限 128 字）" maxlength="128" show-word-limit />
          </el-form-item>
          <el-form-item label="工单号" prop="ticketNo">
            <el-input v-model="clearForm.ticketNo" placeholder="请填写关联工单号" />
          </el-form-item>
          <el-form-item label="二次确认" prop="confirmed">
            <el-checkbox v-model="clearForm.confirmed">我已确认该批次无成功事实（ACK/ACTIVE/成功事件），可安全解除阻断</el-checkbox>
          </el-form-item>
        </el-form>
      </template>
      <div slot="footer" class="dialog-footer">
        <el-button type="danger" :loading="submitting" @click="submitClear">确认清阻断</el-button>
        <el-button @click="openClear = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  queryProvisioning,
  getBlockingDiagnosis,
  clearBlocking,
  resolveByCertificateRequest
} from '@/api/viam/businessKey'

/** 可清阻断的批次状态（与后端门禁一致） */
const CLEARABLE_STATES = ['RECONCILE_REQUIRED', 'FAILED']

export default {
  name: 'BlockingGovernance',
  props: {
    // 开通批次 requestId（kp-*，来自告警深链或手动输入），非空时自动查询诊断
    requestId: {
      type: String,
      default: ''
    },
    // 证书申请 requestId（MPT-CERT-*，来自车辆证书入口），非空时先寻址再定位批次
    certificateRequestId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      // 查询输入
      queryRequestId: '',
      certRequestId: '',
      loading: false,
      resolving: false,
      includeTerminal: false,
      // 证书维度寻址结果
      resolution: null,
      // 批次治理视图（含 modifyTime/rowVersion 锚点）
      batch: null,
      // 阻塞诊断（证据与可清理性）
      diagnosis: null,
      // 清阻断结果
      result: null,
      // 清阻断对话框
      openClear: false,
      submitting: false,
      clearForm: {},
      clearRules: {
        reasonCode: [{ required: true, message: '请选择原因码', trigger: 'change' }],
        reason: [{ required: true, message: '请填写清理原因', trigger: 'blur' }],
        ticketNo: [{ required: true, message: '请填写关联工单号', trigger: 'blur' }],
        confirmed: [{
          validator: (rule, value, callback) => {
            if (!value) {
              callback(new Error('请勾选二次确认'))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }]
      },
      // 批次状态选项（BatchState）
      stateOptions: [
        { value: 'PREPARING', label: '开通准备中', type: 'warning' },
        { value: 'WAIT_DEVICE_ACK', label: '等待设备导入确认', type: 'warning' },
        { value: 'COMPLETED', label: '已完成', type: 'success' },
        { value: 'FAILED', label: '已失败', type: 'danger' },
        { value: 'RECONCILE_REQUIRED', label: '待对账', type: 'warning' },
        { value: 'EXPIRED', label: '已过期', type: 'info' }
      ],
      // 原因码选项（受治理枚举，与后端审计一致）
      reasonCodeOptions: [
        { value: 'PROVIDER_UNKNOWN', label: 'Provider 调用结果未知，需人工复核后解除' },
        { value: 'ACK_TIMEOUT', label: '设备导入 ACK 超时未达' },
        { value: 'QUARANTINE_MIGRATION', label: '迁移隔离批次人工复核' },
        { value: 'MANUAL_OPERATION', label: '人工事故恢复（已确认无副作用）' }
      ]
    }
  },
  computed: {
    /** 是否允许清阻断（只读提示；服务端仍会重做门禁） */
    clearable() {
      if (!this.batch) return false
      if (this.batch.blockingLevel !== 'BATCH') return false
      return this.isClearableState(this.batch.status)
    }
  },
  created() {
    if (this.certificateRequestId) {
      this.certRequestId = this.certificateRequestId
      this.handleResolve()
    } else if (this.requestId) {
      this.queryRequestId = this.requestId
      this.handleQuery()
    }
  },
  methods: {
    /**
     * 时间展示：后端返回 ISO-8601（UTC，带 Z），先转 Date 再格式化。
     * 直接字符串交给 parseTime 会残留 Z 后缀导致部分浏览器解析失败。
     */
    fmtTime(value, pattern) {
      if (!value) return ''
      const date = value instanceof Date ? value : new Date(value)
      if (isNaN(date.getTime())) return ''
      return this.parseTime(date, pattern)
    },
    /** 证书维度寻址：证书申请 requestId → 真实开通批次 requestId */
    handleResolve() {
      const certRequestId = (this.certRequestId || '').trim()
      if (!certRequestId) {
        this.$modal.msgWarning('请输入证书申请 requestId')
        return
      }
      this.resolving = true
      resolveByCertificateRequest(certRequestId, 'V2C_COMM', this.includeTerminal).then(response => {
        const data = response.data || {}
        this.resolution = data
        if (data.selected) {
          // 命中唯一批次：自动定位到真实批次并诊断（两套 ID 不得混用）
          this.queryRequestId = data.selected
          this.handleQuery()
        } else if (data.resolution === 'MULTIPLE') {
          this.$modal.msgWarning('命中多个候选批次，未自动择一，请从候选列表确认目标批次')
        } else {
          this.$modal.msgInfo('该设备 + 业务域当前无可用开通批次')
        }
      }).finally(() => {
        this.resolving = false
      })
    },
    /** 定位到寻址命中的批次并诊断 */
    jumpToBatchDiagnosis() {
      if (this.resolution && this.resolution.selected) {
        this.queryRequestId = this.resolution.selected
        this.handleQuery()
      }
    },
    /** 查询批次治理视图 + 阻塞诊断 */
    handleQuery() {
      const requestId = (this.queryRequestId || '').trim()
      if (!requestId) {
        this.$modal.msgWarning('请输入业务密钥开通批次 requestId（kp-*）')
        return
      }
      this.loading = true
      this.result = null
      queryProvisioning(requestId).then(response => {
        this.batch = response.data || null
        // 诊断仅提供证据与可清理性判断；失败不阻断批次视图展示
        return getBlockingDiagnosis(requestId).then(res => {
          this.diagnosis = res.data || null
        }).catch(() => {
          this.diagnosis = null
        })
      }).finally(() => {
        this.loading = false
      })
    },
    /** 重置 */
    resetQuery() {
      this.queryRequestId = ''
      this.certRequestId = ''
      this.batch = null
      this.diagnosis = null
      this.result = null
      this.resolution = null
      this.includeTerminal = false
    },
    /** 打开清阻断确认对话框 */
    openClearDialog() {
      this.clearForm = {
        reasonCode: this.batch && this.batch.status === 'FAILED' ? 'MANUAL_OPERATION' : 'PROVIDER_UNKNOWN',
        reason: undefined,
        ticketNo: undefined,
        confirmed: false
      }
      this.openClear = true
      this.$nextTick(() => {
        this.resetForm('clearForm')
      })
    },
    /** 提交清阻断 */
    submitClear() {
      this.$refs['clearForm'].validate(valid => {
        if (!valid) return
        if (!this.batch) return
        this.submitting = true
        const data = {
          maintenanceRequestId: this.genMaintenanceRequestId(),
          expectedState: this.batch.status,
          // 原样回传查询时的批次修改时间，防止基于过期视图执行（服务端返回 702222）
          expectedModifyTime: this.batch.modifyTime,
          reasonCode: this.clearForm.reasonCode,
          reason: this.clearForm.reason,
          ticketNo: this.clearForm.ticketNo
        }
        clearBlocking(this.queryRequestId.trim(), data).then(response => {
          const res = response.data || {}
          this.openClear = false
          this.result = res
          this.$modal.msgSuccess(res.result === 'IDEMPOTENT_HIT'
            ? '该维护请求已执行过，返回既有结果'
            : '批次阻断已清除，可用新 requestId 重新发起开通')
          // 清理后刷新视图，确认状态已推进
          this.handleQuery()
        }).finally(() => {
          this.submitting = false
        })
      })
    },
    /** 生成维护操作审计关联号（幂等键） */
    genMaintenanceRequestId() {
      const d = new Date()
      const pad = n => String(n).padStart(2, '0')
      const ts = '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
        pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds())
      const rand = Math.random().toString(36).slice(2, 8)
      return 'mpt-' + ts + '-' + rand
    },
    /** 批次状态文案 */
    statusLabel(status) {
      if (!status) return ''
      const item = this.stateOptions.find(o => o.value === status)
      return item ? item.label : status
    },
    /** 批次状态标签类型 */
    statusTagType(status) {
      const item = this.stateOptions.find(o => o.value === status)
      return item ? item.type : 'info'
    },
    /** 是否可清阻断（与后端门禁一致） */
    isClearableState(status) {
      return CLEARABLE_STATES.indexOf(status) >= 0
    },
    /** 阻塞层级文案 */
    blockingLabel(level) {
      const map = {
        BATCH: '批次级阻塞',
        LOCAL_DIRECTORY: '目录行级阻塞',
        NONE: '无阻塞'
      }
      return map[level] || (level || '-')
    },
    /** 阻塞层级标签类型 */
    blockingTagType(level) {
      if (level === 'BATCH') return 'danger'
      if (level === 'LOCAL_DIRECTORY') return 'warning'
      return 'success'
    },
    /** 寻址结果文案 */
    resolutionLabel(resolution) {
      const map = {
        UNIQUE: '唯一命中批次',
        MULTIPLE: '多候选，需人工确认',
        NONE: '无可用批次'
      }
      return map[resolution] || (resolution || '-')
    },
    /** 寻址结果标签类型 */
    resolutionTagType(resolution) {
      if (resolution === 'UNIQUE') return 'success'
      if (resolution === 'MULTIPLE') return 'warning'
      return 'info'
    },
    /** 设备确认结果标签类型 */
    deviceResultTagType(result) {
      if (result === 'SUCCEEDED') return 'success'
      if (result === 'FAILED') return 'danger'
      if (result === 'UNKNOWN') return 'warning'
      return 'info'
    },
    /** 目录行状态标签类型 */
    directoryStateTagType(state) {
      if (!state) return 'info'
      if (state === 'ACTIVE') return 'success'
      if (state === 'RECONCILE_REQUIRED' || state === 'PENDING_RECOVERY') return 'warning'
      if (state === 'FAILED' || state === 'REVOKED') return 'danger'
      return 'info'
    }
  }
}
</script>

<style scoped>
.query-section {
  margin-bottom: 8px;
}
.query-section:last-child {
  margin-bottom: 0;
}
.section-label {
  display: inline-block;
  width: 190px;
  color: #909399;
  font-size: 12px;
}
.diagnosis-body {
  margin-top: 4px;
}
.evidence-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: #606266;
  line-height: 1.9;
}
</style>
