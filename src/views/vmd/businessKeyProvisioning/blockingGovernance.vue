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
              placeholder="车辆证书申请 requestId（MPT-CERT-*）"
              clearable
              style="width: 300px"
              @keyup.enter.native="handleResolve"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              v-hasPermi="['vmd:security:businessKey:provisioning:query']"
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
              style="width: 300px"
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              v-hasPermi="['vmd:security:businessKey:provisioning:query']"
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
          <el-tag :type="resolution.resolution === 'OPEN_BATCH_FOUND' ? 'success' : 'info'" size="mini">
            {{ resolution.resolution === 'OPEN_BATCH_FOUND' ? '命中未终结开通批次' : '无未终结开通批次' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template v-if="resolution.openBatch">
        <div style="margin: 12px 0 6px; font-weight: bold;">命中批次</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="真实批次 requestId" :span="2">{{ resolution.openBatch.provisioningRequestId }}</el-descriptions-item>
          <el-descriptions-item label="批次状态">
            <el-tag :type="statusTagType(resolution.openBatch.state)" size="mini">{{ statusLabel(resolution.openBatch.state) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="证书已升级">
            <el-tag :type="resolution.openBatch.certificateChanged ? 'warning' : 'info'" size="mini">
              {{ resolution.openBatch.certificateChanged ? '是（旧摘要与新证书冲突）' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="可清理候选">
            <el-tag :type="resolution.openBatch.clearCandidate ? 'success' : 'info'" size="mini">
              {{ resolution.openBatch.clearCandidate ? '是' : '否（WAIT_DEVICE_ACK 由 ACK 超时任务治理）' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="批次修改时间">{{ parseTime(resolution.openBatch.modifyTime) }}</el-descriptions-item>
        </el-descriptions>
      </template>
      <template v-if="resolution.terminalHistory && resolution.terminalHistory.length">
        <div style="margin: 12px 0 6px; font-weight: bold;">历史终结批次（仅供审计，不进入清理）</div>
        <el-table :data="resolution.terminalHistory" size="mini" border>
          <el-table-column label="批次 requestId" prop="provisioningRequestId" min-width="220" show-overflow-tooltip />
          <el-table-column label="状态" prop="state" align="center" width="110">
            <template slot-scope="scope">
              <el-tag :type="statusTagType(scope.row.state)" size="mini">{{ statusLabel(scope.row.state) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="证书已升级" prop="certificateChanged" align="center" width="110">
            <template slot-scope="scope">
              <el-tag :type="scope.row.certificateChanged ? 'warning' : 'info'" size="mini">{{ scope.row.certificateChanged ? '是' : '否' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="批次修改时间" align="center" width="150">
            <template slot-scope="scope">{{ parseTime(scope.row.modifyTime) }}</template>
          </el-table-column>
        </el-table>
      </template>
      <div v-if="resolution.openBatch && resolution.openBatch.clearCandidate" style="margin-top: 10px; text-align: right;">
        <el-button type="primary" size="mini" icon="el-icon-search" @click="jumpToBatchDiagnosis">定位到该批次并诊断</el-button>
      </div>
      <div v-else-if="resolution.openBatch" style="margin-top: 10px; color: #E6A23C; font-size: 12px;">
        该批次非清理候选（{{ statusLabel(resolution.openBatch.state) }}），无需执行"清理阻塞"；WAIT_DEVICE_ACK 由 ACK 超时任务治理。
      </div>
      <div v-else style="margin-top: 10px; color: #67C23A; font-size: 12px;">
        该设备 + 业务域当前无未终结开通批次，无需清理阻塞。
      </div>
    </el-card>

    <el-alert
      title="本功能仅用于解除旧业务密钥开通批次对新证书流程的占用（清理批次 FAILED + 关联 PENDING 目录），不会修改、删除或撤销车辆证书，也不会自动签发证书。证书申请 requestId 与开通批次 requestId 是两套独立标识，诊断/清理仅接受真实批次 requestId（kp-*）。"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 12px;"
    />

    <!-- 诊断结果 -->
    <div v-if="diagnosis" v-loading="loading" class="diagnosis-body">
      <el-descriptions title="阻塞诊断" :column="2" border size="small">
        <el-descriptions-item label="requestId" :span="2">{{ diagnosis.requestId }}</el-descriptions-item>
        <el-descriptions-item label="设备SN">{{ diagnosis.deviceSn }}</el-descriptions-item>
        <el-descriptions-item label="业务域">{{ diagnosis.businessDomain }}</el-descriptions-item>
        <el-descriptions-item label="批次状态">
          <el-tag :type="statusTagType(diagnosis.status)" size="mini">{{ statusLabel(diagnosis.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="批次最近修改时间">{{ parseTime(diagnosis.modifyTime) }}</el-descriptions-item>
        <el-descriptions-item label="滞留时长">
          <span v-if="diagnosis.staleDurationSeconds !== null && diagnosis.staleDurationSeconds !== undefined">
            {{ formatDuration(diagnosis.staleDurationSeconds) }}
          </span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="证书摘要对比">
          <el-tag :type="diagnosis.certificateChanged ? 'warning' : 'info'" size="mini">
            {{ diagnosis.certificateChanged ? '证书已升级（与当前ACTIVE证书不一致）' : '证书未变化' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="原失败原因" :span="2">{{ diagnosis.failReason || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div style="margin: 14px 0 6px; font-weight: bold;">operation 汇总</div>
      <el-descriptions :column="4" border size="small">
        <el-descriptions-item label="未开始">{{ opSummary.notStarted }}</el-descriptions-item>
        <el-descriptions-item label="确定失败">{{ opSummary.confirmedFailed }}</el-descriptions-item>
        <el-descriptions-item label="成功">
          <span :class="opSummary.succeeded > 0 ? 'text-danger' : ''">{{ opSummary.succeeded }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="处理中/未知">
          <span :class="opSummary.inProgressOrUnknown > 0 ? 'text-warning' : ''">{{ opSummary.inProgressOrUnknown }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <div style="margin: 14px 0 6px; font-weight: bold;">唯一约束与处置建议</div>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="关联 PENDING 目录数">{{ diagnosis.pendingDirectoryCount }}</el-descriptions-item>
        <el-descriptions-item label="占用唯一约束">
          <el-tag :type="diagnosis.uniqueConstraintOccupied ? 'warning' : 'success'" size="mini">
            {{ diagnosis.uniqueConstraintOccupied ? '是（阻塞新批次）' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处置建议" :span="2">
          <el-tag :type="suggestedActionTagType(diagnosis.suggestedAction)" size="mini">
            {{ suggestedActionLabel(diagnosis.suggestedAction) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="diagnosis.blockingReasons && diagnosis.blockingReasons.length" label="阻断原因" :span="2">
          <ul style="margin: 0; padding-left: 16px;">
            <li v-for="(reason, idx) in diagnosis.blockingReasons" :key="idx" style="line-height: 1.8;">{{ reason }}</li>
          </ul>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 主操作按钮 -->
      <div v-if="diagnosis.clearable" style="margin-top: 18px; text-align: center;">
        <el-button
          v-hasPermi="['vmd:security:businessKey:provisioning:terminate']"
          type="danger"
          size="medium"
          icon="el-icon-warning-outline"
          @click="openClearDialog"
        >清理业务密钥阻塞，允许新证书重试
        </el-button>
      </div>
    </div>

    <!-- 清理结果 -->
    <el-card v-if="result" shadow="never" style="margin-top: 16px; border-left: 4px solid #67C23A;">
      <div slot="header">
        <span>清理结果（requestId：{{ result.requestId }}）</span>
        <el-button type="text" style="float: right; padding: 0;" @click="result = null">收起</el-button>
      </div>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="批次状态流转">{{ result.beforeState }} → {{ result.afterState }}</el-descriptions-item>
        <el-descriptions-item label="发生状态变更">
          <el-tag :type="result.changed ? 'success' : 'info'" size="mini">{{ result.changed ? '是' : '否（幂等返回）' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="阻塞已清理">
          <el-tag :type="result.blockingCleared ? 'success' : 'danger'" size="mini">{{ result.blockingCleared ? '是' : '否' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="允许新证书重试">
          <el-tag :type="result.reopenAllowed ? 'success' : 'danger'" size="mini">{{ result.reopenAllowed ? '是' : '否' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="连带失败化 PENDING 目录数">{{ result.failedPendingKeyCount }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ parseTime(result.operatedAt) }}</el-descriptions-item>
        <el-descriptions-item v-if="result.blockingReasons && result.blockingReasons.length" label="阻断原因" :span="2">
          <ul style="margin: 0; padding-left: 16px;">
            <li v-for="(reason, idx) in result.blockingReasons" :key="idx" style="line-height: 1.8;">{{ reason }}</li>
          </ul>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 一键清理确认对话框（二次确认） -->
    <el-dialog title="清理业务密钥阻塞，允许新证书重试" :visible.sync="openClear" width="620px" append-to-body>
      <el-alert
        title="该操作将把当前业务密钥开通批次置为 FAILED，并将关联 PENDING 目录一并失败化，以释放唯一约束；批次明细、摘要与历史证据保留，不会删除数据、不会伪造成功事件。清理后请使用新的 requestId + 当前 ACTIVE 新证书由车端重新发起开通。"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 14px;"
      />
      <el-descriptions :column="2" border size="small" style="margin-bottom: 14px;">
        <el-descriptions-item label="requestId" :span="2">{{ queryRequestId }}</el-descriptions-item>
        <el-descriptions-item label="设备SN">{{ diagnosis.deviceSn }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="statusTagType(diagnosis.status)" size="mini">{{ statusLabel(diagnosis.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="批次修改时间">{{ parseTime(diagnosis.modifyTime) }}</el-descriptions-item>
        <el-descriptions-item label="证书已升级">
          <el-tag :type="diagnosis.certificateChanged ? 'warning' : 'info'" size="mini">{{ diagnosis.certificateChanged ? '是' : '否' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关联 PENDING 目录数">{{ diagnosis.pendingDirectoryCount }}</el-descriptions-item>
      </el-descriptions>
      <el-form ref="clearForm" :model="clearForm" :rules="clearRules" label-width="130px">
        <el-form-item label="终止原因码" prop="reasonCode">
          <el-select v-model="clearForm.reasonCode" placeholder="请选择终止原因码" style="width: 100%">
            <el-option
              v-for="item in reasonCodeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="原因说明" prop="reason">
          <el-input v-model="clearForm.reason" type="textarea" :rows="2" placeholder="请填写清理原因（将进入审计，限制 200 字）" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="工单号" prop="ticketNo">
          <el-input v-model="clearForm.ticketNo" placeholder="请填写关联工单号" />
        </el-form-item>
        <el-form-item label="二次确认" prop="confirmed">
          <el-checkbox v-model="clearForm.confirmed">我已确认该批次无成功事实（ACK/ACTIVE/成功事件）且 operation 已确定无副作用，可安全清理</el-checkbox>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="danger" :loading="submitting" @click="submitClear">确认清理</el-button>
        <el-button @click="openClear = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getBlockingDiagnosis,
  clearBlocking,
  resolveByCertificateRequest
} from '@/api/vmd/businessKeyProvisioning'

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
      // 诊断结果
      diagnosis: null,
      // 清理结果
      result: null,
      // 清理对话框
      openClear: false,
      submitting: false,
      clearForm: {},
      clearRules: {
        reasonCode: [{ required: true, message: '请选择终止原因码', trigger: 'change' }],
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
      // 批次状态选项（BusinessKeyProvisioningState）
      stateOptions: [
        { value: 'PREPARING', label: '开通准备中', type: 'warning' },
        { value: 'WAIT_DEVICE_ACK', label: '等待设备导入确认', type: 'warning' },
        { value: 'COMPLETED', label: '已完成', type: 'success' },
        { value: 'FAILED', label: '已失败', type: 'danger' },
        { value: 'RECONCILE_REQUIRED', label: '待对账', type: 'warning' },
        { value: 'EXPIRED', label: '已过期', type: 'info' }
      ],
      // 终止原因码选项（TerminationReasonCode）
      reasonCodeOptions: [
        { value: 'CERTIFICATE_CHANGED_DIGEST_CONFLICT', label: '证书已升级，旧批次摘要与当前ACTIVE证书冲突' },
        { value: 'CERTIFICATE_PROFILE_REJECTED_STALE', label: '证书Profile确定性拒绝，旧批次不可继续' },
        { value: 'DEPENDENCY_BLOCKED_NO_SIDE_EFFECT', label: '依赖阻断且确认无成功副作用' },
        { value: 'PROVIDER_OPERATION_CONFIRMED_FAILED', label: 'Provider操作已确认失败' },
        { value: 'MANUAL_INCIDENT_RECOVERY', label: '人工事故恢复' }
      ],
      // 处置建议文案与标签类型
      suggestedActions: {
        CLEARABLE: { label: '可一键清理', type: 'danger' },
        RECONCILE_FIRST: { label: '需要先对账', type: 'warning' },
        WAIT_ACK_EXPIRY: { label: '等待ACK超时治理', type: 'warning' },
        NOT_CLEARABLE: { label: '不可清理', type: 'info' }
      }
    }
  },
  computed: {
    /** operation 汇总 */
    opSummary() {
      const s = (this.diagnosis && this.diagnosis.operationSummary) || {}
      return {
        notStarted: s.notStarted || 0,
        confirmedFailed: s.confirmedFailed || 0,
        succeeded: s.succeeded || 0,
        inProgressOrUnknown: s.inProgressOrUnknown || 0
      }
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
    /** 证书维度寻址：证书申请 requestId → 真实开通批次 requestId */
    handleResolve() {
      const certRequestId = (this.certRequestId || '').trim()
      if (!certRequestId) {
        this.$modal.msgWarning('请输入证书申请 requestId')
        return
      }
      this.resolving = true
      resolveByCertificateRequest(certRequestId, 'V2C_COMM', this.includeTerminal).then(response => {
        const data = response.data
        this.resolution = data
        if (data.resolution === 'OPEN_BATCH_FOUND' && data.openBatch) {
          // 自动定位到真实批次并诊断（两套 ID 不得混用：此处为 kp-* 批次号）
          this.queryRequestId = data.openBatch.provisioningRequestId
          this.handleQuery()
        } else {
          this.$modal.msgInfo('该设备 + 业务域当前无未终结开通批次，无需清理阻塞')
        }
      }).finally(() => {
        this.resolving = false
      })
    },
    /** 定位到寻址命中的批次并诊断 */
    jumpToBatchDiagnosis() {
      if (this.resolution && this.resolution.openBatch) {
        this.queryRequestId = this.resolution.openBatch.provisioningRequestId
        this.handleQuery()
      }
    },
    /** 查询阻塞诊断 */
    handleQuery() {
      const requestId = (this.queryRequestId || '').trim()
      if (!requestId) {
        this.$modal.msgWarning('请输入业务密钥开通批次 requestId（kp-*）')
        return
      }
      this.loading = true
      this.result = null
      getBlockingDiagnosis(requestId).then(response => {
        this.diagnosis = response.data
      }).finally(() => {
        this.loading = false
      })
    },
    /** 重置 */
    resetQuery() {
      this.queryRequestId = ''
      this.certRequestId = ''
      this.diagnosis = null
      this.result = null
      this.resolution = null
      this.includeTerminal = false
    },
    /** 打开清理确认对话框 */
    openClearDialog() {
      this.clearForm = {
        reasonCode: this.diagnosis.certificateChanged
          ? 'CERTIFICATE_CHANGED_DIGEST_CONFLICT'
          : undefined,
        reason: undefined,
        ticketNo: undefined,
        confirmed: false
      }
      this.openClear = true
      this.$nextTick(() => {
        this.resetForm('clearForm')
      })
    },
    /** 提交一键清理 */
    submitClear() {
      this.$refs['clearForm'].validate(valid => {
        if (!valid) return
        this.submitting = true
        const data = {
          maintenanceRequestId: this.genMaintenanceRequestId(),
          expectedState: this.diagnosis.status,
          // 原样回传诊断时的批次修改时间，防止基于过期诊断结果执行（STALE_VIEW）
          expectedModifyTime: this.diagnosis.modifyTime,
          reasonCode: this.clearForm.reasonCode,
          reason: this.clearForm.reason,
          ticketNo: this.clearForm.ticketNo
        }
        clearBlocking(this.queryRequestId.trim(), data).then(response => {
          const res = response.data || {}
          this.openClear = false
          this.result = res
          if (res.blockingCleared) {
            this.$modal.msgSuccess('阻塞已清理，可用新 requestId + 当前 ACTIVE 证书重新发起开通')
          }
          // 清理后刷新诊断，确认唯一约束已释放
          this.handleQuery()
        }).finally(() => {
          this.submitting = false
        })
      })
    },
    /** 生成维护操作审计关联号 */
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
    /** 处置建议文案 */
    suggestedActionLabel(action) {
      const item = this.suggestedActions[action]
      return item ? item.label : (action || '-')
    },
    /** 处置建议标签类型 */
    suggestedActionTagType(action) {
      const item = this.suggestedActions[action]
      return item ? item.type : 'info'
    },
    /** 秒数格式化为可读时长 */
    formatDuration(seconds) {
      if (seconds === null || seconds === undefined || isNaN(seconds)) return '-'
      const days = Math.floor(seconds / 86400)
      const hours = Math.floor((seconds % 86400) / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      let text = ''
      if (days > 0) text += days + ' 天 '
      if (hours > 0 || days > 0) text += hours + ' 小时 '
      if (mins > 0 || (days === 0 && hours === 0)) text += mins + ' 分钟'
      return text.trim() || '0 分钟'
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
  width: 170px;
  color: #909399;
  font-size: 12px;
}
.diagnosis-body {
  margin-top: 4px;
}
.text-danger {
  color: #F56C6C;
  font-weight: bold;
}
.text-warning {
  color: #E6A23C;
  font-weight: bold;
}
</style>
