<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="报告类型" prop="reportType">
        <el-select
          v-model="queryParams.reportType"
          placeholder="报告类型"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="reportType in this.reportTypeList"
            :key="reportType.code"
            :label="reportType.name"
            :value="reportType.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="场景" prop="scene">
        <el-select
          v-model="queryParams.scene"
          placeholder="场景"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="scene in this.sceneList"
            :key="scene.code"
            :label="scene.name"
            :value="scene.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="报告状态" prop="reportState">
        <el-select
          v-model="queryParams.reportState"
          placeholder="报告状态"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="reportState in this.reportStateList"
            :key="reportState.code"
            :label="reportState.name"
            :value="reportState.code"
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
          v-hasPermi="['edd:rsms:gbInspectionReport:add']"
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
          v-hasPermi="['edd:rsms:gbInspectionReport:edit']"
        >修改
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
          v-hasPermi="['edd:rsms:gbInspectionReport:remove']"
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
          v-hasPermi="['edd:rsms:gbInspectionReport:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="gbInspectionReportList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="检测开始时间" align="center" prop="startTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.startTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="检测结束时间" align="center" prop="endTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.endTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="报告类型" align="center" prop="reportType" width="150">
        <template slot-scope="scope">
          <span>{{ getReportType(scope.row.reportType) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="场景" align="center" prop="scene" width="150">
        <template slot-scope="scope">
          <span>{{ getScene(scope.row.scene) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="车型或车架号" prop="vehicle"/>
      <el-table-column label="报告状态" align="center" prop="reportState" width="150">
        <template slot-scope="scope">
          <span>{{ getReportState(scope.row.reportState) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleResult(scope.row)"
            :disabled="scope.row.reportState !== 2"
            v-hasPermi="['edd:rsms:gbInspectionReport:query']"
          >报告
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['edd:rsms:gbInspectionReport:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['edd:rsms:gbInspectionReport:remove']"
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

    <!-- 添加或修改国标检测报告对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="750px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="130px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="检测开始时间" prop="startTime">
              <el-date-picker
                v-model="form.startTime"
                type="datetime"
                placeholder="请选择检测开始时间"
                value-format="timestamp"
                :readonly="form.id !== undefined"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检测结束时间" prop="endTime">
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                placeholder="请选择检测结束时间"
                value-format="timestamp"
                :readonly="form.id !== undefined"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="报告类型" prop="reportType">
              <el-select
                v-model="form.reportType"
                placeholder="报告类型"
                clearable
                style="width: 140px"
                :readonly="form.id !== undefined"
              >
                <el-option
                  v-for="reportType in this.reportTypeList"
                  :key="reportType.code"
                  :label="reportType.name"
                  :value="reportType.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="场景" prop="scene">
              <el-select
                v-model="form.scene"
                placeholder="场景"
                clearable
                style="width: 140px"
                :readonly="form.id !== undefined"
              >
                <el-option
                  v-for="scene in this.sceneList"
                  :key="scene.code"
                  :label="scene.name"
                  :value="scene.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="车型或车架号" prop="vehicle">
          <el-input v-model="form.vehicle" :readonly="form.id !== undefined" placeholder="请输入车型或车架号"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 报告结果层 -->
    <el-drawer title="国标检测报告" :visible.sync="openResult" direction="rtl" size="80%" :modal="true"
               :append-to-body="true">
      <div class="drawer-content">
        <el-row class="drawer-row">
          <el-col :span="6">报告类型:</el-col>
          <el-col :span="6">{{ formResult.reportTypeName }}</el-col>
          <el-col :span="6">车型或车架号:</el-col>
          <el-col :span="6">{{ formResult.vehicle }}</el-col>
        </el-row>
        <el-row class="drawer-row">
          <el-col :span="6">检测开始时间:</el-col>
          <el-col :span="6">{{ parseTime(formResult.startTime) }} </el-col>
          <el-col :span="6">检测结束时间:</el-col>
          <el-col :span="6">{{ parseTime(formResult.endTime) }}</el-col>
        </el-row>
        <el-row class="drawer-row">
          <el-col :span="6">数据开始时间:</el-col>
          <el-col :span="6">{{ parseTime(formResult.dataStartTime) }}</el-col>
          <el-col :span="6">数据结束时间:</el-col>
          <el-col :span="6">{{ parseTime(formResult.dataEndTime) }}</el-col>
        </el-row>
        <el-row class="drawer-row">
          <el-col :span="6">错误车辆数 / 车辆总数:</el-col>
          <el-col :span="6">{{ formResult.vehicleErrorCount }} / {{ formResult.vehicleCount }}</el-col>
          <el-col :span="6">错误占比:</el-col>
          <el-col :span="6">{{ formResult.vehicleErrorPercentage }}%</el-col>
        </el-row>
        <el-row class="drawer-row">
          <el-col :span="6">错误消息数 / 消息总数:</el-col>
          <el-col :span="6">{{ formResult.messageErrorCount }} / {{ formResult.messageCount }}</el-col>
          <el-col :span="6">错误占比:</el-col>
          <el-col :span="6">{{ formResult.messageErrorPercentage }}%</el-col>
        </el-row>
        <el-row class="drawer-row">
          <el-col :span="6">错误数据数 / 数据总数:</el-col>
          <el-col :span="6">{{ formResult.dataErrorCount }} / {{ formResult.dataCount }}</el-col>
          <el-col :span="6">错误占比:</el-col>
          <el-col :span="6">{{ formResult.dataErrorPercentage }}%</el-col>
        </el-row>
        <div v-if="formResult.items">
          <div v-if="formResult.items.STANDARD">
            <el-divider></el-divider>
            <div class="drawer-title">• 标准检测</div>
            <div v-if="formResult.items.STANDARD.ABNORMAL">
              <div class="drawer-title">◦ 数据异常</div>
              <div v-if="formResult.items.STANDARD.ABNORMAL.SPEED_ABNORMAL">
                <div class="drawer-title">▪ 车速</div>
                <el-row class="drawer-row">
                  <el-col :span="6">错误数据 / 总数据:</el-col>
                  <el-col :span="6">
                    {{ formResult.items.STANDARD.ABNORMAL.SPEED_ABNORMAL.errorDataCount }} /
                    {{ formResult.items.STANDARD.ABNORMAL.SPEED_ABNORMAL.totalDataCount }}
                  </el-col>
                  <el-col :span="6">错误占比:</el-col>
                  <el-col :span="6">
                    {{ formResult.items.STANDARD.ABNORMAL.SPEED_ABNORMAL.errorVehiclePercentage }}%
                  </el-col>
                </el-row>
                <el-row class="drawer-row">
                  <el-col :span="6">错误车辆 / 总车辆:</el-col>
                  <el-col :span="6">
                    {{ formResult.items.STANDARD.ABNORMAL.SPEED_ABNORMAL.errorVehicleCount }} /
                    {{ formResult.items.STANDARD.ABNORMAL.SPEED_ABNORMAL.totalVehicleCount }}
                  </el-col>
                  <el-col :span="6">错误占比:</el-col>
                  <el-col :span="6">
                    {{ formResult.items.STANDARD.ABNORMAL.SPEED_ABNORMAL.errorVehiclePercentage }}%
                  </el-col>
                </el-row>
              </div>
            </div>
          </div>
          <div v-if="formResult.items.INTEGRITY">
            <el-divider></el-divider>
            <div class="drawer-title">• 完整性检测</div>
          </div>
          <div v-if="formResult.items.ACCURACY">
            <el-divider></el-divider>
            <div class="drawer-title">• 准确性检测</div>
          </div>
          <div v-if="formResult.items.CONSISTENCY">
            <el-divider></el-divider>
            <div class="drawer-title">• 一致性检测</div>
            <div v-if="formResult.items.CONSISTENCY.INCONSISTENCY">
              <div class="drawer-title">◦ 数据不一致</div>
              <div v-if="formResult.items.CONSISTENCY.INCONSISTENCY.TOTAL_VOLTAGE_INCONSISTENCY">
                <div class="drawer-title">▪ 总电压与所有电芯电压累加不一致</div>
                <el-row class="drawer-row">
                  <el-col :span="6">错误数据 / 总数据:</el-col>
                  <el-col :span="6">
                    {{ formResult.items.CONSISTENCY.INCONSISTENCY.TOTAL_VOLTAGE_INCONSISTENCY.errorDataCount }} /
                    {{ formResult.items.CONSISTENCY.INCONSISTENCY.TOTAL_VOLTAGE_INCONSISTENCY.totalDataCount }}
                  </el-col>
                  <el-col :span="6">错误占比:</el-col>
                  <el-col :span="6">
                    {{ formResult.items.CONSISTENCY.INCONSISTENCY.TOTAL_VOLTAGE_INCONSISTENCY.errorDataPercentage }}%
                  </el-col>
                </el-row>
                <el-row class="drawer-row">
                  <el-col :span="6">错误车辆 / 总车辆:</el-col>
                  <el-col :span="6">
                    {{ formResult.items.CONSISTENCY.INCONSISTENCY.TOTAL_VOLTAGE_INCONSISTENCY.errorVehicleCount }} /
                    {{ formResult.items.CONSISTENCY.INCONSISTENCY.TOTAL_VOLTAGE_INCONSISTENCY.totalVehicleCount }}
                  </el-col>
                  <el-col :span="6">错误占比:</el-col>
                  <el-col :span="6">
                    {{ formResult.items.CONSISTENCY.INCONSISTENCY.TOTAL_VOLTAGE_INCONSISTENCY.errorVehiclePercentage }}%
                  </el-col>
                </el-row>
              </div>
            </div>
          </div>
          <div v-if="formResult.items.TIMELINESS">
            <el-divider></el-divider>
            <div class="drawer-title">• 时效性检测</div>
            <div v-if="formResult.items.TIMELINESS.DUPLICATE">
              <div class="drawer-title">◦ 重复性检测</div>
              <div v-if="formResult.items.TIMELINESS.DUPLICATE.MESSAGE_TIME_DUPLICATE">
                <div class="drawer-title">▪ 消息时间重复</div>
                <el-row class="drawer-row">
                  <el-col :span="6">错误数据 / 总数据:</el-col>
                  <el-col :span="6">
                    {{ formResult.items.TIMELINESS.DUPLICATE.MESSAGE_TIME_DUPLICATE.errorDataCount }} /
                    {{ formResult.items.TIMELINESS.DUPLICATE.MESSAGE_TIME_DUPLICATE.totalDataCount }}
                  </el-col>
                  <el-col :span="6">错误占比:</el-col>
                  <el-col :span="6">
                    {{ formResult.items.TIMELINESS.DUPLICATE.MESSAGE_TIME_DUPLICATE.errorDataPercentage }}%
                  </el-col>
                </el-row>
                <el-row class="drawer-row">
                  <el-col :span="6">错误车辆 / 总车辆:</el-col>
                  <el-col :span="6">
                    {{ formResult.items.TIMELINESS.DUPLICATE.MESSAGE_TIME_DUPLICATE.errorVehicleCount }} /
                    {{ formResult.items.TIMELINESS.DUPLICATE.MESSAGE_TIME_DUPLICATE.totalVehicleCount }}
                  </el-col>
                  <el-col :span="6">错误占比:</el-col>
                  <el-col :span="6">
                    {{ formResult.items.TIMELINESS.DUPLICATE.MESSAGE_TIME_DUPLICATE.errorVehiclePercentage }}%
                  </el-col>
                </el-row>
              </div>
            </div>
          </div>
        </div>
        <div slot="footer" class="dialog-footer">
          <el-button @click="closeResult">关 闭</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  addGbInspectionReport,
  delGbInspectionReport,
  getGbInspectionReport,
  getGbInspectionReportResult,
  listGbInspectionReport,
  listGbInspectionReportScene,
  listGbInspectionReportState,
  listGbInspectionReportType,
  updateGbInspectionReport
} from "@/api/edd/rsms/gbinspectionreport";

export default {
  name: "GbInspectionReport",
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
      // 国标检测报告表格数据
      gbInspectionReportList: [],
      reportTypeList: [],
      reportStateList: [],
      sceneList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      openResult: false,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 表单参数
      form: {},
      formResult: {},
      // 表单校验
      rules: {
        startTime: [
          {required: true, message: "检测开始时间不能为空", trigger: "blur"}
        ],
        endTime: [
          {required: true, message: "检测结束时间不能为空", trigger: "blur"}
        ],
        reportType: [
          {required: true, message: "报告类型不能为空", trigger: "blur"}
        ],
        vehicle: [
          {required: true, message: "车型或车架号不能为空", trigger: "blur"}
        ]
      },
    };
  },
  created() {
    this.getReportTypeList();
    this.getReportStateList();
    this.getSceneList();
    this.getList();
  },
  methods: {
    /** 查询国标检测报告列表 */
    getList() {
      this.loading = true;
      listGbInspectionReport(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.gbInspectionReportList = response.rows;
          this.total = response.total;
          this.loading = false;
        }
      );
    },
    /** 获取报告类型列表 */
    getReportTypeList() {
      listGbInspectionReportType().then(response => {
        this.reportTypeList = response.data;
      });
    },
    /** 获取报告类型 */
    getReportType(reportType) {
      const item = this.reportTypeList.find(
        dict => dict.code === reportType
      )
      return item ? item.name : reportType
    },
    /** 获取报告状态列表 */
    getReportStateList() {
      listGbInspectionReportState().then(response => {
        this.reportStateList = response.data;
      });
    },
    /** 获取报告状态 */
    getReportState(reportState) {
      const item = this.reportStateList.find(
        dict => dict.code === reportState
      )
      return item ? item.name : reportState
    },
    /** 获取场景列表 */
    getSceneList() {
      listGbInspectionReportScene().then(response => {
        this.sceneList = response.data;
      });
    },
    /** 获取场景 */
    getScene(scene) {
      const item = this.sceneList.find(
        dict => dict.code === scene
      )
      return item ? item.name : scene
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    closeResult() {
      this.openResult = false;
      this.resetResult();
    },
    /** 表单重置 */
    reset() {
      this.form = {
        vehicle: undefined,
        description: undefined
      };
      this.resetForm("form");
    },
    resetResult() {
      this.formResult = {};
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
      this.title = "添加国标检测报告";
      this.form = {};
    },
    /** 报告按钮操作 */
    handleResult(row) {
      this.resetResult();
      const gbInspectionReportId = row.id
      getGbInspectionReportResult(gbInspectionReportId).then(response => {
        this.formResult = response.data;
        this.openResult = true;
      });
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const gbInspectionReportId = row.id || this.ids
      getGbInspectionReport(gbInspectionReportId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改国标检测报告";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateGbInspectionReport(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addGbInspectionReport(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const gbInspectionReportIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除国标检测报告ID为"' + gbInspectionReportIds + '"的数据项？').then(function () {
        return delGbInspectionReport(gbInspectionReportIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('tsp-rsms/mpt/gbInspectionReport/export', {
        ...this.queryParams
      }, `gb_inspection_report_${new Date().getTime()}.xlsx`)
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
