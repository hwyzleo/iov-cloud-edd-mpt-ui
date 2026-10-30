<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="批次号" prop="batchNum">
        <el-input
          v-model="queryParams.batchNum"
          placeholder="请输入批次号"
          clearable
          style="width: 190px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="零件代码" prop="partCode">
        <el-select
          v-model="queryParams.partCode"
          placeholder="零件代码"
          clearable
          style="width: 200px"
        >
          <el-option
            v-for="item in partList"
            :key="item.code"
            :label="item.code + ' - ' + item.name"
            :value="item.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="是否已处理" prop="handle">
        <el-select
          v-model="queryParams.handle"
          placeholder="处理状态"
          clearable
          style="width: 120px"
        >
          <el-option label="是" value="true"/>
          <el-option label="否" value="false"/>
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
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['vmd:vehicle:importData:add']"
        >新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['vmd:vehicle:importData:edit']"
        >解析处理
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['vmd:vehicle:importData:remove']"
        >删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['vmd:vehicle:importData:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="partImportDataList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="批次号" prop="batchNum" width="140" fixed="left"/>
      <el-table-column label="硬件零件号" prop="partCode" width="130" fixed="left"/>
      <el-table-column label="零件名称" prop="partName" min-width="250"/>
      <el-table-column label="车载节点" prop="vehicleNodeCode" width="150" align="center"/>
      <el-table-column label="数据版本" prop="version" align="center" width="80"/>
      <el-table-column label="是否已处理" align="center" width="100">
        <template slot-scope="scope">
          <span>{{ scope.row.handle ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="300" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-if="scope.row.handle === false"
            v-hasPermi="['vmd:vehicle:importData:edit']"
          >解析处理
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleDetail(scope.row)"
            v-if="scope.row.handle === true"
          >详情
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-refresh"
            @click="handleReimport(scope.row)"
            v-if="scope.row.handle === true"
            v-hasPermi="['vmd:importOperation:execute']"
          >重导
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-refresh-right"
            :disabled="scope.row.postProcessReplayable === false"
            :title="scope.row.postProcessReplayable === false ? scope.row.postProcessReplayReason : ''"
            @click="handleReplay(scope.row)"
            v-hasPermi="['vmd:partImportData:replayPostProcess']"
          >补发
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['vmd:vehicle:importData:remove']"
          >删除
          </el-button>
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

    <!-- 添加或修改零件导入数据配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="批次号" prop="batchNum">
          <el-input v-model="form.batchNum" placeholder="请输入批次号"/>
        </el-form-item>
        <el-form-item label="硬件零件号" prop="partCode">
          <el-select
            v-model="form.partCode"
            placeholder="硬件零件号"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in partList"
              :key="item.code"
              :label="item.code + ' - ' + item.name"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数据版本" prop="version">
          <el-input v-model="form.version" placeholder="请输入数据版本"/>
        </el-form-item>
        <el-form-item label="零件数据" prop="data">
          <el-input v-model="form.data" type="textarea" placeholder="请输入零件数据" :rows="10"/>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">解析处理</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 零件导入数据详情对话框 -->
    <el-dialog title="零件导入数据详情" :visible.sync="detailOpen" width="800px" append-to-body>
      <el-form :model="detailForm" label-width="120px">
        <el-form-item label="批次号">
          <el-input v-model="detailForm.batchNum" disabled/>
        </el-form-item>
        <el-form-item label="零件代码">
          <el-select
            v-model="detailForm.partCode"
            disabled
            style="width: 100%"
          >
            <el-option
              v-for="item in partList"
              :key="item.code"
              :label="item.code + ' - ' + item.name"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="零件名称">
          <el-input v-model="detailForm.partName" disabled/>
        </el-form-item>
        <el-form-item label="车载节点">
          <el-input v-model="detailForm.vehicleNodeCode" disabled/>
        </el-form-item>
        <el-form-item label="数据版本">
          <el-input v-model="detailForm.version" disabled/>
        </el-form-item>
        <el-form-item label="是否已处理">
          <el-input :value="detailForm.handle ? '是' : '否'" disabled/>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-input :value="parseTime(detailForm.createTime, '{y}-{m}-{d} {h}:{i}:{s}')" disabled/>
        </el-form-item>
        <el-form-item label="零件数据">
          <el-input v-model="detailForm.data" type="textarea" disabled :rows="15"/>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="detailForm.description" type="textarea" disabled/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailOpen = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 零件导入数据补发（后置处理重放）对话框 -->
    <el-dialog title="零件导入数据补发" :visible.sync="replayOpen" width="900px" append-to-body>
      <el-alert
        title="补发仅重新执行导入后的后置处理（跨域事件、下游联动、绑定事实事件、安全常量补偿），不会重新解析导入数据，也不会修改零件主体与绑定关系。"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      />
      <el-form ref="replayForm" :model="replayForm" label-width="120px">
        <el-form-item label="批次号">
          <span>{{ replayForm.batchNum }}</span>
        </el-form-item>
        <el-form-item label="硬件零件号">
          <span>{{ replayForm.partCode }}{{ replayForm.partName ? ' - ' + replayForm.partName : '' }}</span>
        </el-form-item>
        <el-form-item label="补发动作">
          <el-table
            ref="actionTable"
            :data="replayForm.actionPreview"
            size="mini"
            border
            row-key="actionType"
            @selection-change="handleActionSelectionChange"
          >
            <el-table-column type="selection" width="45" align="center" :selectable="row => row.applicable"/>
            <el-table-column label="动作" prop="label" min-width="150"/>
            <el-table-column label="动作类型" prop="actionType" width="170"/>
            <el-table-column label="是否适用" align="center" width="90">
              <template slot-scope="scope">
                <el-tag :type="scope.row.applicable ? 'success' : 'info'" size="mini">
                  {{ scope.row.applicable ? '适用' : '不适用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="不适用原因" prop="reason" min-width="150" show-overflow-tooltip/>
          </el-table>
          <div class="replay-tip">不勾选任何动作时，按服务端判定补发全部适用动作。</div>
        </el-form-item>
        <el-form-item label="仅重试失败项">
          <el-switch v-model="replayForm.retryFailedOnly"/>
          <span class="replay-tip">开启后仅继续上一次补发中失败或未完成的动作。</span>
        </el-form-item>
        <el-form-item label="请求ID">
          <el-input v-model="replayForm.requestId" placeholder="可选，作为幂等键；留空由服务端生成"/>
        </el-form-item>
        <el-form-item label="补发原因">
          <el-input v-model="replayForm.reason" type="textarea" :rows="2" placeholder="可选，将进入审计"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" :loading="replaySubmitting" @click="submitReplay">确 定</el-button>
        <el-button @click="replayOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 补发结果对话框 -->
    <el-dialog title="补发结果" :visible.sync="replayResultOpen" width="900px" append-to-body>
      <div v-loading="replayResultLoading">
        <el-descriptions title="任务概要" :column="3" border size="small">
          <el-descriptions-item label="补发请求ID" :span="2">{{ replayResult.replayId }}</el-descriptions-item>
          <el-descriptions-item label="任务状态">
            <el-tag :type="replayStatusTagType(replayResult.status)" size="mini">
              {{ replayStatusLabel(replayResult.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="批次号">{{ replayResult.batchNum }}</el-descriptions-item>
          <el-descriptions-item label="候选实例数">{{ replayResult.totalItemCount }}</el-descriptions-item>
          <el-descriptions-item label="规划动作数">{{ replayResult.totalActionCount }}</el-descriptions-item>
          <el-descriptions-item label="成功">{{ replayResult.successCount }}</el-descriptions-item>
          <el-descriptions-item label="已入Outbox">{{ replayResult.queuedCount }}</el-descriptions-item>
          <el-descriptions-item label="跳过">{{ replayResult.skippedCount }}</el-descriptions-item>
          <el-descriptions-item label="失败">
            <span :class="{ 'replay-fail-count': replayResult.failureCount > 0 }">{{ replayResult.failureCount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="操作人">{{ replayResult.operatorName }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ parseTime(replayResult.startedAt) }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ parseTime(replayResult.finishedAt) }}</el-descriptions-item>
          <el-descriptions-item label="补发原因" :span="2">{{ replayResult.reason }}</el-descriptions-item>
          <el-descriptions-item label="动作范围">{{ replayResult.scope || '全部适用动作' }}</el-descriptions-item>
        </el-descriptions>

        <div class="replay-section-title">动作明细</div>
        <el-table :data="replayResult.items || []" size="mini" border max-height="340">
          <el-table-column label="硬件零件号" prop="partCode" width="130"/>
          <el-table-column label="SN" prop="sn" min-width="150" show-overflow-tooltip/>
          <el-table-column label="动作" width="170">
            <template slot-scope="scope">
              <span>{{ actionTypeLabel(scope.row.actionType) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center" width="110">
            <template slot-scope="scope">
              <el-tag :type="actionStatusTagType(scope.row.status)" size="mini">
                {{ actionStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="尝试次数" prop="attemptCount" align="center" width="80"/>
          <el-table-column label="失败/跳过原因" min-width="200" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.errorMessage || scope.row.skipReason }}</span>
            </template>
          </el-table-column>
          <el-table-column label="结束时间" align="center" width="140">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.finishedAt, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!replayResult.items || replayResult.items.length === 0" description="暂无动作明细" :image-size="80"/>

        <div v-if="replayFailures.length > 0" class="replay-section-title">失败摘要</div>
        <ul v-if="replayFailures.length > 0" class="replay-failure-list">
          <li v-for="(failure, index) in replayFailures" :key="index">{{ failure }}</li>
        </ul>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button icon="el-icon-refresh" @click="refreshReplayResult">刷 新</el-button>
        <el-button
          type="primary"
          :disabled="!replayResult.failureCount"
          @click="handleRetryFailed"
          v-hasPermi="['vmd:partImportData:replayPostProcess']"
        >仅重试失败项
        </el-button>
        <el-button @click="replayResultOpen = false">关 闭</el-button>
      </div>
    </el-dialog>

    <reimport-dialog
      :visible.sync="reimportOpen"
      :domain="reimportDomain"
      :import-data-id="reimportImportDataId"
      :batch-num="reimportBatchNum"
    />
  </div>
</template>

<script>
import {
  listPartImportData,
  getPartImportData,
  addPartImportData,
  updatePartImportData,
  delPartImportData,
  replayPartImportPostProcess,
  getPartImportPostProcessReplay
} from "@/api/vmd/partImportData";
import { listAllParts } from "@/api/mdm/part";
import ReimportDialog from "@/views/vmd/importOperation/reimportDialog";

// 补发动作类型（与 VMD PartPostProcessActionType 对齐）
const ACTION_TYPE_OPTIONS = [
  { value: 'PART_INBOUND_EVENT', label: '零件入站跨域事件' },
  { value: 'TSP_SYNC', label: 'TSP 下游联动' },
  { value: 'OTA_SYNC', label: 'OTA 下游联动' },
  { value: 'IDK_SYNC', label: 'IDK 下游联动' },
  { value: 'BINDING_FACT_EVENT', label: '绑定事实事件' },
  { value: 'SECURITY_PRESET', label: '器件安全常量补偿' }
];

// 补发主任务状态（与 VMD PartPostProcessReplayStatus 对齐）
const REPLAY_STATUS_OPTIONS = [
  { value: 'PENDING', label: '待执行', tag: 'info' },
  { value: 'RUNNING', label: '执行中', tag: '' },
  { value: 'PARTIAL_SUCCESS', label: '部分成功', tag: 'warning' },
  { value: 'SUCCESS', label: '成功', tag: 'success' },
  { value: 'FAILED', label: '失败', tag: 'danger' }
];

// 补发动作状态（与 VMD PartPostProcessActionStatus 对齐）
const ACTION_STATUS_OPTIONS = [
  { value: 'PENDING', label: '待执行', tag: 'info' },
  { value: 'RUNNING', label: '执行中', tag: '' },
  { value: 'QUEUED', label: '事件已入Outbox', tag: 'warning' },
  { value: 'SUCCESS', label: '成功', tag: 'success' },
  { value: 'SKIPPED', label: '已跳过', tag: 'info' },
  { value: 'FAILED_RETRYABLE', label: '可重试失败', tag: 'danger' },
  { value: 'FAILED_FINAL', label: '终态失败', tag: 'danger' }
];

export default {
  name: "VmdImportData",
  dicts: [],
  components: { ReimportDialog },
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
      // 零件导入数据表格数据
      partImportDataList: [],
      // 零件列表
      partList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 是否显示详情弹出层
      detailOpen: false,
      // 详情表单参数
      detailForm: {},
      // 是否显示补发弹出层
      replayOpen: false,
      // 补发表单参数
      replayForm: {
        actionPreview: []
      },
      // 补发选中的动作范围
      replayScope: [],
      // 补发提交中
      replaySubmitting: false,
      // 是否显示补发结果弹出层
      replayResultOpen: false,
      // 补发结果加载中
      replayResultLoading: false,
      // 补发结果
      replayResult: {},
      // 补发失败摘要
      replayFailures: [],
      // 当前补发的零件导入数据ID
      replayPartImportDataId: undefined,
      // 重导对话框
      reimportOpen: false,
      reimportDomain: 'PART',
      reimportImportDataId: undefined,
      reimportBatchNum: undefined,
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
        batchNum: [
          {required: true, message: "批次号不能为空", trigger: "blur"}
        ],
        partCode: [
          {required: true, message: "零件代码不能为空", trigger: "change"}
        ],
        version: [
          {required: true, message: "数据版本不能为空", trigger: "blur"}
        ],
        data: [
          {required: true, message: "零件数据不能为空", trigger: "blur"}
        ]
      },
    };
  },
  created() {
    this.getList();
    this.loadPartList();
  },
  methods: {
    /** 查询零件导入数据列表 */
    getList() {
      this.loading = true;
      listPartImportData(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.partImportDataList = response.data.items;
          this.total = response.data.total;
          this.loading = false;
        }
      );
    },
    // 获取数据类型
    getDataTypeLabel(dataType) {
      const item = this.partList.find(part => part.code === dataType);
      return item ? item.code + ' - ' + item.name : dataType;
    },
    // 加载零件列表（只获取硬件总成零件）
    loadPartList() {
      listAllParts({ isSoftware: false, isAssembly: true }).then(response => {
        this.partList = response.data || [];
      });
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 表单重置 */
    reset() {
      this.form = {
        batchNum: undefined,
        partCode: undefined,
        version: undefined,
        data: undefined,
        description: undefined
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
      this.reset();
      this.open = true;
      this.title = "添加零件导入数据";
      const now = new Date();
      const batchNum = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0');
      this.form = {
        batchNum: batchNum,
        version: "1.0"
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const partImportDataId = row.id || this.ids
      getPartImportData(partImportDataId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改零件导入数据";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updatePartImportData(this.form).then(response => {
              this.handleImportResult(response, "修改");
              this.open = false;
              this.getList();
            });
          } else {
            addPartImportData(this.form).then(response => {
              this.handleImportResult(response, "新增");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 根据解析结果提示成功或失败（有失败项时展示具体错误） */
    handleImportResult(response, action) {
      const data = response.data;
      if (data && data.failureCount > 0) {
        let msg = action + "成功，但有 " + data.failureCount + " 条处理失败";
        if (data.description) {
          msg += "：\n" + data.description;
        }
        this.$modal.alertError(msg);
      } else {
        this.$modal.msgSuccess(action + "成功");
      }
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const partImportDataIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除零件导入数据ID为"' + partImportDataIds + '"的数据项？').then(function () {
        return delPartImportData(partImportDataIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('edd-vmd/api/mpt/partImportData/v1/export', {
        ...this.queryParams
      }, `part_import_data_${new Date().getTime()}.xlsx`)
    },
    /** 详情按钮操作 */
    handleDetail(row) {
      const partImportDataId = row.id || this.ids;
      getPartImportData(partImportDataId).then(response => {
        this.detailForm = response.data;
        this.detailOpen = true;
      });
    },
    /** 补发按钮操作：打开二次确认弹窗并展示动作预览 */
    handleReplay(row) {
      getPartImportData(row.id).then(response => {
        const data = response.data || {};
        if (data.postProcessReplayable === false) {
          this.$modal.msgError(data.postProcessReplayReason || "该零件导入数据不允许补发");
          return;
        }
        this.replayPartImportDataId = data.id;
        this.replayScope = [];
        this.replayForm = {
          batchNum: data.batchNum,
          partCode: data.partCode,
          partName: data.partName,
          actionPreview: data.postProcessActionPreview || [],
          retryFailedOnly: false,
          requestId: undefined,
          reason: undefined
        };
        this.replayOpen = true;
      });
    },
    /** 重导按钮操作：打开统一操作门面 REIMPORT 对话框 */
    handleReimport(row) {
      this.reimportImportDataId = row.id;
      this.reimportBatchNum = row.batchNum;
      this.reimportOpen = true;
    },
    /** 补发动作多选 */
    handleActionSelectionChange(selection) {
      this.replayScope = selection.map(item => item.actionType);
    },
    /** 提交补发 */
    submitReplay() {
      this.replaySubmitting = true;
      this.doReplay({
        reason: this.replayForm.reason,
        requestId: this.replayForm.requestId,
        scope: this.replayScope.length > 0 ? this.replayScope : undefined,
        retryFailedOnly: this.replayForm.retryFailedOnly === true
      }).finally(() => {
        this.replaySubmitting = false;
      });
    },
    /** 仅重试失败项 */
    handleRetryFailed() {
      this.$modal.confirm('是否确认仅重试本次补发中失败或未完成的动作？').then(() => {
        return this.doReplay({
          reason: this.replayResult.reason,
          requestId: this.replayResult.replayId,
          retryFailedOnly: true
        });
      }).catch(() => {
      });
    },
    /** 执行补发并展示结果 */
    doReplay(data) {
      return replayPartImportPostProcess(this.replayPartImportDataId, data).then(response => {
        const result = response.data || {};
        this.replayFailures = result.failures || [];
        this.replayOpen = false;
        this.replayResultOpen = true;
        if (result.failureCount > 0) {
          this.$modal.msgWarning("补发完成，存在 " + result.failureCount + " 个失败动作");
        } else {
          this.$modal.msgSuccess("补发成功");
        }
        this.getList();
        return this.loadReplayResult(result.replayId);
      });
    },
    /** 加载补发任务及动作明细 */
    loadReplayResult(replayId) {
      if (!replayId) {
        return Promise.resolve();
      }
      this.replayResultLoading = true;
      return getPartImportPostProcessReplay(replayId).then(response => {
        this.replayResult = response.data || {};
      }).finally(() => {
        this.replayResultLoading = false;
      });
    },
    /** 刷新补发结果 */
    refreshReplayResult() {
      this.loadReplayResult(this.replayResult.replayId);
    },
    /** 动作类型名称 */
    actionTypeLabel(actionType) {
      const item = ACTION_TYPE_OPTIONS.find(option => option.value === actionType);
      return item ? item.label : actionType;
    },
    /** 主任务状态名称 */
    replayStatusLabel(status) {
      const item = REPLAY_STATUS_OPTIONS.find(option => option.value === status);
      return item ? item.label : status;
    },
    /** 主任务状态标签类型 */
    replayStatusTagType(status) {
      const item = REPLAY_STATUS_OPTIONS.find(option => option.value === status);
      return item ? item.tag : 'info';
    },
    /** 动作状态名称 */
    actionStatusLabel(status) {
      const item = ACTION_STATUS_OPTIONS.find(option => option.value === status);
      return item ? item.label : status;
    },
    /** 动作状态标签类型 */
    actionStatusTagType(status) {
      const item = ACTION_STATUS_OPTIONS.find(option => option.value === status);
      return item ? item.tag : 'info';
    }
  }
};
</script>

<style scoped>
.replay-tip {
  color: #909399;
  font-size: 12px;
  line-height: 20px;
  margin-left: 8px;
}

.replay-section-title {
  margin: 16px 0 8px;
  font-weight: bold;
}

.replay-fail-count {
  color: #f56c6c;
  font-weight: bold;
}

.replay-failure-list {
  margin: 0;
  padding-left: 20px;
  color: #f56c6c;
  font-size: 12px;
  line-height: 20px;
}
</style>
