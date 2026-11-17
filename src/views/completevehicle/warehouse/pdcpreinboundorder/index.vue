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
      <el-form-item label="仓库" prop="warehouseCode">
        <el-select
          v-model="queryParams.warehouseCode"
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
      <el-table-column label="操作" align="center" width="260" fixed="right" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-if="scope.row.state === 'PENDING_ARRIVAL'"
            size="mini"
            type="text"
            icon="el-icon-check"
            @click="handleArrival(scope.row)"
            v-hasPermi="['completeVehicle:warehouse:preInboundOrder:arrival']"
          >到货确认
          </el-button>
          <el-button
            v-if="scope.row.state === 'ARRIVED'"
            size="mini"
            type="text"
            icon="el-icon-box"
            @click="handleInbound(scope.row)"
            v-hasPermi="['completeVehicle:warehouse:preInboundOrder:inbound']"
          >入库确认
          </el-button>
          <el-button
            v-if="scope.row.state === 'PENDING_ARRIVAL' || scope.row.state === 'ARRIVED'"
            size="mini"
            type="text"
            icon="el-icon-close"
            @click="handleCancel(scope.row)"
            v-hasPermi="['completeVehicle:warehouse:preInboundOrder:cancel']"
          >取消
          </el-button>
          <span v-if="scope.row.state === 'COMPLETED' || scope.row.state === 'CANCELLED'">-</span>
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

    <!-- 入库确认对话框：选择储区与储位 -->
    <el-dialog title="入库确认" :visible.sync="inboundOpen" width="500px" append-to-body>
      <el-form ref="inboundForm" :model="inboundForm" :rules="inboundRules" label-width="100px">
        <el-form-item label="预入库单号">
          <el-input v-model="inboundForm.orderNum" :readonly="true"/>
        </el-form-item>
        <el-form-item label="车架号">
          <el-input v-model="inboundForm.vin" :readonly="true"/>
        </el-form-item>
        <el-form-item label="储区" prop="storageAreaCode">
          <el-select
            v-model="inboundForm.storageAreaCode"
            placeholder="请选择储区"
            style="width: 100%"
            @change="handleStorageAreaChange"
          >
            <el-option
              v-for="area in storageAreaList"
              :key="area.code"
              :label="area.name + '（' + area.code + '）'"
              :value="area.code"
              :disabled="!area.enable"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="储位" prop="storageLocationCode">
          <el-select
            v-model="inboundForm.storageLocationCode"
            placeholder="请选择储位"
            style="width: 100%"
            v-loading="locationLoading"
          >
            <el-option
              v-for="location in storageLocationList"
              :key="location.code"
              :label="location.name + '（' + location.code + '）'"
              :value="location.code"
              :disabled="!location.enable"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" :loading="submitLoading" @click="submitInbound">确 定</el-button>
        <el-button @click="inboundOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 取消预入库单对话框 -->
    <el-dialog title="取消预入库单" :visible.sync="cancelOpen" width="500px" append-to-body>
      <el-form ref="cancelForm" :model="cancelForm" label-width="100px">
        <el-form-item label="预入库单号">
          <el-input v-model="cancelForm.orderNum" :readonly="true"/>
        </el-form-item>
        <el-form-item label="取消原因" prop="reason">
          <el-input v-model="cancelForm.reason" type="textarea" :rows="3" placeholder="请输入取消原因"/>
        </el-form-item>
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
  listPreInboundOrder,
  arrivalPreInboundOrder,
  inboundPreInboundOrder,
  cancelPreInboundOrder
} from "@/api/completevehicle/warehouse/pdcpreinboundorder";
import {
  listWarehouse,
  listWarehouseByLevel,
  listWarehouseStorageArea,
  listWarehouseStorageAreaStorageLocation
} from "@/api/completevehicle/warehouse/info";

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
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 入库确认弹窗
      inboundOpen: false,
      inboundForm: {},
      inboundRules: {
        storageAreaCode: [
          {required: true, message: "储区不能为空", trigger: "change"}
        ],
        storageLocationCode: [
          {required: true, message: "储位不能为空", trigger: "change"}
        ]
      },
      // 取消预入库单弹窗
      cancelOpen: false,
      cancelForm: {},
      // 当前操作行
      currentRow: {},
      // 储区/储位候选列表
      storageAreaList: [],
      storageLocationList: [],
      // 当前预入库单所在仓库ID（用于查询储区/储位）
      warehouseId: undefined,
      // 储位加载中
      locationLoading: false,
      // 提交加载中
      submitLoading: false,
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
    /** 到货确认 */
    handleArrival(row) {
      this.$modal.confirm('确认车架号 ' + row.vin + ' 的车辆已到达「' + row.warehouseName + '」？').then(() => {
        return arrivalPreInboundOrder(row.orderNum, {
          requestId: this.genRequestId('ARR', row),
          expectedVersion: row.rowVersion
        });
      }).then(() => {
        this.$modal.msgSuccess("到货确认成功");
        this.getList();
      }).catch(() => {
      });
    },
    /** 入库确认：打开储区/储位选择弹窗 */
    handleInbound(row) {
      this.currentRow = row;
      this.inboundForm = {
        orderNum: row.orderNum,
        vin: row.vin,
        storageAreaCode: undefined,
        storageLocationCode: undefined
      };
      this.storageAreaList = [];
      this.storageLocationList = [];
      this.inboundOpen = true;
      listWarehouse({pageNum: 1, pageSize: 1, code: row.warehouseCode}).then(response => {
        const warehouse = response.data.items && response.data.items[0];
        if (!warehouse) {
          this.$modal.msgError("未找到仓库：" + row.warehouseCode);
          return;
        }
        this.warehouseId = warehouse.id;
        return listWarehouseStorageArea(warehouse.id).then(areas => {
          this.storageAreaList = areas;
        });
      });
    },
    /** 储区变更后加载储位 */
    handleStorageAreaChange(areaCode) {
      this.inboundForm.storageLocationCode = undefined;
      this.storageLocationList = [];
      const area = this.storageAreaList.find(item => item.code === areaCode);
      if (!area) {
        return;
      }
      this.locationLoading = true;
      listWarehouseStorageAreaStorageLocation(this.warehouseId, area.id).then(locations => {
        this.storageLocationList = locations;
        this.locationLoading = false;
      }).catch(() => {
        this.locationLoading = false;
      });
    },
    /** 提交入库确认 */
    submitInbound() {
      this.$refs["inboundForm"].validate(valid => {
        if (!valid) {
          return;
        }
        this.submitLoading = true;
        inboundPreInboundOrder(this.inboundForm.orderNum, {
          requestId: this.genRequestId('INB', this.currentRow),
          storageAreaCode: this.inboundForm.storageAreaCode,
          storageLocationCode: this.inboundForm.storageLocationCode,
          expectedVersion: this.currentRow.rowVersion
        }).then(() => {
          this.$modal.msgSuccess("入库确认成功，车辆已上架");
          this.inboundOpen = false;
          this.submitLoading = false;
          this.getList();
        }).catch(() => {
          this.submitLoading = false;
        });
      });
    },
    /** 取消预入库单 */
    handleCancel(row) {
      this.currentRow = row;
      this.cancelForm = {orderNum: row.orderNum, reason: undefined};
      this.cancelOpen = true;
    },
    /** 提交取消 */
    submitCancel() {
      this.submitLoading = true;
      cancelPreInboundOrder(this.cancelForm.orderNum, {
        requestId: this.genRequestId('CAN', this.currentRow),
        reason: this.cancelForm.reason,
        expectedVersion: this.currentRow.rowVersion
      }).then(() => {
        this.$modal.msgSuccess("预入库单已取消");
        this.cancelOpen = false;
        this.submitLoading = false;
        this.getList();
      }).catch(() => {
        this.submitLoading = false;
      });
    },
    /** 生成幂等请求标识（32位UUID，保证 action:requestId 不超过 inbox event_id 的64长度） */
    genRequestId(action, row) {
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
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length != 1
      this.multiple = !selection.length
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
