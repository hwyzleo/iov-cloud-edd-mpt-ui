<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="任务号" prop="orderNum">
        <el-input
          v-model="queryParams.orderNum"
          placeholder="请输入任务号"
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
      <el-form-item label="车架号" prop="vin">
        <el-input
          v-model="queryParams.vin"
          placeholder="请输入车架号"
          clearable
          style="width: 170px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="目标仓库" prop="warehouseCode">
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
          style="width: 130px"
        >
          <el-option
            v-for="item in inboundTaskStateOptions"
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

    <el-table v-loading="loading" :data="inboundTaskList">
      <el-table-column label="任务号" prop="orderNum" width="220" show-overflow-tooltip/>
      <el-table-column label="来源系统" prop="sourceSystem" width="120" show-overflow-tooltip/>
      <el-table-column label="来源单号" prop="sourceOrderNum" width="200" show-overflow-tooltip/>
      <el-table-column label="车架号" prop="vin" width="180" show-overflow-tooltip/>
      <el-table-column label="目标仓库" prop="warehouseCode" width="140" show-overflow-tooltip/>
      <el-table-column label="状态" align="center" width="110">
        <template slot-scope="scope">
          <el-tooltip :content="scope.row.state || '-'" placement="top">
            <span>{{ inboundTaskStateLabel(scope.row.state) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="预计到达时间" align="center" width="150">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.estimatedArrivalTime) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="到达时间" align="center" width="150">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.arrivalTime) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="入库时间" align="center" width="150">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.inboundTime) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" fixed="right" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-if="scope.row.state === 'PENDING'"
            size="mini"
            type="text"
            icon="el-icon-check"
            @click="handleArrival(scope.row)"
            v-hasPermi="['completeVehicle:warehouse:inboundTask:arrival']"
          >到货确认
          </el-button>
          <el-button
            v-if="scope.row.state === 'ARRIVED'"
            size="mini"
            type="text"
            icon="el-icon-box"
            @click="handleInbound(scope.row)"
            v-hasPermi="['completeVehicle:warehouse:inboundTask:inbound']"
          >入库确认
          </el-button>
          <el-button
            v-if="scope.row.state === 'PENDING' || scope.row.state === 'ARRIVED'"
            size="mini"
            type="text"
            icon="el-icon-close"
            @click="handleCancel(scope.row)"
            v-hasPermi="['completeVehicle:warehouse:inboundTask:cancel']"
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

    <!-- 入库确认弹窗：选择储区/储位 -->
    <el-dialog title="到货入库确认" :visible.sync="inboundOpen" width="520px" append-to-body>
      <el-form ref="inboundForm" :model="inboundForm" :rules="inboundRules" label-width="100px">
        <el-form-item label="任务号">
          <el-input v-model="inboundForm.orderNum" :readonly="true"/>
        </el-form-item>
        <el-form-item label="车架号">
          <el-input v-model="inboundForm.vin" :readonly="true"/>
        </el-form-item>
        <el-form-item label="目标仓库">
          <el-input v-model="inboundForm.warehouseCode" :readonly="true"/>
        </el-form-item>
        <el-form-item label="储区" prop="storageAreaCode">
          <el-select v-model="inboundForm.storageAreaCode" placeholder="请选择储区" style="width: 100%"
                     @change="handleStorageAreaChange">
            <el-option
              v-for="area in storageAreaList"
              :key="area.code"
              :label="area.name + '（' + area.code + '）'"
              :value="area.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="储位" prop="storageLocationCode">
          <el-select v-model="inboundForm.storageLocationCode" placeholder="请选择储位" style="width: 100%"
                     :loading="locationLoading">
            <el-option
              v-for="location in storageLocationList"
              :key="location.code"
              :label="location.name + '（' + location.code + '）'"
              :value="location.code"
            />
          </el-select>
        </el-form-item>
        <el-alert
          title="入库确认后车辆当前库存变为「在库」并占用所选储位，同时生成第二段入库事实。"
          type="info"
          :closable="false"
          show-icon
        />
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" :loading="submitLoading" @click="submitInbound">确 定</el-button>
        <el-button @click="inboundOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 取消待入库任务弹窗 -->
    <el-dialog title="取消待入库任务" :visible.sync="cancelOpen" width="480px" append-to-body>
      <el-form ref="cancelForm" :model="cancelForm" :rules="cancelRules" label-width="100px">
        <el-form-item label="任务号">
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
          title="取消后车辆库存回退为「已出库」，任务不可再入库。"
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
  listInboundTask,
  arrivalInboundTask,
  inboundInboundTask,
  cancelInboundTask
} from "@/api/completevehicle/warehouse/inboundtask";
import {
  listWarehouse,
  listWarehouseStorageArea,
  listWarehouseStorageAreaStorageLocation
} from "@/api/completevehicle/warehouse/info";
import {
  INBOUND_TASK_STATE_OPTIONS,
  inboundTaskStateLabel
} from "@/views/completevehicle/warehouse/wmsLabels";

