<template>
  <div class="app-container">
    <el-form ref="queryForm" :model="queryParams" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="TBOX SN" prop="sn">
        <el-input
          v-model="queryParams.sn"
          placeholder="请输入TBOX SN"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="当前VIN" prop="vin">
        <el-input
          v-model="queryParams.vin"
          placeholder="请输入当前VIN"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="设备状态" prop="deviceStatus">
        <el-select v-model="queryParams.deviceStatus" placeholder="请选择设备状态" clearable style="width: 160px">
          <el-option
            v-for="item in deviceStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="绑定状态" prop="bindingStatus">
        <el-select v-model="queryParams.bindingStatus" placeholder="请选择绑定状态" clearable style="width: 160px">
          <el-option
            v-for="item in bindingStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="异常标签" prop="anomalyType">
        <el-select v-model="queryParams.anomalyType" placeholder="请选择异常标签" clearable style="width: 160px">
          <el-option
            v-for="item in anomalyTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="零件编码" prop="partCode" v-show="showAdvanced">
        <el-input
          v-model="queryParams.partCode"
          placeholder="请输入零件编码"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="首次登录时间" v-show="showAdvanced">
        <el-date-picker
          v-model="firstLoginRange"
          style="width: 340px"
          value-format="yyyy-MM-dd HH:mm:ss"
          :default-time="['00:00:00', '23:59:59']"
          type="datetimerange"
          range-separator="-"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
      </el-form-item>
      <el-form-item label="最后登录时间" v-show="showAdvanced">
        <el-date-picker
          v-model="lastLoginRange"
          style="width: 340px"
          value-format="yyyy-MM-dd HH:mm:ss"
          :default-time="['00:00:00', '23:59:59']"
          type="datetimerange"
          range-separator="-"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
      </el-form-item>
      <el-form-item label="激活时间" v-show="showAdvanced">
        <el-date-picker
          v-model="activateRange"
          style="width: 340px"
          value-format="yyyy-MM-dd HH:mm:ss"
          :default-time="['00:00:00', '23:59:59']"
          type="datetimerange"
          range-separator="-"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
      </el-form-item>
      <el-form-item label="创建时间" v-show="showAdvanced">
        <el-date-picker
          v-model="createdRange"
          style="width: 340px"
          value-format="yyyy-MM-dd HH:mm:ss"
          :default-time="['00:00:00', '23:59:59']"
          type="datetimerange"
          range-separator="-"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
        <el-button size="mini" @click="showAdvanced = !showAdvanced">
          {{ showAdvanced ? '收起' : '高级筛选' }}
          <i :class="showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
        </el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          :loading="exportLoading"
          @click="handleExport"
          v-hasPermi="['tsp:tbox:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table
      v-loading="loading"
      :data="tboxList"
      :default-sort="{ prop: 'lastLoginTime', order: 'descending' }"
      @sort-change="handleSortChange"
    >
      <el-table-column label="TBOX SN" key="sn" prop="sn" v-if="columns[0].visible" width="180">
        <template slot-scope="scope">
          {{ scope.row.sn }}
        </template>
      </el-table-column>
      <el-table-column label="当前VIN" key="vin" prop="vin" v-if="columns[1].visible" width="180">
        <template slot-scope="scope">
          <span v-if="scope.row.vin">{{ scope.row.vin }}</span>
          <span v-else-if="scope.row.bindingStatus === 'BINDING_CONFLICT'" class="text-danger">绑定冲突</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="零件编码" align="center" key="partCode" prop="partCode" v-if="columns[2].visible" min-width="140" show-overflow-tooltip />
      <el-table-column label="设备状态" align="center" key="deviceStatus" prop="deviceStatus" v-if="columns[3].visible" width="100" sortable="custom">
        <template slot-scope="scope">
          <el-tag :type="deviceStatusType(scope.row.deviceStatus)" size="mini">
            {{ deviceStatusLabel(scope.row.deviceStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="首次登录时间" align="center" key="firstLoginTime" prop="firstLoginTime" v-if="columns[4].visible" width="140" sortable="custom">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.firstLoginTime, '{y}-{m}-{d} {h}:{i}') || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最后登录时间" align="center" key="lastLoginTime" prop="lastLoginTime" v-if="columns[5].visible" width="140" sortable="custom">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.lastLoginTime, '{y}-{m}-{d} {h}:{i}') || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="激活时间" align="center" key="activateTime" prop="activateTime" v-if="columns[6].visible" width="140" sortable="custom">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.activateTime, '{y}-{m}-{d} {h}:{i}') || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="绑定状态" align="center" key="bindingStatus" prop="bindingStatus" v-if="columns[7].visible" width="100">
        <template slot-scope="scope">
          <el-tag :type="bindingStatusType(scope.row.bindingStatus)" size="mini">
            {{ bindingStatusLabel(scope.row.bindingStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="异常标签" key="anomalyTags" prop="anomalyTags" v-if="columns[8].visible">
        <template slot-scope="scope">
          <template v-if="scope.row.anomalyTags && scope.row.anomalyTags.length">
            <el-tag
              v-for="tag in scope.row.anomalyTags"
              :key="tag.type"
              :type="anomalyTagType(tag.type)"
              size="mini"
              style="margin: 1px"
            >{{ anomalyLabel(tag.type) }}</el-tag>
          </template>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="绑定版本" align="center" key="bindingVersion" prop="bindingVersion" v-if="columns[9].visible" width="100">
        <template slot-scope="scope">
          <span>{{ scope.row.bindingVersion === null || scope.row.bindingVersion === undefined ? '-' : scope.row.bindingVersion }}</span>
        </template>
      </el-table-column>
      <el-table-column label="HSM UID" align="center" key="maskedHsmUid" prop="maskedHsmUid" v-if="columns[10].visible" min-width="140" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.maskedHsmUid || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="IMEI" align="center" key="maskedImei" prop="maskedImei" v-if="columns[11].visible" min-width="140" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.maskedImei || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="ICCID" align="center" key="maskedIccids" prop="maskedIccids" v-if="columns[12].visible" min-width="160" show-overflow-tooltip>
        <template slot-scope="scope">
          <template v-if="scope.row.maskedIccids && scope.row.maskedIccids.length">
            <div v-for="(iccid, index) in scope.row.maskedIccids" :key="index">{{ iccid }}</div>
          </template>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" key="supplierCode" prop="supplierCode" v-if="columns[13].visible" width="110" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.supplierCode || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="硬件版本" align="center" key="hardwareVersion" prop="hardwareVersion" v-if="columns[14].visible" width="110" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.hardwareVersion || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="软件版本" align="center" key="softwareVersion" prop="softwareVersion" v-if="columns[15].visible" width="110" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.softwareVersion || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" key="createdAt" prop="createdAt" v-if="columns[16].visible" width="160" sortable="custom">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createdAt) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" align="center" key="updatedAt" prop="updatedAt" v-if="columns[17].visible" width="160" sortable="custom">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.updatedAt) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="90" class-name="small-padding fixed-width" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleDetail(scope.row)"
            v-hasPermi="['tsp:tbox:query']"
          >详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNo"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
import { listTbox, exportTbox } from '@/api/iov/tsp/tbox'
import { blobValidate } from '@/utils/ruoyi'
import { saveAs } from 'file-saver'
import errorCode from '@/utils/errorCode'

export default {
  name: 'Tbox',
  data() {
    return {
      // 遮罩层
      loading: true,
      // 导出遮罩层
      exportLoading: false,
      // 显示搜索条件
      showSearch: true,
      // 显示高级筛选条件
      showAdvanced: false,
      // 总条数
      total: 0,
      // TBOX 列表数据
      tboxList: [],
      // 首次登录时间范围
      firstLoginRange: [],
      // 最后登录时间范围
      lastLoginRange: [],
      // 激活时间范围
      activateRange: [],
      // 创建时间范围
      createdRange: [],
      // 设备状态选项
      deviceStatusOptions: [
        { value: 1, label: '待激活' },
        { value: 5, label: '激活中' },
        { value: 2, label: '在役' },
        { value: 4, label: '冻结黑名单' },
        { value: 3, label: '报废' }
      ],
      // 绑定状态选项
      bindingStatusOptions: [
        { value: 'UNBOUND', label: '未绑定' },
        { value: 'BOUND', label: '已绑定' },
        { value: 'BINDING_CONFLICT', label: '绑定冲突' }
      ],
      // 异常标签选项
      anomalyTypeOptions: [
        { value: 'BINDING_CONFLICT', label: '绑定冲突' },
        { value: 'FROZEN_OR_RETIRED', label: '冻结或退役' },
        { value: 'ACTIVATION_TIMEOUT', label: '激活超时' },
        { value: 'NEVER_ONLINE', label: '从未上线' },
        { value: 'LONG_OFFLINE', label: '长期未登录' },
        { value: 'UNBOUND', label: '未绑定' }
      ],
      // 列信息（前 9 列为默认展示列）
      columns: [
        { key: 0, label: 'TBOX SN', visible: true },
        { key: 1, label: '当前VIN', visible: true },
        { key: 2, label: '零件编码', visible: false },
        { key: 3, label: '设备状态', visible: true },
        { key: 4, label: '首次登录时间', visible: true },
        { key: 5, label: '最后登录时间', visible: true },
        { key: 6, label: '激活时间', visible: true },
        { key: 7, label: '绑定状态', visible: true },
        { key: 8, label: '异常标签', visible: true },
        { key: 9, label: '绑定版本', visible: false },
        { key: 10, label: 'HSM UID', visible: false },
        { key: 11, label: 'IMEI', visible: false },
        { key: 12, label: 'ICCID', visible: false },
        { key: 13, label: '供应商', visible: false },
        { key: 14, label: '硬件版本', visible: false },
        { key: 15, label: '软件版本', visible: false },
        { key: 16, label: '创建时间', visible: false },
        { key: 17, label: '更新时间', visible: false }
      ],
      // 查询参数
      queryParams: {
        pageNo: 1,
        pageSize: 20,
        sn: undefined,
        vin: undefined,
        partCode: undefined,
        deviceStatus: undefined,
        bindingStatus: undefined,
        anomalyType: undefined,
        sortBy: 'lastLoginTime',
        sortDirection: 'desc'
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询 TBOX 列表 */
    getList() {
      this.loading = true
      listTbox(this.buildQuery()).then(response => {
        this.tboxList = response.data.items || []
        this.total = response.data.total || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    /** 组装查询参数（时间统一转换为 ISO-8601） */
    buildQuery() {
      const query = Object.assign({}, this.queryParams)
      this.applyRange(query, this.firstLoginRange, 'firstLoginFrom', 'firstLoginTo')
      this.applyRange(query, this.lastLoginRange, 'lastLoginFrom', 'lastLoginTo')
      this.applyRange(query, this.activateRange, 'activateFrom', 'activateTo')
      this.applyRange(query, this.createdRange, 'createdFrom', 'createdTo')
      return query
    },
    applyRange(query, range, fromKey, toKey) {
      if (range && range.length === 2) {
        query[fromKey] = range[0] ? range[0].replace(' ', 'T') : undefined
        query[toKey] = range[1] ? range[1].replace(' ', 'T') : undefined
      }
    },
    /** 排序变化（仅允许后端白名单字段） */
    handleSortChange({ prop, order }) {
      if (!order) {
        this.queryParams.sortBy = 'lastLoginTime'
        this.queryParams.sortDirection = 'desc'
      } else {
        this.queryParams.sortBy = prop
        this.queryParams.sortDirection = order === 'ascending' ? 'asc' : 'desc'
      }
      this.getList()
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNo = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.firstLoginRange = []
      this.lastLoginRange = []
      this.activateRange = []
      this.createdRange = []
      this.resetForm('queryForm')
      this.queryParams.sortBy = 'lastLoginTime'
      this.queryParams.sortDirection = 'desc'
      this.handleQuery()
    },
    /** 详情按钮操作 */
    handleDetail(row) {
      this.$router.push({ path: '/iov/tsp/tbox/' + row.sn })
    },
    /** 导出按钮操作 */
    handleExport() {
      this.exportLoading = true
      exportTbox(this.buildQuery()).then(res => {
        const isBlob = blobValidate(res)
        if (isBlob) {
          const blob = new Blob([res], { type: 'application/vnd.ms-excel' })
          saveAs(blob, 'tbox_' + new Date().getTime() + '.xlsx')
        } else {
          res.text().then(text => {
            const rspObj = JSON.parse(text)
            const errMsg = errorCode[rspObj.code] || rspObj.msg || rspObj.message || errorCode['default']
            this.$modal.msgError(errMsg)
          })
        }
        this.exportLoading = false
      }).catch(() => {
        this.exportLoading = false
      })
    },
    /** 设备状态文本 */
    deviceStatusLabel(code) {
      const map = { 1: '待激活', 5: '激活中', 2: '在役', 4: '冻结黑名单', 3: '报废' }
      return map[code] || (code === null || code === undefined ? '-' : '未知')
    },
    /** 设备状态标签类型 */
    deviceStatusType(code) {
      const map = { 1: 'info', 5: 'warning', 2: 'success', 4: 'danger', 3: 'info' }
      return map[code] || 'info'
    },
    /** 绑定状态文本 */
    bindingStatusLabel(status) {
      const map = { UNBOUND: '未绑定', BOUND: '已绑定', BINDING_CONFLICT: '绑定冲突' }
      return map[status] || status || '-'
    },
    /** 绑定状态标签类型 */
    bindingStatusType(status) {
      const map = { UNBOUND: 'info', BOUND: 'success', BINDING_CONFLICT: 'danger' }
      return map[status] || 'info'
    },
    /** 异常标签文本 */
    anomalyLabel(type) {
      const map = {
        BINDING_CONFLICT: '绑定冲突',
        FROZEN_OR_RETIRED: '冻结或退役',
        ACTIVATION_TIMEOUT: '激活超时',
        NEVER_ONLINE: '从未上线',
        LONG_OFFLINE: '长期未登录',
        UNBOUND: '未绑定'
      }
      return map[type] || type
    },
    /** 异常标签类型 */
    anomalyTagType(type) {
      const map = {
        BINDING_CONFLICT: 'danger',
        FROZEN_OR_RETIRED: 'danger',
        ACTIVATION_TIMEOUT: 'warning',
        NEVER_ONLINE: 'info',
        LONG_OFFLINE: 'warning',
        UNBOUND: 'info'
      }
      return map[type] || 'info'
    }
  }
}
</script>

<style scoped>
.text-danger {
  color: #f56c6c;
}
</style>
