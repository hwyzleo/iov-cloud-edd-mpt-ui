<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true">
      <el-form-item label="工厂代码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入工厂代码"
          clearable
          style="width: 140px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="工厂名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入工厂名称"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="工厂类型" prop="plantType">
        <el-select v-model="queryParams.plantType" placeholder="请选择工厂类型" clearable style="width: 150px">
          <el-option
            v-for="item in plantTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="国家" prop="country">
        <el-input
          v-model="queryParams.country"
          placeholder="请输入国家"
          clearable
          style="width: 120px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="包含停用">
        <el-checkbox v-model="queryParams.includeInactive">包含停用数据</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['mdm:plant:add']"
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['mdm:plant:edit']"
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['mdm:plant:remove']"
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['mdm:plant:export']"
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
        >导出</el-button>
      </el-col>
      <right-toolbar :show-search.sync="showSearch" @queryTable="getList" />
    </el-row>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="plantList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="工厂代码" prop="code" width="120" />
      <el-table-column label="工厂名称" prop="name" />
      <el-table-column label="工厂类型" prop="plantType" width="120">
        <template slot-scope="scope">
          {{ getPlantTypeLabel(scope.row.plantType) }}
        </template>
      </el-table-column>
      <el-table-column label="国家" prop="country" width="80" />
      <el-table-column label="状态" align="center" width="100">
        <template slot-scope="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="版本" prop="version" width="60" align="center" />
      <el-table-column label="创建时间" align="center" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-hasPermi="['mdm:plant:edit']"
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
          >修改</el-button>
          <el-button
            v-if="scope.row.status === 'ACTIVE'"
            v-hasPermi="['mdm:plant:remove']"
            size="mini"
            type="text"
            icon="el-icon-close"
            @click="handleDeactivate(scope.row)"
          >停用</el-button>
          <el-button
            v-if="scope.row.status === 'DRAFT'"
            v-hasPermi="['mdm:plant:remove']"
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
          >删除</el-button>
          <el-button
            v-hasPermi="['mdm:plant:query']"
            size="mini"
            type="text"
            icon="el-icon-time"
            @click="handleHistory(scope.row)"
          >查看历史</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.page"
      :limit.sync="queryParams.size"
      @pagination="getList"
    />

    <!-- 添加或修改工厂对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <!-- 基本信息 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工厂代码" prop="code">
              <el-input v-model="form.code" :readonly="form.code !== undefined && form.id !== undefined" placeholder="请输入工厂代码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工厂名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入工厂名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="英文名称" prop="nameEn">
              <el-input v-model="form.nameEn" placeholder="请输入英文名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="简称" prop="shortName">
              <el-input v-model="form.shortName" placeholder="请输入简称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工厂类型" prop="plantType">
              <el-select v-model="form.plantType" placeholder="请选择工厂类型">
                <el-option
                  v-for="item in plantTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="描述">
              <el-input v-model="form.description" type="textarea" placeholder="请输入描述" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 地址信息 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="国家" prop="country">
              <el-input v-model="form.country" placeholder="请输入国家" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="省份" prop="province">
              <el-input v-model="form.province" placeholder="请输入省份" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="城市" prop="city">
              <el-input v-model="form.city" placeholder="请输入城市" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地址" prop="address">
              <el-input v-model="form.address" placeholder="请输入地址" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="经度" prop="longitude">
              <el-input-number v-model="form.longitude" :precision="6" :step="0.000001" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纬度" prop="latitude">
              <el-input-number v-model="form.latitude" :precision="6" :step="0.000001" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="时区" prop="timezone">
              <el-input v-model="form.timezone" placeholder="请输入时区" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 生产信息 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="年产能" prop="annualCapacity">
              <el-input-number v-model="form.annualCapacity" :min="0" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产线数量" prop="productionLines">
              <el-input-number v-model="form.productionLines" :min="0" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="运营开始日期" prop="operationalStartDate">
              <el-date-picker v-model="form.operationalStartDate" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 系统信息 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="法人实体编码" prop="legalEntityCode">
              <el-input v-model="form.legalEntityCode" placeholder="请输入法人实体编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成本中心编码" prop="costCenterCode">
              <el-input v-model="form.costCenterCode" placeholder="请输入成本中心编码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="MES实例" prop="mesInstance">
              <el-input v-model="form.mesInstance" placeholder="请输入MES实例" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 有效期 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="生效时间">
              <el-date-picker
                v-model="effectiveDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd"
                @change="handleEffectiveDateChange"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 历史版本对话框 -->
    <history-snapshot
      v-model="historyVisible"
      :loading="historyLoading"
      :history-list="historyList"
      :fields="historyFields"
    >
      <template #detail-fields="{ data }">
        <el-form-item label="工厂代码">{{ data.code }}</el-form-item>
        <el-form-item label="工厂名称">{{ data.name }}</el-form-item>
        <el-form-item label="英文名称">{{ data.nameEn }}</el-form-item>
        <el-form-item label="简称">{{ data.shortName }}</el-form-item>
        <el-form-item label="工厂类型">{{ getPlantTypeLabel(data.plantType) }}</el-form-item>
        <el-form-item label="国家">{{ data.country }}</el-form-item>
        <el-form-item label="省份">{{ data.province }}</el-form-item>
        <el-form-item label="城市">{{ data.city }}</el-form-item>
        <el-form-item label="地址">{{ data.address }}</el-form-item>
        <el-form-item label="年产能">{{ data.annualCapacity }}</el-form-item>
        <el-form-item label="生产线数量">{{ data.productionLines }}</el-form-item>
        <el-form-item label="运营开始日期">{{ parseTime(data.operationalStartDate) }}</el-form-item>
        <el-form-item label="版本">{{ data.version }}</el-form-item>
        <el-form-item label="状态">{{ getStatusLabel(data.status) }}</el-form-item>
        <el-form-item label="生效开始时间">{{ parseTime(data.effectiveFrom) }}</el-form-item>
        <el-form-item label="生效结束时间">{{ parseTime(data.effectiveTo) }}</el-form-item>
        <el-form-item label="操作类型">{{ data.operationType }}</el-form-item>
        <el-form-item label="快照时间">{{ parseTime(data.snapshotTime) }}</el-form-item>
        <el-form-item label="操作人">{{ data.operator }}</el-form-item>
      </template>
    </history-snapshot>
  </div>
