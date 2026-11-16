<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="盘点单号" prop="orderNum">
        <el-input
          v-model="queryParams.orderNum"
          placeholder="请输入盘点单号"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="盘点类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="盘点类型"
          clearable
          style="width: 120px"
        >
          <el-option
            v-for="dict in dict.type.iov_inventory_count_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="仓库名称" prop="warehouseName">
        <el-select
          v-model="queryParams.warehouseName"
          placeholder="请选择仓库"
          clearable
          style="width: 200px"
        >
          <el-option
            v-for="warehouse in this.pdcWarehouseList"
            :key="warehouse.code"
            :label="warehouse.name"
            :value="warehouse.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="盘点状态" prop="state">
        <el-select
          v-model="queryParams.state"
          placeholder="盘点状态"
          clearable
          style="width: 120px"
        >
          <el-option
            v-for="dict in dict.type.iov_inventory_count_state"
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
          v-hasPermi="['completeVehicle:warehouse:inventoryCount:add']"
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
          v-hasPermi="['completeVehicle:warehouse:inventoryCount:edit']"
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
          v-hasPermi="['completeVehicle:warehouse:inventoryCount:remove']"
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
          v-hasPermi="['completeVehicle:warehouse:inventoryCount:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="inventoryCountList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="盘点单号" prop="orderNum" width="200"/>
      <el-table-column label="盘点类型" align="center" width="120">
        <template slot-scope="scope">
          <el-tooltip :content="scope.row.type" placement="top">
            <span>{{ getInventoryCountTypeLabel(scope.row.type) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="仓库名称" prop="warehouseName"/>
      <el-table-column label="储区代码" prop="storageAreaCode" width="100"/>
      <el-table-column label="盘点状态" align="center" width="120">
        <template slot-scope="scope">
          <el-tooltip :content="scope.row.state" placement="top">
            <span>{{ getInventoryCountStateLabel(scope.row.state) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="盘点开始时间" align="center" prop="startTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.startTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="盘点结束时间" align="center" prop="endTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.endTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" fixed="right" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['completeVehicle:warehouse:inventoryCount:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['completeVehicle:warehouse:inventoryCount:remove']"
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

    <!-- 添加或修改盘点信息配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="盘点单号" prop="orderNum" v-if="form.id !== undefined">
          <el-input v-model="form.orderNum" :readonly="true" placeholder="请输入盘点单号"/>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="前置库" prop="warehouseCode">
              <el-select
                v-model="form.warehouseCode"
                placeholder="前置库"
                clearable
              >
                <el-option
                  v-for="warehouse in this.pdcWarehouseList"
                  :key="warehouse.code"
                  :label="warehouse.name"
                  :value="warehouse.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="储区代码" prop="storageAreaCode">
              <el-input v-model="form.storageAreaCode" placeholder="请输入储区代码"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
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
  listInventoryCount,
  getInventoryCount,
  updateInventoryCount,
  addInventoryCount,
  delInventoryCount
} from "@/api/completevehicle/warehouse/pdcinventorycount";
import {listWarehouseByLevel,} from "@/api/completevehicle/warehouse/info";

export default {
  name: "InventoryCount",
  dicts: ['iov_inventory_count_type','iov_inventory_count_state'],
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
      // 前置库列表
      pdcWarehouseList: [],
      // 盘点信息表格数据
      inventoryCountList: [],
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
        warehouseCode: [
          {required: true, message: "前置库不能为空", trigger: "blur"}
        ]
      },
    };
  },
  created() {
    this.getPdcWarehouseList();
    this.getList();
  },
  methods: {
    /** 查询前置库列表 */
    getPdcWarehouseList() {
      listWarehouseByLevel('PDC').then(response => {
        this.pdcWarehouseList = response;
      });
    },
    /** 查询盘点信息列表 */
    getList() {
      this.loading = true;
      listInventoryCount(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.inventoryCountList = response.data.items;
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
        warehouseCode: undefined
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
      this.title = "添加盘点信息";
      this.form = {
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const inventoryCountId = row.id || this.ids
      getInventoryCount(inventoryCountId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改盘点信息";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateInventoryCount(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addInventoryCount(this.form).then(response => {
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
      const inventoryCountIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除盘点信息ID为"' + inventoryCountIds + '"的数据项？').then(function () {
        return delInventoryCount(inventoryCountIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('otd-wms/mpt/inventoryCount/export', {
        ...this.queryParams
      }, `inventory_count_${new Date().getTime()}.xlsx`)
    },
    /** 获取盘点类型标签 */
    getInventoryCountTypeLabel(type) {
      if (!this.dict || !this.dict.type || !this.dict.type.iov_inventory_count_type) {
        return type;
      }
      const item = this.dict.type.iov_inventory_count_type.find(
        dict => dict.value == type
      )
      return item ? item.label : type
    },
    /** 获取盘点状态标签 */
    getInventoryCountStateLabel(state) {
      if (!this.dict || !this.dict.type || !this.dict.type.iov_inventory_count_state) {
        return state;
      }
      const item = this.dict.type.iov_inventory_count_state.find(
        dict => dict.value == state
      )
      return item ? item.label : state
    },
  }
};
</script>