export default {
  name: "InboundNotice",
  dicts: [],
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      warehouseList: [],
      inboundTaskList: [],
      inboundTaskStateOptions: INBOUND_TASK_STATE_OPTIONS,
      dateRange: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
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
      storageAreaList: [],
      storageLocationList: [],
      warehouseId: undefined,
      locationLoading: false,
      cancelOpen: false,
      cancelForm: {},
      cancelRules: {
        reason: [
          {required: true, message: "取消原因不能为空", trigger: "blur"}
        ]
      },
      currentRow: {},
      submitLoading: false
    };
  },
  created() {
    this.getWarehouseList();
    this.getList();
  },
  methods: {
    /** 待入库任务状态中文标签 */
    inboundTaskStateLabel,
    /** 查询交付库候选（不按库类型硬编码，全部仓库可选） */
    getWarehouseList() {
      listWarehouse({pageNum: 1, pageSize: 500}).then(response => {
        this.warehouseList = (response.data && response.data.items) || [];
      });
    },
    /** 查询待入库任务列表 */
    getList() {
      this.loading = true;
      listInboundTask(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.inboundTaskList = (response.data && response.data.items) || [];
        this.total = (response.data && response.data.total) || 0;
        this.loading = false;
      }).catch(() => {
        this.inboundTaskList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    /** 到货确认 */
    handleArrival(row) {
      this.$modal.confirm('确认车辆 ' + row.vin + ' 已到达仓库「' + row.warehouseCode + '」？').then(() => {
        return arrivalInboundTask(row.orderNum, {
          requestId: this.genRequestId(),
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
        warehouseCode: row.warehouseCode,
        storageAreaCode: undefined,
        storageLocationCode: undefined
      };
      this.storageAreaList = [];
      this.storageLocationList = [];
      this.inboundOpen = true;
      this.$nextTick(() => {
        this.$refs["inboundForm"] && this.$refs["inboundForm"].clearValidate();
      });
      listWarehouse({pageNum: 1, pageSize: 1, code: row.warehouseCode}).then(response => {
        const warehouse = response.data && response.data.items && response.data.items[0];
        if (!warehouse) {
          this.$modal.msgError("未找到仓库：" + row.warehouseCode);
          return;
        }
        this.warehouseId = warehouse.id;
        return listWarehouseStorageArea(warehouse.id).then(areas => {
          this.storageAreaList = areas || [];
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
        this.storageLocationList = locations || [];
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
        inboundInboundTask(this.inboundForm.orderNum, {
          requestId: this.genRequestId(),
          storageAreaCode: this.inboundForm.storageAreaCode,
          storageLocationCode: this.inboundForm.storageLocationCode,
          expectedVersion: this.currentRow.rowVersion
        }).then(() => {
          this.$modal.msgSuccess("入库确认成功");
          this.inboundOpen = false;
          this.submitLoading = false;
          this.getList();
        }).catch(() => {
          this.submitLoading = false;
        });
      });
    },
    /** 取消按钮操作 */
    handleCancel(row) {
      this.currentRow = row;
      this.cancelForm = {orderNum: row.orderNum, reason: ''};
      this.cancelOpen = true;
      this.$nextTick(() => {
        this.$refs["cancelForm"] && this.$refs["cancelForm"].clearValidate();
      });
    },
    /** 提交取消 */
    submitCancel() {
      this.$refs["cancelForm"].validate(valid => {
        if (!valid) {
          return;
        }
        this.submitLoading = true;
        cancelInboundTask(this.cancelForm.orderNum, {
          requestId: this.genRequestId(),
          reason: this.cancelForm.reason,
          expectedVersion: this.currentRow.rowVersion
        }).then(() => {
          this.$modal.msgSuccess("取消成功，车辆库存已回退为已出库");
          this.cancelOpen = false;
          this.submitLoading = false;
          this.getList();
        }).catch(() => {
          this.submitLoading = false;
        });
      });
    },
    /** 生成幂等请求标识（32位UUID） */
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
