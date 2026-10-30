<template>
  <el-dialog :title="title" :visible="dialogVisible" :before-close="handleClose" width="920px" append-to-body @closed="reset">
    <div v-loading="previewLoading">
      <!-- 预检信息 -->
      <el-alert
        title="重新导入（REIMPORT）将重新进入导入内核修复事实数据，仅按 FILL_MISSING 策略补缺、不改写已有正确字段；已处理批次无法通过普通解析处理接口重导（幂等跳过），必须走统一操作门面。"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 12px"
      />
      <template v-if="!result">
        <el-descriptions :column="3" border size="small" style="margin-bottom: 12px">
          <el-descriptions-item label="操作域">{{ domainLabel }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ batchNum }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">REIMPORT</el-descriptions-item>
          <el-descriptions-item label="候选数量">{{ preview.candidateCount }}</el-descriptions-item>
          <el-descriptions-item label="消息估算">{{ preview.messageEstimate }}</el-descriptions-item>
          <el-descriptions-item label="计划摘要" :span="2">
            <span class="plan-digest">{{ preview.planDigest }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <el-form label-width="120px">
          <el-form-item label="重导原因">
            <el-input v-model="reason" type="textarea" :rows="2" placeholder="可选，将进入审计"/>
          </el-form-item>
        </el-form>
      </template>

      <!-- 执行结果 -->
      <template v-if="result">
        <el-descriptions title="操作结果" :column="3" border size="small">
          <el-descriptions-item label="操作ID" :span="2">{{ result.operationId }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="operationStatusTagType(result.status)" size="mini">
              {{ operationStatusLabel(result.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="已变更">{{ counters.changed }}</el-descriptions-item>
          <el-descriptions-item label="未变更">{{ counters.unchanged }}</el-descriptions-item>
          <el-descriptions-item label="跳过">{{ counters.skipped }}</el-descriptions-item>
          <el-descriptions-item label="失败">
            <span :class="{ 'reimport-fail-count': counters.failed > 0 }">{{ counters.failed }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="关联补发ID" v-if="result.legacyReplayId" :span="3">
            {{ result.legacyReplayId }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="operationDetail" class="reimport-section-title">操作详情</div>
        <el-descriptions v-if="operationDetail" :column="3" border size="small" style="margin-top: 8px">
          <el-descriptions-item label="批次号">{{ operationDetail.batchNum }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ operationDetail.operatorName }}</el-descriptions-item>
          <el-descriptions-item label="来源">{{ operationDetail.operationSource }}</el-descriptions-item>
          <el-descriptions-item label="原因" :span="3">{{ operationDetail.reason }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ parseTime(operationDetail.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ parseTime(operationDetail.startedAt) }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ parseTime(operationDetail.finishedAt) }}</el-descriptions-item>
        </el-descriptions>

        <div class="reimport-section-title">逐项明细</div>
        <div v-loading="itemsLoading">
          <el-table :data="items" size="mini" border max-height="320">
            <el-table-column label="候选标识" prop="candidateKey" min-width="160" show-overflow-tooltip/>
            <el-table-column label="VIN" prop="vin" min-width="140" show-overflow-tooltip/>
            <el-table-column label="实体类型" prop="entityType" width="150"/>
            <el-table-column label="阶段" prop="phase" width="90" align="center"/>
            <el-table-column label="动作" prop="actionType" min-width="150" show-overflow-tooltip/>
            <el-table-column label="状态" align="center" width="120">
              <template slot-scope="scope">
                <el-tag :type="itemStatusTagType(scope.row.status)" size="mini">
                  {{ itemStatusLabel(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="尝试" prop="attemptCount" width="70" align="center"/>
            <el-table-column label="跳过/失败原因" min-width="180" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{ scope.row.skipReason || scope.row.errorMessage }}</span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="items.length === 0" description="暂无明细" :image-size="80"/>
        </div>
      </template>
    </div>

    <div slot="footer" class="dialog-footer">
      <template v-if="!result">
        <el-button
          type="primary"
          :loading="executing"
          :disabled="previewLoading"
          @click="confirmExecute"
        >执行重导
        </el-button>
        <el-button @click="handleClose">取 消</el-button>
      </template>
      <template v-else>
        <el-button icon="el-icon-refresh" @click="loadDetail">刷 新</el-button>
        <el-button
          v-if="retryable"
          type="primary"
          :loading="executing"
          @click="handleRetry"
          v-hasPermi="['vmd:importOperation:execute']"
        >重 试
        </el-button>
        <el-button @click="handleClose">关 闭</el-button>
      </template>
    </div>
  </el-dialog>
</template>

<script>
import {
  previewImportOperation,
  executeImportOperation,
  retryImportOperation,
  getImportOperation,
  listImportOperationItems
} from "@/api/vmd/importOperation";

// 主任务状态（与 ImportOperationAppService STATUS_* 对齐）
const OPERATION_STATUS_OPTIONS = [
  { value: 'PENDING', label: '待执行', tag: 'info' },
  { value: 'RUNNING', label: '执行中', tag: '' },
  { value: 'SUCCEEDED', label: '成功', tag: 'success' },
  { value: 'PARTIAL_FAILED', label: '部分失败', tag: 'warning' },
  { value: 'FAILED', label: '失败', tag: 'danger' },
  { value: 'RECOVERING', label: '恢复中', tag: 'warning' }
];

// 明细状态（与 ImportOperationItem status 对齐）
const ITEM_STATUS_OPTIONS = [
  { value: 'PENDING', label: '待执行', tag: 'info' },
  { value: 'RUNNING', label: '执行中', tag: '' },
  { value: 'QUEUED', label: '已入队', tag: 'warning' },
  { value: 'SUCCEEDED', label: '成功', tag: 'success' },
  { value: 'NOOP', label: '无操作', tag: 'info' },
  { value: 'SKIPPED', label: '已跳过', tag: 'info' },
  { value: 'FAILED_RETRYABLE', label: '可重试失败', tag: 'danger' },
  { value: 'FAILED_FINAL', label: '终态失败', tag: 'danger' }
];

export default {
  name: "ReimportDialog",
  props: {
    visible: { type: Boolean, default: false },
    // PART | VEHICLE
    domain: { type: String, default: 'PART' },
    importDataId: { type: Number, default: undefined },
    batchNum: { type: String, default: '' }
  },
  data() {
    return {
      dialogVisible: false,
      reason: undefined,
      previewLoading: false,
      executing: false,
      preview: {
        planDigest: undefined,
        candidateCount: 0,
        messageEstimate: 0
      },
      result: null,
      operationDetail: null,
      items: [],
      itemsLoading: false
    };
  },
  computed: {
    title() {
      return this.domain === 'VEHICLE' ? "车辆导入数据重导" : "零件导入数据重导";
    },
    domainLabel() {
      return this.domain === 'VEHICLE' ? 'VEHICLE（车辆）' : 'PART（零件）';
    },
    counters() {
      if (!this.result || !this.result.counters) {
        return { changed: 0, unchanged: 0, skipped: 0, failed: 0 };
      }
      try {
        return JSON.parse(this.result.counters);
      } catch (e) {
        return { changed: 0, unchanged: 0, skipped: 0, failed: 0 };
      }
    },
    retryable() {
      return this.result && ['PENDING', 'FAILED'].includes(this.result.status);
    }
  },
  watch: {
    visible(val) {
      this.dialogVisible = val;
      if (val) {
        this.reset();
        this.previewReimport();
      }
    }
  },
  methods: {
    /** 关闭（同步父级 visible） */
    handleClose() {
      this.dialogVisible = false;
      this.$emit('update:visible', false);
    },
    /** 预检 */
    previewReimport() {
      this.previewLoading = true;
      previewImportOperation({
        domain: this.domain,
        importDataId: this.importDataId,
        mode: 'REIMPORT',
        repairPolicy: 'FILL_MISSING'
      }).then(response => {
        this.preview = response.data || {};
      }).catch(() => {
        this.$modal.msgError("预检失败，无法从原导入记录识别候选");
        this.handleClose();
      }).finally(() => {
        this.previewLoading = false;
      });
    },
    /** 二次确认后执行 */
    confirmExecute() {
      this.$modal.confirm(
        '确认对该批次执行重新导入（REIMPORT）？将按 FILL_MISSING 策略重新进入导入内核修复事实数据。'
      ).then(() => {
        return this.executeReimport();
      }).catch(() => {
      });
    },
    executeReimport() {
      this.executing = true;
      return executeImportOperation({
        domain: this.domain,
        importDataId: this.importDataId,
        mode: 'REIMPORT',
        repairPolicy: 'FILL_MISSING',
        planDigest: this.preview.planDigest,
        reason: this.reason
      }).then(response => {
        this.result = response.data || {};
        if (this.result.status === 'FAILED' || this.result.status === 'PARTIAL_FAILED') {
          this.$modal.msgWarning("重导完成，存在失败项");
        } else {
          this.$modal.msgSuccess("重导成功");
        }
        this.loadDetail();
      }).finally(() => {
        this.executing = false;
      });
    },
    /** 重试 */
    handleRetry() {
      this.$modal.confirm('是否确认重试该操作？').then(() => {
        this.executing = true;
        return retryImportOperation(this.result.operationId).then(response => {
          this.result = response.data || {};
          this.loadDetail();
        });
      }).catch(() => {
      }).finally(() => {
        this.executing = false;
      });
    },
    /** 加载操作详情与明细 */
    loadDetail() {
      if (!this.result || !this.result.operationId) {
        return;
      }
      getImportOperation(this.result.operationId).then(response => {
        this.operationDetail = response.data || null;
      });
      this.itemsLoading = true;
      listImportOperationItems(this.result.operationId, { limit: 200 }).then(response => {
        this.items = response.data || [];
      }).finally(() => {
        this.itemsLoading = false;
      });
    },
    /** 重置 */
    reset() {
      this.reason = undefined;
      this.previewLoading = false;
      this.executing = false;
      this.preview = { planDigest: undefined, candidateCount: 0, messageEstimate: 0 };
      this.result = null;
      this.operationDetail = null;
      this.items = [];
      this.itemsLoading = false;
    },
    operationStatusLabel(status) {
      const item = OPERATION_STATUS_OPTIONS.find(option => option.value === status);
      return item ? item.label : status;
    },
    operationStatusTagType(status) {
      const item = OPERATION_STATUS_OPTIONS.find(option => option.value === status);
      return item ? item.tag : 'info';
    },
    itemStatusLabel(status) {
      const item = ITEM_STATUS_OPTIONS.find(option => option.value === status);
      return item ? item.label : status;
    },
    itemStatusTagType(status) {
      const item = ITEM_STATUS_OPTIONS.find(option => option.value === status);
      return item ? item.tag : 'info';
    }
  }
};
</script>

<style scoped>
.plan-digest {
  font-family: monospace;
  font-size: 12px;
  color: #909399;
  word-break: break-all;
}

.reimport-section-title {
  margin: 16px 0 8px;
  font-weight: bold;
}

.reimport-fail-count {
  color: #f56c6c;
  font-weight: bold;
}
</style>
