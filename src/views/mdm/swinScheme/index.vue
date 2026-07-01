<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="编码方案代码" prop="code">
        <el-input v-model="queryParams.code" placeholder="请输入编码方案代码" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="方案名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入方案名称" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
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
          v-hasPermi="['mdm:eead:swinScheme:add']"
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
          v-hasPermi="['mdm:eead:swinScheme:edit']"
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
          v-hasPermi="['mdm:eead:swinScheme:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['mdm:eead:swinScheme:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="swinSchemeList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="编码方案代码" prop="code" width="150"/>
      <el-table-column label="方案名称" prop="name" width="150"/>
      <el-table-column label="编码路线" prop="route" width="120">
        <template slot-scope="scope">
          <span>{{ scope.row.route === 'SINGLE_SWIN' ? '单一SWIN' : scope.row.route === 'MULTI_SWIN' ? '多SWIN' : scope.row.route }}</span>
        </template>
      </el-table-column>
      <el-table-column label="数据来源" prop="source" width="100"/>
      <el-table-column label="状态" align="center" width="80">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : scope.row.status === 'INACTIVE' ? 'info' : 'warning'">
            {{ scope.row.status === 'ACTIVE' ? '启用' : scope.row.status === 'INACTIVE' ? '停用' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="260" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['mdm:eead:swinScheme:edit']"
          >修改</el-button>
          <el-button
            v-if="scope.row.status === 'ACTIVE'"
            size="mini"
            type="text"
            icon="el-icon-close"
            @click="handleDeactivate(scope.row)"
            v-hasPermi="['mdm:eead:swinScheme:edit']"
          >停用</el-button>
          <el-button
            v-if="scope.row.status === 'INACTIVE'"
            size="mini"
            type="text"
            icon="el-icon-check"
            @click="handleActivate(scope.row)"
            v-hasPermi="['mdm:eead:swinScheme:edit']"
          >启用</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-time"
            @click="handleHistory(scope.row)"
            v-hasPermi="['mdm:eead:swinScheme:query']"
          >历史</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['mdm:eead:swinScheme:remove']"
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

    <!-- 添加或修改编码方案对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="编码方案代码" prop="code">
          <el-input v-model="form.code" :readonly="form.id !== undefined" placeholder="请输入编码方案代码"/>
        </el-form-item>
        <el-form-item label="方案名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入方案名称"/>
        </el-form-item>
        <el-form-item label="本地化名称">
          <el-input v-model="form.nameLocal" placeholder="请输入本地化名称"/>
        </el-form-item>
        <el-form-item label="编码路线" prop="route">
          <el-select v-model="form.route" placeholder="请选择编码路线" style="width: 100%">
            <el-option label="单一SWIN" value="SINGLE_SWIN" />
            <el-option label="多SWIN" value="MULTI_SWIN" />
          </el-select>
        </el-form-item>
        <el-form-item label="SWIN结构模板">
          <el-input v-model="form.structurePattern" placeholder="请输入SWIN结构/格式模板"/>
        </el-form-item>
        <el-form-item label="版本号格式">
          <el-input v-model="form.versionFormat" placeholder="请输入SWIN版本号格式说明"/>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" placeholder="请输入描述"/>
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
        <el-form-item label="编码方案代码">{{ data.code }}</el-form-item>
        <el-form-item label="方案名称">{{ data.name }}</el-form-item>
        <el-form-item label="本地化名称">{{ data.nameLocal }}</el-form-item>
        <el-form-item label="编码路线">{{ data.route === 'SINGLE_SWIN' ? '单一SWIN' : '多SWIN' }}</el-form-item>
        <el-form-item label="SWIN结构模板">{{ data.structurePattern }}</el-form-item>
        <el-form-item label="版本号格式">{{ data.versionFormat }}</el-form-item>
        <el-form-item label="描述">{{ data.description }}</el-form-item>
        <el-form-item label="版本">{{ data.version }}</el-form-item>
        <el-form-item label="状态">{{ data.status === 'ACTIVE' ? '启用' : data.status === 'INACTIVE' ? '停用' : '草稿' }}</el-form-item>
        <el-form-item label="生效开始时间">{{ parseTime(data.effectiveFrom) }}</el-form-item>
        <el-form-item label="生效结束时间">{{ parseTime(data.effectiveTo) }}</el-form-item>
      </template>
    </history-snapshot>
  </div>
</template>

<script>
import {
  listSwinScheme,
  getSwinScheme,
  addSwinScheme,
  updateSwinScheme,
  delSwinScheme,
  deactivateSwinScheme,
  activateSwinScheme,
  swinSchemeHistory
} from '@/api/mdm/swinScheme'
import HistorySnapshot from '@/components/HistorySnapshot/index.vue'

export default {
  name: 'MdmSwinScheme',
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
      swinSchemeList: [],
      title: '',
      open: false,
      effectiveDateRange: [],
      queryParams: {
        page: 1,
        size: 10,
        code: undefined,
        name: undefined,
        status: undefined
      },
      form: {},
      historyVisible: false,
      historyLoading: false,
      historyList: [],
      historyFields: [
        { prop: 'code', label: '编码方案代码' },
        { prop: 'name', label: '方案名称' },
        { prop: 'nameLocal', label: '本地化名称' },
        { prop: 'route', label: '编码路线' },
        { prop: 'structurePattern', label: 'SWIN结构模板' },
        { prop: 'versionFormat', label: '版本号格式' },
        { prop: 'description', label: '描述' },
        { prop: 'version', label: '版本' },
        { prop: 'status', label: '状态', type: 'status' },
        { prop: 'effectiveFrom', label: '生效开始时间', type: 'date' },
        { prop: 'effectiveTo', label: '生效结束时间', type: 'date' }
      ],
      historyCode: '',
      rules: {
        code: [
          { required: true, message: '编码方案代码不能为空', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '方案名称不能为空', trigger: 'blur' }
        ],
        route: [
          { required: true, message: '编码路线不能为空', trigger: 'change' }
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
      listSwinScheme(this.queryParams).then(response => {
        this.swinSchemeList = response.data.rows
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
        id: undefined,
        code: undefined,
        name: undefined,
        nameLocal: undefined,
        route: undefined,
        structurePattern: undefined,
        versionFormat: undefined,
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
      this.title = '添加编码方案'
    },
    handleUpdate(row) {
      this.reset()
      const code = row.code || this.codes[0]
      getSwinScheme(code).then(response => {
        const data = response.data
        this.form = {
          id: data.id,
          code: data.code,
          name: data.name,
          nameLocal: data.nameLocal || data.name_local,
          route: data.route,
          structurePattern: data.structurePattern || data.structure_pattern,
          versionFormat: data.versionFormat || data.version_format,
          description: data.description,
          effectiveFrom: data.effectiveFrom || data.effective_from,
          effectiveTo: data.effectiveTo || data.effective_to
        }
        if (this.form.effectiveFrom && this.form.effectiveTo) {
          this.effectiveDateRange = [this.form.effectiveFrom, this.form.effectiveTo]
        }
        this.open = true
        this.title = '修改编码方案'
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateSwinScheme(this.form.code, this.form).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addSwinScheme(this.form).then(response => {
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
      this.$modal.confirm('是否确认停用编码方案"' + code + '"？').then(function() {
        return deactivateSwinScheme(code)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('停用成功')
      }).catch(() => {})
    },
    handleActivate(row) {
      const code = row.code
      this.$modal.confirm('是否确认启用编码方案"' + code + '"？').then(function() {
        return activateSwinScheme(code)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('启用成功')
      }).catch(() => {})
    },
    handleDelete(row) {
      const code = row.code || this.codes[0]
      this.$modal.confirm('是否确认删除编码方案"' + code + '"？').then(function() {
        return delSwinScheme(code)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    handleHistory(row) {
      this.historyCode = row.code
      this.historyVisible = true
      this.loadHistory()
    },
    loadHistory() {
      this.historyLoading = true
      swinSchemeHistory(this.historyCode).then(response => {
        this.historyList = response.data.rows
        this.historyLoading = false
      })
    },
    handleExport() {
      this.download('edd-mdm/api/mpt/swinScheme/v1/export', {
        ...this.queryParams
      }, `swinScheme_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>
