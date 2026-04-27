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
          style="width: 120px"
        >
          <el-option
            v-for="dict in dict.type.iov_import_data_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
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
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="vehicleImportDataList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="批次号" prop="batchNum"/>
      <el-table-column label="数据类型" prop="type" width="200">
        <template slot-scope="scope">
          <span>{{ getDataTypeLabel(scope.row.type) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="数据版本" prop="version" align="center" width="150"/>
      <el-table-column label="是否已处理" align="center" width="150">
        <template slot-scope="scope">
          <span>{{ scope.row.handle ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="200" class-name="small-padding fixed-width">
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
          >
            <el-option
              v-for="dict in dict.type.iov_import_data_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
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
  </div>
</template>

<script>
import {
  listVehicleImportData,
  getVehicleImportData,
  addVehicleImportData,
  updateVehicleImportData,
  delVehicleImportData
} from "@/api/completevehicle/vehicle/importdata";

export default {
  name: "VehicleImportData",
  dicts: ['iov_import_data_type'],
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
      // 车辆导入数据表格数据
      vehicleImportDataList: [],
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
        batchNum: [
          {required: true, message: "批次号不能为空", trigger: "blur"}
        ],
        type: [
          {required: true, message: "数据类型不能为空", trigger: "blur"}
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
  methods: {
    /** 查询车辆导入数据列表 */
    getList() {
      this.loading = true;
      listVehicleImportData(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.vehicleImportDataList = response.data.items;
          this.total = response.data.total;
          this.loading = false;
        }
      );
    },
    // 获取数据类型
    getDataTypeLabel(dataType) {
      if (!this.dict || !this.dict.type || !this.dict.type.iov_import_data_type) {
        return dataType;
      }
      const item = this.dict.type.iov_import_data_type.find(
        dict => dict.value === dataType
      )
      return item ? item.label : dataType;
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
      const vehicleImportDataId = row.id || this.ids
      getVehicleImportData(vehicleImportDataId).then(response => {
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
            updateVehicleImportData(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addVehicleImportData(this.form).then(response => {
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
      const vehicleImportDataIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除车辆导入数据ID为"' + vehicleImportDataIds + '"的数据项？').then(function () {
        return delVehicleImportData(vehicleImportDataIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('edd-vmd/api/vehicleImportData/v1/export', {
        ...this.queryParams
      }, `vehicle_import_data_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
