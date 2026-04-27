<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="车架号" prop="vin">
        <el-input
          v-model="queryParams.vin"
          placeholder="请输入车架号"
          clearable
          style="width: 190px"
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
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['completeVehicle:vehicle:info:add']"
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
          v-hasPermi="['completeVehicle:vehicle:info:edit']"
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
          v-hasPermi="['completeVehicle:vehicle:info:remove']"
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
          v-hasPermi="['completeVehicle:vehicle:info:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="vehicleList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="车架号" fixed="left" width="170" prop="vin"/>
      <el-table-column label="工厂代码" prop="manufacturerCode" align="center" width="80"/>
      <el-table-column label="品牌代码" prop="brandCode" align="center" width="80"/>
      <el-table-column label="平台代码" prop="platformCode" align="center" width="80"/>
      <el-table-column label="车系代码" prop="seriesCode" align="center" width="80"/>
      <el-table-column label="车型代码" prop="modelCode" align="center" width="80"/>
      <el-table-column label="基础车型代码" prop="baseModelCode" align="center" width="120"/>
      <el-table-column label="生产配置代码" prop="buildConfigCode"/>
      <el-table-column label="车辆下线时间" align="center" prop="eolTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.eolTime) }}</span>
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
            icon="el-icon-help"
            @click="handleLifecycle(scope.row)"
            v-hasPermi="['completeVehicle:vehicle:info:query']"
          >生命周期
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['completeVehicle:vehicle:info:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['completeVehicle:vehicle:info:remove']"
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

    <!-- 添加或修改路由配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="车架号" prop="vin">
          <el-input v-model="form.vin" placeholder="请输入车架号"/>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 车辆生命周期列表对话框 -->
    <el-dialog :title="title" :visible.sync="openLifecycleList" width="800px" append-to-body>
      <div class="dialog-body" style="max-height: 50vh; overflow-y: auto;">
        <el-table v-loading="loadingLifecycle" :data="lifecycleList">
          <el-table-column label="节点" prop="node">
            <template slot-scope="scope">
              <span>{{ getNodeType(scope.row.node) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="节点时间" align="center" prop="reachTime" width="180">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.reachTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="排序" prop="sort" width="60"/>
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
                @click="handleUpdateLifecycle(scope.row)"
                v-hasPermi="['vehicle:vehicle:vehicle:edit']"
              >修改
              </el-button>
              <el-button
                size="mini"
                type="text"
                icon="el-icon-delete"
                @click="handleDeleteLifecycle(scope.row)"
                v-hasPermi="['vehicle:vehicle:vehicle:edit']"
              >删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleAddLifecycle(form.vin)">新 增</el-button>
        <el-button @click="cancelLifecycleList">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 添加或修改生命周期对话框 -->
    <el-dialog :title="title2" :visible.sync="openLifecycle" width="500px" append-to-body>
      <el-form ref="formLifecycle" :model="formLifecycle" :rules="rulesLifecycle" label-width="120px">
        <el-form-item label="车架号" prop="vin">
          <el-input v-model="formLifecycle.vin" readonly placeholder="请输入车架号"/>
        </el-form-item>
        <el-form-item label="节点类型" prop="node">
          <el-select
            v-model="formLifecycle.node"
            placeholder="节点类型"
            clearable
          >
            <el-option
              v-for="dict in dict.type.iov_vehicle_lifecycle"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="触达时间" prop="reachTime">
          <el-date-picker
            v-model="formLifecycle.reachTime"
            type="datetime"
            placeholder="选择日期时间"
            value-format="timestamp"
            format="yyyy-MM-dd HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formLifecycle.sort" controls-position="right" :min="0"/>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formLifecycle.description" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitFormLifecycle">确 定</el-button>
        <el-button @click="cancelLifecycle">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listVehicle,
  listVehicleLifecycle,
  getVehicle,
  addVehicle,
  addVehicleLifecycle,
  updateVehicle,
  updateVehicleLifecycle,
  delVehicle,
  delVehicleLifecycle
} from "@/api/completevehicle/vehicle/info";

export default {
  name: "Vehicle",
  dicts: ['iov_vehicle_lifecycle'],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 遮罩层（生命周期列表）
      loadingLifecycle: true,
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
      // 车辆表格数据
      vehicleList: [],
      // 车辆生命周期表格数据
      lifecycleList: [],
      // 弹出层标题
      title: "",
      title2: "",
      // 是否显示弹出层
      open: false,
      // 是否显示弹出层（生命周期列表）
      openLifecycleList: false,
      // 是否显示弹出层（生命周期）
      openLifecycle: false,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 表单参数
      form: {},
      // 表单参数（生命周期）
      formLifecycle: {},
      // 表单校验
      rules: {
        vin: [
          {required: true, message: "车架号不能为空", trigger: "blur"}
        ]
      },
      // 表单校验（生命周期）
      rulesLifecycle: {
        vin: [
          {required: true, message: "车架号不能为空", trigger: "blur"}
        ],
        node: [
          {required: true, message: "节点类型不能为空", trigger: "blur"}
        ],
        reachTime: [
          {required: true, message: "触达时间不能为空", trigger: "blur"}
        ],
        sort: [
          {required: true, message: "排序不能为空", trigger: "blur"}
        ]
      },
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询车辆列表 */
    getList() {
      this.loading = true;
      listVehicle(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.vehicleList = response.data.items;
          this.total = response.data.total;
          this.loading = false;
        }
      );
    },
    /** 查询车辆列表（生命周期） */
    getListLifecycle(vin) {
      this.loadingLifecycle = true;
      listVehicleLifecycle(vin).then(response => {
          this.lifecycleList = response;
          this.form = {
            vin: vin
          };
          this.loadingLifecycle = false;
        }
      );
    },
    // 获取生命周期节点类型
    getNodeType(lifecycleNodeCode) {
      if (!this.dict || !this.dict.type || !this.dict.type.iov_vehicle_lifecycle) {
        return lifecycleNodeCode;
      }
      const item = this.dict.type.iov_vehicle_lifecycle.find(
        dict => dict.value == lifecycleNodeCode
      )
      return item ? item.label : lifecycleNodeCode;
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 取消按钮（生命周期列表） */
    cancelLifecycleList() {
      this.openLifecycleList = false;
    },
    /** 取消按钮（生命周期） */
    cancelLifecycle() {
      this.openLifecycle = false;
    },
    /** 表单重置 */
    reset() {
      this.form = {
        vin: undefined
      };
      this.resetForm("form");
    },
    /** 表单重置（生命周期） */
    resetLifecycle() {
      this.formLifecycle = {
        vin: undefined,
        node: undefined,
        reachTime: undefined,
        sort: 0
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
      this.title = "添加车辆";
      this.form = {};
    },
    /** 新增按钮操作（生命周期） */
    handleAddLifecycle() {
      this.resetLifecycle();
      this.openLifecycle = true;
      this.title2 = "添加车辆生命周期";
      this.formLifecycle = {
        vin: this.form.vin,
        sort: 0
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const vehicleId = row.id || this.ids
      getVehicle(vehicleId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改车辆";
    },
    /** 修改按钮操作（生命周期） */
    handleUpdateLifecycle(row) {
      this.resetLifecycle();
      this.formLifecycle = row;
      this.openLifecycle = true;
      this.title2 = "修改车辆生命周期";
    },
    /** 生命周期按钮操作 */
    handleLifecycle(row) {
      this.openLifecycleList = true;
      this.getListLifecycle(row.vin);
      this.title = "车辆 " + row.vin + " 生命周期";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateVehicle(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addVehicle(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 提交按钮（生命周期） */
    submitFormLifecycle: function () {
      this.$refs["formLifecycle"].validate(valid => {
        if (valid) {
          if (this.formLifecycle.id !== undefined) {
            updateVehicleLifecycle(this.formLifecycle).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.openLifecycle = false;
              this.getListLifecycle(this.formLifecycle.vin);
            });
          } else {
            addVehicleLifecycle(this.formLifecycle).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.openLifecycle = false;
              this.getListLifecycle(this.formLifecycle.vin);
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const vehicleIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除车辆ID为"' + vehicleIds + '"的数据项？').then(function () {
        return delVehicle(vehicleIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 删除按钮操作（生命周期） */
    handleDeleteLifecycle(row) {
      this.$modal.confirm('是否确认删除车辆生命周期ID为"' + row.id + '"的数据项？').then(function () {
        return delVehicleLifecycle(row.vin, row.id);
      }).then(() => {
        this.getListLifecycle(row.vin);
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('tsp-vmd/vehicle/export', {
        ...this.queryParams
      }, `vehicle_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
