<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="100px">
      <el-form-item label="运单号" prop="orderNum">
        <el-input
          v-model="queryParams.orderNum"
          placeholder="请输入运单号"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="运单状态" prop="state">
        <el-select v-model="queryParams.state" placeholder="请选择运单状态" clearable style="width: 160px">
          <el-option
            v-for="item in stateOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="承运商" prop="carrierCode">
        <el-select v-model="queryParams.carrierCode" placeholder="请选择承运商" clearable filterable style="width: 220px">
          <el-option
            v-for="carrier in carrierOptions"
            :key="carrier.code"
            :label="carrier.name + '（' + carrier.code + '）'"
            :value="carrier.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="发车据点" prop="dispatchLogisticsNodeCode">
        <el-select v-model="queryParams.dispatchLogisticsNodeCode" placeholder="请选择发车据点" clearable filterable style="width: 220px">
          <el-option
            v-for="node in nodeOptions"
            :key="node.code"
            :label="node.name + '（' + node.code + '）'"
            :value="node.code"
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
          type="info"
          plain
          icon="el-icon-refresh"
          size="mini"
          @click="getList"
        >刷新</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="orderList">
      <el-table-column label="运单号" prop="orderNum" width="220" :show-overflow-tooltip="true"/>
      <el-table-column label="来源订单号" prop="sourceOrderNo" width="160" :show-overflow-tooltip="true"/>
      <el-table-column label="运单状态" align="center" width="100">
        <template slot-scope="scope">
          <el-tag :type="stateTagType(scope.row.state)" size="small">{{ scope.row.stateName || getStateLabel(scope.row.state) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="承运商" prop="carrierCode" width="140" :show-overflow-tooltip="true"/>
      <el-table-column label="运输线路" prop="transportRouteCode" width="140" :show-overflow-tooltip="true"/>
      <el-table-column label="发车据点" prop="dispatchLogisticsNodeCode" width="140" :show-overflow-tooltip="true"/>
      <el-table-column label="接车据点" prop="handoverLogisticsNodeCode" width="140" :show-overflow-tooltip="true"/>
      <el-table-column label="车牌" prop="licensePlate" width="120" :show-overflow-tooltip="true"/>
      <el-table-column label="VIN 数" align="center" width="80">
        <template slot-scope="scope">
          <span>{{ scope.row.vins ? scope.row.vins.length : 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预计装车时间" align="center" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.estimatedLoadingTime) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预计到达时间" align="center" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.estimatedArrivalTime) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="调度人" prop="dispatcher" width="110" :show-overflow-tooltip="true"/>
      <el-table-column label="调度时间" align="center" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.dispatchTime) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="已回写订单状态" align="center" width="130">
        <template slot-scope="scope">
          <span>{{ scope.row.lastReportedVsoState || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="300" fixed="right" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleDetail(scope.row)"
            v-hasPermi="['completeVehicle:transport:transportOrder:query']"
          >明细</el-button>
          <el-button
            v-if="scope.row.state === 1"
            size="mini"
            type="text"
            icon="el-icon-truck"
            @click="handleDispatch(scope.row)"
            v-hasPermi="['completeVehicle:transport:transportOrder:dispatch']"
          >调度</el-button>
          <el-button
            v-if="scope.row.state === 1 && scope.row.dispatchTime"
            size="mini"
            type="text"
            icon="el-icon-position"
            @click="handleDepart(scope.row)"
            v-hasPermi="['completeVehicle:transport:transportOrder:depart']"
          >确认发车</el-button>
          <el-button
            v-if="scope.row.state === 2 || scope.row.state === 3"
            size="mini"
            type="text"
            icon="el-icon-s-claim"
            @click="handleHandover(scope.row)"
            v-hasPermi="['completeVehicle:transport:transportOrder:handover']"
          >交车</el-button>
          <el-button
            v-if="scope.row.state >= 3 && scope.row.state <= 5"
            size="mini"
            type="text"
            icon="el-icon-finished"
            @click="handleReceipt(scope.row)"
            v-hasPermi="['completeVehicle:transport:transportOrder:receipt']"
          >接车</el-button>
          <el-button
            v-if="scope.row.state === 1 || scope.row.state === 2"
            size="mini"
            type="text"
            icon="el-icon-close"
            @click="handleCancel(scope.row)"
            v-hasPermi="['completeVehicle:transport:transportOrder:cancel']"
          >取消</el-button>
          <el-button
            v-if="scope.row.state !== 6 && scope.row.state !== 7 && scope.row.state !== 9"
            size="mini"
            type="text"
            icon="el-icon-switch-button"
            @click="handleManualClose(scope.row)"
            v-hasPermi="['completeVehicle:transport:transportOrder:manualClose']"
          >手工结束</el-button>
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

    <!-- 运输调度 -->
    <el-dialog title="运输调度" :visible.sync="openDispatch" width="800px" append-to-body>
      <el-form ref="dispatchForm" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="运单号">
              <el-input v-model="form.orderNum" readonly/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="承运商" prop="carrierCode">
              <el-select v-model="form.carrierCode" placeholder="请选择承运商" filterable style="width: 100%">
                <el-option
                  v-for="carrier in carrierOptions"
                  :key="carrier.code"
                  :label="carrier.name + '（' + carrier.code + '）'"
                  :value="carrier.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="运输线路" prop="transportRouteCode">
              <el-select v-model="form.transportRouteCode" placeholder="请选择运输线路" filterable style="width: 100%">
                <el-option
                  v-for="route in filteredRoutes"
                  :key="route.code"
                  :label="route.name + '（' + route.code + '）'"
                  :value="route.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发车据点" prop="dispatchLogisticsNodeCode">
              <el-select v-model="form.dispatchLogisticsNodeCode" placeholder="请选择发车据点" filterable style="width: 100%">
                <el-option
                  v-for="node in nodeOptions"
                  :key="node.code"
                  :label="node.name + '（' + node.code + '）'"
                  :value="node.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="接车据点" prop="handoverLogisticsNodeCode">
              <el-select v-model="form.handoverLogisticsNodeCode" placeholder="请选择接车据点" filterable style="width: 100%">
                <el-option
                  v-for="node in nodeOptions"
                  :key="node.code"
                  :label="node.name + '（' + node.code + '）'"
                  :value="node.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="运输车辆" prop="licensePlate">
              <el-select v-model="form.licensePlate" placeholder="请选择车牌" filterable allow-create default-first-option style="width: 100%">
                <el-option
                  v-for="vehicle in filteredVehicles"
                  :key="vehicle.licensePlate"
                  :label="vehicle.licensePlate + '（' + vehicle.vehicleType + '）'"
                  :value="vehicle.licensePlate"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="驾驶员身份证号" prop="idNumber">
              <el-select v-model="form.idNumber" placeholder="请选择驾驶员" filterable allow-create default-first-option style="width: 100%">
                <el-option
                  v-for="driver in filteredDrivers"
                  :key="driver.idNumber"
                  :label="driver.realName + '（' + driver.idNumber + '）'"
                  :value="driver.idNumber"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="调度人" prop="dispatcher">
              <el-input v-model="form.dispatcher" placeholder="请输入调度人"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预计装车时间" prop="estimatedLoadingTime">
              <el-date-picker
                v-model="form.estimatedLoadingTime"
                type="datetime"
                placeholder="请选择预计装车时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计到达时间" prop="estimatedArrivalTime">
              <el-date-picker
                v-model="form.estimatedArrivalTime"
                type="datetime"
                placeholder="请选择预计到达时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-alert
          title="调度成功后将向 WMS 下发出库指令，并回写订单状态为「准备发运(500)」；确认发车需全部 VIN 已出库。"
          type="info"
          :closable="false"
          show-icon
        />
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitDispatch">确 定</el-button>
        <el-button @click="openDispatch = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 交车 / 接车 -->
    <el-dialog :title="actionTitle" :visible.sync="openAction" width="480px" append-to-body>
      <el-form :model="actionForm" label-width="100px">
        <el-form-item label="运单号">
          <el-input v-model="actionForm.orderNum" readonly/>
        </el-form-item>
        <el-form-item label="完成情况">
          <el-radio-group v-model="actionForm.allCompleted">
            <el-radio :label="true">全部完成</el-radio>
            <el-radio :label="false">部分完成</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitAction">确 定</el-button>
        <el-button @click="openAction = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 运单明细 -->
    <el-dialog :title="detailTitle" :visible.sync="openDetail" width="900px" append-to-body>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="运单号">{{ detail.orderNum }}</el-descriptions-item>
        <el-descriptions-item label="来源订单号">{{ detail.sourceOrderNo }}</el-descriptions-item>
        <el-descriptions-item label="运单状态">{{ detail.stateName || getStateLabel(detail.state) }}</el-descriptions-item>
        <el-descriptions-item label="承运商">{{ detail.carrierCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="运输线路">{{ detail.transportRouteCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detail.warehouseCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发车据点">{{ detail.dispatchLogisticsNodeCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="接车据点">{{ detail.handoverLogisticsNodeCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="车牌">{{ detail.licensePlate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="调度人">{{ detail.dispatcher || '-' }}</el-descriptions-item>
        <el-descriptions-item label="调度时间">{{ parseTime(detail.dispatchTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预计装车时间">{{ parseTime(detail.estimatedLoadingTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预计到达时间">{{ parseTime(detail.estimatedArrivalTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="实际发车时间">{{ parseTime(detail.vehicleDispatchTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="交车时间">{{ parseTime(detail.deliveryTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="接车时间">{{ parseTime(detail.receiptTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="已回写订单状态">{{ detail.lastReportedVsoState || '-' }}</el-descriptions-item>
        <el-descriptions-item label="拒收原因">{{ detail.rejectReason || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="detailList" size="small" style="margin-top: 16px">
        <el-table-column label="VIN" prop="vin" min-width="200" :show-overflow-tooltip="true"/>
        <el-table-column label="WMS 状态" prop="stateName" align="center" width="120"/>
        <el-table-column label="出库单号" prop="outboundOrderNum" align="center" width="220" :show-overflow-tooltip="true"/>
        <el-table-column label="装载行号" prop="loadingLine" align="center" width="100"/>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="openDetail = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listTransportOrder,
  getTransportOrder,
  listTransportOrderDetail,
  dispatchTransportOrder,
  departTransportOrder,
  handoverTransportOrder,
  receiptTransportOrder,
  cancelTransportOrder,
  manualCloseTransportOrder
} from "@/api/completevehicle/transport/transportorder";
import {listAllCarrier} from "@/api/completevehicle/transport/carrier";
import {listAllLogisticsNode} from "@/api/completevehicle/transport/logisticsnode";
import {listAllTransportRoute} from "@/api/completevehicle/transport/transportroute";
import {listAllDriver} from "@/api/completevehicle/transport/driver";
import {listAllLoadingVehicle} from "@/api/completevehicle/transport/loadingVehicle";

export default {
  name: "TransportOrder",
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      orderList: [],
      carrierOptions: [],
      nodeOptions: [],
      routeOptions: [],
      driverOptions: [],
      vehicleOptions: [],
      stateOptions: [
        {value: 1, label: "未发运"},
        {value: 2, label: "运输中"},
        {value: 3, label: "部分交车"},
        {value: 4, label: "交车完成"},
        {value: 5, label: "部分接车"},
        {value: 6, label: "接车完成"},
        {value: 7, label: "手工结束"},
        {value: 9, label: "已取消"}
      ],
      dateRange: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        orderNum: undefined,
        state: undefined,
        carrierCode: undefined,
        dispatchLogisticsNodeCode: undefined
      },
      openDispatch: false,
      form: {},
      rules: {
        carrierCode: [{required: true, message: "承运商不能为空", trigger: "change"}],
        transportRouteCode: [{required: true, message: "运输线路不能为空", trigger: "change"}],
        dispatchLogisticsNodeCode: [{required: true, message: "发车据点不能为空", trigger: "change"}],
        handoverLogisticsNodeCode: [{required: true, message: "接车据点不能为空", trigger: "change"}]
      },
      openAction: false,
      actionTitle: "",
      actionType: "",
      actionForm: {orderNum: undefined, allCompleted: true},
      openDetail: false,
      detailTitle: "",
      detail: {},
      detailList: []
    };
  },
  computed: {
    /** 线路按所选承运商过滤（未选承运商时全量） */
    filteredRoutes() {
      if (!this.form.carrierCode) {
        return this.routeOptions;
      }
      return this.routeOptions.filter(route => !route.carrierCode || route.carrierCode === this.form.carrierCode);
    },
    /** 装载车按所选承运商过滤 */
    filteredVehicles() {
      if (!this.form.carrierCode) {
        return this.vehicleOptions;
      }
      return this.vehicleOptions.filter(vehicle => vehicle.carrierCode === this.form.carrierCode);
    },
    /** 驾驶员按所选承运商过滤 */
    filteredDrivers() {
      if (!this.form.carrierCode) {
        return this.driverOptions;
      }
      return this.driverOptions.filter(driver => driver.carrierCode === this.form.carrierCode);
    }
  },
  created() {
    this.getOptions();
    this.getList();
  },
  methods: {
    /** 查询运输单列表 */
    getList() {
      this.loading = true;
      listTransportOrder(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.orderList = response.data.items || [];
        this.total = response.data.total;
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },
    /** 基底数据（承运商/据点/线路/驾驶员/装载车） */
    getOptions() {
      listAllCarrier().then(response => {
        this.carrierOptions = response || [];
      });
      listAllLogisticsNode().then(response => {
        this.nodeOptions = response || [];
      });
      listAllTransportRoute().then(response => {
        this.routeOptions = response || [];
      });
      listAllDriver().then(response => {
        this.driverOptions = response || [];
      });
      listAllLoadingVehicle().then(response => {
        this.vehicleOptions = response || [];
      });
    },
    getStateLabel(state) {
      const item = this.stateOptions.find(option => option.value === state);
      return item ? item.label : state;
    },
    stateTagType(state) {
      if (state === 1) {
        return "info";
      }
      if (state === 2) {
        return "warning";
      }
      if (state === 6) {
        return "success";
      }
      if (state === 7 || state === 9) {
        return "danger";
      }
      return "";
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    /** 调度 */
    handleDispatch(row) {
      this.form = {
        orderNum: row.orderNum,
        carrierCode: row.carrierCode,
        transportRouteCode: row.transportRouteCode,
        dispatchLogisticsNodeCode: row.dispatchLogisticsNodeCode,
        handoverLogisticsNodeCode: row.handoverLogisticsNodeCode,
        licensePlate: row.licensePlate,
        dispatcher: row.dispatcher
      };
      this.openDispatch = true;
      this.$nextTick(() => {
        if (this.$refs["dispatchForm"]) {
          this.$refs["dispatchForm"].clearValidate();
        }
      });
    },
    submitDispatch() {
      this.$refs["dispatchForm"].validate(valid => {
        if (!valid) {
          return;
        }
        const payload = {
          orderNum: this.form.orderNum,
          carrierCode: this.form.carrierCode,
          transportRouteCode: this.form.transportRouteCode,
          dispatchLogisticsNodeCode: this.form.dispatchLogisticsNodeCode,
          handoverLogisticsNodeCode: this.form.handoverLogisticsNodeCode,
          licensePlate: this.form.licensePlate,
          idNumber: this.form.idNumber,
          estimatedLoadingTime: this.toIso(this.form.estimatedLoadingTime),
          estimatedArrivalTime: this.toIso(this.form.estimatedArrivalTime),
          dispatcher: this.form.dispatcher
        };
        dispatchTransportOrder(payload).then(() => {
          this.$modal.msgSuccess("调度成功，已下发出库指令并回写订单状态");
          this.openDispatch = false;
          this.getList();
        });
      });
    },
    /** 确认发车 */
    handleDepart(row) {
      this.$confirm('确认运单「' + row.orderNum + '」已全部装车出库并发车？发车后将回写订单状态为「运输中」。', "确认发车", {
        confirmButtonText: "确 定",
        cancelButtonText: "取 消",
        type: "warning"
      }).then(() => {
        departTransportOrder({orderNum: row.orderNum}).then(() => {
          this.$modal.msgSuccess("发车成功");
          this.getList();
        });
      }).catch(() => {
      });
    },
    /** 交车 */
    handleHandover(row) {
      this.actionType = "handover";
      this.actionTitle = "运单交车";
      this.actionForm = {orderNum: row.orderNum, allCompleted: true};
      this.openAction = true;
    },
    /** 接车 */
    handleReceipt(row) {
      this.actionType = "receipt";
      this.actionTitle = "运单接车";
      this.actionForm = {orderNum: row.orderNum, allCompleted: true};
      this.openAction = true;
    },
    submitAction() {
      const request = this.actionType === "handover" ? handoverTransportOrder : receiptTransportOrder;
      request({orderNum: this.actionForm.orderNum, allCompleted: this.actionForm.allCompleted}).then(() => {
        this.$modal.msgSuccess("操作成功");
        this.openAction = false;
        this.getList();
      });
    },
    /** 取消运单 */
    handleCancel(row) {
      this.$prompt('请输入取消运单「' + row.orderNum + '」的原因（仅未装车可取消）', "取消运单", {
        confirmButtonText: "确 定",
        cancelButtonText: "取 消"
      }).then(({value}) => {
        cancelTransportOrder({orderNum: row.orderNum, reason: value}).then(() => {
          this.$modal.msgSuccess("取消成功");
          this.getList();
        });
      }).catch(() => {
      });
    },
    /** 手工结束 */
    handleManualClose(row) {
      this.$confirm('确认手工结束运单「' + row.orderNum + '」？', "手工结束", {
        confirmButtonText: "确 定",
        cancelButtonText: "取 消",
        type: "warning"
      }).then(() => {
        manualCloseTransportOrder({orderNum: row.orderNum}).then(() => {
          this.$modal.msgSuccess("已手工结束");
          this.getList();
        });
      }).catch(() => {
      });
    },
    /** 运单明细 */
    handleDetail(row) {
      this.detailTitle = "运单明细 - " + row.orderNum;
      getTransportOrder(row.orderNum).then(response => {
        this.detail = response.data || {};
      });
      listTransportOrderDetail(row.orderNum).then(response => {
        this.detailList = response || [];
      });
      this.openDetail = true;
    },
    /** 本地时间 → ISO-8601 UTC（后端时间契约） */
    toIso(value) {
      return value ? new Date(value).toISOString() : null;
    }
  }
};
</script>
