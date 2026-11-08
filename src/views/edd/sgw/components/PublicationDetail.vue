<template>
  <el-dialog
    title="发布记录详情"
    :visible="visible"
    width="900px"
    append-to-body
    @close="close"
  >
    <div v-loading="loading">
      <el-descriptions v-if="publication" :column="3" border size="small">
        <el-descriptions-item label="发布ID">{{ publication.publicationId }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ typeLabel(publication.type) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(publication.status)" size="mini">
            {{ statusLabel(publication.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="目标版本">{{ publication.targetVersionNo }}</el-descriptions-item>
        <el-descriptions-item label="来源版本">{{ publication.sourceVersionNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作者">{{ publication.actor || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(publication.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ parseTime(publication.completedAt) }}</el-descriptions-item>
        <el-descriptions-item label="说明">{{ publication.comment || '-' }}</el-descriptions-item>
        <el-descriptions-item label="失败信息" :span="3">
          <span class="sgw-error-text">{{ publication.errorMessage || '-' }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <el-table :data="instances" size="mini" style="margin-top: 12px">
        <el-table-column label="实例" prop="instanceId" min-width="160" />
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="instanceTagType(scope.row.status)" size="mini">
              {{ instanceStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目标版本" prop="targetVersionNo" width="100" align="center" />
        <el-table-column label="生效版本" prop="activeVersionNo" width="100" align="center" />
        <el-table-column label="上报时间" width="170" align="center">
          <template slot-scope="scope">{{ parseTime(scope.row.reportTime) }}</template>
        </el-table-column>
        <el-table-column label="失败信息" prop="errorMessage" :show-overflow-tooltip="true" />
      </el-table>
      <el-empty v-if="!loading && !publication" description="暂无发布记录" :image-size="80" />
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button
        v-if="retryable"
        v-hasPermi="['edd:sgw:publication:retry']"
        type="warning"
        size="mini"
        icon="el-icon-refresh-right"
        @click="handleRetry"
      >重试发布</el-button>
      <el-button size="mini" @click="close">关 闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getPublication, retryPublication } from '@/api/edd/sgw/publication'
import {
  INSTANCE_STATUS,
  PUBLICATION_TYPES,
  isActiveStatus,
  isRetryableStatus,
  publicationStatusLabel,
  statusTagType
} from '@/views/edd/sgw/sgw-options'

export default {
  name: 'SgwPublicationDetail',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    publicationId: {
      type: String,
      default: null
    },
    poll: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      loading: false,
      publication: null,
      timer: null
    }
  },
  computed: {
    instances() {
      return this.publication && Array.isArray(this.publication.instances) ? this.publication.instances : []
    },
    retryable() {
      return this.publication && isRetryableStatus(this.publication.status)
    }
  },
  watch: {
    visible(value) {
      if (value) {
        this.load()
      } else {
        this.stopPolling()
      }
    },
    publicationId() {
      if (this.visible) {
        this.load()
      }
    }
  },
  beforeDestroy() {
    this.stopPolling()
  },
  methods: {
    load() {
      if (!this.publicationId) {
        this.publication = null
        return
      }
      this.stopPolling()
      this.loading = true
      getPublication(this.publicationId).then(response => {
        this.publication = response.data
        this.loading = false
        this.schedulePolling()
      }).catch(() => {
        this.loading = false
      })
    },
    schedulePolling() {
      if (!this.poll || !this.publication || !isActiveStatus(this.publication.status)) {
        return
      }
      this.timer = setTimeout(() => {
        this.load()
      }, 1500)
    },
    stopPolling() {
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
    },
    handleRetry() {
      this.$modal.confirm('是否确认重试该发布？将创建新的发布尝试，不会改变目标版本内容。').then(() => {
        return retryPublication(this.publication.publicationId)
      }).then(response => {
        this.$modal.msgSuccess('已创建重试发布')
        this.$emit('success', response.data)
        this.publicationId !== response.data.publicationId && this.loadById(response.data.publicationId)
      }).catch(() => {})
    },
    loadById(publicationId) {
      this.stopPolling()
      this.loading = true
      getPublication(publicationId).then(response => {
        this.publication = response.data
        this.loading = false
        this.schedulePolling()
      }).catch(() => {
        this.loading = false
      })
    },
    close() {
      this.stopPolling()
      this.$emit('update:visible', false)
    },
    statusLabel(status) {
      return publicationStatusLabel(status)
    },
    instanceStatusLabel(status) {
      return INSTANCE_STATUS[status] || status
    },
    instanceTagType(status) {
      return status === 'SUCCEEDED' ? 'success' : (status === 'FAILED' || status === 'TIMEOUT' ? 'danger' : 'primary')
    },
    typeLabel(type) {
      return PUBLICATION_TYPES[type] || type
    },
    statusTagType(status) {
      return statusTagType(status)
    }
  }
}
</script>

<style scoped>
.sgw-error-text {
  color: #F56C6C;
  word-break: break-all;
}
</style>
