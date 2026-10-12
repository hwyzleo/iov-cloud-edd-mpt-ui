<template>
  <div class="app-container" v-loading="loading">
    <el-page-header @back="goBack" content="TBOX 运营详情" />
    <el-divider />

    <div v-if="summary.sn">
      <!-- Overview -->
      <el-card shadow="never" class="box-card">
        <div slot="header" class="card-header">
          <span>概览</span>
          <div class="card-header-actions">
            <el-button
              v-if="linkKeys.vin"
              size="mini"
              type="primary"
              plain
              icon="el-icon-truck"
              @click="linkToVehicle"
              v-hasPermi="['tsp:tbox:query']"
            >查看车辆</el-button>
            <el-button
              size="mini"
              type="primary"
              plain
              icon="el-icon-goods"
              @click="linkToPart"
              v-hasPermi="['tsp:tbox:query']"
            >查看零件实例</el-button>
          </div>
        </div>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="TBOX SN">{{ summary.sn || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备状态">
            <el-tag :type="deviceStatusType(summary.deviceStatus)" size="mini">{{ deviceStatusLabel(summary.deviceStatus) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="零件编码">{{ summary.partCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="当前VIN">
            <span v-if="summary.vin">{{ summary.vin }}</span>
            <el-tag v-else-if="summary.bindingStatus === 'BINDING_CONFLICT'" type="danger" size="mini">绑定冲突</el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="绑定状态">
            <el-tag :type="bindingStatusType(summary.bindingStatus)" size="mini">{{ bindingStatusLabel(summary.bindingStatus) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最后登录时间">{{ parseTime(summary.lastLoginTime) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="异常标签" :span="3">
            <template v-if="summary.anomalyTags && summary.anomalyTags.length">
              <el-tag
                v-for="tag in summary.anomalyTags"
                :key="tag.type"
                :type="anomalyTagType(tag.type)"
                size="mini"
                style="margin-right: 4px"
              >{{ anomalyLabel(tag.type) }}</el-tag>
            </template>
            <span v-else>无</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Basic -->
      <el-card shadow="never" class="box-card">
        <div slot="header" class="card-header"><span>基础信息</span></div>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="硬件零件号">{{ detail.hardwareNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="软件零件号">{{ detail.softwareNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="配置字">{{ detail.configWord || '-' }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ summary.supplierCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="硬件版本">{{ summary.hardwareVersion || '-' }}</el-descriptions-item>
          <el-descriptions-item label="软件版本">{{ summary.softwareVersion || '-' }}</el-descriptions-item>
          <el-descriptions-item label="HSM UID">{{ summary.maskedHsmUid || '-' }}</el-descriptions-item>
          <el-descriptions-item label="IMEI">{{ summary.maskedImei || '-' }}</el-descriptions-item>
          <el-descriptions-item label="ICCID">
            <template v-if="summary.maskedIccids && summary.maskedIccids.length">
              <div v-for="(iccid, index) in summary.maskedIccids" :key="index">{{ iccid }}</div>
            </template>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Activation -->
      <el-card shadow="never" class="box-card">
        <div slot="header" class="card-header"><span>激活信息</span></div>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="首次登录时间">{{ parseTime(summary.firstLoginTime) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="最近登录时间">{{ parseTime(summary.lastLoginTime) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="激活时间">{{ parseTime(summary.activateTime) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="激活耗时">{{ formatDuration(summary.activationDurationSeconds) }}</el-descriptions-item>
          <el-descriptions-item label="离线时长">{{ formatDuration(summary.lastLoginAgeSeconds) }}</el-descriptions-item>
          <el-descriptions-item label="绑定版本">{{ summary.bindingVersion === null || summary.bindingVersion === undefined ? '-' : summary.bindingVersion }}</el-descriptions-item>
        </el-descriptions>
        <div class="sub-title">激活里程碑</div>
        <el-timeline v-if="activationMilestones.length">
          <el-timeline-item
            v-for="(item, index) in activationMilestones"
            :key="index"
            :type="milestoneType(item.milestone)"
            :timestamp="parseTime(item.occurredAt) || '-'"
            placement="top"
          >
            <div class="milestone-title">{{ milestoneLabel(item.milestone) }}</div>
            <div v-if="item.detail" class="milestone-detail">{{ item.detail }}</div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无可证实的激活里程碑" :image-size="80" />
      </el-card>

      <!-- Binding -->
      <el-card shadow="never" class="box-card">
        <div slot="header" class="card-header"><span>绑定信息</span></div>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="当前VIN">{{ summary.vin || '-' }}</el-descriptions-item>
          <el-descriptions-item label="车辆节点编码">{{ detail.vehicleNodeCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="绑定ID">{{ detail.bindingId === null || detail.bindingId === undefined ? '-' : detail.bindingId }}</el-descriptions-item>
          <el-descriptions-item label="绑定版本">{{ summary.bindingVersion === null || summary.bindingVersion === undefined ? '-' : summary.bindingVersion }}</el-descriptions-item>
          <el-descriptions-item label="绑定状态">
            <span>{{ detail.bindingState || (summary.bindingStatus === 'BINDING_CONFLICT' ? '绑定冲突' : '-') }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="绑定最后同步时间">{{ parseTime(detail.bindingUpdatedAt) || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Audit Timeline -->
      <el-card shadow="never" class="box-card">
        <div slot="header" class="card-header"><span>审计时间线</span></div>
        <el-alert
          v-if="timelinePartial"
          title="消费幂等记录不可用，以下为仅由设备字段可证实的部分时间线"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />
        <el-timeline v-if="timeline.length">
          <el-timeline-item
            v-for="(item, index) in timeline"
            :key="index"
            :type="milestoneType(item.milestone)"
            :timestamp="parseTime(item.occurredAt) || '-'"
            placement="top"
          >
            <div class="milestone-title">{{ milestoneLabel(item.milestone) }}</div>
            <div v-if="item.detail" class="milestone-detail">{{ item.detail }}</div>
            <div v-if="item.sourceRef" class="milestone-source">来源：{{ item.sourceRef }}</div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无可证实的时间线" :image-size="80" />
      </el-card>
    </div>

    <el-empty v-else-if="!loading" description="TBOX 不存在或无权访问" />
  </div>
</template>

<script>
import { getTbox, getTboxTimeline } from '@/api/iov/tsp/tbox'

export default {
  name: 'TboxDetail',
  data() {
    return {
      loading: true,
      timelineLoading: false,
      sn: undefined,
      detail: {},
      summary: {},
      linkKeys: {},
      timeline: [],
      timelinePartial: false
    }
  },
  computed: {
    activationMilestones() {
      return this.detail.activationMilestones || []
    }
  },
  created() {
    this.sn = this.$route.params.sn || this.$route.query.sn
    if (this.sn) {
      this.getDetail()
      this.getTimeline()
    } else {
      this.loading = false
    }
  },
  methods: {
    /** 查询 TBOX 详情 */
    getDetail() {
      this.loading = true
      getTbox(this.sn).then(response => {
        this.detail = response.data || {}
        this.summary = this.detail.summary || {}
        this.linkKeys = this.detail.linkKeys || {}
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    /** 查询 TBOX 时间线 */
    getTimeline() {
      this.timelineLoading = true
      getTboxTimeline(this.sn).then(response => {
        const data = response.data || {}
        this.timeline = data.milestones || []
        this.timelinePartial = !!data.partial
        this.timelineLoading = false
      }).catch(() => {
        this.timelineLoading = false
      })
    },
    goBack() {
      this.$router.back()
    },
    /** 跳转车辆信息页面（使用稳定标识 vin） */
    linkToVehicle() {
      if (!this.linkKeys.vin) return
      this.$router.push({ path: '/vmd/vehicleInfo', query: { vin: this.linkKeys.vin }})
    },
    /** 跳转零件实例页面（使用稳定标识 sn/partCode） */
    linkToPart() {
      const query = {}
      if (this.linkKeys.sn) query.sn = this.linkKeys.sn
      if (this.linkKeys.partCode) query.partCode = this.linkKeys.partCode
      this.$router.push({ path: '/vmd/partInfo', query })
    },
    /** 时长格式化 */
    formatDuration(seconds) {
      if (seconds === null || seconds === undefined) return '-'
      if (seconds < 0) return '-'
      if (seconds < 60) return seconds + ' 秒'
      const minutes = Math.floor(seconds / 60)
      if (minutes < 60) return minutes + ' 分钟'
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return hours + ' 小时 ' + (minutes % 60) + ' 分钟'
      const days = Math.floor(hours / 24)
      return days + ' 天 ' + (hours % 24) + ' 小时'
    },
    /** 设备状态文本 */
    deviceStatusLabel(code) {
      const map = { 1: '待激活', 5: '激活中', 2: '在役', 4: '冻结黑名单', 3: '报废' }
      return map[code] || (code === null || code === undefined ? '-' : '未知')
    },
    /** 设备状态标签类型 */
    deviceStatusType(code) {
      const map = { 1: 'info', 5: 'warning', 2: 'success', 4: 'danger', 3: 'info' }
      return map[code] || 'info'
    },
    /** 绑定状态文本 */
    bindingStatusLabel(status) {
      const map = { UNBOUND: '未绑定', BOUND: '已绑定', BINDING_CONFLICT: '绑定冲突' }
      return map[status] || status || '-'
    },
    /** 绑定状态标签类型 */
    bindingStatusType(status) {
      const map = { UNBOUND: 'info', BOUND: 'success', BINDING_CONFLICT: 'danger' }
      return map[status] || 'info'
    },
    /** 异常标签文本 */
    anomalyLabel(type) {
      const map = {
        BINDING_CONFLICT: '绑定冲突',
        FROZEN_OR_RETIRED: '冻结或退役',
        ACTIVATION_TIMEOUT: '激活超时',
        NEVER_ONLINE: '从未上线',
        LONG_OFFLINE: '长期未登录',
        UNBOUND: '未绑定'
      }
      return map[type] || type
    },
    /** 异常标签类型 */
    anomalyTagType(type) {
      const map = {
        BINDING_CONFLICT: 'danger',
        FROZEN_OR_RETIRED: 'danger',
        ACTIVATION_TIMEOUT: 'warning',
        NEVER_ONLINE: 'info',
        LONG_OFFLINE: 'warning',
        UNBOUND: 'info'
      }
      return map[type] || 'info'
    },
    /** 里程碑文本 */
    milestoneLabel(milestone) {
      const map = {
        IMPORTED: '设备导入',
        FIRST_LOGIN: '首次登录',
        ACTIVATING: '激活中',
        V2C_PROVISIONED: 'V2C密钥开通',
        ACTIVE: '已激活',
        LAST_LOGIN: '最近登录',
        BLOCKED: '已冻结',
        RETIRED: '已退役'
      }
      return map[milestone] || milestone
    },
    /** 里程碑颜色类型 */
    milestoneType(milestone) {
      const map = {
        IMPORTED: 'info',
        FIRST_LOGIN: 'primary',
        ACTIVATING: 'warning',
        V2C_PROVISIONED: 'warning',
        ACTIVE: 'success',
        LAST_LOGIN: 'primary',
        BLOCKED: 'danger',
        RETIRED: 'info'
      }
      return map[milestone] || 'info'
    }
  }
}
</script>

<style scoped>
.box-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.card-header-actions {
  font-weight: normal;
}

.sub-title {
  margin: 16px 0 12px;
  font-weight: bold;
}

.milestone-title {
  font-weight: bold;
}

.milestone-detail {
  color: #606266;
  font-size: 13px;
  margin-top: 2px;
}

.milestone-source {
  color: #909399;
  font-size: 12px;
  margin-top: 2px;
  word-break: break-all;
}
</style>
