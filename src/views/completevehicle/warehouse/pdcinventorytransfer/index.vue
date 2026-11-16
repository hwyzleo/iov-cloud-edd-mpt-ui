<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="车架号" prop="vin">
        <el-input
          v-model="queryParams.vin"
          placeholder="请输入车架号"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
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
          v-hasPermi="['completeVehicle:warehouse:inventoryTransfer:add']"
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
          v-hasPermi="['completeVehicle:warehouse:inventoryTransfer:edit']"
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
          v-hasPermi="['completeVehicle:warehouse:inventoryTransfer:remove']"
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
          v-hasPermi="['completeVehicle:warehouse:inventoryTransfer:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="inventoryTransferList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="车架号" prop="vin" width="180"/>
      <el-table-column label="生辰配置代码" prop="buildConfigCode" width="200"/>
      <el-table-column label="仓库名称" prop="warehouseName"/>
      <el-table-column label="原储区代码" prop="oldStorageAreaCode" width="100"/>
      <el-table-column label="原储位代码" prop="oldStorageLocationCode" width="100"/>
      <el-table-column label="新储区代码" prop="newStorageAreaCode" width="100"/>
      <el-table-column label="新储位代码" prop="newStorageLocationCode" width="100"/>
      <el-table-column label="移库状态" prop="transferState" width="100"/>
      <el-table-column label="移库时间" align="center" prop="transferTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.inboundTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="移库者" prop="transferBy" width="100"/>
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
            v-hasPermi="['completeVehicle:warehouse:inventoryTransfer:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['completeVehicle:warehouse:inventoryTransfer:remove']"
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

    <!-- 添加或修改移库信息配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="车架号" prop="vin">
              <el-input v-model="form.vin" placeholder="请输入车架号"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车型配置代码" prop="modelConfigCode">
              <el-input v-model="form.modelConfigCode" placeholder="请输入车型配置代码"/>
            </el-form-item>
          </el-col>
        </el-row>
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
        <el-row>
          <el-col :span="12">
            <el-form-item label="原储区代码" prop="oldStorageAreaCode">
              <el-input v-model="form.oldStorageAreaCode" placeholder="请输入原储区代码"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原储位代码" prop="oldStorageLocationCode">
              <el-input v-model="form.oldStorageLocationCode" placeholder="请输入原储位代码"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="新储区代码" prop="newStorageAreaCode">
              <el-input v-model="form.newStorageAreaCode" placeholder="请输入新储区代码"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="新储位代码" prop="newStorageLocationCode">
              <el-input v-model="form.newStorageLocationCode" placeholder="请输入新储位代码"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="移库时间" prop="transferTime">
              <el-date-picker
                v-model="form.transferTime"
                type="datetime"
                placeholder="请选择移库时间"
                value-format="timestamp"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="移库者" prop="transferBy" v-if="form.id !== undefined">
              <el-input v-model="form.transferBy" placeholder="请输入移库者"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="移库状态" prop="transferState">
          <el-input v-model="form.transferState" placeholder="请输入移库状态"/>
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
  </div>
</template>

<script>
import {
  listInventoryTransfer,
  getInventoryTransfer,
  updateInventoryTransfer,
  addInventoryTransfer,
  delInventoryTransfer
} from "@/api/completevehicle/warehouse/pdcinventorytransfer";
import {listWarehouseByLevel,} from "@/api/completevehicle/warehouse/info";

export default {
  name: "InventoryTransfer",
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
      // 前置库列表
      pdcWarehouseList: [],
      // 移库信息表格数据
      inventoryTransferList: [],
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
        modelConfigCode: [
          {required: true, message: "车型配置代码不能为空", trigger: "blur"}
        ],
        warehouseCode: [
          {required: true, message: "前置库不能为空", trigger: "blur"}
        ],
        newStorageAreaCode: [
          {required: true, message: "新储区代码不能为空", trigger: "blur"}
        ],
        newStorageLocationCode: [
          {required: true, message: "新储位代码不能为空", trigger: "blur"}
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
    /** 查询移库信息列表 */
    getList() {
      this.loading = true;
      listInventoryTransfer(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.inventoryTransferList = response.data.items;
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
        vin: undefined,
        modelConfigCode: undefined,
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
      this.title = "添加移库信息";
      this.form = {
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const inventoryTransferId = row.id || this.ids
      getInventoryTransfer(inventoryTransferId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改移库信息";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateInventoryTransfer(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addInventoryTransfer(this.form).then(response => {
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
      const inventoryTransferIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除移库信息ID为"' + inventoryTransferIds + '"的数据项？').then(function () {
        return delInventoryTransfer(inventoryTransferIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('otd-wms/mpt/inventoryTransfer/export', {
        ...this.queryParams
      }, `inventory_transfer_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
