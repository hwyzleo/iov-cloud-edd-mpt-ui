<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="车辆" prop="vin">
        <el-input
          v-model="queryParams.vin"
          placeholder="请输入车辆"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
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
          v-hasPermi="['ota:fota:vehicle:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="车辆" key="vin" prop="vin" v-if="columns[0].visible" min-width="170" fixed="left"/>
      <el-table-column label="品牌" key="brandCode" prop="brandCode" v-if="columns[1].visible" width="80" align="center"/>
      <el-table-column label="平台" key="platformCode" prop="platformCode" v-if="columns[2].visible" width="80" align="center"/>
      <el-table-column label="车系" key="carLineCode" prop="carLineCode" v-if="columns[3].visible" width="80" align="center"/>
      <el-table-column label="车型" key="modelCode" prop="modelCode" v-if="columns[4].visible" width="100" align="center"/>
      <el-table-column label="版本" key="variantCode" prop="variantCode" v-if="columns[5].visible" width="140" align="center"/>
      <el-table-column label="配置代码" key="configurationCode" prop="configurationCode" v-if="columns[6].visible" width="180" align="center"/>
      <el-table-column label="工厂代码" key="plantCode" prop="plantCode" v-if="columns[7].visible" width="100" align="center"/>
      <el-table-column label="生产时间" key="productionTime" prop="productionTime" v-if="columns[8].visible" align="center" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.productionTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最后同步时间" key="lastSyncTime" prop="lastSyncTime" v-if="columns[9].visible" align="center" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.lastSyncTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最后上报时间" key="lastInventoryReportedAt" prop="lastInventoryReportedAt" v-if="columns[10].visible" align="center" width="140">
        <template slot-scope="scope">
          <span>{{ scope.row.lastInventoryReportedAt ? parseTime(scope.row.lastInventoryReportedAt, '{y}-{m}-{d} {h}:{i}') : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" key="createTime" prop="createTime" v-if="columns[11].visible" align="center" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="100" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleDetail(scope.row)"
            v-hasPermi="['ota:fota:vehicle:query']"
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

    <!-- 车辆详情（只读，含最后上报时间） -->
    <el-drawer title="车辆详情" :visible.sync="detailOpen" direction="rtl" size="600px"
               :modal="true"
               :append-to-body="true"
               @close="detailCancel">
      <div class="drawer-content" v-loading="detailLoading">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="车辆">{{ detail.vin || '--' }}</el-descriptions-item>
          <el-descriptions-item label="品牌">{{ detail.brandCode || '--' }}</el-descriptions-item>
          <el-descriptions-item label="平台">{{ detail.platformCode || '--' }}</el-descriptions-item>
          <el-descriptions-item label="车系">{{ detail.carLineCode || '--' }}</el-descriptions-item>
          <el-descriptions-item label="车型">{{ detail.modelCode || '--' }}</el-descriptions-item>
          <el-descriptions-item label="版本">{{ detail.variantCode || '--' }}</el-descriptions-item>
          <el-descriptions-item label="配置代码">{{ detail.configurationCode || '--' }}</el-descriptions-item>
          <el-descriptions-item label="工厂代码">{{ detail.plantCode || '--' }}</el-descriptions-item>
          <el-descriptions-item label="生产时间">
            {{ detail.productionTime ? parseTime(detail.productionTime, '{y}-{m}-{d} {h}:{i}') : '--' }}
          </el-descriptions-item>
          <el-descriptions-item label="最后同步时间">
            {{ detail.lastSyncTime ? parseTime(detail.lastSyncTime, '{y}-{m}-{d} {h}:{i}') : '--' }}
          </el-descriptions-item>
          <el-descriptions-item label="最后上报时间">
            {{ detail.lastInventoryReportedAt ? parseTime(detail.lastInventoryReportedAt, '{y}-{m}-{d} {h}:{i}') : '--' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ detail.createTime ? parseTime(detail.createTime, '{y}-{m}-{d} {h}:{i}') : '--' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>

    <!-- 添加或修改对话框 -->
    <el-drawer title="升级过程" :visible.sync="open" direction="rtl" size="700px"
               :modal="true"
               :append-to-body="true"
               @close="cancel">
      <div class="drawer-content">
        <el-table v-loading="loading" :data="processList" @selection-change="handleSelectionChange">
          <el-table-column label="设备" prop="device"/>
          <el-table-column label="执行操作" prop="operation" width="120" align="center"/>
          <el-table-column label="操作时间" align="center" prop="operationTime" width="180">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.operationTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作结果" prop="operationResult" width="120" align="center"/>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  getVehicle,
  listVehicle
} from "@/api/iov/ota/vehicle";
import cache from '@/plugins/cache'

// 列显隐状态本地持久化键（浏览器维度，仅保存 key + visible，不保存文案）
const COLUMN_CACHE_KEY = 'ota:vehicle:columns'

// 默认列定义（品牌/平台/车系默认隐藏，并随列表列顺序一致）
const DEFAULT_COLUMNS = [
  { key: 0, label: '车辆', visible: true },
  { key: 1, label: '品牌', visible: false },
  { key: 2, label: '平台', visible: false },
  { key: 3, label: '车系', visible: false },
  { key: 4, label: '车型', visible: true },
  { key: 5, label: '版本', visible: true },
  { key: 6, label: '配置代码', visible: true },
  { key: 7, label: '工厂代码', visible: true },
  { key: 8, label: '生产时间', visible: true },
  { key: 9, label: '最后同步时间', visible: true },
  { key: 10, label: '最后上报时间', visible: true },
  { key: 11, label: '创建时间', visible: true }
]

// 读取本地持久化的列显隐状态；无缓存/缓存异常时回退默认值
function loadColumns() {
  let saved = null
  try {
    saved = cache.local.getJSON(COLUMN_CACHE_KEY)
  } catch (e) {
    saved = null
  }
  return DEFAULT_COLUMNS.map(column => {
    const hit = Array.isArray(saved)
      ? saved.find(item => item && item.key === column.key)
      : null
    return {
      ...column,
      visible: hit && typeof hit.visible === 'boolean' ? hit.visible : column.visible
    }
  })
}

export default {
  name: "Vehicle",
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
      // 表格数据
      list: [],
      partList: [],
      // 列信息（品牌/平台/车系默认隐藏，可通过显隐列开关展示；状态本地持久化）
      columns: loadColumns(),
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 详情遮罩层
      detailLoading: false,
      // 是否显示详情抽屉
      detailOpen: false,
      // 详情数据（只读，含最后上报时间 lastInventoryReportedAt）
      detail: {},
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
      },
    };
  },
  created() {
    this.getList();
  },
  watch: {
    // 列显隐变化时持久化到 localStorage（RightToolbar 直接修改 columns 项，无需改公共组件）
    columns: {
      deep: true,
      handler(columns) {
        try {
          cache.local.setJSON(COLUMN_CACHE_KEY,
            columns.map(({ key, visible }) => ({ key, visible })))
        } catch (e) {
          // 存储不可用（隐私模式/配额满）时静默降级为仅会话内生效
        }
      }
    }
  },
  methods: {
    getList() {
      this.loading = true;
      listVehicle(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.list = response.data.items;
          this.total = response.data.total;
          this.loading = false;
        }
      );
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
    },
    /** 详情按钮操作：只读展示车辆运行态，最后上报时间为空显示 -- */
    handleDetail(row) {
      this.detail = {};
      this.detailOpen = true;
      this.detailLoading = true;
      getVehicle(row.vin).then(response => {
        this.detail = response.data || {};
        this.detailLoading = false;
      }).catch(() => {
        this.detailLoading = false;
      });
    },
    /** 详情抽屉关闭 */
    detailCancel() {
      this.detailOpen = false;
      this.detail = {};
    },
    /** 表单重置 */
    reset() {
      this.form = {
        name: undefined
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
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
    },
    handleProcess(row) {
      const id = row.id || this.ids
    },
    /** 提交按钮 */
    submitForm: function () {
    },
    /** 删除按钮操作 */
    handleDelete(row) {
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('/iov-ota/api/mpt/vehicle/v1/export', {
        ...this.queryParams
      }, `vehicle_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
<style>
.message-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.message-cell:hover {
  cursor: pointer;
}

.my-tooltip {
  max-width: 400px !important;
  white-space: normal !important;
  word-break: break-word !important;
}

.drawer-content {
  padding: 20px;
  font-size: 14px;
  color: #606266;
}

.drawer-title {
  font-size: 16px;
  font-weight: bolder;
  margin-top: 20px;
  margin-bottom: 20px;
}

.drawer-row {
  margin-bottom: 15px;
}
</style>
