<template>
  <div class="app-container">
    <el-page-header @back="goBack" :content="'车辆升级详情：' + vin"/>

    <el-tabs v-model="activeTab" style="margin-top: 16px">
      <!-- ==================== 升级关联 ==================== -->
      <el-tab-pane label="升级关联" name="relation">
        <el-card shadow="never">
          <div slot="header">
            <span class="card-title">关联活动</span>
            <span class="card-sub">（以已生成的 VehicleTask 为依据，同一活动只出现一次）</span>
          </div>
          <div v-if="activityError" class="load-error">
            <span>{{ activityError }}</span>
            <el-button type="text" icon="el-icon-refresh" @click="getActivities">重试</el-button>
          </div>
          <el-table v-else v-loading="activityLoading" :data="activities" size="small" empty-text="暂无关联活动">
            <el-table-column label="活动ID" prop="activityId" width="90" align="center"/>
            <el-table-column label="活动名称" prop="activityName" min-width="200" show-overflow-tooltip/>
            <el-table-column label="活动状态" width="110" align="center">
              <template slot-scope="scope">
                <el-tag size="mini" :type="activityStateType(scope.row.activityState)">
                  {{ activityStateLabel(scope.row.activityState) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="任务数" prop="vehicleTaskCount" width="90" align="center"/>
            <el-table-column label="最近任务时间" width="170" align="center">
              <template slot-scope="scope">{{ formatTime(scope.row.latestTaskTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="110" align="center">
              <template slot-scope="scope">
                <el-button size="mini" type="text" icon="el-icon-view"
                           @click="viewActivity(scope.row)"
                           v-hasPermi="['ota:fota:activity:query']">查看活动
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination v-show="activityTotal > 0" :total="activityTotal"
                      :page.sync="activityQuery.pageNum" :limit.sync="activityQuery.pageSize"
                      @pagination="getActivities"/>
        </el-card>

        <el-card shadow="never" style="margin-top: 16px">
          <div slot="header">
            <span class="card-title">关联任务</span>
            <span class="card-sub">（全部历史，默认创建时间倒序）</span>
          </div>
          <el-form :model="taskQuery" ref="taskForm" size="small" :inline="true">
            <el-form-item label="活动ID" prop="activityId">
              <el-input v-model="taskQuery.activityId" placeholder="活动ID" clearable style="width: 120px"
                        @keyup.enter.native="handleTaskQuery"/>
            </el-form-item>
            <el-form-item label="任务状态" prop="taskState">
              <el-select v-model="taskQuery.taskState" placeholder="全部" clearable style="width: 130px">
                <el-option v-for="item in taskStateOptions" :key="item.value"
                           :label="item.label" :value="item.value"/>
              </el-select>
            </el-form-item>
            <el-form-item label="车辆任务状态" prop="vehicleTaskStatus">
              <el-select v-model="taskQuery.vehicleTaskStatus" placeholder="全部" clearable style="width: 150px">
                <el-option v-for="item in vehicleTaskStatusOptions" :key="item.value"
                           :label="item.label" :value="item.value"/>
              </el-select>
            </el-form-item>
            <el-form-item label="创建时间">
              <el-date-picker v-model="taskDateRange" style="width: 240px" value-format="yyyy-MM-dd"
                              type="daterange" range-separator="-"
                              start-placeholder="开始日期" end-placeholder="结束日期"/>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="mini" @click="handleTaskQuery">搜索</el-button>
              <el-button icon="el-icon-refresh" size="mini" @click="resetTaskQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <div v-if="taskError" class="load-error">
            <span>{{ taskError }}</span>
            <el-button type="text" icon="el-icon-refresh" @click="getTasks">重试</el-button>
          </div>
          <el-table v-else v-loading="taskLoading" :data="tasks" size="small" empty-text="暂无关联任务">
            <el-table-column label="任务ID" prop="taskId" width="80" align="center"/>
            <el-table-column label="任务名称" prop="taskName" min-width="160" show-overflow-tooltip/>
            <el-table-column label="活动名称" prop="activityName" min-width="150" show-overflow-tooltip/>
            <el-table-column label="阶段" width="90" align="center">
              <template slot-scope="scope">{{ taskPhaseLabel(scope.row.taskPhase) }}</template>
            </el-table-column>
            <el-table-column label="任务状态" width="100" align="center">
              <template slot-scope="scope">{{ taskStateLabel(scope.row.taskState) }}</template>
            </el-table-column>
            <el-table-column label="车辆任务状态" width="120" align="center">
              <template slot-scope="scope">{{ vehicleTaskStatusLabel(scope.row.vehicleTaskStatus) }}</template>
            </el-table-column>
            <el-table-column label="结果代码" prop="resultCode" width="100" align="center">
              <template slot-scope="scope">{{ scope.row.resultCode || '--' }}</template>
            </el-table-column>
            <el-table-column label="发布时间" width="160" align="center">
              <template slot-scope="scope">{{ formatTime(scope.row.releaseAt) }}</template>
            </el-table-column>
            <el-table-column label="执行窗口" width="300" align="center">
              <template slot-scope="scope">
                {{ formatTime(scope.row.startTime) }} ~ {{ formatTime(scope.row.endTime) }}
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="160" align="center">
              <template slot-scope="scope">{{ formatTime(scope.row.createTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="170" align="center">
              <template slot-scope="scope">
                <el-button size="mini" type="text" icon="el-icon-view"
                           @click="viewTask(scope.row)"
                           v-hasPermi="['ota:fota:task:query']">查看任务
                </el-button>
                <el-button size="mini" type="text" icon="el-icon-tickets"
                           @click="viewVehicleTask(scope.row)"
                           v-hasPermi="['ota:fota:taskVehicle:query']">升级过程
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination v-show="taskTotal > 0" :total="taskTotal"
                      :page.sync="taskQuery.pageNum" :limit.sync="taskQuery.pageSize"
                      @pagination="getTasks"/>
        </el-card>
      </el-tab-pane>

      <!-- ==================== 设备软件清单 ==================== -->
      <el-tab-pane label="设备软件清单" name="inventory">
        <div v-if="inventoryError" class="load-error">
          <span>{{ inventoryError }}</span>
          <el-button type="text" icon="el-icon-refresh" @click="getInventory">重试</el-button>
        </div>
        <el-empty v-else-if="!inventoryLoading && !inventoryData" description="暂无已接受清单"/>
        <div v-else v-loading="inventoryLoading">
          <el-descriptions v-if="inventoryData" :column="3" border size="small">
            <el-descriptions-item label="清单版本">{{ inventoryData.inventoryRevision || '--' }}</el-descriptions-item>
            <el-descriptions-item label="清单模型">{{ inventoryData.inventoryModel || '--' }}</el-descriptions-item>
            <el-descriptions-item label="ECU 数量">{{ inventoryData.ecuCount || 0 }}</el-descriptions-item>
            <el-descriptions-item label="OTA 接受时间">{{ formatTime(inventoryData.acceptedTime) }}</el-descriptions-item>
            <el-descriptions-item label="车端采集时间">{{ formatTime(inventoryData.sourceCollectedAt) }}</el-descriptions-item>
            <el-descriptions-item label="Canonical 版本">
              {{ inventoryData.canonicalizationVersion || '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="Canonical Digest" :span="3">
              <span class="digest-cell">{{ inventoryData.canonicalDigestHex || '--' }}</span>
            </el-descriptions-item>
          </el-descriptions>

          <el-collapse v-if="inventoryData" style="margin-top: 16px">
            <el-collapse-item v-for="ecu in (inventoryData.ecuList || [])" :key="ecu.ecuId" :name="ecu.ecuId">
              <template slot="title">
                <span class="ecu-title">{{ ecu.ecuId || '--' }}</span>
                <el-tag size="mini" style="margin-left: 8px">{{ ecu.softwareModel || 'SINGLE_IMAGE' }}</el-tag>
                <el-tag size="mini" style="margin-left: 8px" :type="partStatusType(ecu.partAssociation)">
                  {{ partStatusLabel(ecu.partAssociation) }}
                </el-tag>
                <span class="ecu-meta">
                  硬件 {{ ecu.hardwarePn || '--' }} / {{ ecu.hardwareVersion || '--' }}
                </span>
              </template>

              <el-table :data="ecu.softwareUnits || []" size="mini" empty-text="暂无软件单元">
                <el-table-column label="Target" prop="softwareTargetCode" min-width="140" show-overflow-tooltip/>
                <el-table-column label="软件零件号" prop="softwarePartNumber" min-width="150" show-overflow-tooltip/>
                <el-table-column label="版本" prop="swVersion" width="130"/>
                <el-table-column label="Slot" width="80" align="center">
                  <template slot-scope="scope">{{ scope.row.slot || '--' }}</template>
                </el-table-column>
                <el-table-column label="Active" width="80" align="center">
                  <template slot-scope="scope">{{ scope.row.active ? '是' : '否' }}</template>
                </el-table-column>
                <el-table-column label="Digest" min-width="200" show-overflow-tooltip>
                  <template slot-scope="scope">{{ scope.row.digest || '--' }}</template>
                </el-table-column>
              </el-table>

              <div class="part-block">
                <template v-if="ecu.partAssociation && ecu.partAssociation.status === 'MATCHED'">
                  <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="零件号">{{ ecu.partAssociation.part.pn || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="设备代码">{{ ecu.partAssociation.part.deviceCode || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="设备项">{{ ecu.partAssociation.part.deviceItem || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="SN">{{ ecu.partAssociation.part.sn || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="供应商">{{ ecu.partAssociation.part.supplierCode || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="批次">{{ ecu.partAssociation.part.batchNum || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="硬件版本">{{ ecu.partAssociation.part.hardwareVer || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="软件版本">{{ ecu.partAssociation.part.softwareVer || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="硬件零件号">{{ ecu.partAssociation.part.hardwarePn || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="软件零件号">{{ ecu.partAssociation.part.softwarePn || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="投影更新时间">{{ formatTime(ecu.partAssociation.part.modifyTime) }}</el-descriptions-item>
                    <el-descriptions-item label="附加信息">
                      <span class="digest-cell">{{ ecu.partAssociation.part.extra || '--' }}</span>
                    </el-descriptions-item>
                  </el-descriptions>
                  <div class="part-row"><b>原始配置字（只读，不解析不下发）：</b></div>
                  <pre class="config-word">{{ partConfigWord(ecu.partAssociation.part.configWord) }}</pre>
                </template>
                <div v-else class="part-row">
                  <b>零件关联：</b>{{ partStatusLabel(ecu.partAssociation) }}
                  <span v-if="ecu.partAssociation">
                    （候选 {{ ecu.partAssociation.candidateCount || 0 }} 条；无唯一匹配时不展示零件与配置字）
                  </span>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import {
  getVehicleInventory,
  listVehicleActivities,
  listVehicleTasks
} from '@/api/iov/ota/vehicle'
import {
  activityStateLabel,
  activityStateType,
  partConfigWord,
  partStatusLabel,
  partStatusType,
  taskPhaseLabel,
  taskStateLabel,
  TASK_STATE_OPTIONS,
  VEHICLE_TASK_STATUS_OPTIONS,
  vehicleTaskStatusLabel
} from './constants'

export default {
  name: 'VehicleUpgradeDetail',
  data() {
    return {
      vin: this.$route.params.vin || this.$route.query.vin || '',
      activeTab: this.$route.query.tab === 'inventory' ? 'inventory' : 'relation',
      taskStateOptions: TASK_STATE_OPTIONS,
      vehicleTaskStatusOptions: VEHICLE_TASK_STATUS_OPTIONS,
      // 活动
      activityLoading: false,
      activityError: '',
      activities: [],
      activityTotal: 0,
      activityQuery: { pageNum: 1, pageSize: 10 },
      // 任务
      taskLoading: false,
      taskError: '',
      tasks: [],
      taskTotal: 0,
      taskQuery: { pageNum: 1, pageSize: 10, activityId: undefined, taskState: undefined, vehicleTaskStatus: undefined },
      taskDateRange: [],
      // 清单
      inventoryLoading: false,
      inventoryError: '',
      inventoryData: null
    }
  },
  created() {
    if (!this.vin) {
      this.$modal.msgError('缺少车架号参数')
      return
    }
    this.getActivities()
    this.getTasks()
    this.getInventory()
  },
  methods: {
    activityStateLabel,
    activityStateType,
    taskPhaseLabel,
    taskStateLabel,
    vehicleTaskStatusLabel,
    partStatusLabel,
    partStatusType,
    partConfigWord,
    getActivities() {
      this.activityLoading = false
      this.activityError = ''
      if (!this.$auth.hasPermi('ota:fota:activity:list')) {
        this.activityError = '无权限查看关联活动'
        return
      }
      this.activityLoading = true
      listVehicleActivities(this.vin, this.activityQuery).then(response => {
        const page = response.data || {}
        this.activities = page.items || []
        this.activityTotal = page.total || 0
        this.activityLoading = false
      }).catch(error => {
        this.activityLoading = false
        this.activityError = (error && error.message) ? error.message : '关联活动加载失败'
      })
    },
    getTasks() {
      this.taskLoading = false
      this.taskError = ''
      // 关联任务复用 taskVehicle:list，不因挂在 vehicle 路径下扩大数据权限
      if (!this.$auth.hasPermi('ota:fota:taskVehicle:list')) {
        this.taskError = '无权限查看关联任务'
        return
      }
      this.taskLoading = true
      const query = this.addDateRange(this.taskQuery, this.taskDateRange)
      listVehicleTasks(this.vin, query).then(response => {
        const page = response.data || {}
        this.tasks = page.items || []
        this.taskTotal = page.total || 0
        this.taskLoading = false
      }).catch(error => {
        this.taskLoading = false
        this.taskError = (error && error.message) ? error.message : '关联任务加载失败'
      })
    },
    handleTaskQuery() {
      this.taskQuery.pageNum = 1
      this.getTasks()
    },
    resetTaskQuery() {
      this.taskDateRange = []
      this.resetForm('taskForm')
      this.taskQuery.activityId = undefined
      this.taskQuery.taskState = undefined
      this.taskQuery.vehicleTaskStatus = undefined
      this.handleTaskQuery()
    },
    getInventory() {
      this.inventoryLoading = true
      this.inventoryError = ''
      getVehicleInventory(this.vin).then(response => {
        this.inventoryData = response.data || null
        this.inventoryLoading = false
      }).catch(error => {
        this.inventoryLoading = false
        this.inventoryError = (error && error.message) ? error.message : '设备软件清单加载失败'
      })
    },
    /** 跳转活动详情（携带 activityId；目标资源自行校验 query 权限） */
    viewActivity(row) {
      this.$router.push({ path: '/iov/ota/activity', query: { id: row.activityId } })
    },
    /** 跳转任务详情（携带 taskId） */
    viewTask(row) {
      this.$router.push({ path: '/iov/ota/task', query: { id: row.taskId } })
    },
    /** 跳转既有 VehicleTask 完整过程页（携带 vehicleTaskId 与 vin） */
    viewVehicleTask(row) {
      this.$router.push({
        path: '/iov/ota/taskvehicle',
        query: { id: row.vehicleTaskId, vin: this.vin }
      })
    },
    formatTime(value) {
      return value ? this.parseTime(value, '{y}-{m}-{d} {h}:{i}:{s}') : '--'
    },
    goBack() {
      this.$router.push({ path: '/iov/ota/vehicle' })
    }
  }
}
</script>

<style scoped>
.card-title {
  font-weight: bolder;
}

.card-sub {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

.load-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  color: #f56c6c;
  background: #fef0f0;
  border-radius: 4px;
}

.ecu-title {
  font-weight: bolder;
}

.ecu-meta {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}

.part-block {
  margin-top: 8px;
  padding: 8px;
  background: #fafafa;
  border-radius: 4px;
}

.part-row {
  margin: 6px 0;
  font-size: 13px;
}

/* 配置字只读完整查看：超长/多行换行展示，不编辑 */
.config-word {
  margin: 0;
  padding: 8px;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.digest-cell {
  word-break: break-all;
}
</style>
