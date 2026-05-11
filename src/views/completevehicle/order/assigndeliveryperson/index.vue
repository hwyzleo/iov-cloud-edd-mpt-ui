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
      <el-form-item label="锁单时间">
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
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="orderWithoutDeliveryPersonList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="订单号" prop="orderNo" fixed="left" width="180"/>
      <el-table-column label="订单状态" align="center" width="180">
        <template slot-scope="scope">
          <el-tooltip :content="parseTime(scope.row.orderStateTime)" placement="top">
            <span>{{ getVehicleSaleOrderStateLabel(scope.row.orderState) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="车型配置代码" align="center" width="200">
        <template slot-scope="scope">
          {{ scope.row.modelConfigCode }}
        </template>
      </el-table-column>
      <el-table-column label="上牌城市" prop="licenseCity" width="170"/>
      <el-table-column label="交付中心" prop="deliveryCenterName" width="250"/>
      <el-table-column label="锁单时间" align="center" prop="lockTime" width="200">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.lockTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center" fixed="right" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleAssign(scope.row)"
            v-hasPermi="['completeVehicle:order:assignVehicle:edit']"
          >分配交付人员
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

    <!-- 交付中心员工列表对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="1000px" append-to-body>
      <div class="dialog-body" style="max-height: 50vh; overflow-y: auto;">
        <el-table v-loading="loadingDeliveryCenterStaff" :data="deliveryCenterStaffList">
          <el-table-column label="员工账号" prop="userName" />
          <el-table-column label="员工昵称" prop="nickName" />
          <el-table-column label="手机号码" prop="phonenumber" />
          <el-table-column label="未交付订单数" align="center" prop="notDeliveryOrderCount" />
          <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleBinding(scope.row)"
                v-hasPermi="['completeVehicle:order:assignVehicle:edit']"
              >绑定交付人员
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  bindingDeliveryPerson,
  listOrderWithoutDeliveryPerson,
  listDeliveryCenterStaff
} from "@/api/completevehicle/order/assigndeliveryperson";

export default {
  name: "AssignDeliveryPerson",
  dicts: ['iov_vehicle_sale_order_state'],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 遮罩层（交付中心员工）
      loadingDeliveryCenterStaff: true,
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
      // 没有交付人员车辆销售订单表格数据
      orderWithoutDeliveryPersonList: [],
      // 交付中心员工表格数据
      deliveryCenterStaffList: [],
      // 弹出层标题
      title: "",
      // 2级弹出层标题
      title2: "",
      // 是否显示弹出层
      open: false,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 查询参数（可分配交付人员）
      queryDealershipStaffParams: {
        pageNum: 1,
        pageSize: 10,
        dealershipCode: undefined
      },
      // 表单参数
      form: {
        vin: undefined,
        orderNo: undefined
      },
      // 表单校验
      rules: {}
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询没有交付人员车辆销售订单列表 */
    getList() {
      this.loading = true;
      listOrderWithoutDeliveryPerson(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.orderWithoutDeliveryPersonList = response.data.items;
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
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 表单重置 */
    reset() {
      this.form = {
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
    /** 分配交付人员操作 */
    handleAssign(row) {
      this.form.orderNo = row.orderNo;
      this.queryDealershipStaffParams.dealershipCode = row.deliveryCenter;
      this.loadingDeliveryCenterStaff = true;
      listDeliveryCenterStaff(this.queryDealershipStaffParams).then(response => {
        this.deliveryCenterStaffList = response.data.items;
        this.open = true;
        this.loadingDeliveryCenterStaff = false;
      });
      this.title = "交付中心-" + row.deliveryCenterName + " 员工";
    },
    /** 绑定交付人员操作 */
    handleBinding(row) {
      const orderNo = this.form.orderNo;
      this.$modal.confirm('是否确认绑定交付人员"' + row.nickName + '"到订单"' + orderNo + '"？').then(function () {
        return bindingDeliveryPerson(row.userId, row.nickName, orderNo);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("绑定成功");
        this.open = false;
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('otd-vso/mpt/vehicleSaleOrder/assignVehicle/export', {
        ...this.queryParams
      }, `assignable_order_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
