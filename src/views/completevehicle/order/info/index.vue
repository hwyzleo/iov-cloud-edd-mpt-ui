<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="订单号" prop="orderNo">
        <el-input
          v-model="queryParams.orderNo"
          placeholder="请输入订单号"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="订单状态" prop="orderState">
        <el-select
          v-model="queryParams.orderState"
          placeholder="订单状态"
          clearable
          style="width: 120px"
        >
          <el-option
            v-for="dict in dict.type.iov_vehicle_sale_order_state"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="订单状态时间">
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
          v-hasPermi="['completeVehicle:order:info:add']"
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
          v-hasPermi="['completeVehicle:order:info:edit']"
        >修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['completeVehicle:order:info:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="orderList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="订单号" prop="orderNo" fixed="left" width="160"/>
      <el-table-column label="下单用户" width="120">
        <template slot-scope="scope">
          <el-link
            type="primary"
            @click="openAccountTab(scope.row.orderPersonId)"
          >{{ scope.row.orderPersonPhone }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="下单时间" align="center" prop="orderTime" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.orderTime, "{y}-{m}-{d} {h}:{i}") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="订单状态" align="center" width="150">
        <template slot-scope="scope">
          <el-tooltip :content="parseTime(scope.row.orderStateTime)" placement="top">
            <span>{{ getVehicleSaleOrderStateLabel(scope.row.orderState) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="意向金支付时间" align="center" prop="earnestMoneyTime" width="140">
        <template slot-scope="scope">
          <el-tooltip :content="String(scope.row.earnestMoneyAmount)" placement="top">
            <span>{{ parseTime(scope.row.earnestMoneyTime, "{y}-{m}-{d} {h}:{i}") }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="定金支付时间" align="center" prop="downPaymentTime" width="140">
        <template slot-scope="scope">
          <el-tooltip :content="String(scope.row.downPaymentAmount)" placement="top">
            <span>{{ parseTime(scope.row.downPaymentTime, "{y}-{m}-{d} {h}:{i}") }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="锁单时间" align="center" prop="lockTime" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.lockTime, "{y}-{m}-{d} {h}:{i}") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="销售代码" align="center" width="100">
        <template slot-scope="scope">
          <el-link
            type="primary"
            @click="openSaleModelTab(scope.row.saleCode)"
          >{{ scope.row.saleCode }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="生产配置代码" align="center" width="180">
        <template slot-scope="scope">
          <el-link
            type="primary"
            @click="openModelConfigTab(scope.row.buildConfigCode)"
          >{{ scope.row.buildConfigCode }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" align="center" fixed="right" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['completeVehicle:order:info:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleImages(scope.row)"
            v-hasPermi="['completeVehicle:order:info:query']"
          >详细
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-setting"
            @click="handleConfig(scope.row)"
            v-hasPermi="['completeVehicle:order:info:edit']"
          >车型配置
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['completeVehicle:order:info:remove']"
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

    <!-- 添加或修改车辆销售订单配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="销售代码" prop="saleCode">
          <el-input v-model="form.saleCode" :readonly="form.id !== undefined" placeholder="请输入销售代码"/>
        </el-form-item>
        <el-form-item label="销售车型名称" prop="modelName">
          <el-input v-model="form.modelName" placeholder="请输入销售车型名称"/>
        </el-form-item>
        <el-form-item label="是否允许意向金">
          <el-radio-group v-model="form.earnestMoney">
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="意向金金额" v-show="form.earnestMoney">
          <el-input v-model="form.earnestMoneyPrice" placeholder="请输入意向金金额"/>
        </el-form-item>
        <el-form-item label="是否允许定金">
          <el-radio-group v-model="form.downPayment">
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="定金金额" v-show="form.downPayment">
          <el-input v-model="form.downPaymentPrice" placeholder="请输入定金金额"/>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-radio-group v-model="form.enable">
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" controls-position="right" :min="0"/>
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
  listOrder,
  getOrder,
  delOrder,
  physicalDeleteOrder,
  auditPass,
  auditReject,
  lockOrder,
  closeOrder
} from "@/api/completevehicle/order/info";

export default {
  name: "VehicleSaleOrder",
  dicts: ['iov_vehicle_sale_order_state'],
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
      // 车辆销售订单表格数据
      orderList: [],
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
        orderNo: [
          {required: true, message: "订单号不能为空", trigger: "blur"}
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询车辆销售订单列表 */
    getList() {
      this.loading = true;
      listOrder(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.orderList = response.data.items;
          this.total = response.data.total;
          this.loading = false;
        }
      );
    },
    /** 获取车辆销售订单状态标签 */
    getVehicleSaleOrderStateLabel(vehicleSaleOrderState) {
      if (!this.dict || !this.dict.type || !this.dict.type.iov_vehicle_sale_order_state) {
        return vehicleSaleOrderState;
      }
      const item = this.dict.type.iov_vehicle_sale_order_state.find(
        dict => dict.value == vehicleSaleOrderState
      )
      return item ? item.label : vehicleSaleOrderState
    },
    /** 跳转账号页 */
    openAccountTab(accountId) {
      const params = {accountId: accountId};
      this.$tab.openPage("账号管理", "/tsp/account", params);
    },
    /** 跳转销售车型页 */
    openSaleModelTab(saleCode) {
      const params = {saleCode: saleCode};
      this.$tab.openPage("销售车型管理", "/otd/saleModel", params);
    },
    /** 跳转车型配置页 */
    openModelConfigTab(modelConfigCode) {
      const params = {modelConfigCode: modelConfigCode};
      this.$tab.openPage("车型配置管理", "/tsp/vmd/modelConfig", params);
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 表单重置 */
    reset() {
      this.form = {
        orderNo: undefined
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
      this.title = "添加车辆销售订单";
      this.form = {
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const orderId = row.id || this.ids
      getOrder(orderId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改车辆销售订单";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateOrder(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addOrder(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除车辆销售订单号为"' + row.orderNo + '"的数据项？').then(function () {
        return physicalDeleteOrder(row.orderId, {});
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('otd-vso/mpt/vehicleSaleOrder/export', {
        ...this.queryParams
      }, `vehicle_sale_order_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
