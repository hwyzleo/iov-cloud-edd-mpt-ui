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
      <el-form-item label="任务状态" prop="vehicleTaskStatus">
        <el-select
          v-model="queryParams.vehicleTaskStatus"
          placeholder="全部"
          clearable
          style="width: 150px"
        >
          <el-option
            v-for="item in vehicleTaskStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
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
      <el-form-item label="仅看当前">
        <el-switch v-model="queryParams.isCurrent" @change="handleQuery"/>
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
      <el-table-column type="selection" width="55" align="center" fixed="left"/>
      <el-table-column label="车辆" prop="vin" width="180" fixed="left" show-overflow-tooltip/>
      <el-table-column label="任务名称" prop="taskName" min-width="220" fixed="left" show-overflow-tooltip/>
      <el-table-column label="活动名称" prop="activityName" min-width="220" show-overflow-tooltip/>
      <el-table-column label="任务状态" prop="vehicleTaskStatus" width="120" align="center">
        <template slot-scope="scope">
          <span>{{ vehicleTaskStatusLabel(scope.row.vehicleTaskStatus) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="结果代码" prop="resultCode" width="140" align="center" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.resultCode || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="当前任务" align="center" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.isCurrent === false ? 'info' : 'success'" size="mini">
            {{ scope.row.isCurrent === false ? '已取代' : '当前' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="重置次数" align="center" prop="resetCount" width="90">
        <template slot-scope="scope">
          <span>{{ scope.row.resetCount || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="取代者" align="center" prop="supersededBy" width="100">
        <template slot-scope="scope">
          <span>{{ scope.row.supersededBy || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" fixed="right" class-name="small-padding fixed-width">
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
              <el-dropdown-item command="stageResults" icon="el-icon-s-data">包阶段历史</el-dropdown-item>
              <el-dropdown-item command="retryLogs" icon="el-icon-refresh">重试轨迹</el-dropdown-item>
              <el-dropdown-item command="upgradeLogs" icon="el-icon-document">升级日志</el-dropdown-item>
              <el-dropdown-item
                command="reset"
                icon="el-icon-refresh-left"
                divided
                :disabled="scope.row.isCurrent === false || scope.row.vehicleTaskStatus === 'SUCCEEDED'"
                :title="resetDisabledReason(scope.row)"
                v-hasPermi="['ota:fota:taskVehicle:reset']"
              >重置任务</el-dropdown-item>
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

    <!-- 车辆任务重置确认（CR-025） -->
    <el-dialog title="重置车辆任务" :visible.sync="resetOpen" width="560px" append-to-body>
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="重置将把当前车辆任务标记为「已取代」，并为该车新建一条初始化状态的车辆任务，历史授权、安装与日志记录全部保留。"
      />
      <el-form :model="resetForm" label-width="90px" size="small" style="margin-top: 12px">
        <el-form-item label="车辆任务">{{ resetForm.vehicleTaskStatus }}（ID: {{ resetForm.id }}）</el-form-item>
        <el-form-item label="重置原因" required>
          <el-input
            v-model="resetForm.reason"
            type="textarea"
            :rows="3"
            maxlength="512"
            show-word-limit
            placeholder="请填写重置原因（必填，用于审计）"
          />
        </el-form-item>
        <el-form-item v-if="resetForm.isExecuting" label="风险确认">
          <el-checkbox v-model="resetForm.confirmed">
            我已知悉以下风险，确认强制重置
          </el-checkbox>
          <ul class="reset-risk-list">
            <li>车端可能仍在刷写，ECU 实际状态未知；</li>
            <li>本次安装将按「已取消 / 结果未知」收口，不计入成功或失败统计；</li>
            <li>重置后该车需重新执行下载与安装流程，并按任务要求重新授权；</li>
            <li>旧车辆任务将被标记为「已取代」，历史过程仍可在详情中查看。</li>
          </ul>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="resetOpen = false">取 消</el-button>
        <el-button type="primary" :loading="resetLoading" @click="submitReset">确 定</el-button>
      </div>
    </el-dialog>

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
              <el-form-item label="任务状态">{{ vehicleTaskStatusLabel(processData.vehicleTask.vehicleTaskStatus) }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最后失败原因">
                <span class="message-cell" :title="processData.vehicleTask.lastFailReason">{{ processData.vehicleTask.lastFailReason || '-' }}</span>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div v-else class="drawer-row">暂无车辆任务信息</div>

        <!-- 重置记录（CR-025） -->
        <div class="drawer-title">重置记录</div>
        <el-table v-if="processData && processData.resetLogs && processData.resetLogs.length" :data="processData.resetLogs">
          <el-table-column label="原车辆任务" prop="oldVehicleTaskId" min-width="110"/>
          <el-table-column label="新车辆任务" prop="newVehicleTaskId" min-width="110"/>
          <el-table-column label="原状态" prop="oldStatus" min-width="110"/>
          <el-table-column label="强制收口执行" min-width="110">
            <template slot-scope="scope">
              <span>{{ scope.row.oldExecutionId || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="是否强制" width="90" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.force ? 'warning' : 'info'" size="mini">{{ scope.row.force ? '强制' : '常规' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="原因" prop="reason" min-width="180" show-overflow-tooltip/>
          <el-table-column label="操作人" prop="operator" width="110"/>
          <el-table-column label="操作时间" min-width="160">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createdAt) }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div v-else class="drawer-row">暂无重置记录</div>

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
          <el-table-column label="状态" width="110" align="center">
            <template slot-scope="scope">
              <el-tag :type="executionStatusType(scope.row.status)" size="mini">{{ executionStatusLabel(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="已接受序号" prop="acceptedSequenceNo" width="110" align="center"/>
          <el-table-column label="最终序号" prop="finalSequenceNo" width="100" align="center"/>
          <el-table-column label="缺失区间" prop="missingSequenceRanges" min-width="120" show-overflow-tooltip/>
          <el-table-column label="开始时间" width="170" align="center">
            <template slot-scope="scope">
              <span v-if="scope.row.startTime" :title="'云端受理：' + timeOrDash(parseTime, scope.row.startReceivedTime)">
                {{ parseTime(scope.row.startTime) }}
              </span>
              <el-tag v-else type="info" size="mini">-</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="结束时间" width="170" align="center">
            <template slot-scope="scope">
              <span v-if="scope.row.endTime" :title="'云端受理：' + timeOrDash(parseTime, scope.row.endReceivedTime)">
                {{ parseTime(scope.row.endTime) }}
              </span>
              <span v-else-if="scope.row.endReceivedTime" :title="'车端结束时间未上报，展示云端受理时间'">
                {{ parseTime(scope.row.endReceivedTime) }}<el-tag type="info" size="mini">受理</el-tag>
              </span>
              <el-tag v-else type="info" size="mini">-</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="耗时" width="110" align="center">
            <template slot-scope="scope">{{ formatDuration(scope.row.durationMs) }}</template>
          </el-table-column>
          <el-table-column label="活跃" prop="active" width="80" align="center">
            <template slot-scope="scope">{{ scope.row.active ? '是' : '否' }}</template>
          </el-table-column>
        </el-table>

        <!-- 包下载进度（CR-026：观测事实，不表示安装就绪） -->
        <div class="drawer-title">包下载进度</div>
        <el-table v-if="processData && processData.packageStages && processData.packageStages.length"
                  :data="processData.packageStages">
          <el-table-column label="包ID" prop="packageId" min-width="150" show-overflow-tooltip/>
          <el-table-column label="版本" prop="packageRevision" min-width="110" show-overflow-tooltip/>
          <el-table-column label="尝试" width="70" align="center">
            <template slot-scope="scope">{{ scope.row.downloadProgress ? scope.row.downloadProgress.downloadAttemptNo : '-' }}</template>
          </el-table-column>
          <el-table-column label="下载状态" width="130" align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.downloadProgress" :type="downloadStateType(scope.row.downloadProgress.downloadState)" size="mini">
                {{ downloadStateLabel(scope.row.downloadProgress.downloadState) }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="字节进度" min-width="170">
            <template slot-scope="scope">
              <template v-if="scope.row.downloadProgress">
                <div>{{ formatBytes(scope.row.downloadProgress.downloadedBytes) }} / {{ formatBytes(scope.row.downloadProgress.totalBytes) }}</div>
                <el-progress :percentage="Number(scope.row.downloadProgress.progressPercent || 0)"
                             :stroke-width="6" :show-text="true"/>
              </template>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="续传起点" width="110" align="center">
            <template slot-scope="scope">{{ scope.row.downloadProgress ? formatBytes(scope.row.downloadProgress.resumeOffset) : '-' }}</template>
          </el-table-column>
          <el-table-column label="车端发生" width="165" align="center">
            <template slot-scope="scope">{{ scope.row.downloadProgress ? (parseTime(scope.row.downloadProgress.occurredAt) || '未知') : '-' }}</template>
          </el-table-column>
          <el-table-column label="云端受理" width="165" align="center">
            <template slot-scope="scope">{{ scope.row.downloadProgress ? (parseTime(scope.row.downloadProgress.receivedAt) || '-') : '-' }}</template>
          </el-table-column>
          <el-table-column label="失败原因" min-width="140" show-overflow-tooltip>
            <template slot-scope="scope">
              <span v-if="scope.row.downloadProgress">
                {{ scope.row.downloadProgress.errorCode || scope.row.downloadProgress.failureReason || '-' }}
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center">
            <template slot-scope="scope">
              <el-button v-if="scope.row.downloadProgress" size="mini" type="text" icon="el-icon-time"
                         @click="handleDownloadHistory(scope.row)">历史</el-button>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
        <div v-else class="drawer-row">暂无下载进度</div>
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
        <el-tab-pane label="包阶段历史" name="stageResults">
          <el-form :inline="true" size="mini" class="tab-filter">
            <el-form-item label="包ID">
              <el-input v-model="stageResultsQueryParams.packageId" clearable placeholder="精确匹配" style="width: 190px"/>
            </el-form-item>
            <el-form-item label="阶段">
              <el-select v-model="stageResultsQueryParams.stage" clearable placeholder="全部" style="width: 130px">
                <el-option label="DOWNLOAD" value="DOWNLOAD"/>
                <el-option label="VERIFY" value="VERIFY"/>
                <el-option label="DECRYPT" value="DECRYPT"/>
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" @click="stageResultsQueryParams.pageNum = 1; loadPackageStageResults()">查询</el-button>
            </el-form-item>
          </el-form>
          <el-table v-loading="stageResultsLoading" :data="stageResultsList">
            <el-table-column label="包ID" prop="packageId" min-width="150" show-overflow-tooltip/>
            <el-table-column label="阶段" width="95" align="center">
              <template slot-scope="scope">{{ stageLabel(scope.row.stage) }}</template>
            </el-table-column>
            <el-table-column label="结果" width="90" align="center">
              <template slot-scope="scope">
                <el-tag :type="resultType(scope.row.resultStatus)" size="mini">
                  {{ resultLabel(scope.row.resultStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="版本" prop="packageRevision" min-width="110" show-overflow-tooltip/>
            <el-table-column label="ETag" prop="etag" min-width="110" show-overflow-tooltip/>
            <el-table-column label="签名校验" width="100" align="center">
              <template slot-scope="scope">{{ resultLabel(scope.row.signatureResult) }}</template>
            </el-table-column>
            <el-table-column label="解密结果" width="100" align="center">
              <template slot-scope="scope">{{ resultLabel(scope.row.decryptResult) }}</template>
            </el-table-column>
            <el-table-column label="尝试" width="70" align="center">
              <template slot-scope="scope">{{ scope.row.downloadAttemptNo == null ? '-' : scope.row.downloadAttemptNo }}</template>
            </el-table-column>
            <el-table-column label="失败原因" prop="failReason" min-width="140" show-overflow-tooltip/>
            <el-table-column label="车端发生" width="165" align="center">
              <template slot-scope="scope">{{ timeOrDash(parseTime, scope.row.occurredAt) }}</template>
            </el-table-column>
            <el-table-column label="云端受理" width="165" align="center">
              <template slot-scope="scope">{{ timeOrDash(parseTime, scope.row.receivedAt) }}</template>
            </el-table-column>
          </el-table>
          <pagination v-show="stageResultsTotal>0" :total="stageResultsTotal" :page.sync="stageResultsQueryParams.pageNum" :limit.sync="stageResultsQueryParams.pageSize" @pagination="loadPackageStageResults"/>
        </el-tab-pane>
        <el-tab-pane label="安装尝试" name="executions">
          <el-table v-loading="executionsLoading" :data="executionsList">
            <el-table-column label="执行ID" prop="executionId" min-width="150" show-overflow-tooltip/>
            <el-table-column label="尝试次数" prop="attemptNo" width="90" align="center"/>
            <el-table-column label="状态" width="110" align="center">
              <template slot-scope="scope">
                <el-tag :type="executionStatusType(scope.row.status)" size="mini">{{ executionStatusLabel(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="已接受序号" prop="acceptedSequenceNo" width="110" align="center"/>
            <el-table-column label="最终序号" prop="finalSequenceNo" width="100" align="center"/>
            <el-table-column label="缺失区间" prop="missingSequenceRanges" min-width="120" show-overflow-tooltip/>
            <el-table-column label="开始时间" width="170" align="center">
              <template slot-scope="scope">
                <span v-if="scope.row.startTime" :title="'云端受理：' + timeOrDash(parseTime, scope.row.startReceivedTime)">
                  {{ parseTime(scope.row.startTime) }}
                </span>
                <el-tag v-else type="info" size="mini">-</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="结束时间" width="170" align="center">
              <template slot-scope="scope">
                <span v-if="scope.row.endTime" :title="'云端受理：' + timeOrDash(parseTime, scope.row.endReceivedTime)">
                  {{ parseTime(scope.row.endTime) }}
                </span>
                <span v-else-if="scope.row.endReceivedTime" :title="'车端结束时间未上报，展示云端受理时间'">
                  {{ parseTime(scope.row.endReceivedTime) }}<el-tag type="info" size="mini">受理</el-tag>
                </span>
                <el-tag v-else type="info" size="mini">-</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="耗时" width="110" align="center">
              <template slot-scope="scope">{{ formatDuration(scope.row.durationMs) }}</template>
            </el-table-column>
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
          <el-form :inline="true" size="mini" class="tab-filter">
            <el-form-item label="阶段">
              <el-select v-model="retryLogsQueryParams.stage" clearable placeholder="全部" style="width: 130px">
                <el-option label="DOWNLOAD" value="DOWNLOAD"/>
                <el-option label="INSTALL" value="INSTALL"/>
              </el-select>
            </el-form-item>
            <el-form-item label="动作">
              <el-select v-model="retryLogsQueryParams.action" clearable placeholder="全部" style="width: 170px">
                <el-option v-for="item in retryActionOptions" :key="item.value" :label="item.label" :value="item.value"/>
              </el-select>
            </el-form-item>
            <el-form-item label="尝试次数">
              <el-input v-model.number="retryLogsQueryParams.attemptNo" clearable style="width: 100px"/>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" @click="retryLogsQueryParams.pageNum = 1; loadRetryLogs()">查询</el-button>
            </el-form-item>
          </el-form>
          <el-table v-loading="retryLogsLoading" :data="retryLogsList">
            <el-table-column label="阶段" width="95" align="center">
              <template slot-scope="scope">{{ stageLabel(scope.row.stage) }}</template>
            </el-table-column>
            <el-table-column label="动作" width="130" align="center">
              <template slot-scope="scope">{{ retryActionLabel(scope.row.action) }}</template>
            </el-table-column>
            <el-table-column label="尝试次数" prop="attemptNo" width="85" align="center"/>
            <el-table-column label="偏移" width="100" align="center">
              <template slot-scope="scope">{{ formatBytes(scope.row.offset) }}</template>
            </el-table-column>
            <el-table-column label="结果" width="80" align="center">
              <template slot-scope="scope">{{ resultLabel(scope.row.result) }}</template>
            </el-table-column>
            <el-table-column label="错误码" prop="errorCode" width="130" align="center"/>
            <el-table-column label="原因" prop="reason" min-width="150" show-overflow-tooltip/>
            <el-table-column label="车端发生" width="165" align="center">
              <template slot-scope="scope">{{ timeOrDash(parseTime, scope.row.occurredAt) }}</template>
            </el-table-column>
            <el-table-column label="云端受理" width="165" align="center">
              <template slot-scope="scope">{{ timeOrDash(parseTime, scope.row.receivedAt) }}</template>
            </el-table-column>
          </el-table>
          <pagination v-show="retryLogsTotal>0" :total="retryLogsTotal" :page.sync="retryLogsQueryParams.pageNum" :limit.sync="retryLogsQueryParams.pageSize" @pagination="loadRetryLogs"/>
        </el-tab-pane>
        <el-tab-pane label="升级日志" name="upgradeLogs">
          <el-alert type="info" :closable="false" show-icon
                    title="仅展示脱敏元数据；日志正文保存在对象存储，列表不返回预签名地址或永久 URL。"/>
          <el-form :inline="true" size="mini" class="tab-filter">
            <el-form-item label="状态">
              <el-select v-model="upgradeLogsQueryParams.uploadState" clearable placeholder="全部" style="width: 150px">
                <el-option v-for="item in logUploadStateOptions" :key="item" :label="item" :value="item"/>
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" @click="upgradeLogsQueryParams.pageNum = 1; loadUpgradeLog()">查询</el-button>
            </el-form-item>
          </el-form>
          <el-table v-loading="upgradeLogsLoading" :data="upgradeLogsList">
            <el-table-column label="申请ID" prop="logRequestId" min-width="170" show-overflow-tooltip/>
            <el-table-column label="执行ID" width="90" align="center">
              <template slot-scope="scope">{{ scope.row.executionId == null ? '-' : scope.row.executionId }}</template>
            </el-table-column>
            <el-table-column label="对象键" prop="objectKey" min-width="230" show-overflow-tooltip/>
            <el-table-column label="大小" width="100" align="center">
              <template slot-scope="scope">{{ formatBytes(scope.row.objectSizeBytes) }}</template>
            </el-table-column>
            <el-table-column label="摘要" min-width="150" show-overflow-tooltip>
              <template slot-scope="scope">
                <span :title="scope.row.logDigest">{{ shortDigest(scope.row.logDigest) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="110" align="center">
              <template slot-scope="scope">
                <el-tag :type="logUploadStateType(scope.row.uploadState)" size="mini">
                  {{ logUploadStateLabel(scope.row.uploadState) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="失败原因" prop="failureReason" min-width="130" show-overflow-tooltip/>
            <el-table-column label="授权时间" width="165" align="center">
              <template slot-scope="scope">{{ parseTime(scope.row.authorizedAt) || '未知' }}</template>
            </el-table-column>
            <el-table-column label="核验时间" width="165" align="center">
              <template slot-scope="scope">{{ parseTime(scope.row.uploadedAt) || '未知' }}</template>
            </el-table-column>
          </el-table>
          <pagination v-show="upgradeLogsTotal>0" :total="upgradeLogsTotal" :page.sync="upgradeLogsQueryParams.pageNum" :limit.sync="upgradeLogsQueryParams.pageSize" @pagination="loadUpgradeLog"/>
        </el-tab-pane>
      </el-tabs>
      <div slot="footer" class="dialog-footer">
        <el-button @click="execOpen = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 下载进度历史对话框（CR-026） -->
    <el-dialog title="下载进度历史" :visible.sync="downloadHistoryOpen" width="1000px" append-to-body>
      <el-form :inline="true" size="mini">
        <el-form-item label="包ID">{{ downloadHistoryScope.packageId }}</el-form-item>
        <el-form-item label="下载尝试">{{ downloadHistoryScope.attemptNo }}</el-form-item>
        <el-form-item label="状态">
          <el-select v-model="downloadEventsQueryParams.state" clearable placeholder="全部" style="width: 150px">
            <el-option v-for="item in downloadStateOptions" :key="item" :label="downloadStateLabel(item)" :value="item"/>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search"
                     @click="downloadEventsQueryParams.pageNum = 1; loadDownloadEvents()">查询</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="downloadEventsLoading" :data="downloadEventsList">
        <el-table-column label="进度ID" prop="progressId" min-width="170" show-overflow-tooltip/>
        <el-table-column label="序号" prop="progressSeq" width="80" align="center"/>
        <el-table-column label="状态" width="130" align="center">
          <template slot-scope="scope">
            <el-tag :type="downloadStateType(scope.row.downloadState)" size="mini">
              {{ downloadStateLabel(scope.row.downloadState) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="字节" min-width="150">
          <template slot-scope="scope">
            {{ formatBytes(scope.row.downloadedBytes) }} / {{ formatBytes(scope.row.totalBytes) }}
          </template>
        </el-table-column>
        <el-table-column label="百分比" width="90" align="center">
          <template slot-scope="scope">{{ Number(scope.row.progressPercent || 0).toFixed(2) }}%</template>
        </el-table-column>
        <el-table-column label="续传起点" width="110" align="center">
          <template slot-scope="scope">{{ formatBytes(scope.row.resumeOffset) }}</template>
        </el-table-column>
        <el-table-column label="处置" prop="disposition" width="140" align="center"/>
        <el-table-column label="错误码" prop="errorCode" width="120" align="center"/>
        <el-table-column label="车端发生" width="165" align="center">
          <template slot-scope="scope">{{ parseTime(scope.row.occurredAt) || '未知' }}</template>
        </el-table-column>
        <el-table-column label="云端受理" width="165" align="center">
          <template slot-scope="scope">{{ parseTime(scope.row.receivedAt) }}</template>
        </el-table-column>
      </el-table>
      <pagination v-show="downloadEventsTotal>0" :total="downloadEventsTotal"
                  :page.sync="downloadEventsQueryParams.pageNum"
                  :limit.sync="downloadEventsQueryParams.pageSize"
                  @pagination="loadDownloadEvents"/>
      <div slot="footer" class="dialog-footer">
        <el-button @click="downloadHistoryOpen = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 执行事件对话框 -->
    <el-dialog title="执行事件" :visible.sync="eventsOpen" width="920px" append-to-body>
      <el-form :inline="true" size="mini">
        <el-form-item label="阶段">
          <el-select v-model="eventsQueryParams.stage" clearable placeholder="全部" style="width: 140px">
            <el-option label="INSTALL" value="INSTALL"/>
            <el-option label="REBOOT" value="REBOOT"/>
            <el-option label="POST_CHECK" value="POST_CHECK"/>
            <el-option label="ROLLBACK" value="ROLLBACK"/>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="eventsQueryParams.pageNum = 1; loadExecutionEvents()">查询</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="eventsLoading" :data="eventsList">
        <el-table-column label="序号" prop="sequenceNo" width="70" align="center"/>
        <el-table-column label="阶段" prop="stage" width="110" align="center"/>
        <el-table-column label="事件ID" prop="eventId" min-width="140" show-overflow-tooltip/>
        <el-table-column label="进度" width="80" align="center">
          <template slot-scope="scope">{{ scope.row.progressPercent == null ? '-' : scope.row.progressPercent + '%' }}</template>
        </el-table-column>
        <el-table-column label="ECU" prop="ecuId" min-width="110" show-overflow-tooltip/>
        <el-table-column label="Target" prop="softwareTargetCode" min-width="120" show-overflow-tooltip/>
        <el-table-column label="Slot" prop="slot" width="80" align="center"/>
        <el-table-column label="错误码" prop="errorCode" width="130" align="center"/>
        <el-table-column label="失败原因" prop="failureReason" min-width="150" show-overflow-tooltip/>
        <el-table-column label="处置" prop="disposition" width="100" align="center"/>
        <el-table-column label="车端发生" width="165" align="center">
          <template slot-scope="scope">{{ parseTime(scope.row.occurredAt) || '未知' }}</template>
        </el-table-column>
        <el-table-column label="云端受理" width="165" align="center">
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
  listTaskVehicleUpgradeLogs,
  listTaskVehiclePackageStageResults,
  listTaskVehicleDownloadEvents,
  resetTaskVehicle
} from "@/api/iov/ota/taskvehicle";
import { VEHICLE_TASK_STATUS_OPTIONS, vehicleTaskStatusLabel } from "@/views/iov/ota/vehicle/constants";
import {
  RETRY_ACTION_OPTIONS,
  LOG_UPLOAD_STATE_OPTIONS,
  DOWNLOAD_STATE_OPTIONS,
  downloadStateLabel,
  downloadStateType,
  retryActionLabel,
  executionStatusLabel,
  executionStatusType,
  vehicleTaskStatusLabel,
  stageLabel,
  resultLabel,
  resultType,
  timeOrDash,
  logUploadStateLabel,
  logUploadStateType,
  formatDuration,
  formatBytes,
  shortDigest
} from "@/views/iov/ota/taskvehicle/processLabels";

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
      processTaskVehicleId: undefined,
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
      retryLogsQueryParams: { pageNum: 1, pageSize: 10, stage: undefined, action: undefined, attemptNo: undefined },
      retryLogsLoading: false,
      upgradeLogsList: [],
      upgradeLogsTotal: 0,
      upgradeLogsQueryParams: { pageNum: 1, pageSize: 10, uploadState: undefined },
      upgradeLogsLoading: false,
      // 包阶段历史（CR-026）
      stageResultsList: [],
      stageResultsTotal: 0,
      stageResultsQueryParams: { pageNum: 1, pageSize: 10, packageId: undefined, stage: undefined },
      stageResultsLoading: false,
      // 下载进度历史（CR-026）
      downloadHistoryOpen: false,
      downloadHistoryScope: { packageId: undefined, attemptNo: undefined },
      downloadEventsList: [],
      downloadEventsTotal: 0,
      downloadEventsQueryParams: { pageNum: 1, pageSize: 10, state: undefined },
      downloadEventsLoading: false,
      // 执行事件
      eventsOpen: false,
      eventsLoading: false,
      eventsList: [],
      eventsTotal: 0,
      eventsQueryParams: { pageNum: 1, pageSize: 10, stage: undefined },
      currentExecutionId: undefined,
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 日期范围
      dateRange: [],
      // 查询参数（isCurrent=true 时仅返回当前车辆任务，CR-025）
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        isCurrent: true
      },
      // 车辆任务重置（CR-025）
      resetOpen: false,
      resetLoading: false,
      resetForm: {
        id: undefined,
        vehicleTaskStatus: '',
        reason: '',
        confirmed: false,
        isExecuting: false,
        rowVersion: undefined
      },
      // 任务状态筛选项（与 VehicleTaskStatus 枚举、列表展示字典同源）
      vehicleTaskStatusOptions: VEHICLE_TASK_STATUS_OPTIONS,
      // CR-026 枚举选项（与后端冻结取值同源）
      retryActionOptions: RETRY_ACTION_OPTIONS,
      logUploadStateOptions: LOG_UPLOAD_STATE_OPTIONS,
      downloadStateOptions: DOWNLOAD_STATE_OPTIONS,
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      },
    };
  },
  created() {
    // CR-023：从车辆升级详情按 vehicleTaskId/vin 深链时定位并打开完整过程
    const query = this.$route.query || {};
    if (query.vin) {
      this.queryParams.vin = query.vin;
    }
    this.getList();
    if (query.id && this.$auth.hasPermi('ota:fota:taskVehicle:query')) {
      this.$nextTick(() => this.handleProcess({ id: Number(query.id) }));
    }
  },
  methods: {
    // CR-026 过程展示字典与格式化（共享模块，单测覆盖）
    downloadStateLabel,
    downloadStateType,
    retryActionLabel,
    logUploadStateLabel,
    logUploadStateType,
    formatDuration,
    formatBytes,
    shortDigest,
    /** CR-012 VehicleTask 状态枚举名转中文文案（旧 tb_task_vehicle.state 数值码已删除） */
    vehicleTaskStatusLabel,
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
      this.queryParams.isCurrent = true;
      this.handleQuery();
    },
    /** 重置入口禁用原因（CR-025） */
    resetDisabledReason(row) {
      if (row.isCurrent === false) {
        return "已被取代的历史车辆任务不可重置";
      }
      if (row.vehicleTaskStatus === "SUCCEEDED") {
        return "已成功的车辆任务不可重置";
      }
      return "";
    },
    /** 打开重置确认 */
    handleReset(row) {
      this.resetForm = {
        id: row.id,
        vehicleTaskStatus: this.vehicleTaskStatusLabel(row.vehicleTaskStatus),
        reason: "",
        confirmed: false,
        isExecuting: row.vehicleTaskStatus === "EXECUTING" || row.vehicleTaskStatus === "ROLLBACK_PENDING",
        rowVersion: undefined
      };
      this.resetOpen = true;
    },
    /** 提交重置：执行中需勾选风险确认（后端要求 force=true） */
    submitReset() {
      if (!this.resetForm.reason || !this.resetForm.reason.trim()) {
        this.$modal.msgWarning("请填写重置原因");
        return;
      }
      if (this.resetForm.isExecuting && !this.resetForm.confirmed) {
        this.$modal.msgWarning("请先勾选风险确认");
        return;
      }
      this.resetLoading = true;
      resetTaskVehicle(this.resetForm.id, {
        reason: this.resetForm.reason.trim(),
        force: this.resetForm.isExecuting && this.resetForm.confirmed
      }).then(res => {
        const data = res.data || {};
        this.$modal.msgSuccess(
          "重置成功：新车辆任务[" + (data.newVehicleTaskId || "-") + "]" +
          (data.forcedExecutionCanceled ? "，已强制收口执行[" + (data.oldExecutionId || "-") + "]" : "")
        );
        this.resetOpen = false;
        this.getList();
      }).catch(err => {
        this.$modal.msgError((err && err.message) ? err.message : "重置失败");
      }).finally(() => {
        this.resetLoading = false;
      });
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
      this.processTaskVehicleId = id
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
        stageResults: () => this.handlePackageStageResults(row),
        retryLogs: () => this.handleRetryLogs(row),
        upgradeLogs: () => this.handleUpgradeLogs(row),
        reset: () => this.handleReset(row)
      }
      const action = actions[command]
      if (action) action()
    },
    /** tab 切换 */
    handleExecTab(tab) {
      if (tab.name === 'executions') this.loadExecutions()
      else if (tab.name === 'stageResults') this.loadPackageStageResults()
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
    /** 包阶段历史（CR-026） */
    handlePackageStageResults(row) {
      this.execTaskVehicleId = row.id || this.ids
      this.execTab = 'stageResults'
      this.execOpen = true
      this.stageResultsQueryParams.pageNum = 1
      this.loadPackageStageResults()
    },
    loadPackageStageResults() {
      if (!this.execTaskVehicleId) return
      this.stageResultsLoading = true
      listTaskVehiclePackageStageResults(this.execTaskVehicleId, this.stageResultsQueryParams).then(response => {
        this.stageResultsList = response.data.items || []
        this.stageResultsTotal = response.data.total || 0
        this.stageResultsLoading = false
      }).catch(() => {
        this.stageResultsLoading = false
      })
    },
    /** 下载进度历史（CR-026） */
    handleDownloadHistory(row) {
      const progress = row.downloadProgress || {}
      this.downloadHistoryScope = { packageId: row.packageId, attemptNo: progress.downloadAttemptNo }
      this.downloadEventsQueryParams = { pageNum: 1, pageSize: 10, state: undefined }
      this.downloadEventsList = []
      this.downloadEventsTotal = 0
      this.downloadHistoryOpen = true
      this.loadDownloadEvents()
    },
    loadDownloadEvents() {
      const { packageId, attemptNo } = this.downloadHistoryScope
      if (!this.processTaskVehicleId || !packageId || !attemptNo) return
      this.downloadEventsLoading = true
      listTaskVehicleDownloadEvents(this.processTaskVehicleId, packageId, attemptNo, this.downloadEventsQueryParams)
        .then(response => {
          this.downloadEventsList = response.data.items || []
          this.downloadEventsTotal = response.data.total || 0
          this.downloadEventsLoading = false
        }).catch(() => {
          this.downloadEventsLoading = false
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

.reset-risk-list {
  margin: 6px 0 0 0;
  padding-left: 18px;
  color: #e6a23c;
  line-height: 1.8;
}
</style>
