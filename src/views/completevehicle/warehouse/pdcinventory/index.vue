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
      <el-form-item label="储存状态" prop="state">
        <el-select
          v-model="queryParams.state"
          placeholder="请选择状态"
          clearable
          style="width: 120px"
        >
          <el-option
            v-for="item in inventoryStateOptions"
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
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['completeVehicle:warehouse:inventory:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="inventoryList">
      <el-table-column label="车架号" prop="vin" width="180"/>
      <el-table-column label="生产配置代码" prop="buildConfigCode" min-width="180" show-overflow-tooltip/>
      <el-table-column label="仓库名称" prop="warehouseName" min-width="160" show-overflow-tooltip/>
      <el-table-column label="储区代码" prop="storageAreaCode" width="110"/>
      <el-table-column label="储位代码" prop="storageLocationCode" width="120"/>
      <el-table-column label="储存状态" align="center" width="110">
        <template slot-scope="scope">
          <el-tooltip :content="scope.row.stateName || String(scope.row.state)" placement="top">
            <span>{{ inventoryStateLabel(scope.row.state, scope.row.stateName) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="预留出库单号" prop="reservedOrderNum" min-width="200" show-overflow-tooltip/>
      <el-table-column label="入库时间" align="center" prop="inboundTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.inboundTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="出库时间" align="center" prop="outboundTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.outboundTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="140" fixed="right" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-if="scope.row.state === 1"
            size="mini"
            type="text"
            icon="el-icon-sort"
            @click="handleTransfer(scope.row)"
            v-hasPermi="['completeVehicle:warehouse:inventoryTransfer:add']"
          >移库
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleView(scope.row)"
            v-hasPermi="['completeVehicle:warehouse:inventory:query']"
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

    <!-- 库存详情对话框：库存由业务动作维护，仅查看 -->
    <el-dialog title="库存详情" :visible.sync="open" width="700px" append-to-body>
      <el-form :model="form" label-width="120px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="车架号">
              <el-input v-model="form.vin" :readonly="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产配置代码">
              <el-input v-model="form.buildConfigCode" :readonly="true"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="仓库名称">
          <el-input v-model="form.warehouseName" :readonly="true"/>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="储区代码">
              <el-input v-model="form.storageAreaCode" :readonly="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="储位代码">
              <el-input v-model="form.storageLocationCode" :readonly="true"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="储存状态">
              <span>{{ inventoryStateLabel(form.state, form.stateName) }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预留出库单号">
              <span>{{ form.reservedOrderNum || '-' }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="入库时间">
              <span>{{ parseTime(form.inboundTime) || '-' }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出库时间">
              <span>{{ parseTime(form.outboundTime) || '-' }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="创建时间">
          <span>{{ parseTime(form.createTime) || '-' }}</span>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="open = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 同库移库对话框：原储区/储位以服务端当前库存为准，只需选择目标位置 -->
    <el-dialog title="同库移库" :visible.sync="transferOpen" width="520px" append-to-body>
      <el-form ref="transferForm" :model="transferForm" :rules="transferRules" label-width="110px">
        <el-form-item label="车架号">
          <el-input v-model="transferForm.vin" :readonly="true"/>
        </el-form-item>
        <el-form-item label="仓库名称">
          <el-input v-model="transferForm.warehouseName" :readonly="true"/>
        </el-form-item>
        <el-form-item label="当前储区/储位">
          <el-input :value="currentLocation" :readonly="true"/>
        </el-form-item>
        <el-form-item label="目标储区" prop="newStorageAreaCode">
          <el-select
            v-model="transferForm.newStorageAreaCode"
            placeholder="请选择目标储区"
            style="width: 100%"
            @change="handleTransferAreaChange"
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
        <el-form-item label="目标储位" prop="newStorageLocationCode">
          <el-select
            v-model="transferForm.newStorageLocationCode"
            placeholder="请选择目标储位"
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
        <el-button type="primary" :loading="submitLoading" @click="submitTransfer">确 定</el-button>
        <el-button @click="transferOpen = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listInventory,
  getInventory
} from "@/api/completevehicle/warehouse/pdcinventory";
import {transferInventory} from "@/api/completevehicle/warehouse/pdcinventorytransfer";
import {
  listWarehouse,
  listWarehouseStorageArea,
  listWarehouseStorageAreaStorageLocation
} from "@/api/completevehicle/warehouse/info";
import {
  INVENTORY_STATE_OPTIONS,
  inventoryStateLabel
} from "@/views/completevehicle/warehouse/wmsLabels";

export default {
  name: "PdcInventory",
  dicts: [],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 前置库列表
      pdcWarehouseList: [],
      // 库存表格数据
      inventoryList: [],
      // 库存状态下拉选项（数值与后端 InventoryState 保持一致）
      inventoryStateOptions: INVENTORY_STATE_OPTIONS,
      // 是否显示详情弹窗
      open: false,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 详情表单参数
      form: {},
      // 移库弹窗
      transferOpen: false,
      transferForm: {},
      transferRules: {
        newStorageAreaCode: [
          {required: true, message: "目标储区不能为空", trigger: "change"}
        ],
        newStorageLocationCode: [
          {required: true, message: "目标储位不能为空", trigger: "change"}
        ]
      },
      // 当前操作行
      currentRow: {},
      // 目标储区/储位候选列表
      storageAreaList: [],
      storageLocationList: [],
      // 当前库存所在仓库ID（用于查询储区/储位）
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
  computed: {
    /** 当前所在储区/储位展示文本 */
    currentLocation() {
      const row = this.currentRow || {};
      if (!row.storageAreaCode && !row.storageLocationCode) {
        return '-';
      }
      return (row.storageAreaCode || '-') + ' / ' + (row.storageLocationCode || '-');
    }
  },
  methods: {
    /** 查询仓库候选（不按库类型硬编码，交付库/区域库车辆同样可查） */
    getPdcWarehouseList() {
      listWarehouse({pageNum: 1, pageSize: 500}).then(response => {
        this.pdcWarehouseList = (response.data && response.data.items) || [];
      });
    },
    /** 查询库存列表 */
    getList() {
      this.loading = true;
      listInventory(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.inventoryList = response.data.items;
          this.total = response.data.total;
          this.loading = false;
        }
      );
    },
    /** 库存状态中文标签 */
    inventoryStateLabel,
    /** 详情按钮操作 */
    handleView(row) {
      this.form = {};
      getInventory(row.id).then(response => {
        this.form = response.data;
        this.open = true;
      });
    },
    /** 移库按钮操作：加载仓库储区候选 */
    handleTransfer(row) {
      this.currentRow = row;
      this.transferForm = {
        vin: row.vin,
        warehouseCode: row.warehouseCode,
        warehouseName: row.warehouseName,
        newStorageAreaCode: undefined,
        newStorageLocationCode: undefined
      };
      this.storageAreaList = [];
      this.storageLocationList = [];
      this.transferOpen = true;
      this.$nextTick(() => {
        this.$refs["transferForm"] && this.$refs["transferForm"].clearValidate();
      });
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
    /** 目标储区变更后加载储位 */
    handleTransferAreaChange(areaCode) {
      this.transferForm.newStorageLocationCode = undefined;
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
    /** 提交移库 */
    submitTransfer() {
      this.$refs["transferForm"].validate(valid => {
        if (!valid) {
          return;
        }
        this.submitLoading = true;
        transferInventory({
          requestId: this.genRequestId(),
          vin: this.currentRow.vin,
          warehouseCode: this.currentRow.warehouseCode,
          newStorageAreaCode: this.transferForm.newStorageAreaCode,
          newStorageLocationCode: this.transferForm.newStorageLocationCode,
          expectedVersion: this.currentRow.rowVersion
        }).then(() => {
          this.$modal.msgSuccess("移库成功");
          this.transferOpen = false;
          this.submitLoading = false;
          this.getList();
        }).catch(() => {
          this.submitLoading = false;
        });
      });
    },
    /** 生成幂等请求标识（32位UUID，保证不超过 request_id 的64长度） */
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
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('otd-wms/mpt/inventory/export', {
        ...this.queryParams
      }, `inventory_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
