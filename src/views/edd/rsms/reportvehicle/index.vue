<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="车架号" prop="vin">
        <el-input
          v-model="queryParams.vin"
          placeholder="请输入车架号"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="车辆上报状态" prop="reportState">
        <el-select
          v-model="queryParams.reportState"
          placeholder="车辆上报状态"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="dict in dict.type.iov_rsms_vehicle_report_state"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="离线天数">
        <el-input-number v-model="queryParams.offlineDays" controls-position="right" :min="1"/>
      </el-form-item>
      <el-form-item label="30天内频繁报警">
        <el-checkbox v-model="queryParams.frequentAlarmIn30Days" />
      </el-form-item>
      <el-form-item label="大面积聚集停放">
        <el-checkbox v-model="queryParams.highDensityParking" />
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
          v-hasPermi="['edd:rsms:reportVehicle:add']"
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
          v-hasPermi="['edd:rsms:reportVehicle:edit']"
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
          v-hasPermi="['edd:rsms:reportVehicle:remove']"
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
          v-hasPermi="['edd:rsms:reportVehicle:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="reportVehicleList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="车架号" prop="vin"/>
      <el-table-column label="车辆上报状态" align="center" prop="reportState" width="150">
        <template slot-scope="scope">
          <span>{{ getReportState(scope.row.reportState) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备案型号" prop="model" width="150"/>
      <el-table-column label="车辆更新时间" align="center" prop="vehicleTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.vehicleTime) }}</span>
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
            @click="handleUpdate(scope.row)"
            v-hasPermi="['edd:rsms:reportVehicle:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['edd:rsms:reportVehicle:remove']"
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

    <!-- 添加或修改上报车辆对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="750px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="130px">
        <el-form-item label="车架号" prop="vin">
          <el-input v-model="form.vin" :readonly="form.id !== undefined" placeholder="请输入车架号"/>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="车辆上报状态" prop="reportState">
              <el-select
                v-model="form.reportState"
                placeholder="车辆上报状态"
                clearable
                style="width: 140px"
              >
                <el-option
                  v-for="dict in dict.type.iov_rsms_vehicle_report_state"
                  :key="dict.value"
                  :label="dict.label"
                  :value="parseInt(dict.value)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="ICCID" prop="iccid">
              <el-input v-model="form.iccid" placeholder="请输入ICCID"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="备案型号" prop="model">
              <el-input v-model="form.model" placeholder="请输入备案型号"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="驱动电机型号" prop="driveMotorType">
              <el-input v-model="form.driveMotorType" placeholder="请输入驱动电机型号"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="整车最高车速" prop="maxSpeed">
              <el-input-number v-model="form.maxSpeed" controls-position="right" :min="0"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纯电续航" prop="evRange">
              <el-input-number v-model="form.evRange" controls-position="right" :min="0"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="各挡位下的传动比" prop="gearRatio">
          <el-input v-model="form.gearRatio" placeholder="请输入各挡位下的传动比"/>
        </el-form-item>
        <el-form-item label="电池相关参数" prop="batteryParam">
          <el-input v-model="form.batteryParam" type="textarea" placeholder="请输入电池相关参数"/>
        </el-form-item>
        <el-form-item label="驱动电机相关参数" prop="driveMotorParam">
          <el-input v-model="form.driveMotorParam" type="textarea" placeholder="请输入驱动电机相关参数"/>
        </el-form-item>
        <el-form-item label="通用报警预值" prop="alarmDefault">
          <el-input v-model="form.alarmDefault" type="textarea" placeholder="通用报警预值"/>
        </el-form-item>
        <el-form-item label="发动机编号" prop="engineSn">
          <el-input v-model="form.engineSn" placeholder="请输入发动机编号"/>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="燃油类型" prop="fuelType">
              <el-input v-model="form.fuelType" placeholder="请输入燃油类型"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="燃油标号" prop="fuelMark">
              <el-input v-model="form.fuelMark" placeholder="请输入燃油标号"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="最大输出功率" prop="engineMaxPower">
              <el-input v-model="form.engineMaxPower" placeholder="请输入最大输出功率"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大输出转矩" prop="engineMaxTorque">
              <el-input v-model="form.engineMaxTorque" placeholder="请输入最大输出转矩"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  addReportVehicle,
  updateReportVehicle,
  delReportVehicle,
  getReportVehicle,
  listReportVehicle
} from "@/api/edd/rsms/reportvehicle";

export default {
  name: "ReportVehicle",
  dicts: ['iov_rsms_vehicle_report_state'],
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
      // 上报车辆表格数据
      reportVehicleList: [],
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
        vin: [
          {required: true, message: "车架号不能为空", trigger: "blur"}
        ],
        reportState: [
          {required: true, message: "车辆上报状态不能为空", trigger: "blur"}
        ]
      },
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询上报车辆列表 */
    getList() {
      this.loading = true;
      listReportVehicle(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.reportVehicleList = response.rows;
          this.total = response.total;
          this.loading = false;
        }
      );
    },
    /** 获取车辆上报状态 */
    getReportState(reportState) {
      if (!this.dict || !this.dict.type || !this.dict.type.iov_rsms_vehicle_report_state) {
        return reportState;
      }
      const item = this.dict.type.iov_rsms_vehicle_report_state.find(
        dict => parseInt(dict.value) === reportState
      )
      return item ? item.label : reportState
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 表单重置 */
    reset() {
      this.form = {
        serverPlatformCode: undefined,
        vin: undefined,
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
      this.title = "添加上报车辆";
      this.form = {
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const reportVehicleId = row.id || this.ids
      getReportVehicle(reportVehicleId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改上报车辆";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateReportVehicle(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addReportVehicle(this.form).then(response => {
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
      const reportVehicleIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除上报车辆ID为"' + reportVehicleIds + '"的数据项？').then(function () {
        return delReportVehicle(reportVehicleIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('tsp-rsms/mpt/reportVehicle/export', {
        ...this.queryParams
      }, `report_vehicle_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
