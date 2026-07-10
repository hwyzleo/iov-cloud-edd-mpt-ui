<template>
  <div class="app-container">
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true">
      <el-form-item label="锚定层级" prop="anchorType">
        <el-select v-model="queryParams.anchorType" placeholder="请选择锚定层级" clearable style="width: 150px">
          <el-option v-for="item in anchorTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="锚点编码" prop="anchorCode">
        <el-input v-model="queryParams.anchorCode" placeholder="请输入锚点编码" clearable style="width: 160px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="基线状态" prop="baselineStatus">
        <el-select v-model="queryParams.baselineStatus" placeholder="请选择基线状态" clearable style="width: 150px">
          <el-option v-for="item in baselineStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button v-hasPermi="['mdm:material:softwareBaseline:add']" type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button v-hasPermi="['mdm:material:softwareBaseline:export']" type="warning" plain icon="el-icon-download" size="mini" :loading="exportLoading" @click="handleExport">导出</el-button>
      </el-col>
      <right-toolbar :show-search.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="baselineList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="基线编码" prop="code" width="220" />
      <el-table-column label="基线名称" prop="name" min-width="120" show-overflow-tooltip />
      <el-table-column label="锚定层级" prop="anchorType" width="80" align="center">
        <template slot-scope="scope">{{ getAnchorTypeLabel(scope.row.anchorType) }}</template>
      </el-table-column>
      <el-table-column label="锚点编码" prop="anchorCode" width="190" />
      <el-table-column label="基线版本" prop="baselineVersion" width="80" align="center" />
      <el-table-column label="基线状态" prop="baselineStatus" width="80" align="center">
        <template slot-scope="scope">
          <el-tag :type="getBaselineStatusTagType(scope.row.baselineStatus)">{{ getBaselineStatusLabel(scope.row.baselineStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="版本" prop="version" width="60" align="center" />
      <el-table-column label="发布时间" align="center" width="140">
        <template slot-scope="scope"><span>{{ parseTime(scope.row.releasedAt, "{y}-{m}-{d} {h}:{i}") }}</span></template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="380" fixed="right" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button v-if="scope.row.baselineStatus === 'DRAFT'" v-hasPermi="['mdm:material:softwareBaseline:edit']" size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button v-hasPermi="['mdm:material:softwareBaseline:query']" size="mini" type="text" icon="el-icon-connection" @click="handleManageItems(scope.row)">基线项</el-button>
          <el-button v-if="scope.row.baselineStatus === 'DRAFT'" v-hasPermi="['mdm:material:softwareBaseline:release']" size="mini" type="text" icon="el-icon-open" @click="handleRelease(scope.row)">发布</el-button>
          <el-button v-if="scope.row.baselineStatus === 'RELEASED'" v-hasPermi="['mdm:material:softwareBaseline:edit']" size="mini" type="text" icon="el-icon-sort" @click="handleSupersede(scope.row)">取代</el-button>
          <el-button v-if="scope.row.baselineStatus === 'DRAFT'" v-hasPermi="['mdm:material:softwareBaseline:remove']" size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)">删除</el-button>
          <el-button v-if="scope.row.baselineStatus !== 'DRAFT'" v-hasPermi="['mdm:material:softwareBaseline:remove:force']" size="mini" type="text" icon="el-icon-delete-solid" @click="handleForceDelete(scope.row)">强制删除</el-button>
          <el-button v-hasPermi="['mdm:material:softwareBaseline:query']" size="mini" type="text" icon="el-icon-time" @click="handleHistory(scope.row)">历史</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="queryParams.page" :limit.sync="queryParams.size" @pagination="getList" />

    <!-- 添加或修改软件基线对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="基线名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入基线名称" />
        </el-form-item>
        <el-form-item v-if="form.id !== undefined" label="基线编码">
          <el-input v-model="form.code" disabled />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="锚定层级" prop="anchorType">
              <el-select v-model="form.anchorType" placeholder="请选择锚定层级" clearable style="width: 100%" :disabled="form.id !== undefined" @change="handleAnchorTypeChange">
                <el-option v-for="item in anchorTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="锚点编码" prop="anchorCode">
              <el-select v-model="form.anchorCode" placeholder="请选择锚点编码" clearable filterable style="width: 100%" :disabled="form.id !== undefined">
                <el-option v-for="item in anchorOptions" :key="item.code" :label="item.name + ' (' + item.code + ')'" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="基线版本" prop="baselineVersion">
              <el-input v-model="form.baselineVersion" placeholder="请输入基线版本（如 V1）" :disabled="form.id !== undefined" />
            </el-form-item>
          </el-col>
          <el-col v-if="form.id !== undefined" :span="12">
            <el-form-item label="基线状态">
              <el-tag :type="getBaselineStatusTagType(form.baselineStatus)">{{ getBaselineStatusLabel(form.baselineStatus) }}</el-tag>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="生效时间">
          <el-date-picker v-model="effectiveDateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd" @change="handleEffectiveDateChange" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 基线项管理对话框 -->
    <el-dialog :title="'基线项管理 - ' + currentBaselineCode" :visible.sync="itemOpen" width="900px" append-to-body>
      <el-card v-if="currentBaselineStatus === 'DRAFT'" shadow="never" style="margin-bottom: 15px">
        <div slot="header"><span>绑定基线项</span></div>
        <el-form ref="itemForm" :model="itemForm" :rules="itemRules" :inline="true" size="small" label-width="100px">
          <el-form-item label="软件件" prop="partCode">
            <el-select v-model="itemForm.partCode" placeholder="搜索软件件" filterable remote clearable reserve-keyword style="width: 260px" :remote-method="remotePartSearch" :loading="partLoading">
              <el-option v-for="item in partOptions" :key="item.code" :label="item.name + ' (' + item.code + ')'" :value="item.code" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="itemForm.remark" placeholder="备注" style="width: 200px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-plus" @click="handleBindItem">绑定</el-button>
          </el-form-item>
        </el-form>
      </el-card>
      <el-table v-loading="itemLoading" :data="itemList" size="small" border>
        <el-table-column label="零件编码" prop="partCode" width="160" />
        <el-table-column label="车载节点" prop="vehicleNodeCode" width="120" />
        <el-table-column label="备注" prop="remark" show-overflow-tooltip />
        <el-table-column label="操作" align="center" width="80">
          <template slot-scope="scope">
            <el-button v-if="currentBaselineStatus === 'DRAFT'" size="mini" type="text" icon="el-icon-delete" @click="handleUnbindItem(scope.row)">解绑</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="itemOpen = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 取代基线对话框 -->
    <el-dialog title="取代基线" :visible.sync="supersedeOpen" width="700px" append-to-body>
      <el-form label-width="120px" size="small">
        <el-form-item label="当前基线">
          <el-input :value="currentBaselineCode + ' (' + currentBaselineVersion + ')'" disabled />
        </el-form-item>
        <el-form-item label="新基线">
          <el-select v-model="supersedeForm.supersededByCode" placeholder="请选择取代本基线的新基线" filterable style="width: 100%">
            <el-option v-for="item in supersedeOptions" :key="item.code" :label="item.code + ' (' + item.baselineVersion + ' - ' + getBaselineStatusLabel(item.baselineStatus) + ')'" :value="item.code" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitSupersede">确 定</el-button>
        <el-button @click="supersedeOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 历史版本 -->
    <history-snapshot v-model="historyVisible" :loading="historyLoading" :history-list="historyList" :fields="historyFields">
      <template #detail-fields="{ data }">
        <el-form-item label="快照ID">{{ data.snapshotId }}</el-form-item>
        <el-form-item label="操作类型">{{ data.operationType }}</el-form-item>
        <el-form-item label="操作人">{{ data.operator }}</el-form-item>
        <el-form-item label="快照时间">{{ parseTime(data.snapshotTime) }}</el-form-item>
        <el-form-item label="基线编码">{{ data.code }}</el-form-item>
        <el-form-item label="基线名称">{{ data.name }}</el-form-item>
        <el-form-item label="锚定层级">{{ getAnchorTypeLabel(data.anchorType) }}</el-form-item>
        <el-form-item label="锚点编码">{{ data.anchorCode }}</el-form-item>
        <el-form-item label="基线版本">{{ data.baselineVersion }}</el-form-item>
        <el-form-item label="基线状态">{{ getBaselineStatusLabel(data.baselineStatus) }}</el-form-item>
        <el-form-item label="发布时间">{{ parseTime(data.releasedAt) }}</el-form-item>
        <el-form-item label="发布人">{{ data.releasedBy }}</el-form-item>
        <el-form-item label="取代基线">{{ data.supersededByCode }}</el-form-item>
        <el-form-item label="描述">{{ data.description }}</el-form-item>
        <el-form-item label="版本">{{ data.version }}</el-form-item>
        <el-form-item label="状态">{{ data.status }}</el-form-item>
        <el-form-item label="强制删除">{{ data.forceDelete ? '是' : '否' }}</el-form-item>
        <el-form-item label="基线项快照">
          <el-table v-if="data.itemsSnapshot && data.itemsSnapshot.length" :data="data.itemsSnapshot" size="mini" border>
            <el-table-column label="零件编码" prop="partCode" width="140" />
            <el-table-column label="车载节点" prop="vehicleNodeCode" width="100" />
            <el-table-column label="备注" prop="remark" show-overflow-tooltip />
          </el-table>
          <span v-else>无</span>
        </el-form-item>
      </template>
    </history-snapshot>
  </div>
</template>

<script>
import {
  listSoftwareBaseline,
  getSoftwareBaseline,
  addSoftwareBaseline,
  updateSoftwareBaseline,
  delSoftwareBaseline,
  forceDelSoftwareBaseline,
  bindSoftwareBaselineItem,
  unbindSoftwareBaselineItem,
  releaseSoftwareBaseline,
  supersedeSoftwareBaseline,
  listSoftwareBaselineHistory,
  exportSoftwareBaseline
} from '@/api/mdm/softwareBaseline'
import { listConfiguration } from '@/api/mdm/configuration'
import { listVariant } from '@/api/mdm/variant'
import { listAllParts } from '@/api/mdm/part'
import HistorySnapshot from '@/components/HistorySnapshot/index.vue'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const ANCHOR_TYPE_OPTIONS = [
  { label: '配置', value: 'CONFIGURATION' },
  { label: '版本', value: 'VARIANT' }
]

const ANCHOR_TYPE_MAP = {
  'CONFIGURATION': '配置',
  'VARIANT': '版本'
}

const BASELINE_STATUS_OPTIONS = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已发布', value: 'RELEASED' },
  { label: '已取代', value: 'SUPERSEDED' }
]

const BASELINE_STATUS_MAP = {
  'DRAFT': '草稿',
  'RELEASED': '已发布',
  'SUPERSEDED': '已取代'
}

const BASELINE_STATUS_TAG_MAP = {
  'DRAFT': 'warning',
  'RELEASED': 'success',
  'SUPERSEDED': 'info'
}

export default {
  name: 'MdmSoftwareBaseline',
  components: { HistorySnapshot },
  data() {
    return {
      anchorTypeOptions: ANCHOR_TYPE_OPTIONS,
      baselineStatusOptions: BASELINE_STATUS_OPTIONS,
      anchorOptions: [],
      partOptions: [],
      partLoading: false,
      loading: true,
      exportLoading: false,
      ids: [],
      codes: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      baselineList: [],
      title: '',
      open: false,
      effectiveDateRange: [],
      queryParams: {
        page: 1,
        size: 10,
        anchorType: undefined,
        anchorCode: undefined,
        baselineStatus: undefined
      },
      form: {},
      rules: {
        name: [{ required: true, message: '基线名称不能为空', trigger: 'blur' }],
        anchorType: [{ required: true, message: '锚定层级不能为空', trigger: 'change' }],
        anchorCode: [{ required: true, message: '锚点编码不能为空', trigger: 'change' }],
        baselineVersion: [{ required: true, message: '基线版本不能为空', trigger: 'blur' }]
      },
      // 基线项管理
      itemOpen: false,
      itemLoading: false,
      itemList: [],
      currentBaselineCode: '',
      currentBaselineStatus: '',
      currentBaselineVersion: '',
      currentBaselineAnchorType: '',
      currentBaselineAnchorCode: '',
      itemForm: {
        partCode: undefined,
        remark: undefined
      },
      itemRules: {
        partCode: [{ required: true, message: '请选择软件件', trigger: 'change' }]
      },
      // 取代
      supersedeOpen: false,
      supersedeOptions: [],
      supersedeForm: {
        supersededByCode: undefined
      },
      // 历史
      historyVisible: false,
      historyLoading: false,
      historyList: [],
      historyFields: [
        { prop: 'code', label: '基线编码' },
        { prop: 'name', label: '基线名称' },
        { prop: 'anchorType', label: '锚定层级' },
        { prop: 'anchorCode', label: '锚点编码' },
        { prop: 'baselineVersion', label: '基线版本' },
        { prop: 'baselineStatus', label: '基线状态' },
        { prop: 'description', label: '描述' },
        { prop: 'version', label: '版本' },
        { prop: 'status', label: '状态' },
        { prop: 'releasedAt', label: '发布时间', type: 'date' },
        { prop: 'releasedBy', label: '发布人' },
        { prop: 'supersededByCode', label: '取代基线' },
        { prop: 'effectiveFrom', label: '生效开始时间', type: 'date' },
        { prop: 'effectiveTo', label: '生效结束时间', type: 'date' }
      ],
      historyCode: ''
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listSoftwareBaseline(this.queryParams).then(response => {
        this.baselineList = response.data.list
        this.total = response.data.total
        this.loading = false
      })
    },
    getAnchorTypeLabel(type) {
      return ANCHOR_TYPE_MAP[type] || type
    },
    getBaselineStatusLabel(status) {
      return BASELINE_STATUS_MAP[status] || status
    },
    getBaselineStatusTagType(status) {
      return BASELINE_STATUS_TAG_MAP[status] || ''
    },
    handleAnchorTypeChange(val) {
      this.form.anchorCode = undefined
      this.anchorOptions = []
      if (val === 'CONFIGURATION') {
        listConfiguration({ page: 1, size: 1000 }).then(response => {
          this.anchorOptions = response.data.rows
        })
      } else if (val === 'VARIANT') {
        listVariant({ page: 1, size: 1000 }).then(response => {
          this.anchorOptions = response.data.rows
        })
      }
    },
    remotePartSearch(query) {
      if (query !== '') {
        this.partLoading = true
        listAllParts().then(response => {
          this.partOptions = response.data
            .filter(item => item.isSoftware === true &&
              (item.code.toLowerCase().includes(query.toLowerCase()) ||
               item.name.toLowerCase().includes(query.toLowerCase())))
            .map(item => ({ code: item.code, name: item.name }))
          this.partLoading = false
        })
      } else {
        this.partOptions = []
      }
    },
    cancel() {
      this.open = false
      this.reset()
    },
    reset() {
      this.form = {
        id: undefined,
        code: undefined,
        name: undefined,
        anchorType: undefined,
        anchorCode: undefined,
        baselineVersion: undefined,
        baselineStatus: undefined,
        description: undefined,
        effectiveFrom: undefined,
        effectiveTo: undefined
      }
      this.effectiveDateRange = []
      this.anchorOptions = []
      this.resetForm('form')
    },
    handleQuery() {
      this.queryParams.page = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
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
      this.title = '添加软件基线'
    },
    handleUpdate(row) {
      this.reset()
      const code = row.code || this.codes[0]
      getSoftwareBaseline(code).then(response => {
        this.form = response.data
        if (this.form.effectiveFrom && this.form.effectiveTo) {
          this.effectiveDateRange = [this.form.effectiveFrom, this.form.effectiveTo]
        }
        if (this.form.anchorType) {
          this.handleAnchorTypeChange(this.form.anchorType)
        }
        this.open = true
        this.title = '修改软件基线'
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateSoftwareBaseline(this.form.code, {
              name: this.form.name,
              description: this.form.description,
              effectiveFrom: this.form.effectiveFrom,
              effectiveTo: this.form.effectiveTo,
              modifyBy: this.$store.state.user.name
            }).then(() => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addSoftwareBaseline({
              name: this.form.name,
              anchorType: this.form.anchorType,
              anchorCode: this.form.anchorCode,
              baselineVersion: this.form.baselineVersion,
              description: this.form.description,
              effectiveFrom: this.form.effectiveFrom,
              effectiveTo: this.form.effectiveTo,
              createBy: this.$store.state.user.name
            }).then(() => {
              this.$modal.msgSuccess('新增成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    handleDelete(row) {
      const code = row.code || this.codes[0]
      this.$modal.confirm('是否确认删除软件基线"' + code + '"？').then(() => {
        return delSoftwareBaseline(code, this.$store.state.user.name)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    handleForceDelete(row) {
      const code = row.code
      this.$modal.confirm('是否确认强制删除软件基线"' + code + '"？此操作将跳过下游引用检查！').then(() => {
        return forceDelSoftwareBaseline(code, this.$store.state.user.name)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('强制删除成功')
      }).catch(() => {})
    },
    handleRelease(row) {
      this.$modal.confirm('是否确认发布软件基线"' + row.code + '"？发布后基线将被冻结，不可修改。').then(() => {
        return releaseSoftwareBaseline(row.code, this.$store.state.user.name)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('发布成功')
      }).catch(() => {})
    },
    handleSupersede(row) {
      this.currentBaselineCode = row.code
      this.currentBaselineVersion = row.baselineVersion
      this.currentBaselineAnchorType = row.anchorType
      this.currentBaselineAnchorCode = row.anchorCode
      this.supersedeForm.supersededByCode = undefined
      this.supersedeOpen = true
      listSoftwareBaseline({
        page: 1,
        size: 1000,
        anchorType: row.anchorType,
        anchorCode: row.anchorCode
      }).then(response => {
        this.supersedeOptions = response.data.list.filter(item =>
          item.code !== row.code && item.baselineStatus !== 'SUPERSEDED'
        )
      })
    },
    submitSupersede() {
      if (!this.supersedeForm.supersededByCode) {
        this.$modal.msgWarning('请选择新基线')
        return
      }
      supersedeSoftwareBaseline(
        this.currentBaselineCode,
        this.supersedeForm.supersededByCode,
        this.$store.state.user.name
      ).then(() => {
        this.$modal.msgSuccess('取代成功')
        this.supersedeOpen = false
        this.getList()
      })
    },
    handleManageItems(row) {
      this.currentBaselineCode = row.code
      this.currentBaselineStatus = row.baselineStatus
      this.itemOpen = true
      this.itemForm = {
        partCode: undefined,
        remark: undefined
      }
      this.partOptions = []
      this.loadItems(row)
    },
    loadItems(row) {
      this.itemLoading = true
      getSoftwareBaseline(row.code).then(response => {
        this.itemList = response.data.items || []
        this.itemLoading = false
      })
    },
    handleBindItem() {
      this.$refs['itemForm'].validate(valid => {
        if (valid) {
          bindSoftwareBaselineItem(this.currentBaselineCode, {
            baselineCode: this.currentBaselineCode,
            partCode: this.itemForm.partCode,
            remark: this.itemForm.remark,
            operator: this.$store.state.user.name
          }).then(() => {
            this.$modal.msgSuccess('绑定成功')
            this.itemForm = {
              partCode: undefined,
              remark: undefined
            }
            this.partOptions = []
            this.loadItems({ code: this.currentBaselineCode })
          })
        }
      })
    },
    handleUnbindItem(row) {
      this.$modal.confirm('是否确认解绑基线项"' + row.partCode + '"？').then(() => {
        return unbindSoftwareBaselineItem(this.currentBaselineCode, row.partCode, this.$store.state.user.name)
      }).then(() => {
        this.$modal.msgSuccess('解绑成功')
        this.loadItems({ code: this.currentBaselineCode })
      }).catch(() => {})
    },
    handleHistory(row) {
      this.historyCode = row.code
      this.historyVisible = true
      this.historyLoading = true
      listSoftwareBaselineHistory(this.historyCode).then(response => {
        this.historyList = response.data.rows
        this.historyLoading = false
      })
    },
    handleExport() {
      this.exportLoading = true
      exportSoftwareBaseline().then(response => {
        const data = response.data.map(item => ({
          '基线编码': item.code,
          '基线名称': item.name,
          '锚定层级': this.getAnchorTypeLabel(item.anchorType),
          '锚点编码': item.anchorCode,
          '基线版本': item.baselineVersion,
          '基线状态': this.getBaselineStatusLabel(item.baselineStatus),
          '版本': item.version,
          '发布时间': this.parseTime(item.releasedAt),
          '发布人': item.releasedBy,
          '取代基线': item.supersededByCode,
          '描述': item.description,
          '状态': item.status,
          '生效开始时间': this.parseTime(item.effectiveFrom),
          '生效结束时间': this.parseTime(item.effectiveTo)
        }))
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, '软件基线')
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'software_baseline_' + new Date().getTime() + '.xlsx')
        this.exportLoading = false
      }).catch(() => {
        this.exportLoading = false
      })
    }
  }
}
</script>
