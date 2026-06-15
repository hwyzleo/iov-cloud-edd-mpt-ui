<template>
  <div class="app-container">
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true">
      <el-form-item label="类别编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入类别编码"
          clearable
          style="width: 160px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="类别名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入类别名称"
          clearable
          style="width: 160px"
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

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['mdm:deviceCategory:add']"
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['mdm:deviceCategory:edit']"
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
          v-hasPermi="['mdm:deviceCategory:remove']"
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
          v-hasPermi="['mdm:deviceCategory:export']"
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
        >导出</el-button>
      </el-col>
      <right-toolbar :show-search.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="categoryList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="类别编码" prop="code" width="100" />
      <el-table-column label="类别名称" prop="name" />
      <el-table-column label="本地化名称" prop="nameLocal" />
      <el-table-column label="排序" prop="sortOrder" width="80" align="center" />
      <el-table-column label="数据来源" prop="source" width="100" align="center" />
      <el-table-column label="状态" align="center" width="80">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : scope.row.status === 'INACTIVE' ? 'info' : scope.row.status === 'DEPRECATED' ? 'danger' : 'warning'">
            {{ scope.row.status === 'ACTIVE' ? '启用' : scope.row.status === 'INACTIVE' ? '停用' : scope.row.status === 'DEPRECATED' ? '废弃' : scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="版本" prop="version" width="60" align="center" />
      <el-table-column label="创建时间" align="center" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-hasPermi="['mdm:deviceCategory:edit']"
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
          >修改</el-button>
          <el-button
            v-if="scope.row.status === 'ACTIVE'"
            v-hasPermi="['mdm:deviceCategory:remove']"
            size="mini"
            type="text"
            icon="el-icon-close"
            @click="handleDeactivate(scope.row)"
          >停用</el-button>
          <el-button
            v-if="scope.row.status !== 'ACTIVE'"
            v-hasPermi="['mdm:deviceCategory:remove']"
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
          >删除</el-button>
          <el-button
            v-hasPermi="['mdm:deviceCategory:query']"
            size="mini"
            type="text"
            icon="el-icon-time"
            @click="handleHistory(scope.row)"
          >历史</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.page"
      :limit.sync="queryParams.size"
      @pagination="getList"
    />

    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="类别编码" prop="code">
          <el-input v-model="form.code" :readonly="isEdit" placeholder="请输入类别编码" />
        </el-form-item>
        <el-form-item label="类别名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入类别名称" />
        </el-form-item>
        <el-form-item label="本地化名称" prop="nameLocal">
          <el-input v-model="form.nameLocal" placeholder="请输入本地化名称" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="描述">
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
        <el-form-item label="类别编码">{{ data.code }}</el-form-item>
        <el-form-item label="类别名称">{{ data.name }}</el-form-item>
        <el-form-item label="本地化名称">{{ data.nameLocal }}</el-form-item>
        <el-form-item label="描述">{{ data.description }}</el-form-item>
        <el-form-item label="排序">{{ data.sortOrder }}</el-form-item>
        <el-form-item label="版本">{{ data.version }}</el-form-item>
        <el-form-item label="状态">{{ data.status === 'ACTIVE' ? '启用' : data.status === 'INACTIVE' ? '停用' : data.status }}</el-form-item>
        <el-form-item label="生效开始时间">{{ parseTime(data.effectiveFrom) }}</el-form-item>
        <el-form-item label="生效结束时间">{{ parseTime(data.effectiveTo) }}</el-form-item>
        <el-form-item label="操作人">{{ data.modifyBy || data.createBy }}</el-form-item>
      </template>
    </history-snapshot>
  </div>
</template>

<script>
import {
  listDeviceCategory,
  getDeviceCategory,
  addDeviceCategory,
  updateDeviceCategory,
  delDeviceCategory,
  deactivateDeviceCategory,
  listDeviceCategoryHistory
} from '@/api/mdm/deviceCategory'
import HistorySnapshot from '@/components/HistorySnapshot/index.vue'

export default {
  name: 'MdmDeviceCategory',
  components: {
    HistorySnapshot
  },
  data() {
    return {
      loading: true,
      ids: [],
      codes: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      categoryList: [],
      title: '',
      open: false,
      isEdit: false,
      effectiveDateRange: [],
      queryParams: {
        page: 1,
        size: 10,
        code: undefined,
        name: undefined,
        includeInactive: false
      },
      form: {},
      historyVisible: false,
      historyLoading: false,
      historyList: [],
      historyFields: [
        { prop: 'code', label: '类别编码' },
        { prop: 'name', label: '类别名称' },
        { prop: 'nameLocal', label: '本地化名称' },
        { prop: 'description', label: '描述' },
        { prop: 'sortOrder', label: '排序' },
        { prop: 'version', label: '版本' },
        { prop: 'status', label: '状态', type: 'status' },
        { prop: 'effectiveFrom', label: '生效开始时间', type: 'date' },
        { prop: 'effectiveTo', label: '生效结束时间', type: 'date' },
        { prop: 'modifyBy', label: '操作人' }
      ],
      historyCode: '',
      rules: {
        code: [
          { required: true, message: '类别编码不能为空', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '类别名称不能为空', trigger: 'blur' }
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
      listDeviceCategory(this.queryParams).then(response => {
        this.categoryList = response.data.rows
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
        nameLocal: undefined,
        description: undefined,
        sortOrder: 0,
        effectiveFrom: undefined,
        effectiveTo: undefined
      }
      this.isEdit = false
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
      this.queryParams.code = undefined
      this.queryParams.name = undefined
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
      this.title = '添加设备类别'
    },
    handleUpdate(row) {
      this.reset()
      const code = row.code || this.codes[0]
      getDeviceCategory(code).then(response => {
        this.form = response.data
        this.isEdit = true
        if (this.form.effectiveFrom && this.form.effectiveTo) {
          this.effectiveDateRange = [this.form.effectiveFrom, this.form.effectiveTo]
        }
        this.open = true
        this.title = '修改设备类别'
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.isEdit) {
            updateDeviceCategory(this.form.code, this.form).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addDeviceCategory(this.form).then(response => {
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
      this.$modal.confirm('是否确认停用设备类别"' + code + '"？').then(function() {
        return deactivateDeviceCategory(code, '')
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('停用成功')
      }).catch(() => {})
    },
    handleDelete(row) {
      const code = row.code || this.codes[0]
      this.$modal.confirm('是否确认删除设备类别"' + code + '"？').then(function() {
        return delDeviceCategory(code, '')
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    handleExport() {
      this.download('edd-mdm/api/mpt/deviceCategory/v1/export', {
        ...this.queryParams
      }, `deviceCategory_${new Date().getTime()}.xlsx`)
    },
    handleHistory(row) {
      this.historyCode = row.code
      this.historyVisible = true
      this.loadHistory()
    },
    loadHistory() {
      this.historyLoading = true
      listDeviceCategoryHistory(this.historyCode).then(response => {
        this.historyList = response.data.rows
        this.historyLoading = false
      })
    }
  }
}
</script>
