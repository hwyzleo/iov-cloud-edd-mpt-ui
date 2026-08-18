<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="车辆" prop="vin">
        <el-input
          v-model="queryParams.vin"
          placeholder="请输入车辆"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="dateRange"
          style="width: 240px"
          value-format="yyyy-MM-dd"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['ota:fota:taskVehicle:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="车辆" prop="vin" width="180"/>
      <el-table-column label="任务名称" prop="taskName"/>
      <el-table-column label="活动名称" prop="activityName"/>
      <el-table-column label="任务状态" prop="state" width="120" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.state === 0">等待下载</span>
          <span v-else-if="scope.row.state === 1">开始下载</span>
          <span v-else-if="scope.row.state === 3">继续下载</span>
          <span v-else-if="scope.row.state === 5">结束下载</span>
          <span v-else-if="scope.row.state === 7">预约升级</span>
          <span v-else-if="scope.row.state === 9">自动升级</span>
          <span v-else-if="scope.row.state === 10">安装检测</span>
          <span v-else-if="scope.row.state === 11">开始安装</span>
          <span v-else-if="scope.row.state === 15">结束安装</span>
          <span v-else-if="scope.row.state === 17">开始回滚</span>
          <span v-else-if="scope.row.state === 19">结束回滚</span>
          <span v-else-if="scope.row.state === 21">升级立即重启</span>
          <span v-else-if="scope.row.state === 22">升级用户重启</span>
          <span v-else-if="scope.row.state === 23">回滚立即重启</span>
          <span v-else-if="scope.row.state === 24">回滚用户重启</span>
          <span v-else-if="scope.row.state === 25">写配置字</span>
          <span v-else-if="scope.row.state === 26">回滚配置字</span>
          <span v-else-if="scope.row.state === 90">升级失败</span>
          <span v-else-if="scope.row.state === 91">升级超时</span>
          <span v-else>未知</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="340" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-tickets"
            @click="handleProcess(scope.row)"
            v-hasPermi="['ota:fota:task:query']"
          >升级过程
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-document"
            @click="handleConsent(scope.row)"
            v-hasPermi="['ota:fota:taskVehicle:query']"
          >授权
          </el-button>
          <el-dropdown
            trigger="click"
            @command="(command) => handleExecCommand(command, scope.row)"
            style="margin-left: 8px;"
            v-hasPermi="['ota:fota:taskVehicle:query']"
          >
            <el-button size="mini" type="text" icon="el-icon-d-arrow-right">更多<i class="el-icon-arrow-down el-icon--right"></i></el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="executions" icon="el-icon-video-play">安装尝试</el-dropdown-item>
              <el-dropdown-item command="retryLogs" icon="el-icon-refresh">重试轨迹</el-dropdown-item>
              <el-dropdown-item command="upgradeLogs" icon="el-icon-document">升级日志</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 升级过程抽屉 -->
    <el-drawer title="升级过程" :visible.sync="open" direction="rtl" size="800px"
               :modal="true"
               :append-to-body="true"
               @close="cancel">
      <div class="drawer-content">
        <!-- 车辆任务信息 -->
        <div class="drawer-title">车辆任务信息</div>
        <el-form v-if="processData && processData.vehicleTask" label-width="110px" size="small">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item label="任务名称">{{ processData.vehicleTask.taskName || '-' }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="活动名称">{{ processData.vehicleTask.activityName || '-' }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="任务修订">{{ processData.vehicleTask.taskRevision }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="车辆">{{ processData.vinMasked || '-' }}</el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="快照摘要">
                <span class="message-cell" :title="processData.vehicleTask.snapshotDigest">{{ processData.vehicleTask.snapshotDigest || '-' }}</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="任务状态">{{ processData.vehicleTask.vehicleTaskStatus || '-' }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最后失败原因">
                <span class="message-cell" :title="processData.vehicleTask.lastFailReason">{{ processData.vehicleTask.lastFailReason || '-' }}</span>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div v-else class="drawer-row">暂无车辆任务信息</div>

        <!-- 授权汇总 -->
        <div class="drawer-title">授权汇总</div>
        <el-form v-if="processData && processData.consentSummary" label-width="110px" size="small">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item label="授权状态">
                <el-tag :type="consentStateType(processData.consentSummary.consentState)">{{ consentStateLabel(processData.consentSummary.consentState) }}</el-tag>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="授权结果">{{ consentResultLabel(processData.consentSummary.consentResult) || '-' }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="凭据ID">
                <span class="message-cell" :title="processData.consentSummary.receiptId">{{ processData.consentSummary.receiptId || '-' }}</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="条款版本">{{ processData.consentSummary.articleVersion || '-' }}</el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="条款Hash">
                <span class="message-cell" :title="processData.consentSummary.articleHash">{{ processData.consentSummary.articleHash || '-' }}</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="上报时间">{{ parseTime(processData.consentSummary.reportedAt) || '-' }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="渠道">{{ processData.consentSummary.channel || '-' }}</el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div v-else class="drawer-row">暂无授权汇总</div>

        <!-- 执行列表 -->
        <div class="drawer-title">执行列表</div>
        <el-table v-loading="loading" :data="processExecutions">
          <el-table-column label="执行ID" prop="executionId" min-width="150" show-overflow-tooltip/>
          <el-table-column label="尝试次数" prop="attemptNo" width="90" align="center"/>
          <el-table-column label="状态" prop="status" width="110" align="center"/>
          <el-table-column label="已接受序号" prop="acceptedSequenceNo" width="110" align="center"/>
          <el-table-column label="最终序号" prop="finalSequenceNo" width="100" align="center"/>
          <el-table-column label="缺失区间" prop="missingSequenceRanges" min-width="140" show-overflow-tooltip/>
          <el-table-column label="活跃" prop="active" width="80" align="center">
            <template slot-scope="scope">{{ scope.row.active ? '是' : '否' }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <!-- 授权记录抽屉 -->
    <el-drawer title="车辆授权记录" :visible.sync="consentOpen" direction="rtl" size="760px"
               :modal="true" :append-to-body="true" @close="cancelConsent">
      <div class="drawer-content">
        <div class="drawer-title">当前授权状态</div>
        <el-form v-if="currentConsent && currentConsent.vehicleTaskId" label-width="110px" size="small">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item label="授权状态">
                <el-tag :type="consentStateType(currentConsent.consentState)">{{ consentStateLabel(currentConsent.consentState) }}</el-tag>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="凭据有效性">
                <el-tag :type="currentConsent.valid ? 'success' : 'danger'">{{ currentConsent.valid ? '有效' : '无效' }}</el-tag>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="当前凭据ID">{{ currentConsent.currentReceiptId || '-' }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="条款版本">{{ currentConsent.articleVersion || '-' }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="授权范围摘要">
                <span class="message-cell" :title="currentConsent.scopeDigest">{{ currentConsent.scopeDigest || '-' }}</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="无效原因">{{ currentConsent.invalidReason || '-' }}</el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div v-else class="drawer-row">暂无当前授权状态</div>

        <div class="drawer-title">授权历史</div>
        <el-table v-loading="consentLoading" :data="consentList">
          <el-table-column label="授权结果" prop="consentResult" width="90" align="center">
            <template slot-scope="scope">
              <el-tag :type="consentResultType(scope.row.consentResult)">{{ consentResultLabel(scope.row.consentResult) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="凭据ID" prop="consentReceiptId" min-width="160" show-overflow-tooltip/>
          <el-table-column label="条款版本" prop="articleVersion" width="100" align="center"/>
          <el-table-column label="渠道" prop="channel" width="90" align="center"/>
          <el-table-column label="任务修订" prop="taskRevision" width="90" align="center"/>
          <el-table-column label="上报时间" prop="reportedAt" width="160" align="center">
            <template slot-scope="scope">{{ parseTime(scope.row.reportedAt) }}</template>
          </el-table-column>
          <el-table-column label="接收时间" prop="receivedAt" width="160" align="center">
            <template slot-scope="scope">{{ parseTime(scope.row.receivedAt) }}</template>
          </el-table-column>
          <el-table-column label="来源" prop="sourceModel" width="120" align="center"/>
        </el-table>
        <pagination
          v-show="consentTotal>0"
          :total="consentTotal"
          :page.sync="consentQueryParams.pageNum"
          :limit.sync="consentQueryParams.pageSize"
          @pagination="loadConsentHistory"
        />
      </div>
    </el-drawer>

    <!-- 执行记录对话框 -->
    <el-dialog title="车辆任务执行记录" :visible.sync="execOpen" width="980px" append-to-body>
      <el-tabs v-model="execTab" @tab-click="handleExecTab">
        <el-tab-pane label="安装尝试" name="executions">
          <el-table v-loading="executionsLoading" :data="executionsList">
            <el-table-column label="执行ID" prop="executionId" min-width="150" show-overflow-tooltip/>
            <el-table-column label="尝试次数" prop="attemptNo" width="90" align="center"/>
            <el-table-column label="状态" prop="status" width="100" align="center"/>
            <el-table-column label="已接受序号" prop="acceptedSequenceNo" width="110" align="center"/>
            <el-table-column label="最终序号" prop="finalSequenceNo" width="100" align="center"/>
            <el-table-column label="缺失区间" prop="missingSequenceRanges" min-width="140" show-overflow-tooltip/>
            <el-table-column label="活跃" prop="active" width="80" align="center">
              <template slot-scope="scope">{{ scope.row.active ? '是' : '否' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="90" align="center">
              <template slot-scope="scope">
                <el-button size="mini" type="text" icon="el-icon-view" @click="handleExecutionEvents(scope.row)">事件</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination v-show="executionsTotal>0" :total="executionsTotal" :page.sync="executionsQueryParams.pageNum" :limit.sync="executionsQueryParams.pageSize" @pagination="loadExecutions"/>
        </el-tab-pane>
        <el-tab-pane label="重试轨迹" name="retryLogs">
          <el-table v-loading="retryLogsLoading" :data="retryLogsList">
            <el-table-column label="阶段" prop="stage" width="120" align="center"/>
            <el-table-column label="尝试次数" prop="attemptNo" width="90" align="center"/>
            <el-table-column label="偏移" prop="offset" width="90" align="center"/>
            <el-table-column label="结果" prop="result" width="90" align="center"/>
            <el-table-column label="原因" prop="reason" min-width="150" show-overflow-tooltip/>
            <el-table-column label="重试时间" prop="retriedAt" width="170" align="center">
              <template slot-scope="scope">{{ parseTime(scope.row.retriedAt) }}</template>
            </el-table-column>
          </el-table>
          <pagination v-show="retryLogsTotal>0" :total="retryLogsTotal" :page.sync="retryLogsQueryParams.pageNum" :limit.sync="retryLogsQueryParams.pageSize" @pagination="loadRetryLogs"/>
        </el-tab-pane>
        <el-tab-pane label="升级日志" name="upgradeLogs">
          <el-table v-loading="upgradeLogsLoading" :data="upgradeLogsList">
            <el-table-column label="日志URL" prop="logUrl" min-width="240" show-overflow-tooltip>
              <template slot-scope="scope">
                <el-link v-if="scope.row.logUrl" :href="scope.row.logUrl" type="primary" target="_blank">{{ scope.row.logUrl }}</el-link>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="上传状态" prop="uploadState" width="110" align="center"/>
            <el-table-column label="上传时间" prop="uploadTime" width="170" align="center">
              <template slot-scope="scope">{{ parseTime(scope.row.uploadTime) }}</template>
            </el-table-column>
          </el-table>
          <pagination v-show="upgradeLogsTotal>0" :total="upgradeLogsTotal" :page.sync="upgradeLogsQueryParams.pageNum" :limit.sync="upgradeLogsQueryParams.pageSize" @pagination="loadUpgradeLog"/>
        </el-tab-pane>
      </el-tabs>
      <div slot="footer" class="dialog-footer">
        <el-button @click="execOpen = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 执行事件对话框 -->
    <el-dialog title="执行事件" :visible.sync="eventsOpen" width="920px" append-to-body>
      <el-table v-loading="eventsLoading" :data="eventsList">
        <el-table-column label="事件ID" prop="eventId" min-width="150" show-overflow-tooltip/>
        <el-table-column label="序号" prop="sequenceNo" width="80" align="center"/>
        <el-table-column label="事件类型" prop="eventType" width="120" align="center"/>
        <el-table-column label="事件摘要" prop="eventDigest" min-width="180" show-overflow-tooltip/>
        <el-table-column label="处置" prop="disposition" width="100" align="center"/>
        <el-table-column label="接收时间" prop="receivedTime" width="170" align="center">
          <template slot-scope="scope">{{ parseTime(scope.row.receivedTime) }}</template>
        </el-table-column>
      </el-table>
      <pagination v-show="eventsTotal>0" :total="eventsTotal" :page.sync="eventsQueryParams.pageNum" :limit.sync="eventsQueryParams.pageSize" @pagination="loadExecutionEvents"/>
      <div slot="footer" class="dialog-footer">
        <el-button @click="eventsOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getTaskVehicle,
  listTaskVehicle,
  listTaskVehicleProcess,
  listTaskVehicleConsents,
  getTaskVehicleCurrentConsent,
  listTaskVehicleExecutions,
  listTaskVehicleExecutionEvents,
  listTaskVehicleRetryLogs,
  listTaskVehicleUpgradeLogs
} from "@/api/iov/ota/taskvehicle";

export default {
  name: "TaskVehicle",
  dicts: [],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 表格数据
      list: [],
      processData: {},
      processExecutions: [],
      // 授权记录
      consentOpen: false,
      consentLoading: false,
      currentConsent: {},
      consentList: [],
      consentTotal: 0,
      consentTaskVehicleId: undefined,
      consentQueryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 执行记录（安装尝试/重试轨迹/升级日志）
      execOpen: false,
      execTab: 'executions',
      execTaskVehicleId: undefined,
      executionsList: [],
      executionsTotal: 0,
      executionsQueryParams: { pageNum: 1, pageSize: 10 },
      executionsLoading: false,
      retryLogsList: [],
      retryLogsTotal: 0,
      retryLogsQueryParams: { pageNum: 1, pageSize: 10 },
      retryLogsLoading: false,
      upgradeLogsList: [],
      upgradeLogsTotal: 0,
      upgradeLogsQueryParams: { pageNum: 1, pageSize: 10 },
      upgradeLogsLoading: false,
      // 执行事件
      eventsOpen: false,
      eventsLoading: false,
      eventsList: [],
      eventsTotal: 0,
      eventsQueryParams: { pageNum: 1, pageSize: 10 },
      currentExecutionId: undefined,
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      },
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询升级任务列表 */
    getList() {
      this.loading = true;
      listTaskVehicle(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.list = response.data.items;
          this.total = response.data.total;
          this.loading = false;
        }
      );
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
    },
    /** 表单重置 */
    reset() {
      this.form = {
        name: undefined
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
    },
    handleProcess(row) {
      const id = row.id || this.ids
      listTaskVehicleProcess(id).then(response => {
        this.processData = response.data || {};
        this.processExecutions = (this.processData.executions) || [];
        this.open = true;
      });
    },
    /** 查看授权记录 */
    handleConsent(row) {
      const id = row.id || this.ids
      this.consentTaskVehicleId = id
      this.currentConsent = {}
      this.consentList = []
      this.consentTotal = 0
      this.consentQueryParams.pageNum = 1
      this.consentOpen = true
      getTaskVehicleCurrentConsent(id).then(response => {
        this.currentConsent = response.data || {}
      })
      this.loadConsentHistory()
    },
    /** 加载授权历史 */
    loadConsentHistory() {
      if (!this.consentTaskVehicleId) return
      this.consentLoading = true
      listTaskVehicleConsents(this.consentTaskVehicleId, this.consentQueryParams).then(response => {
        this.consentList = response.data.items || []
        this.consentTotal = response.data.total || 0
        this.consentLoading = false
      })
    },
    /** 关闭授权抽屉 */
    cancelConsent() {
      this.consentOpen = false
    },
    /** 授权状态标签类型 */
    consentStateType(state) {
      const map = {
        NOT_REQUIRED: 'info',
        PENDING: 'warning',
        GRANTED: 'success',
        REJECTED: 'danger',
        REVOKED: 'warning',
        EXPIRED: 'info',
        INVALIDATED: 'danger'
      }
      return map[state] || 'info'
    },
    /** 授权状态文本 */
    consentStateLabel(state) {
      const map = {
        NOT_REQUIRED: '无需授权',
        PENDING: '待授权',
        GRANTED: '已同意',
        REJECTED: '已拒绝',
        REVOKED: '已撤回',
        EXPIRED: '已过期',
        INVALIDATED: '已失效'
      }
      return map[state] || state
    },
    /** 授权结果标签类型 */
    consentResultType(result) {
      const map = { GRANTED: 'success', REJECTED: 'danger', REVOKED: 'warning' }
      return map[result] || 'info'
    },
    /** 授权结果文本 */
    consentResultLabel(result) {
      const map = { GRANTED: '同意', REJECTED: '拒绝', REVOKED: '撤回' }
      return map[result] || result
    },
    /** 执行记录下拉命令 */
    handleExecCommand(command, row) {
      const actions = {
        executions: () => this.handleExecutions(row),
        retryLogs: () => this.handleRetryLogs(row),
        upgradeLogs: () => this.handleUpgradeLogs(row)
      }
      const action = actions[command]
      if (action) action()
    },
    /** tab 切换 */
    handleExecTab(tab) {
      if (tab.name === 'executions') this.loadExecutions()
      else if (tab.name === 'retryLogs') this.loadRetryLogs()
      else if (tab.name === 'upgradeLogs') this.loadUpgradeLog()
    },
    /** 安装尝试 */
    handleExecutions(row) {
      this.execTaskVehicleId = row.id || this.ids
      this.execTab = 'executions'
      this.execOpen = true
      this.executionsQueryParams.pageNum = 1
      this.loadExecutions()
    },
    loadExecutions() {
      if (!this.execTaskVehicleId) return
      this.executionsLoading = true
      listTaskVehicleExecutions(this.execTaskVehicleId, this.executionsQueryParams).then(response => {
        this.executionsList = response.data.items || []
        this.executionsTotal = response.data.total || 0
        this.executionsLoading = false
      }).catch(() => {
        this.executionsLoading = false
      })
    },
    /** 重试轨迹 */
    handleRetryLogs(row) {
      this.execTaskVehicleId = row.id || this.ids
      this.execTab = 'retryLogs'
      this.execOpen = true
      this.retryLogsQueryParams.pageNum = 1
      this.loadRetryLogs()
    },
    loadRetryLogs() {
      if (!this.execTaskVehicleId) return
      this.retryLogsLoading = true
      listTaskVehicleRetryLogs(this.execTaskVehicleId, this.retryLogsQueryParams).then(response => {
        this.retryLogsList = response.data.items || []
        this.retryLogsTotal = response.data.total || 0
        this.retryLogsLoading = false
      }).catch(() => {
        this.retryLogsLoading = false
      })
    },
    /** 升级日志 */
    handleUpgradeLogs(row) {
      this.execTaskVehicleId = row.id || this.ids
      this.execTab = 'upgradeLogs'
      this.execOpen = true
      this.upgradeLogsQueryParams.pageNum = 1
      this.loadUpgradeLog()
    },
    loadUpgradeLog() {
      if (!this.execTaskVehicleId) return
      this.upgradeLogsLoading = true
      listTaskVehicleUpgradeLogs(this.execTaskVehicleId, this.upgradeLogsQueryParams).then(response => {
        this.upgradeLogsList = response.data.items || []
        this.upgradeLogsTotal = response.data.total || 0
        this.upgradeLogsLoading = false
      }).catch(() => {
        this.upgradeLogsLoading = false
      })
    },
    /** 执行事件 */
    handleExecutionEvents(row) {
      this.currentExecutionId = row.id
      this.eventsOpen = true
      this.eventsQueryParams.pageNum = 1
      this.loadExecutionEvents()
    },
    loadExecutionEvents() {
      if (!this.execTaskVehicleId || !this.currentExecutionId) return
      this.eventsLoading = true
      listTaskVehicleExecutionEvents(this.execTaskVehicleId, this.currentExecutionId, this.eventsQueryParams).then(response => {
        this.eventsList = response.data.items || []
        this.eventsTotal = response.data.total || 0
        this.eventsLoading = false
      }).catch(() => {
        this.eventsLoading = false
      })
    },
    /** 提交按钮 */
    submitForm: function () {
    },
    /** 删除按钮操作 */
    handleDelete(row) {
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('/iov-ota/api/mpt/taskVehicle/v1/export', {
        ...this.queryParams
      }, `task_vehicle_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
<style>
.message-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.message-cell:hover {
  cursor: pointer;
}

.my-tooltip {
  max-width: 400px !important;
  white-space: normal !important;
  word-break: break-word !important;
}

.drawer-content {
  padding: 20px;
  font-size: 14px;
  color: #606266;
}

.drawer-title {
  font-size: 16px;
  font-weight: bolder;
  margin-top: 20px;
  margin-bottom: 20px;
}

.drawer-row {
  margin-bottom: 15px;
}
</style>
