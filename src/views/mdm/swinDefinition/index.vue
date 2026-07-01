<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="SWIN编号" prop="swinCode">
        <el-input v-model="queryParams.swinCode" placeholder="请输入SWIN编号" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="编码方案" prop="schemeCode">
        <el-select v-model="queryParams.schemeCode" placeholder="请选择编码方案" clearable filterable style="width: 180px">
          <el-option
            v-for="item in schemeOptions"
            :key="item.code"
            :label="item.name"
            :value="item.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="型式锚点类型" prop="typeRefType">
        <el-select v-model="queryParams.typeRefType" placeholder="请选择类型" clearable style="width: 180px">
          <el-option label="Variant" value="VARIANT" />
          <el-option label="Model" value="MODEL" />
        </el-select>
      </el-form-item>
      <el-form-item label="型式锚点编码" prop="typeRefCode">
        <el-input v-model="queryParams.typeRefCode" placeholder="请输入型式锚点编码" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 180px">
          <el-option label="草稿" value="DRAFT" />
          <el-option label="启用" value="ACTIVE" />
          <el-option label="停用" value="INACTIVE" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['mdm:eead:swin:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['mdm:eead:swin:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['mdm:eead:swin:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['mdm:eead:swin:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="swinDefinitionList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="SWIN编号" prop="swinCode" width="150"/>
      <el-table-column label="编码方案" prop="schemeCode" width="150"/>
      <el-table-column label="型式锚点类型" prop="typeRefType" width="120">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.type_ref_type" :value="scope.row.typeRefType"/>
        </template>
      </el-table-column>
      <el-table-column label="型式锚点编码" prop="typeRefCode" width="150"/>
      <el-table-column label="型式批准号" prop="typeApprovalNo" width="150"/>
      <el-table-column label="SWIN版本" prop="swinVersion" width="100"/>
      <el-table-column label="状态" align="center" width="80">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : scope.row.status === 'INACTIVE' ? 'info' : 'warning'">
            {{ scope.row.status === 'ACTIVE' ? '启用' : scope.row.status === 'INACTIVE' ? '停用' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="300" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['mdm:eead:swin:edit']"
          >修改</el-button>
          <el-button
            v-if="scope.row.status === 'ACTIVE'"
            size="mini"
            type="text"
            icon="el-icon-close"
            @click="handleDeactivate(scope.row)"
            v-hasPermi="['mdm:eead:swin:edit']"
          >停用</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-setting"
            @click="handleManageManagedSystems(scope.row)"
            v-hasPermi="['mdm:eead:swin:edit']"
          >受管系统</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-time"
            @click="handleHistory(scope.row)"
            v-hasPermi="['mdm:eead:swin:query']"
          >历史</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['mdm:eead:swin:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.page"
      :limit.sync="queryParams.size"
      @pagination="getList"
    />

    <!-- 添加或修改SWIN定义对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="SWIN编号" prop="swinCode">
          <el-input v-model="form.swinCode" :readonly="form.id !== undefined" placeholder="请输入SWIN编号"/>
        </el-form-item>
        <el-form-item label="编码方案" prop="schemeCode">
          <el-select v-model="form.schemeCode" placeholder="请选择编码方案" filterable style="width: 100%">
            <el-option
              v-for="item in activeSchemeOptions"
              :key="item.code"
              :label="item.name + ' (' + item.code + ')'"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="型式锚点类型" prop="typeRefType">
          <el-select v-model="form.typeRefType" placeholder="请选择类型" style="width: 100%" @change="handleTypeRefTypeChange">
            <el-option label="Variant" value="VARIANT" />
            <el-option label="Model" value="MODEL" />
          </el-select>
        </el-form-item>
        <el-form-item label="型式锚点编码" prop="typeRefCode">
          <el-select v-model="form.typeRefCode" placeholder="请选择型式锚点编码" filterable style="width: 100%">
            <el-option
              v-for="item in typeRefCodeOptions"
              :key="item.code"
              :label="item.name + ' (' + item.code + ')'"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="型式批准号">
          <el-input v-model="form.typeApprovalNo" placeholder="请输入型式批准号"/>
        </el-form-item>
        <el-form-item label="SWIN版本">
          <el-input v-model="form.swinVersion" placeholder="请输入SWIN版本"/>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" placeholder="请输入描述"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 受管系统绑定管理对话框 -->
    <el-dialog
      :title="'受管系统管理 - ' + currentSwinCode"
      :visible.sync="managedSystemOpen"
      width="900px"
      append-to-body
    >
      <el-form :inline="true" size="small">
        <el-form-item label="受管软件系统">
          <el-select
            v-model="bindForm.vehicleNodeCode"
            placeholder="请选择受管软件系统"
            clearable
            filterable
            style="width: 220px"
          >
            <el-option
              v-for="item in vehicleNodeOptions"
              :key="item.code"
              :label="item.name + ' (' + item.code + ')'"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="型式批准相关">
          <el-switch v-model="bindForm.isTypeApprovalRelevant" />
        </el-form-item>
        <el-form-item label="批准软件基线">
          <el-input v-model="bindForm.approvedSoftwareBaseline" placeholder="请输入批准软件基线" style="width: 180px" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="bindForm.remark" placeholder="请输入备注" style="width: 180px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-plus" @click="handleBind">绑定</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="managedSystemLoading" :data="managedSystemList" size="small">
        <el-table-column label="受管软件系统" prop="vehicleNodeCode" width="150"/>
        <el-table-column label="型式批准相关" prop="isTypeApprovalRelevant" width="120">
          <template slot-scope="scope">
            <el-tag :type="scope.row.isTypeApprovalRelevant ? 'success' : 'info'">
              {{ scope.row.isTypeApprovalRelevant ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="批准软件基线" prop="approvedSoftwareBaseline" width="180"/>
        <el-table-column label="备注" prop="remark"/>
        <el-table-column label="操作" align="center" width="100">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleUnbind(scope.row)"
            >解绑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div slot="footer" class="dialog-footer">
        <el-button @click="managedSystemOpen = false">关 闭</el-button>
      </div>
    </el-dialog>

    <history-snapshot
      v-model="historyVisible"
      :loading="historyLoading"
      :history-list="historyList"
      :fields="historyFields"
    >
      <template #detail-fields="{ data }">
        <el-form-item label="SWIN编号">{{ data.swinCode }}</el-form-item>
        <el-form-item label="编码方案">{{ data.schemeCode }}</el-form-item>
        <el-form-item label="型式锚点类型">{{ data.typeRefType === 'VARIANT' ? 'Variant' : 'Model' }}</el-form-item>
        <el-form-item label="型式锚点编码">{{ data.typeRefCode }}</el-form-item>
        <el-form-item label="型式批准号">{{ data.typeApprovalNo }}</el-form-item>
        <el-form-item label="SWIN版本">{{ data.swinVersion }}</el-form-item>
        <el-form-item label="描述">{{ data.description }}</el-form-item>
        <el-form-item label="版本">{{ data.version }}</el-form-item>
        <el-form-item label="状态">{{ data.status === 'ACTIVE' ? '启用' : data.status === 'INACTIVE' ? '停用' : '草稿' }}</el-form-item>
      </template>
    </history-snapshot>
  </div>
</template>

<script>
import {
  listSwinDefinition,
  getSwinDefinition,
  addSwinDefinition,
  updateSwinDefinition,
  delSwinDefinition,
  forceDelSwinDefinition,
  deactivateSwinDefinition,
  bindManagedSystem,
  unbindManagedSystem,
  swinDefinitionHistory
} from '@/api/mdm/swinDefinition'
import { listAllSwinScheme } from '@/api/mdm/swinScheme'
import { listVariant } from '@/api/mdm/variant'
import { listModel } from '@/api/mdm/model'
import { listVehicleNode } from '@/api/mdm/vehicleNode'
import HistorySnapshot from '@/components/HistorySnapshot/index.vue'

export default {
  name: 'MdmSwinDefinition',
  components: {
    HistorySnapshot
  },
  dicts: ['type_ref_type'],
  data() {
    return {
      loading: true,
      ids: [],
      swinCodes: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      swinDefinitionList: [],
      schemeOptions: [],
      activeSchemeOptions: [],
      typeRefCodeOptions: [],
      vehicleNodeOptions: [],
      title: '',
      open: false,
      queryParams: {
        page: 1,
        size: 10,
        swinCode: undefined,
        schemeCode: undefined,
        typeRefType: undefined,
        typeRefCode: undefined,
        status: undefined
      },
      form: {},
      historyVisible: false,
      historyLoading: false,
      historyList: [],
      historyFields: [
        { prop: 'swinCode', label: 'SWIN编号' },
        { prop: 'schemeCode', label: '编码方案' },
        { prop: 'typeRefType', label: '型式锚点类型' },
        { prop: 'typeRefCode', label: '型式锚点编码' },
        { prop: 'typeApprovalNo', label: '型式批准号' },
        { prop: 'swinVersion', label: 'SWIN版本' },
        { prop: 'description', label: '描述' },
        { prop: 'version', label: '版本' },
        { prop: 'status', label: '状态', type: 'status' }
      ],
      historySwinCode: '',
      managedSystemOpen: false,
      managedSystemLoading: false,
      managedSystemList: [],
      currentSwinCode: '',
      bindForm: {
        vehicleNodeCode: undefined,
        isTypeApprovalRelevant: true,
        approvedSoftwareBaseline: undefined,
        remark: undefined
      },
      rules: {
        swinCode: [
          { required: true, message: 'SWIN编号不能为空', trigger: 'blur' }
        ],
        schemeCode: [
          { required: true, message: '编码方案不能为空', trigger: 'change' }
        ],
        typeRefType: [
          { required: true, message: '型式锚点类型不能为空', trigger: 'change' }
        ],
        typeRefCode: [
          { required: true, message: '型式锚点编码不能为空', trigger: 'change' }
        ]
      }
    }
  },
  created() {
    this.getList()
    this.getSchemeOptions()
    this.getVehicleNodeOptions()
  },
  methods: {
    getList() {
      this.loading = true
      listSwinDefinition(this.queryParams).then(response => {
        this.swinDefinitionList = response.data.rows
        this.total = response.data.total
        this.loading = false
      })
    },
    getSchemeOptions() {
      listAllSwinScheme().then(response => {
        this.schemeOptions = response.data || []
        this.activeSchemeOptions = this.schemeOptions.filter(item => item.status === 'ACTIVE')
      })
    },
    getVehicleNodeOptions() {
      listVehicleNode({ page: 1, size: 1000 }).then(response => {
        this.vehicleNodeOptions = response.data.rows.filter(item => item.status === 'ACTIVE')
      })
    },
    handleTypeRefTypeChange(val) {
      this.form.typeRefCode = undefined
      this.typeRefCodeOptions = []
      if (val === 'VARIANT') {
        listVariant({ page: 1, size: 1000 }).then(response => {
          this.typeRefCodeOptions = response.data.rows.filter(item => item.status === 'ACTIVE')
        })
      } else if (val === 'MODEL') {
        listModel({ page: 1, size: 1000 }).then(response => {
          this.typeRefCodeOptions = response.data.rows.filter(item => item.status === 'ACTIVE')
        })
      }
    },
    cancel() {
      this.open = false
      this.reset()
    },
    reset() {
      this.form = {
        id: undefined,
        swinCode: undefined,
        schemeCode: undefined,
        typeRefType: undefined,
        typeRefCode: undefined,
        typeApprovalNo: undefined,
        swinVersion: undefined,
        description: undefined
      }
      this.typeRefCodeOptions = []
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
      this.swinCodes = selection.map(item => item.swinCode)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加SWIN定义'
    },
    handleUpdate(row) {
      this.reset()
      const swinCode = row.swinCode || this.swinCodes[0]
      getSwinDefinition(swinCode).then(response => {
        this.form = response.data
        if (this.form.typeRefType) {
          this.handleTypeRefTypeChange(this.form.typeRefType)
        }
        this.open = true
        this.title = '修改SWIN定义'
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateSwinDefinition(this.form.swinCode, this.form).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addSwinDefinition(this.form).then(response => {
              this.$modal.msgSuccess('新增成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    handleDeactivate(row) {
      const swinCode = row.swinCode
      this.$modal.confirm('是否确认停用SWIN定义"' + swinCode + '"？').then(function() {
        return deactivateSwinDefinition(swinCode)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('停用成功')
      }).catch(() => {})
    },
    handleDelete(row) {
      const swinCode = row.swinCode || this.swinCodes[0]
      this.$modal.confirm('是否确认删除SWIN定义"' + swinCode + '"？').then(function() {
        return delSwinDefinition(swinCode)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(error => {
        if (error.response && error.response.data && error.response.data.code === 812316) {
          this.$modal.confirm('该SWIN定义被下游引用，是否强制删除？').then(() => {
            return forceDelSwinDefinition(swinCode, { reason: '用户强制删除' })
          }).then(() => {
            this.getList()
            this.$modal.msgSuccess('强制删除成功')
          }).catch(() => {})
        }
      })
    },
    handleHistory(row) {
      this.historySwinCode = row.swinCode
      this.historyVisible = true
      this.loadHistory()
    },
    loadHistory() {
      this.historyLoading = true
      swinDefinitionHistory(this.historySwinCode).then(response => {
        this.historyList = response.data.rows
        this.historyLoading = false
      })
    },
    handleManageManagedSystems(row) {
      this.currentSwinCode = row.swinCode
      this.bindForm = {
        vehicleNodeCode: undefined,
        isTypeApprovalRelevant: true,
        approvedSoftwareBaseline: undefined,
        remark: undefined
      }
      this.managedSystemOpen = true
      this.loadManagedSystems()
    },
    loadManagedSystems() {
      this.managedSystemLoading = true
      getSwinDefinition(this.currentSwinCode).then(response => {
        this.managedSystemList = response.data.managedSystems || []
        this.managedSystemLoading = false
      }).catch(() => {
        this.managedSystemLoading = false
      })
    },
    handleBind() {
      if (!this.bindForm.vehicleNodeCode) {
        this.$modal.msgWarning('请选择受管软件系统')
        return
      }
      const data = {
        vehicleNodeCode: this.bindForm.vehicleNodeCode,
        isTypeApprovalRelevant: this.bindForm.isTypeApprovalRelevant,
        approvedSoftwareBaseline: this.bindForm.approvedSoftwareBaseline,
        remark: this.bindForm.remark
      }
      bindManagedSystem(this.currentSwinCode, data).then(() => {
        this.$modal.msgSuccess('绑定成功')
        this.bindForm.vehicleNodeCode = undefined
        this.bindForm.approvedSoftwareBaseline = undefined
        this.bindForm.remark = undefined
        this.loadManagedSystems()
      })
    },
    handleUnbind(row) {
      this.$modal.confirm('是否确认解绑受管系统"' + row.vehicleNodeCode + '"？').then(() => {
        return unbindManagedSystem(this.currentSwinCode, { vehicleNodeCode: row.vehicleNodeCode })
      }).then(() => {
        this.$modal.msgSuccess('解绑成功')
        this.loadManagedSystems()
      }).catch(() => {})
    },
    handleExport() {
      this.download('edd-mdm/api/mpt/mdm/eead/swin/v1/export', {
        ...this.queryParams
      }, `swinDefinition_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>