</template>

<script>
import {
  listPlant,
  getPlant,
  addPlant,
  updatePlant,
  delPlant,
  deactivatePlant,
  listPlantHistory
} from '@/api/mdm/plant'
import HistorySnapshot from '@/components/HistorySnapshot/index.vue'

const PLANT_TYPE_OPTIONS = [
  { label: '整车制造', value: 'VEHICLE_ASSEMBLY' },
  { label: '零部件制造', value: 'COMPONENT_MANUFACTURING' },
  { label: '电池制造', value: 'BATTERY_MANUFACTURING' },
  { label: '研发中心', value: 'R&D_CENTER' },
  { label: '其他', value: 'OTHER' }
]

const PLANT_TYPE_MAP = {
  'VEHICLE_ASSEMBLY': '整车制造',
  'COMPONENT_MANUFACTURING': '零部件制造',
  'BATTERY_MANUFACTURING': '电池制造',
  'R&D_CENTER': '研发中心',
  'OTHER': '其他'
}

export default {
  name: 'MdmPlant',
  components: {
    HistorySnapshot
  },
  dicts: [],
  data() {
    return {
      plantTypeOptions: PLANT_TYPE_OPTIONS,
      loading: true,
      ids: [],
      codes: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      plantList: [],
      title: '',
      open: false,
      effectiveDateRange: [],
      queryParams: {
        page: 1,
        size: 10,
        code: undefined,
        name: undefined,
        plantType: undefined,
        country: undefined,
        includeInactive: false
      },
      form: {},
      historyVisible: false,
      historyLoading: false,
      historyList: [],
      historyFields: [
        { prop: 'code', label: '工厂代码' },
        { prop: 'name', label: '工厂名称' },
        { prop: 'nameEn', label: '英文名称' },
        { prop: 'shortName', label: '简称' },
        { prop: 'plantType', label: '工厂类型' },
        { prop: 'country', label: '国家' },
        { prop: 'province', label: '省份' },
        { prop: 'city', label: '城市' },
        { prop: 'address', label: '地址' },
        { prop: 'annualCapacity', label: '年产能' },
        { prop: 'productionLines', label: '生产线数量' },
        { prop: 'operationalStartDate', label: '运营开始日期', type: 'date' },
        { prop: 'version', label: '版本' },
        { prop: 'status', label: '状态', type: 'status' },
        { prop: 'effectiveFrom', label: '生效开始时间', type: 'date' },
        { prop: 'effectiveTo', label: '生效结束时间', type: 'date' },
        { prop: 'operationType', label: '操作类型' },
        { prop: 'snapshotTime', label: '快照时间', type: 'date' },
        { prop: 'operator', label: '操作人' }
      ],
      historyCode: '',
      rules: {
        code: [
          { required: true, message: '工厂代码不能为空', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '工厂名称不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getPlantTypeLabel(type) {
      return PLANT_TYPE_MAP[type] || type
    },
    getStatusType(status) {
      const types = {
        'ACTIVE': 'success',
        'INACTIVE': 'info',
        'DEPRECATED': 'danger',
        'DRAFT': 'warning'
      }
      return types[status] || 'info'
    },
    getStatusLabel(status) {
      const labels = {
        'ACTIVE': '启用',
        'INACTIVE': '停用',
        'DEPRECATED': '废弃',
        'DRAFT': '草稿'
      }
      return labels[status] || status
    },
    getList() {
      this.loading = true
      listPlant(this.queryParams).then(response => {
        this.plantList = response.data.rows
        this.total = response.data.total
        this.loading = false
      })
    },
    cancel() {
      this.open = false
      this.reset()
    },
    reset() {
      this.form = {
        code: undefined,
        name: undefined,
        nameEn: undefined,
        shortName: undefined,
        description: undefined,
        plantType: undefined,
        legalEntityCode: undefined,
        costCenterCode: undefined,
        country: undefined,
        province: undefined,
        city: undefined,
        address: undefined,
        longitude: undefined,
        latitude: undefined,
        timezone: undefined,
        annualCapacity: undefined,
        productionLines: undefined,
        operationalStartDate: undefined,
        mesInstance: undefined,
        effectiveFrom: undefined,
        effectiveTo: undefined
      }
      this.effectiveDateRange = []
      this.resetForm('form')
    },
    handleQuery() {
      this.queryParams.page = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.queryParams.includeInactive = false
      this.handleQuery()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.codes = selection.map(item => item.code)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    handleEffectiveDateChange(val) {
      if (val) {
        this.form.effectiveFrom = val[0]
        this.form.effectiveTo = val[1]
      } else {
        this.form.effectiveFrom = undefined
        this.form.effectiveTo = undefined
      }
    },
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加工厂'
    },
    handleUpdate(row) {
      this.reset()
      const code = row.code || this.codes[0]
      getPlant(code).then(response => {
        this.form = response.data
        if (this.form.effectiveFrom && this.form.effectiveTo) {
          this.effectiveDateRange = [this.form.effectiveFrom, this.form.effectiveTo]
        }
        this.open = true
        this.title = '修改工厂'
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updatePlant(this.form.code, this.form).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addPlant(this.form).then(response => {
              this.$modal.msgSuccess('新增成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    handleDeactivate(row) {
      const code = row.code
      this.$modal.confirm('是否确认停用工厂"' + code + '"？').then(function() {
        return deactivatePlant(code, '')
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('停用成功')
      }).catch(() => {})
    },
    handleDelete(row) {
      const code = row.code || this.codes[0]
      this.$modal.confirm('是否确认删除工厂"' + code + '"？').then(function() {
        return delPlant(code, '')
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    handleExport() {
      this.download('edd-mdm/api/mpt/plant/v1/export', {
        ...this.queryParams
      }, `plant_${new Date().getTime()}.xlsx`)
    },
    handleHistory(row) {
      this.historyCode = row.code
      this.historyVisible = true
      this.loadHistory()
    },
    loadHistory() {
      this.historyLoading = true
      listPlantHistory(this.historyCode).then(response => {
        this.historyList = response.data.rows
        this.historyLoading = false
      })
    }
  }
}
</script>
