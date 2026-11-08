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
      <el-table-column label="操作" align="center" width="260" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleDetail(scope.row)"
            v-hasPermi="['ota:fota:vehicle:query']"
          >详情
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-connection"
            @click="handleRelations(scope.row)"
            v-hasPermi="['ota:fota:activity:list', 'ota:fota:taskVehicle:list']"
          >升级关联
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-cpu"
            @click="handleInventory(scope.row)"
            v-hasPermi="['ota:fota:vehicle:query']"
          >设备清单
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

    <!-- 升级关联摘要（懒加载：仅展开时按 VIN 请求，快速切换 VIN 忽略过期响应） -->
    <el-drawer :title="'升级关联 - ' + relationVin" :visible.sync="relationOpen" direction="rtl" size="820px"
               :modal="true" :append-to-body="true" @close="closeRelations">
      <div class="drawer-content" v-loading="relationLoading">
        <div v-if="relationError" class="drawer-error">
          <span>{{ relationError }}</span>
          <el-button type="text" icon="el-icon-refresh" @click="loadRelations(relationVin)">重试</el-button>
        </div>
        <template v-else>
          <div class="drawer-title">
            关联活动（共 {{ relationActivityTotal }} 个）
            <el-button type="text" icon="el-icon-view" @click="viewAllRelations('relation')"
                       v-hasPermi="['ota:fota:activity:list']">查看全部</el-button>
          </div>
          <el-table :data="relationActivities" size="small" empty-text="暂无关联活动">
            <el-table-column label="活动ID" prop="activityId" width="90" align="center"/>
            <el-table-column label="活动名称" prop="activityName" min-width="160" show-overflow-tooltip/>
            <el-table-column label="活动状态" width="110" align="center">
              <template slot-scope="scope">
                <el-tag size="mini" :type="activityStateType(scope.row.activityState)">
                  {{ activityStateLabel(scope.row.activityState) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="任务数" prop="vehicleTaskCount" width="80" align="center"/>
            <el-table-column label="最近任务时间" width="160" align="center">
              <template slot-scope="scope">{{ formatTime(scope.row.latestTaskTime) }}</template>
            </el-table-column>
          </el-table>

          <div class="drawer-title" style="margin-top: 24px">
            最近任务（共 {{ relationTaskTotal }} 个）
            <el-button type="text" icon="el-icon-view" @click="viewAllRelations('tasks')"
                       v-hasPermi="['ota:fota:taskVehicle:list']">查看全部</el-button>
          </div>
          <el-table :data="relationTasks" size="small" empty-text="暂无关联任务">
            <el-table-column label="任务名称" prop="taskName" min-width="150" show-overflow-tooltip/>
            <el-table-column label="阶段" width="90" align="center">
              <template slot-scope="scope">{{ taskPhaseLabel(scope.row.taskPhase) }}</template>
            </el-table-column>
            <el-table-column label="任务状态" width="100" align="center">
              <template slot-scope="scope">{{ taskStateLabel(scope.row.taskState) }}</template>
            </el-table-column>
            <el-table-column label="车辆任务状态" width="130" align="center">
              <template slot-scope="scope">{{ vehicleTaskStatusLabel(scope.row.vehicleTaskStatus) }}</template>
            </el-table-column>
            <el-table-column label="发布时间" width="160" align="center">
              <template slot-scope="scope">{{ formatTime(scope.row.releaseAt) }}</template>
            </el-table-column>
            <el-table-column label="创建时间" width="160" align="center">
              <template slot-scope="scope">{{ formatTime(scope.row.createTime) }}</template>
            </el-table-column>
          </el-table>
          <div class="drawer-tip">此处仅展示最近记录，完整筛选与全部历史请进入独立详情。</div>
        </template>
      </div>
    </el-drawer>

    <!-- 设备清单摘要（懒加载：仅展开时按 VIN 请求） -->
    <el-drawer :title="'设备清单 - ' + inventoryVin" :visible.sync="inventoryOpen" direction="rtl" size="900px"
               :modal="true" :append-to-body="true" @close="closeInventory">
      <div class="drawer-content" v-loading="inventoryLoading">
        <div v-if="inventoryError" class="drawer-error">
          <span>{{ inventoryError }}</span>
          <el-button type="text" icon="el-icon-refresh" @click="loadInventory(inventoryVin)">重试</el-button>
        </div>
        <el-empty v-else-if="!inventoryData" description="暂无已接受清单"/>
        <template v-else>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="清单版本">{{ inventoryData.inventoryRevision || '--' }}</el-descriptions-item>
            <el-descriptions-item label="清单模型">{{ inventoryData.inventoryModel || '--' }}</el-descriptions-item>
            <el-descriptions-item label="OTA 接受时间">{{ formatTime(inventoryData.acceptedTime) }}</el-descriptions-item>
            <el-descriptions-item label="车端采集时间">{{ formatTime(inventoryData.sourceCollectedAt) }}</el-descriptions-item>
            <el-descriptions-item label="ECU 数量">{{ inventoryData.ecuCount || 0 }}</el-descriptions-item>
            <el-descriptions-item label="核心版本">{{ coreVersions || '--' }}</el-descriptions-item>
            <el-descriptions-item label="Canonical Digest" :span="2">
              <span class="digest-cell">{{ inventoryData.canonicalDigestHex || '--' }}</span>
            </el-descriptions-item>
          </el-descriptions>

          <el-collapse style="margin-top: 16px">
            <el-collapse-item v-for="ecu in (inventoryData.ecuList || [])" :key="ecu.ecuId" :name="ecu.ecuId">
              <template slot="title">
                <span class="ecu-title">{{ ecu.ecuId || '--' }}</span>
                <el-tag size="mini" style="margin-left: 8px">{{ ecu.softwareModel || 'SINGLE_IMAGE' }}</el-tag>
                <el-tag size="mini" style="margin-left: 8px" :type="partStatusType(ecu.partAssociation)">
                  {{ partStatusLabel(ecu.partAssociation) }}
                </el-tag>
                <span class="ecu-meta">硬件 {{ ecu.hardwarePn || '--' }} / {{ ecu.hardwareVersion || '--' }}</span>
              </template>
              <el-table :data="ecu.softwareUnits || []" size="mini" empty-text="暂无软件单元">
                <el-table-column label="Target" prop="softwareTargetCode" min-width="120" show-overflow-tooltip/>
                <el-table-column label="软件零件号" prop="softwarePartNumber" min-width="140" show-overflow-tooltip/>
                <el-table-column label="版本" prop="swVersion" width="120"/>
                <el-table-column label="Slot" prop="slot" width="70" align="center">
                  <template slot-scope="scope">{{ scope.row.slot || '--' }}</template>
                </el-table-column>
                <el-table-column label="Active" width="70" align="center">
                  <template slot-scope="scope">{{ scope.row.active ? '是' : '否' }}</template>
                </el-table-column>
              </el-table>
              <div class="part-block">
                <template v-if="ecu.partAssociation && ecu.partAssociation.status === 'MATCHED'">
                  <div class="part-row"><b>零件号：</b>{{ ecu.partAssociation.part.pn }}　
                    <b>SN：</b>{{ ecu.partAssociation.part.sn || '--' }}　
                    <b>修改时间：</b>{{ formatTime(ecu.partAssociation.part.modifyTime) }}</div>
                  <div class="part-row"><b>原始配置字（只读）：</b></div>
                  <pre class="config-word">{{ partConfigWord(ecu.partAssociation.part.configWord) }}</pre>
                </template>
                <div v-else class="part-row">
                  <b>零件关联：</b>{{ partStatusLabel(ecu.partAssociation) }}
                  <span v-if="ecu.partAssociation">（候选 {{ ecu.partAssociation.candidateCount || 0 }} 条，不自动选值）</span>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
          <div class="drawer-tip">
            <el-button type="text" icon="el-icon-view" @click="viewAllRelations('inventory')">查看完整设备清单</el-button>
          </div>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  getVehicle,
  getVehicleInventory,
  listVehicle,
  listVehicleActivities,
  listVehicleTasks
} from "@/api/iov/ota/vehicle";
import cache from '@/plugins/cache'
import {
  activityStateLabel as activityStateText,
  activityStateType as activityStateTagType,
  partConfigWord as partConfigWordText,
  partStatusLabel as partStatusText,
  partStatusType as partStatusTagType,
  taskPhaseLabel as taskPhaseText,
  taskStateLabel as taskStateText,
  vehicleTaskStatusLabel as vehicleTaskStatusText
} from './constants'

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
      // ===== CR-023：升级关联摘要（懒加载，未展开不请求） =====
      relationOpen: false,
      relationLoading: false,
      relationError: '',
      relationVin: '',
      relationRequestSeq: 0,
      relationActivities: [],
      relationActivityTotal: 0,
      relationTasks: [],
      relationTaskTotal: 0,
      // ===== CR-023：设备清单摘要（懒加载，未展开不请求） =====
      inventoryOpen: false,
      inventoryLoading: false,
      inventoryError: '',
      inventoryVin: '',
      inventoryRequestSeq: 0,
      inventoryData: null,
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
  computed: {
    /** 设备清单核心版本（去重后的 SoftwareUnit 版本摘要） */
    coreVersions() {
      const ecuList = (this.inventoryData && this.inventoryData.ecuList) || []
      const versions = []
      ecuList.forEach(ecu => {
        (ecu.softwareUnits || []).forEach(unit => {
          if (unit.swVersion && versions.indexOf(unit.swVersion) < 0) {
            versions.push(unit.swVersion)
          }
        })
      })
      return versions.slice(0, 5).join(', ')
    }
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
    /** 升级关联展开：仅展开时按 VIN 懒加载 */
    handleRelations(row) {
      this.relationVin = row.vin;
      this.relationOpen = true;
      this.loadRelations(row.vin);
    },
    /** 加载升级关联摘要（活动/任务第一页）；seq 防止快速切换 VIN 串车数据 */
    loadRelations(vin) {
      const seq = ++this.relationRequestSeq;
      this.relationLoading = true;
      this.relationError = '';
      this.relationActivities = [];
      this.relationActivityTotal = 0;
      this.relationTasks = [];
      this.relationTaskTotal = 0;
      const stale = () => seq !== this.relationRequestSeq || vin !== this.relationVin;
      // 分别复用 activity:list / taskVehicle:list，无权限的子资源不请求也不扩大数据权限
      const activityRequest = this.$auth.hasPermi('ota:fota:activity:list')
        ? listVehicleActivities(vin, { pageNum: 1, pageSize: 5 })
        : Promise.resolve({ data: { items: [], total: 0 } });
      const taskRequest = this.$auth.hasPermi('ota:fota:taskVehicle:list')
        ? listVehicleTasks(vin, { pageNum: 1, pageSize: 5 })
        : Promise.resolve({ data: { items: [], total: 0 } });
      Promise.all([activityRequest, taskRequest]).then(([activityResponse, taskResponse]) => {
        if (stale()) return;
        const activityPage = activityResponse.data || {};
        const taskPage = taskResponse.data || {};
        this.relationActivities = activityPage.items || [];
        this.relationActivityTotal = activityPage.total || 0;
        this.relationTasks = taskPage.items || [];
        this.relationTaskTotal = taskPage.total || 0;
        this.relationLoading = false;
      }).catch(error => {
        if (stale()) return;
        this.relationLoading = false;
        this.relationError = (error && error.message) ? error.message : '升级关联加载失败';
      });
    },
    /** 升级关联抽屉关闭：使在途请求失效 */
    closeRelations() {
      this.relationRequestSeq++;
      this.relationOpen = false;
      this.relationActivities = [];
      this.relationTasks = [];
      this.relationError = '';
    },
    /** 设备清单展开：仅展开时按 VIN 懒加载 */
    handleInventory(row) {
      this.inventoryVin = row.vin;
      this.inventoryOpen = true;
      this.loadInventory(row.vin);
    },
    /** 加载设备清单摘要；seq 防止快速切换 VIN 串车数据 */
    loadInventory(vin) {
      const seq = ++this.inventoryRequestSeq;
      this.inventoryLoading = true;
      this.inventoryError = '';
      this.inventoryData = null;
      getVehicleInventory(vin).then(response => {
        if (seq !== this.inventoryRequestSeq || vin !== this.inventoryVin) return;
        this.inventoryData = response.data || null;
        this.inventoryLoading = false;
      }).catch(error => {
        if (seq !== this.inventoryRequestSeq || vin !== this.inventoryVin) return;
        this.inventoryLoading = false;
        this.inventoryError = (error && error.message) ? error.message : '设备清单加载失败';
      });
    },
    /** 设备清单抽屉关闭：使在途请求失效 */
    closeInventory() {
      this.inventoryRequestSeq++;
      this.inventoryOpen = false;
      this.inventoryData = null;
      this.inventoryError = '';
    },
    /** 查看全部：进入该 VIN 独立详情页（携带 tab） */
    viewAllRelations(tab) {
      const vin = this.relationVin || this.inventoryVin;
      if (!vin) return;
      this.$router.push({
        path: '/iov/ota/vehicle-detail/' + vin,
        query: { tab: tab || 'relation' }
      });
    },
    activityStateLabel(state) {
      return activityStateText(state);
    },
    activityStateType(state) {
      return activityStateTagType(state);
    },
    taskPhaseLabel(phase) {
      return taskPhaseText(phase);
    },
    taskStateLabel(state) {
      return taskStateText(state);
    },
    vehicleTaskStatusLabel(status) {
      return vehicleTaskStatusText(status);
    },
    partStatusLabel(association) {
      return partStatusText(association);
    },
    partStatusType(association) {
      return partStatusTagType(association);
    },
    partConfigWord(configWord) {
      return partConfigWordText(configWord);
    },
    formatTime(value) {
      return value ? this.parseTime(value, '{y}-{m}-{d} {h}:{i}:{s}') : '--';
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

.drawer-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  color: #f56c6c;
  background: #fef0f0;
  border-radius: 4px;
}

.drawer-tip {
  margin-top: 12px;
  color: #909399;
  font-size: 13px;
}

.ecu-title {
  font-weight: bolder;
}

.ecu-meta {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}

.part-block {
  margin-top: 8px;
  padding: 8px;
  background: #fafafa;
  border-radius: 4px;
}

.part-row {
  margin-bottom: 6px;
  font-size: 13px;
}

/* 配置字只读完整查看：超长/多行换行展示，不编辑 */
.config-word {
  margin: 0;
  padding: 8px;
  max-height: 160px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.digest-cell {
  word-break: break-all;
}
</style>
