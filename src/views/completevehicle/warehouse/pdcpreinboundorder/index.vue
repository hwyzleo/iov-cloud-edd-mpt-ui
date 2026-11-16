<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="预入库单号" prop="orderNum">
        <el-input
          v-model="queryParams.orderNum"
          placeholder="请输入预入库单号"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
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
          v-hasPermi="['completeVehicle:warehouse:preInboundOrder:add']"
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
          v-hasPermi="['completeVehicle:warehouse:preInboundOrder:edit']"
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
          v-hasPermi="['completeVehicle:warehouse:preInboundOrder:remove']"
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
          v-hasPermi="['completeVehicle:warehouse:preInboundOrder:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="preInboundOrderList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="预入库单号" prop="orderNum" width="220"/>
      <el-table-column label="车架号" prop="vin" width="180"/>
      <el-table-column label="生产配置代码" prop="buildConfigCode" width="200"/>
      <el-table-column label="仓库名称" prop="warehouseName"/>
      <el-table-column label="状态" prop="state" align="center" width="150"/>
      <el-table-column label="预计到达时间" align="center" prop="estimatedArrivalTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.estimatedArrivalTime, "{y}-{m}-{d} {h}:{i}") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预计入库时间" align="center" prop="estimatedInboundTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.estimatedInboundTime, "{y}-{m}-{d} {h}:{i}") }}</span>
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
            v-hasPermi="['completeVehicle:warehouse:preInboundOrder:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['completeVehicle:warehouse:preInboundOrder:remove']"
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

    <!-- 添加或修改预入库单配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="预入库单号" prop="orderNum" v-if="form.id !== undefined">
          <el-input v-model="form.orderNum" :readonly="true" placeholder="请输入预入库单号"/>
        </el-form-item>
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
            <el-form-item label="预计到达时间" prop="estimatedArrivalTime">
              <el-date-picker
                v-model="form.estimatedArrivalTime"
                type="datetime"
                placeholder="请选择预计到达时间"
                value-format="timestamp"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计入库时间" prop="estimatedInboundTime">
              <el-date-picker
                v-model="form.estimatedInboundTime"
                type="datetime"
                placeholder="请选择预计入库时间"
                value-format="timestamp"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="是否已审核">
              <el-radio-group v-model="form.audit">
                <el-radio
                  :label="true"
                >是
                </el-radio>
                <el-radio
                  :label="false"
                >否
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="审核时间" prop="auditTime">
              <el-date-picker
                v-model="form.auditTime"
                type="datetime"
                placeholder="请选择审核时间"
                value-format="timestamp"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="审核者" prop="auditBy" v-if="form.id !== undefined">
          <el-input v-model="form.auditBy" placeholder="请输入审核者"/>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="是否已到达">
              <el-radio-group v-model="form.arrival">
                <el-radio
                  :label="true"
                >是
                </el-radio>
                <el-radio
                  :label="false"
                >否
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到达时间" prop="arrivalTime">
              <el-date-picker
                v-model="form.arrivalTime"
                type="datetime"
                placeholder="请选择到达时间"
                value-format="timestamp"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="是否已入库">
              <el-radio-group v-model="form.inbound">
                <el-radio
                  :label="true"
                >是
                </el-radio>
                <el-radio
                  :label="false"
                >否
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库时间" prop="inboundTime">
              <el-date-picker
                v-model="form.inboundTime"
                type="datetime"
                placeholder="请选择入库时间"
                value-format="timestamp"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="入库者" prop="inboundBy" v-if="form.id !== undefined">
          <el-input v-model="form.inboundBy" placeholder="请输入入库者"/>
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
  listPreInboundOrder,
  getPreInboundOrder,
  updatePreInboundOrder,
  addPreInboundOrder,
  delPreInboundOrder
} from "@/api/completevehicle/warehouse/pdcpreinboundorder";
import {listWarehouseByLevel,} from "@/api/completevehicle/warehouse/info";

export default {
  name: "PdcPreInboundOrder",
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
      // 预入库单表格数据
      preInboundOrderList: [],
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
    /** 查询预入库单列表 */
    getList() {
      this.loading = true;
      listPreInboundOrder(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.preInboundOrderList = response.data.items;
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
      this.title = "添加预入库单";
      this.form = {
        audit: false,
        arrival: false,
        inbound: false
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const preInboundOrderId = row.id || this.ids
      getPreInboundOrder(preInboundOrderId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改预入库单";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updatePreInboundOrder(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addPreInboundOrder(this.form).then(response => {
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
      const preInboundOrderIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除预入库单ID为"' + preInboundOrderIds + '"的数据项？').then(function () {
        return delPreInboundOrder(preInboundOrderIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('otd-wms/mpt/preInboundOrder/export', {
        ...this.queryParams
      }, `pre_inbound_order_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
