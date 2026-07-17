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
          v-hasPermi="['completeVehicle:vehicle:importData:republish']"
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
          <el-button
            size="mini"
            type="text"
            icon="el-icon-refresh-right"
            @click="handleRepublish(scope.row)"
            v-hasPermi="['completeVehicle:vehicle:importData:republish']"
          >补发
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
  republishBatchVehImportData
} from "@/api/vmd/vehImportData";

export default {
  name: "VehImportData",
  dicts: [],
  data() {
    return {
      // 数据类型选项
      typeOptions: [
        { label: '车辆生产', value: 'PRODUCE' },
        { label: '总装上线', value: 'TOL' }
      ],
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
  methods: {
    /** 获取数据类型标签 */
    getTypeLabel(type) {
      const item = this.typeOptions.find(item => item.value === type);
      return item ? item.label : type;
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
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addVehImportData(this.form).then(response => {
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
    /** 补发按钮操作 */
    handleRepublish(row) {
      this.$modal.confirm('是否确认补发车辆导入数据"' + row.batchNum + '"？补发将重新发送导入消息到下游系统。').then(() => {
        return republishVehImportData(row.id)
      }).then(() => {
        this.$modal.msgSuccess("补发成功")
        this.getList()
      }).catch(() => {})
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
    }
  }
};
</script>
