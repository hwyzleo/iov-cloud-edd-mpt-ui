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
          v-hasPermi="['completeVehicle:warehouse:inventoryTransfer:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="inventoryTransferList">
      <el-table-column label="车架号" prop="vin" width="180"/>
      <el-table-column label="生产配置代码" prop="buildConfigCode" min-width="180" show-overflow-tooltip/>
      <el-table-column label="仓库名称" prop="warehouseName" min-width="160" show-overflow-tooltip/>
      <el-table-column label="原储区代码" prop="oldStorageAreaCode" width="120"/>
      <el-table-column label="原储位代码" prop="oldStorageLocationCode" width="130"/>
      <el-table-column label="新储区代码" prop="newStorageAreaCode" width="120"/>
      <el-table-column label="新储位代码" prop="newStorageLocationCode" width="130"/>
      <el-table-column label="移库时间" align="center" prop="transferTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.transferTime) }}</span>
        </template>
      </el-table-column>
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
            v-hasPermi="['completeVehicle:warehouse:inventoryTransfer:query']"
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

    <!-- 移库详情对话框：移库记录是已完成的不可变事实，仅查看 -->
    <el-dialog title="移库详情" :visible.sync="open" width="700px" append-to-body>
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
            <el-form-item label="原储区代码">
              <el-input v-model="form.oldStorageAreaCode" :readonly="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原储位代码">
              <el-input v-model="form.oldStorageLocationCode" :readonly="true"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="新储区代码">
              <el-input v-model="form.newStorageAreaCode" :readonly="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="新储位代码">
              <el-input v-model="form.newStorageLocationCode" :readonly="true"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="移库时间">
              <span>{{ parseTime(form.transferTime) || '-' }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="移库者">
              <span>{{ form.transferBy || '-' }}</span>
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
  </div>
</template>

<script>
import {
  listInventoryTransfer,
  getInventoryTransfer
} from "@/api/completevehicle/warehouse/pdcinventorytransfer";
import {listWarehouseByLevel,} from "@/api/completevehicle/warehouse/info";

export default {
  name: "InventoryTransfer",
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
      // 移库信息表格数据
      inventoryTransferList: [],
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
    /** 详情按钮操作 */
    handleView(row) {
      this.form = {};
      getInventoryTransfer(row.id).then(response => {
        this.form = response.data;
        this.open = true;
      });
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
      this.download('otd-wms/mpt/inventoryTransfer/export', {
        ...this.queryParams
      }, `inventory_transfer_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
