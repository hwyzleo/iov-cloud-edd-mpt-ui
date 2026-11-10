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
      <!-- 后端按 created_at_business（下单时间）过滤 -->
      <el-form-item label="下单时间">
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

    <el-table v-loading="loading" :data="orderList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="订单号" prop="orderNo" fixed="left" width="160"/>
      <el-table-column label="订单状态" align="center" width="150">
        <template slot-scope="scope">
          <el-tooltip :content="parseTime(scope.row.orderStateTime)" placement="top">
            <span>{{ getVehicleSaleOrderStateLabel(scope.row.orderState) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="下单时间" align="center" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.orderTime || scope.row.createTime) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="锁单时间" align="center" prop="lockTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.lockTime) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="交付门店" prop="deliveryStoreName" width="180"/>
      <el-table-column label="交付顾问" align="center" prop="deliveryPersonName" width="100">
        <template slot-scope="scope">
          <span>{{ scope.row.deliveryPersonName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="交付车辆" align="center" prop="deliveryVin" width="170">
        <template slot-scope="scope">
          <span>{{ scope.row.deliveryVin || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="车型配置代码" align="center" width="200">
        <template slot-scope="scope">
          {{ scope.row.modelConfigCode || scope.row.configurationCode || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="上牌城市" align="center" prop="licenseCity" width="120"/>
      <el-table-column label="发运申请人" align="center" prop="transportApplyPersonName" width="110">
        <template slot-scope="scope">
          <span>{{ scope.row.transportApplyPersonName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="发运申请时间" align="center" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.transportApplyTime) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" align="center" fixed="right" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleApply(scope.row)"
            v-if="scope.row.orderState === 450"
            v-hasPermi="['completeVehicle:order:transport:apply']"
          >申请发运
          </el-button>
          <!-- 换绑/解绑仅允许在 ALLOCATION_VEHICLE(450) 状态执行 -->
          <el-button
            size="mini"
            type="text"
            icon="el-icon-refresh"
            @click="handleReassign(scope.row)"
            v-if="scope.row.orderState === 450"
            v-hasPermi="['completeVehicle:order:assignVehicle:reassign']"
          >换绑 VIN
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-close"
            @click="handleUnbind(scope.row)"
            v-if="scope.row.orderState === 450"
            v-hasPermi="['completeVehicle:order:assignVehicle:unbind']"
          >解绑 VIN
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
  </div>
</template>

<script>
import {
  listTransportOrder,
  applyTransport
} from "@/api/otd/order/transport";
import {
  reassignVehicle,
  unbindVehicle
} from "@/api/otd/order/assignvehicle";

export default {
  name: "Transport",
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
      // 订单表格数据
      orderList: [],
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
    /** 查询运输相关车辆销售订单列表 */
    getList() {
      this.loading = true;
      listTransportOrder(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
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
    /** 申请发运操作 */
    handleApply(row) {
      this.$modal.confirm('是否确认申请发运车辆销售订单为"' + row.orderNo + '"且车辆为"' + row.deliveryVin + '"的数据项？').then(function () {
        return applyTransport(row.orderNo);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("操作成功");
      }).catch(() => {
      });
    },
    /** 换绑 VIN（仅 ALLOCATION_VEHICLE 状态，后端会校验新 VIN 可用性与占用） */
    handleReassign(row) {
      this.$prompt('请输入新的车架号（当前 VIN：' + (row.deliveryVin || '-') + '）', '换绑 VIN - ' + row.orderNo, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '新 VIN 不能为空'
      }).then(({ value }) => {
        return reassignVehicle(row.orderNo, value.trim());
      }).then(() => {
        this.$modal.msgSuccess('换绑成功');
        this.getList();
      }).catch(() => {
      });
    },
    /** 解绑 VIN（仅 ALLOCATION_VEHICLE 状态，解绑后订单释放车辆并回到待配车） */
    handleUnbind(row) {
      this.$prompt('解绑将释放当前车辆占用，请输入解绑原因', '解绑 VIN - ' + row.orderNo, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '解绑原因不能为空'
      }).then(({ value }) => {
        return unbindVehicle(row.orderNo, value.trim());
      }).then(() => {
        this.$modal.msgSuccess('解绑成功');
        this.getList();
      }).catch(() => {
      });
    }
  }
};
</script>
