<template>
  <div class="app-container">
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true">
      <el-form-item label="供应商代码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入供应商代码"
          clearable
          style="width: 140px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="供应商名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入供应商名称"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="供应商类型" prop="supplierType">
        <el-select v-model="queryParams.supplierType" placeholder="请选择供应商类型" clearable style="width: 150px">
          <el-option label="原材料供应商" value="RAW_MATERIAL" />
          <el-option label="零部件供应商" value="COMPONENT" />
          <el-option label="服务供应商" value="SERVICE" />
          <el-option label="设备供应商" value="EQUIPMENT" />
          <el-option label="其他" value="OTHER" />
        </el-select>
      </el-form-item>
      <el-form-item label="包含停用">
        <el-checkbox v-model="queryParams.includeInactive">包含停用数据</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['mdm:supplier:add']"
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['mdm:supplier:edit']"
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
          v-hasPermi="['mdm:supplier:remove']"
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
          v-hasPermi="['mdm:supplier:export']"
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
        >导出</el-button>
      </el-col>
      <right-toolbar :show-search.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="supplierList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="供应商代码" prop="code" width="120" />
      <el-table-column label="供应商名称" prop="name" />
      <el-table-column label="供应商类型" prop="supplierType" width="120">
        <template slot-scope="scope">
          {{ getSupplierTypeLabel(scope.row.supplierType) }}
        </template>
      </el-table-column>
      <el-table-column label="国家" prop="country" width="80" />
      <el-table-column label="联系人" prop="contactName" width="100" />
      <el-table-column label="状态" align="center" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : scope.row.status === 'INACTIVE' ? 'info' : scope.row.status === 'DEPRECATED' ? 'danger' : 'warning'">
            {{ scope.row.status === 'ACTIVE' ? '启用' : scope.row.status === 'INACTIVE' ? '停用' : scope.row.status === 'DEPRECATED' ? '废弃' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="版本" prop="version" width="60" align="center" />
      <el-table-column label="创建时间" align="center" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-hasPermi="['mdm:supplier:edit']"
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
          >修改</el-button>
          <el-button
            v-if="scope.row.status === 'ACTIVE'"
            v-hasPermi="['mdm:supplier:edit']"
            size="mini"
            type="text"
            icon="el-icon-close"
            @click="handleDeactivate(scope.row)"
          >停用</el-button>
          <el-button
            v-if="scope.row.status === 'DRAFT'"
            v-hasPermi="['mdm:supplier:remove']"
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
          >删除</el-button>
          <el-button
            v-hasPermi="['mdm:supplier:query']"
            size="mini"
            type="text"
            icon="el-icon-time"
            @click="handleHistory(scope.row)"
          >查看历史</el-button>
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

    <!-- 添加或修改供应商对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="供应商代码" prop="code">
          <el-input v-model="form.code" :readonly="form.code !== undefined && form.id !== undefined" placeholder="请输入供应商代码" />
        </el-form-item>
        <el-form-item label="供应商名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="本地化名称" prop="nameLocal">
          <el-input v-model="form.nameLocal" placeholder="请输入本地化名称" />
        </el-form-item>
        <el-form-item label="简称" prop="shortName">
          <el-input v-model="form.shortName" placeholder="请输入简称" />
        </el-form-item>
        <el-form-item label="供应商类型" prop="supplierType">
          <el-select v-model="form.supplierType" placeholder="请选择供应商类型" style="width: 100%">
            <el-option label="原材料供应商" value="RAW_MATERIAL" />
            <el-option label="零部件供应商" value="COMPONENT" />
            <el-option label="服务供应商" value="SERVICE" />
            <el-option label="设备供应商" value="EQUIPMENT" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="国家" prop="country">
          <el-input v-model="form.country" placeholder="请输入国家" />
        </el-form-item>
        <el-form-item label="营业执照号" prop="businessLicenseNo">
          <el-input v-model="form.businessLicenseNo" placeholder="请输入营业执照号" />
        </el-form-item>
        <el-form-item label="税号" prop="taxNo">
          <el-input v-model="form.taxNo" placeholder="请输入税号" />
        </el-form-item>
        <el-form-item label="注册地址" prop="registeredAddress">
          <el-input v-model="form.registeredAddress" placeholder="请输入注册地址" />
        </el-form-item>
        <el-form-item label="联系人姓名" prop="contactName">
          <el-input v-model="form.contactName" placeholder="请输入联系人姓名" />
        </el-form-item>
        <el-form-item label="联系人电话" prop="contactPhone">
          <el-input v-model="form.contactPhone" placeholder="请输入联系人电话" />
        </el-form-item>
        <el-form-item label="联系人邮箱" prop="contactEmail">
          <el-input v-model="form.contactEmail" placeholder="请输入联系人邮箱" />
        </el-form-item>
        <el-form-item label="开户银行" prop="bankName">
          <el-input v-model="form.bankName" placeholder="请输入开户银行" />
        </el-form-item>
        <el-form-item label="银行账号" prop="bankAccount">
          <el-input v-model="form.bankAccount" placeholder="请输入银行账号" />
        </el-form-item>
        <el-form-item label="合作开始日期" prop="cooperationStartDate">
          <el-date-picker
            v-model="form.cooperationStartDate"
            type="date"
            placeholder="选择日期"
            value-format="yyyy-MM-dd"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
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
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <history-snapshot
      v-model="historyVisible"
      :loading="historyLoading"
      :history-list="historyList"
      :fields="historyFields"
    >
      <template #detail-fields="{ data }">
        <el-form-item label="供应商代码">{{ data.code }}</el-form-item>
        <el-form-item label="供应商名称">{{ data.name }}</el-form-item>
        <el-form-item label="本地化名称">{{ data.nameLocal }}</el-form-item>
        <el-form-item label="简称">{{ data.shortName }}</el-form-item>
        <el-form-item label="供应商类型">{{ getSupplierTypeLabel(data.supplierType) }}</el-form-item>
        <el-form-item label="国家">{{ data.country }}</el-form-item>
        <el-form-item label="营业执照号">{{ data.businessLicenseNo }}</el-form-item>
        <el-form-item label="税号">{{ data.taxNo }}</el-form-item>
        <el-form-item label="注册地址">{{ data.registeredAddress }}</el-form-item>
        <el-form-item label="联系人姓名">{{ data.contactName }}</el-form-item>
        <el-form-item label="联系人电话">{{ data.contactPhone }}</el-form-item>
        <el-form-item label="联系人邮箱">{{ data.contactEmail }}</el-form-item>
        <el-form-item label="开户银行">{{ data.bankName }}</el-form-item>
        <el-form-item label="银行账号">{{ data.bankAccount }}</el-form-item>
        <el-form-item label="合作开始日期">{{ data.cooperationStartDate }}</el-form-item>
        <el-form-item label="描述">{{ data.description }}</el-form-item>
        <el-form-item label="版本">{{ data.version }}</el-form-item>
        <el-form-item label="状态">{{ data.status === 'ACTIVE' ? '启用' : data.status === 'INACTIVE' ? '停用' : data.status }}</el-form-item>
        <el-form-item label="生效开始时间">{{ parseTime(data.effectiveFrom) }}</el-form-item>
        <el-form-item label="生效结束时间">{{ parseTime(data.effectiveTo) }}</el-form-item>
      </template>
    </history-snapshot>
  </div>
</template>

<script>
import {
  listSupplier,
  getSupplier,
  addSupplier,
  updateSupplier,
  delSupplier,
  deactivateSupplier,
  listSupplierHistory
} from '@/api/mdm/supplier'
import HistorySnapshot from '@/components/HistorySnapshot/index.vue'

export default {
  name: 'MdmSupplier',
  components: {
    HistorySnapshot
  },
  dicts: [],
  data() {
    return {
      loading: true,
      ids: [],
      codes: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      supplierList: [],
      title: '',
      open: false,
      effectiveDateRange: [],
      queryParams: {
        page: 1,
        size: 10,
        includeInactive: false,
        supplierType: undefined
      },
      form: {},
      historyVisible: false,
      historyLoading: false,
      historyList: [],
      historyFields: [
        { prop: 'code', label: '供应商代码' },
        { prop: 'name', label: '供应商名称' },
        { prop: 'nameLocal', label: '本地化名称' },
        { prop: 'shortName', label: '简称' },
        { prop: 'supplierType', label: '供应商类型' },
        { prop: 'country', label: '国家' },
        { prop: 'businessLicenseNo', label: '营业执照号' },
        { prop: 'taxNo', label: '税号' },
        { prop: 'registeredAddress', label: '注册地址' },
        { prop: 'contactName', label: '联系人姓名' },
        { prop: 'contactPhone', label: '联系人电话' },
        { prop: 'contactEmail', label: '联系人邮箱' },
        { prop: 'bankName', label: '开户银行' },
        { prop: 'bankAccount', label: '银行账号' },
        { prop: 'cooperationStartDate', label: '合作开始日期' },
        { prop: 'description', label: '描述' },
        { prop: 'version', label: '版本' },
        { prop: 'status', label: '状态', type: 'status' },
        { prop: 'effectiveFrom', label: '生效开始时间', type: 'date' },
        { prop: 'effectiveTo', label: '生效结束时间', type: 'date' }
      ],
      historyCode: '',
      rules: {
        code: [
          { required: true, message: '供应商代码不能为空', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '供应商名称不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listSupplier(this.queryParams).then(response => {
        this.supplierList = response.data.rows
        this.total = response.data.total
        this.loading = false
      })
    },
    getSupplierTypeLabel(type) {
      const typeMap = {
        'RAW_MATERIAL': '原材料供应商',
        'COMPONENT': '零部件供应商',
        'SERVICE': '服务供应商',
        'EQUIPMENT': '设备供应商',
        'OTHER': '其他'
      }
      return typeMap[type] || type
    },
    cancel() {
      this.open = false
      this.reset()
    },
    reset() {
      this.form = {
        code: undefined,
        name: undefined,
        nameLocal: undefined,
        shortName: undefined,
        supplierType: undefined,
        country: undefined,
        businessLicenseNo: undefined,
        taxNo: undefined,
        registeredAddress: undefined,
        contactName: undefined,
        contactPhone: undefined,
        contactEmail: undefined,
        bankName: undefined,
        bankAccount: undefined,
        cooperationStartDate: undefined,
        description: undefined,
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
      this.queryParams.supplierType = undefined
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
      this.title = '添加供应商'
    },
    handleUpdate(row) {
      this.reset()
      const code = row.code || this.codes[0]
      getSupplier(code).then(response => {
        this.form = response.data
        if (this.form.effectiveFrom && this.form.effectiveTo) {
          this.effectiveDateRange = [this.form.effectiveFrom, this.form.effectiveTo]
        }
        this.open = true
        this.title = '修改供应商'
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateSupplier(this.form.code, this.form).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addSupplier(this.form).then(response => {
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
      this.$modal.confirm('是否确认停用供应商"' + code + '"？').then(function() {
        return deactivateSupplier(code, '')
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('停用成功')
      }).catch(() => {})
    },
    handleDelete(row) {
      const code = row.code || this.codes[0]
      this.$modal.confirm('是否确认删除供应商"' + code + '"？').then(function() {
        return delSupplier(code, '')
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    handleExport() {
      this.download('edd-mdm/api/mpt/supplier/v1/export', {
        ...this.queryParams
      }, `supplier_${new Date().getTime()}.xlsx`)
    },
    handleHistory(row) {
      this.historyCode = row.code
      this.historyVisible = true
      this.loadHistory()
    },
    loadHistory() {
      this.historyLoading = true
      listSupplierHistory(this.historyCode).then(response => {
        this.historyList = response.data.rows
        this.historyLoading = false
      })
    }
  }
}
</script>
