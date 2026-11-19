<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="出库单号" prop="orderNum">
        <el-input
          v-model="queryParams.orderNum"
          placeholder="请输入出库单号"
          clearable
          style="width: 190px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="来源单号" prop="sourceOrderNum">
        <el-input
          v-model="queryParams.sourceOrderNum"
          placeholder="请输入来源单号"
          clearable
          style="width: 170px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="来源系统" prop="sourceSystem">
        <el-input
          v-model="queryParams.sourceSystem"
          placeholder="请输入来源系统"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="仓库" prop="warehouseCode">
        <el-select
          v-model="queryParams.warehouseCode"
          placeholder="请选择仓库"
          clearable
          filterable
          style="width: 200px"
        >
          <el-option
            v-for="warehouse in warehouseList"
            :key="warehouse.code"
            :label="warehouse.name + '（' + warehouse.code + '）'"
            :value="warehouse.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="state">
        <el-select
          v-model="queryParams.state"
          placeholder="请选择状态"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="item in outboundOrderStateOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
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
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="outboundOrderList">
      <el-table-column label="出库单号" prop="orderNum" width="220" show-overflow-tooltip/>
      <el-table-column label="来源系统" prop="sourceSystem" width="140" show-overflow-tooltip/>
      <el-table-column label="来源单号" prop="sourceOrderNum" width="200" show-overflow-tooltip/>
      <el-table-column label="仓库代码" prop="warehouseCode" width="140" show-overflow-tooltip/>
      <el-table-column label="状态" align="center" width="120">
        <template slot-scope="scope">
          <el-tooltip :content="scope.row.state || '-'" placement="top">
            <span>{{ outboundOrderStateLabel(scope.row.state) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="聚合版本" align="center" prop="aggregateVersion" width="100"/>
      <el-table-column label="创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="100" fixed="right" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleView(scope.row)"
            v-hasPermi="['completeVehicle:warehouse:outboundOrder:query']"
          >详情
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

    <!-- 出库单详情对话框：按 VIN 装车／出库确认，装车前可整单取消 -->
    <el-dialog title="出库单详情" :visible.sync="open" width="1080px" append-to-body>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="出库单号">{{ order.orderNum || '-' }}</el-descriptions-item>
        <el-descriptions-item label="出库单状态">
          <el-tooltip :content="order.state || '-'" placement="top">
            <span>{{ outboundOrderStateLabel(order.state) }}</span>
          </el-tooltip>
        </el-descriptions-item>
        <el-descriptions-item label="来源系统">{{ order.sourceSystem || '-' }}</el-descriptions-item>
        <el-descriptions-item label="来源单号">{{ order.sourceOrderNum || '-' }}</el-descriptions-item>
        <el-descriptions-item label="仓库代码">{{ order.warehouseCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="聚合版本">{{ order.aggregateVersion === undefined ? '-' : order.aggregateVersion }}</el-descriptions-item>
        <el-descriptions-item label="首次请求标识">{{ order.requestId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(order.createTime) || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-table v-loading="detailLoading" :data="detailList" size="small" style="margin-top: 16px">
        <el-table-column label="车架号" prop="vin" min-width="180" show-overflow-tooltip/>
        <el-table-column label="生产配置代码" prop="buildConfigCode" min-width="170" show-overflow-tooltip/>
        <el-table-column label="储区代码" prop="storageAreaCode" width="100"/>
        <el-table-column label="储位代码" prop="storageLocationCode" width="110"/>
        <el-table-column label="明细状态" align="center" width="100">
          <template slot-scope="scope">
            <el-tooltip :content="scope.row.state || '-'" placement="top">
              <span>{{ outboundDetailStateLabel(scope.row.state) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="预留时间" align="center" width="150">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.reserveTime) || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="装车时间" align="center" width="150">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.loadTime) || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出库时间" align="center" width="150">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.outboundTime) || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="180" fixed="right" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button
              v-if="scope.row.state === 'RESERVED'"
              size="mini"
              type="text"
              icon="el-icon-truck"
              @click="handleLoading(scope.row)"
              v-hasPermi="['completeVehicle:warehouse:outboundOrder:load']"
            >装车确认
            </el-button>
            <el-button
              v-if="scope.row.state === 'LOADED'"
              size="mini"
              type="text"
              icon="el-icon-position"
              @click="handleOutbound(scope.row)"
              v-hasPermi="['completeVehicle:warehouse:outboundOrder:outbound']"
            >出库确认
            </el-button>
            <span v-if="scope.row.state === 'OUTBOUND' || scope.row.state === 'RELEASED'">-</span>
          </template>
        </el-table-column>
      </el-table>

      <div slot="footer" class="dialog-footer">
        <el-button
          type="danger"
          plain
          :disabled="!cancellable"
          :loading="submitLoading"
          @click="handleCancel"
          v-hasPermi="['completeVehicle:warehouse:outboundOrder:cancel']"
        >取消出库单
        </el-button>
        <el-button @click="open = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 取消出库单弹窗：仅装车前可用 -->
    <el-dialog title="取消出库单" :visible.sync="cancelOpen" width="480px" append-to-body>
      <el-form ref="cancelForm" :model="cancelForm" :rules="cancelRules" label-width="100px">
        <el-form-item label="出库单号">
          <el-input v-model="cancelForm.orderNum" :readonly="true"/>
        </el-form-item>
        <el-form-item label="取消原因" prop="reason">
          <el-input
            v-model="cancelForm.reason"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="请输入取消原因"
          />
        </el-form-item>
        <el-alert
          title="取消后该出库单全部预留车辆将释放为「在库」，已装车或已出库的出库单不允许取消。"
          type="warning"
          :closable="false"
          show-icon
        />
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" :loading="submitLoading" @click="submitCancel">确 定</el-button>
        <el-button @click="cancelOpen = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listOutboundOrder,
  getOutboundOrder,
  listOutboundOrderDetail,
  loadingOutboundVin,
  outboundOutboundVin,
  cancelOutboundOrder
} from "@/api/completevehicle/warehouse/outboundorder";
import {listWarehouse} from "@/api/completevehicle/warehouse/info";
import {
  OUTBOUND_ORDER_STATE_OPTIONS,
  outboundOrderStateLabel,
  outboundDetailStateLabel
} from "@/views/completevehicle/warehouse/wmsLabels";

export default {
  name: "OutboundOrder",
  dicts: [],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 仓库候选列表（出库单不按库类型过滤，直接列出全部仓库）
      warehouseList: [],
      // 出库单表格数据
      outboundOrderList: [],
      // 出库单状态下拉选项（后端权威状态枚举 → 中文标签）
      outboundOrderStateOptions: OUTBOUND_ORDER_STATE_OPTIONS,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 是否显示详情弹窗
      open: false,
      // 详情加载中
      detailLoading: false,
      // 当前出库单
      order: {},
      // 当前出库单 VIN 明细
      detailList: [],
      // 取消出库单弹窗
      cancelOpen: false,
      cancelForm: {},
      cancelRules: {
        reason: [
          {required: true, message: "取消原因不能为空", trigger: "blur"}
        ]
      },
      // 提交加载中
      submitLoading: false
    };
  },
  computed: {
    /**
     * 是否允许取消出库单。
     * 服务端规则：仅当全部明细均为 RESERVED 时允许取消，任一明细 LOADED／OUTBOUND 后一律拒绝。
     */
    cancellable() {
      if (!this.order || !this.order.state) {
        return false;
      }
      if (this.order.state === 'CANCELLED' || this.order.state === 'COMPLETED') {
        return false;
      }
      return this.detailList.length > 0 && this.detailList.every(item => item.state === 'RESERVED');
    }
  },
  created() {
    this.getWarehouseList();
    this.getList();
  },
  methods: {
    /** 出库单状态中文标签 */
    outboundOrderStateLabel,
    /** 出库单明细状态中文标签 */
    outboundDetailStateLabel,
    /** 查询仓库候选列表 */
    getWarehouseList() {
      listWarehouse({pageNum: 1, pageSize: 500}).then(response => {
        this.warehouseList = (response.data && response.data.items) || [];
      });
    },
    /** 查询出库单列表 */
    getList() {
      this.loading = true;
      listOutboundOrder(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.outboundOrderList = (response.data && response.data.items) || [];
        this.total = (response.data && response.data.total) || 0;
        this.loading = false;
      }).catch(() => {
        this.outboundOrderList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    /** 详情按钮操作 */
    handleView(row) {
      this.order = {};
      this.detailList = [];
      this.open = true;
      this.loadOrder(row.id);
      this.loadDetail(row.id);
    },
    /** 加载出库单主信息 */
    loadOrder(outboundOrderId) {
      getOutboundOrder(outboundOrderId).then(response => {
        this.order = response.data || {};
      });
    },
    /** 加载出库单 VIN 明细 */
    loadDetail(outboundOrderId) {
      this.detailLoading = true;
      listOutboundOrderDetail(outboundOrderId).then(response => {
        this.detailList = response.data || [];
        this.detailLoading = false;
      }).catch(() => {
        this.detailList = [];
        this.detailLoading = false;
      });
    },
    /** 刷新详情与列表（动作成功后服务端版本已递增） */
    refreshDetail() {
      if (this.order && this.order.id) {
        this.loadOrder(this.order.id);
        this.loadDetail(this.order.id);
      }
      this.getList();
    },
    /** 装车确认 */
    handleLoading(detail) {
      this.$modal.confirm('确认车架号 ' + detail.vin + ' 已装车？装车后库存保持「已预留」并继续占用储位。').then(() => {
        return loadingOutboundVin(this.order.orderNum, detail.vin, {
          requestId: this.genRequestId(),
          expectedVersion: detail.rowVersion
        });
      }).then(() => {
        this.$modal.msgSuccess("装车确认成功");
        this.refreshDetail();
      }).catch(() => {
      });
    },
    /** 出库确认 */
    handleOutbound(detail) {
      this.$modal.confirm('确认车架号 ' + detail.vin + ' 已出库？出库后库存变为「已出库」并释放储位。').then(() => {
        return outboundOutboundVin(this.order.orderNum, detail.vin, {
          requestId: this.genRequestId(),
          expectedVersion: detail.rowVersion
        });
      }).then(() => {
        this.$modal.msgSuccess("出库确认成功");
        this.refreshDetail();
      }).catch(() => {
      });
    },
    /** 取消出库单按钮操作 */
    handleCancel() {
      if (!this.cancellable) {
        this.$modal.msgWarning("仅全部车辆处于「已预留」时才允许取消出库单");
        return;
      }
      this.cancelForm = {
        orderNum: this.order.orderNum,
        expectedVersion: this.order.rowVersion,
        reason: ''
      };
      this.cancelOpen = true;
      this.$nextTick(() => {
        this.$refs["cancelForm"] && this.$refs["cancelForm"].clearValidate();
      });
    },
    /** 提交取消出库单 */
    submitCancel() {
      this.$refs["cancelForm"].validate(valid => {
        if (!valid) {
          return;
        }
        this.submitLoading = true;
        cancelOutboundOrder(this.cancelForm.orderNum, {
          requestId: this.genRequestId(),
          reason: this.cancelForm.reason,
          expectedVersion: this.cancelForm.expectedVersion
        }).then(() => {
          this.$modal.msgSuccess("取消出库单成功，预留车辆已释放为在库");
          this.cancelOpen = false;
          this.submitLoading = false;
          this.refreshDetail();
        }).catch(() => {
          this.submitLoading = false;
        });
      });
    },
    /** 生成幂等请求标识（32位UUID，保证 action:requestId 不超过 inbox event_id 的64长度） */
    genRequestId() {
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      return uuid.replace(/-/g, '');
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
    }
  }
};
</script>
