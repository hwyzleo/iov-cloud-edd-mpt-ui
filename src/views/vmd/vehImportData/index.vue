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
      <el-form-item label="数据类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="数据类型"
          clearable
          style="width: 200px"
        >
          <el-option
            v-for="item in typeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="是否已处理" prop="handle">
        <el-select
          v-model="queryParams.handle"
          placeholder="处理状态"
          clearable
          style="width: 200px"
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
          v-hasPermi="['completeVehicle:vehicle:importData:add']"
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
          v-hasPermi="['completeVehicle:vehicle:importData:edit']"
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
          v-hasPermi="['completeVehicle:vehicle:importData:remove']"
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
          v-hasPermi="['completeVehicle:vehicle:importData:export']"
        >导出
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-refresh-right"
          size="mini"
          :disabled="multiple"
          @click="handleBatchRepublish"
          v-hasPermi="['completeVehicle:vehicle:importData:replay']"
        >批量补发
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="vehImportDataList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="批次号" prop="batchNum" min-width="150" fixed="left"/>
      <el-table-column label="数据类型" prop="type" align="center" width="150">
        <template slot-scope="scope">
          <span>{{ getTypeLabel(scope.row.type) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="数据版本" prop="version" align="center" width="150"/>
      <el-table-column label="是否已处理" align="center" width="150">
        <template slot-scope="scope">
          <span>{{ scope.row.handle ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="可补发动作" align="center" min-width="220">
        <template slot-scope="scope">
          <template v-if="scope.row.replayActionTypes && scope.row.replayActionTypes.length">
            <el-tag
              v-for="actionType in scope.row.replayActionTypes"
              :key="actionType"
              size="mini"
              type="info"
              style="margin: 2px"
            >{{ getActionLabel(actionType) }}</el-tag>
          </template>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="260" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-if="scope.row.handle === false"
            v-hasPermi="['completeVehicle:vehicle:importData:edit']"
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
          <el-tooltip
            v-if="scope.row.eventReplayable === false && scope.row.eventReplayReason"
            :content="scope.row.eventReplayReason"
            placement="top"
          >
            <span style="margin: 0 4px">
              <el-button size="mini" type="text" icon="el-icon-refresh-right" disabled>补发</el-button>
            </span>
          </el-tooltip>
          <el-button
            v-else
            size="mini"
            type="text"
            icon="el-icon-refresh-right"
            :disabled="scope.row.eventReplayable === false"
            @click="handleRepublish(scope.row)"
            v-hasPermi="['completeVehicle:vehicle:importData:replay']"
          >补发
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['completeVehicle:vehicle:importData:remove']"
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

    <!-- 添加或修改车辆导入数据配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="批次号" prop="batchNum">
          <el-input v-model="form.batchNum" placeholder="请输入批次号"/>
        </el-form-item>
        <el-form-item label="数据类型" prop="type">
          <el-select
            v-model="form.type"
            placeholder="数据类型"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数据版本" prop="version">
          <el-input v-model="form.version" placeholder="请输入数据版本"/>
        </el-form-item>
        <el-form-item label="车辆数据" prop="data">
          <el-input v-model="form.data" type="textarea" placeholder="请输入车辆数据" :rows="10"/>
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

    <!-- 车辆导入数据详情对话框 -->
    <el-dialog title="车辆导入数据详情" :visible.sync="detailOpen" width="800px" append-to-body>
      <el-form :model="detailForm" label-width="120px">
        <el-form-item label="批次号">
          <el-input v-model="detailForm.batchNum" disabled/>
        </el-form-item>
        <el-form-item label="数据类型">
          <el-select
            v-model="detailForm.type"
            disabled
            style="width: 100%"
          >
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
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
        <el-form-item label="车辆数据">
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

    <!-- 车辆导入事件补发对话框（预检 → 选择动作 → 执行 → 结果） -->
    <el-dialog title="车辆导入事件补发" :visible.sync="replayOpen" width="760px" append-to-body @closed="resetReplay">
      <div v-loading="replayLoading">
        <!-- 预检信息 -->
        <el-descriptions v-if="replayPreview" :column="3" border size="small" style="margin-bottom: 12px">
          <el-descriptions-item label="批次号">{{ replayPreview.batchNum }}</el-descriptions-item>
          <el-descriptions-item label="导入类型">{{ getTypeLabel(replayPreview.importType) }}</el-descriptions-item>
          <el-descriptions-item label="候选车辆数">{{ replayPreview.candidateVinCount }}</el-descriptions-item>
        </el-descriptions>

        <!-- 动作选择（仅可提交预检返回的可选动作） -->
        <template v-if="replayPreview && !replayResult">
          <el-alert
            title="请选择需要补发的动作，仅可提交预检返回的动作。跳过项表示候选范围内无可执行目标。"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 12px"
          />
          <el-checkbox-group v-model="replaySelectedActions">
            <el-table :data="replayPreview.actions" border size="small">
              <el-table-column label="选择" align="center" width="60">
                <template slot-scope="scope">
                  <el-checkbox :label="scope.row.actionType" :disabled="scope.row.eligibleCount <= 0">
                    <span></span>
                  </el-checkbox>
                </template>
              </el-table-column>
              <el-table-column label="动作" prop="actionName" min-width="180"/>
              <el-table-column label="可执行数" prop="eligibleCount" align="center" width="90"/>
              <el-table-column label="跳过数" prop="skipCount" align="center" width="80"/>
              <el-table-column label="跳过原因" prop="reason" min-width="200">
                <template slot-scope="scope">
                  <span>{{ scope.row.reason || '-' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-checkbox-group>
        </template>

        <!-- 执行结果（分动作） -->
        <template v-if="replayResult">
          <el-alert
            :title="replayResultSummary"
            :type="replayResult.failureCount > 0 ? 'warning' : 'success'"
            :closable="false"
            show-icon
            style="margin-bottom: 12px"
          />
          <el-table :data="replayResult.actionResults || []" border size="small">
            <el-table-column label="动作" min-width="180">
              <template slot-scope="scope">
                <span>{{ getActionLabel(scope.row.actionType) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="目标数" prop="totalCount" align="center" width="80"/>
            <el-table-column label="入队" prop="queuedCount" align="center" width="70"/>
            <el-table-column label="成功" prop="successCount" align="center" width="70"/>
            <el-table-column label="跳过" prop="skipCount" align="center" width="70"/>
            <el-table-column label="失败" prop="failureCount" align="center" width="70"/>
          </el-table>
          <div v-if="replayResult.failures && replayResult.failures.length" style="margin-top: 12px">
            <el-alert
              v-for="(failure, index) in replayResult.failures"
              :key="index"
              :title="failure"
              type="error"
              :closable="false"
              style="margin-bottom: 6px"
            />
          </div>
        </template>
      </div>
      <div slot="footer" class="dialog-footer">
        <template v-if="!replayResult">
          <el-button
            type="primary"
            :loading="replaySubmitting"
            :disabled="replayLoading || replaySelectedActions.length === 0"
            @click="submitReplay"
          >执行补发
          </el-button>
          <el-button @click="replayOpen = false">取 消</el-button>
        </template>
        <el-button v-else @click="replayOpen = false">关 闭</el-button>
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
  listVehImportData,
  getVehImportData,
  addVehImportData,
  updateVehImportData,
  delVehImportData,
  republishVehImportData,
  previewReplayEvent
} from "@/api/vmd/vehImportData";
import ReimportDialog from "@/views/vmd/importOperation/reimportDialog";

export default {
  name: "VehImportData",
  dicts: [],
  components: { ReimportDialog },
  data() {
    return {
      // 数据类型选项
      typeOptions: [
        { label: '车辆生产', value: 'PRODUCE' },
        { label: '总装上线', value: 'TOL' },
        { label: '电检下线', value: 'EOL' }
      ],
      // 补发动作类型标签映射（与后端 VehicleImportReplayActionType 一致）
      actionTypeLabels: {
        PRODUCE_EVENT: '生产事件补发',
        TOL_LIFECYCLE_ENSURE: 'TOL 生命周期节点补齐',
        EOL_LIFECYCLE_ENSURE: 'EOL 生命周期节点补齐',
        BINDING_EVENT_REPLAY: '绑定变更事件重放',
        SOFTWARE_INVENTORY_EVENT_REPLAY: '软件实装事件重放'
      },
      // 补发对话框
      replayOpen: false,
      // 补发预检加载中
      replayLoading: false,
      // 补发提交中
      replaySubmitting: false,
      // 当前补发行
      replayRow: {},
      // 重导对话框
      reimportOpen: false,
      reimportDomain: 'VEHICLE',
      reimportImportDataId: undefined,
      reimportBatchNum: undefined,
      // 补发预检结果
      replayPreview: null,
      // 已选补发动作类型
      replaySelectedActions: [],
      // 补发执行结果
      replayResult: null,
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
      // 车辆导入数据表格数据
      vehImportDataList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 是否显示详情弹出层
      detailOpen: false,
      // 详情表单参数
      detailForm: {},
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
        type: [
          {required: true, message: "数据类型不能为空", trigger: "change"}
        ],
        version: [
          {required: true, message: "数据版本不能为空", trigger: "blur"}
        ],
        data: [
          {required: true, message: "车辆数据不能为空", trigger: "blur"}
        ]
      },
    };
  },
  created() {
    this.getList();
  },
  computed: {
    /** 补发结果汇总文案 */
    replayResultSummary() {
      if (!this.replayResult) {
        return '';
      }
      const r = this.replayResult;
      return `补发完成：目标总数 ${r.totalCount}，入队 ${r.queuedCount}，成功 ${r.successCount}，跳过 ${r.skipCount}，失败 ${r.failureCount}`;
    }
  },
  methods: {
    /** 获取数据类型标签 */
    getTypeLabel(type) {
      const item = this.typeOptions.find(item => item.value === type);
      return item ? item.label : type;
    },
    /** 获取补发动作类型标签 */
    getActionLabel(actionType) {
      return this.actionTypeLabels[actionType] || actionType;
    },
    /** 查询车辆导入数据列表 */
    getList() {
      this.loading = true;
      listVehImportData(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.vehImportDataList = response.data.items;
          this.total = response.data.total;
          this.loading = false;
        }
      );
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
        type: undefined,
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
      this.title = "添加车辆导入数据";
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
      const vehImportDataId = row.id || this.ids
      getVehImportData(vehImportDataId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改车辆导入数据";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateVehImportData(this.form).then(response => {
              this.handleImportResult(response, "修改");
              this.open = false;
              this.getList();
            });
          } else {
            addVehImportData(this.form).then(response => {
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
      const vehImportDataIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除车辆导入数据ID为"' + vehImportDataIds + '"的数据项？').then(function () {
        return delVehImportData(vehImportDataIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('edd-vmd/api/mpt/vehImportData/v1/export', {
        ...this.queryParams
      }, `veh_import_data_${new Date().getTime()}.xlsx`)
    },
    /** 补发按钮操作：打开对话框并预检 */
    handleRepublish(row) {
      this.resetReplay();
      this.replayRow = row;
      this.replayOpen = true;
      this.replayLoading = true;
      previewReplayEvent(row.id).then(response => {
        this.replayPreview = response.data;
        // 默认勾选所有可执行动作（TOL/EOL 默认全选，PRODUCE 仅 PRODUCE_EVENT）
        this.replaySelectedActions = (this.replayPreview.actions || [])
          .filter(action => action.eligibleCount > 0)
          .map(action => action.actionType);
      }).catch(() => {
        this.replayOpen = false;
      }).finally(() => {
        this.replayLoading = false;
      });
    },
    /** 重导按钮操作：打开统一操作门面 REIMPORT 对话框 */
    handleReimport(row) {
      this.reimportImportDataId = row.id;
      this.reimportBatchNum = row.batchNum;
      this.reimportOpen = true;
    },
    /** 提交补发（仅提交预检返回且勾选的动作） */
    submitReplay() {
      if (this.replaySelectedActions.length === 0) {
        this.$modal.msgWarning("请至少选择一个补发动作");
        return;
      }
      this.replaySubmitting = true;
      const data = {
        actionTypes: this.replaySelectedActions
      };
      republishVehImportData(this.replayRow.id, data).then(response => {
        this.replayResult = response.data;
        this.$modal.msgSuccess("补发已执行");
        this.getList();
      }).finally(() => {
        this.replaySubmitting = false;
      });
    },
    /** 重置补发对话框状态 */
    resetReplay() {
      this.replayRow = {};
      this.replayPreview = null;
      this.replaySelectedActions = [];
      this.replayResult = null;
      this.replayLoading = false;
      this.replaySubmitting = false;
    },
    /** 批量补发按钮操作 */
    handleBatchRepublish() {
      this.$modal.confirm('是否确认批量补发选中的 ' + this.ids.length + ' 条车辆导入数据？').then(() => {
        const promises = this.ids.map(id => republishVehImportData(id))
        return Promise.all(promises)
      }).then(() => {
        this.$modal.msgSuccess("批量补发成功")
        this.getList()
      }).catch(() => {})
    },
    /** 详情按钮操作 */
    handleDetail(row) {
      const vehImportDataId = row.id || this.ids;
      getVehImportData(vehImportDataId).then(response => {
        this.detailForm = response.data;
        this.detailOpen = true;
      });
    }
  }
};
</script>
