<template>
  <div class="app-container">
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true">
      <el-form-item label="分类编码" prop="parentCode">
        <el-input
          v-model="queryParams.parentCode"
          placeholder="请输入父分类编码"
          clearable
          style="width: 150px"
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
          v-hasPermi="['mdm:materialCategory:add']"
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['mdm:materialCategory:edit']"
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
          v-hasPermi="['mdm:materialCategory:remove']"
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
          v-hasPermi="['mdm:materialCategory:export']"
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['mdm:material:category:catalog:preview']"
          type="info"
          plain
          icon="el-icon-view"
          size="mini"
          @click="handleCatalogPreview"
        >目录预检</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['mdm:material:category:catalog:bootstrap']"
          type="warning"
          plain
          icon="el-icon-refresh"
          size="mini"
          @click="handleCatalogBootstrap"
        >标准目录初始化</el-button>
      </el-col>
      <right-toolbar :show-search.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table
      v-loading="loading"
      :data="categoryList"
      row-key="code"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="分类编码" prop="code" width="250" />
      <el-table-column label="分类名称" prop="name" />
      <el-table-column label="本地化名称" prop="nameLocal" />
      <el-table-column label="父分类编码" prop="parentCode" width="200" />
      <el-table-column label="状态" align="center" width="80">
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
      <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-hasPermi="['mdm:materialCategory:edit']"
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
          >修改</el-button>
          <el-button
            v-if="scope.row.status === 'ACTIVE'"
            v-hasPermi="['mdm:materialCategory:remove']"
            size="mini"
            type="text"
            icon="el-icon-close"
            @click="handleDeactivate(scope.row)"
          >停用</el-button>
          <el-button
            v-hasPermi="['mdm:materialCategory:remove']"
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
          >删除</el-button>
          <el-button
            v-hasPermi="['mdm:materialCategory:query']"
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

    <!-- 添加或修改物料分类对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="分类编码" prop="code">
          <el-input v-model="form.code" :readonly="form.code !== undefined && form.id !== undefined" placeholder="请输入分类编码" />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="本地化名称" prop="nameLocal">
          <el-input v-model="form.nameLocal" placeholder="请输入本地化名称" />
        </el-form-item>
        <el-form-item label="父分类编码" prop="parentCode">
          <el-input v-model="form.parentCode" placeholder="请输入父分类编码" />
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
        <el-form-item label="分类编码">{{ data.code }}</el-form-item>
        <el-form-item label="分类名称">{{ data.name }}</el-form-item>
        <el-form-item label="本地化名称">{{ data.nameLocal }}</el-form-item>
        <el-form-item label="父分类编码">{{ data.parentCode }}</el-form-item>
        <el-form-item label="描述">{{ data.description }}</el-form-item>
        <el-form-item label="版本">{{ data.version }}</el-form-item>
        <el-form-item label="状态">{{ data.status === 'ACTIVE' ? '启用' : data.status === 'INACTIVE' ? '停用' : data.status }}</el-form-item>
        <el-form-item label="生效开始时间">{{ parseTime(data.effectiveFrom) }}</el-form-item>
        <el-form-item label="生效结束时间">{{ parseTime(data.effectiveTo) }}</el-form-item>
      </template>
    </history-snapshot>

    <!-- 标准目录预检对话框（CR-039 §6） -->
    <el-dialog title="物料分类标准目录预检" :visible.sync="previewVisible" width="640px" append-to-body>
      <template v-if="previewData.catalogStatus === 'INVALID'">
        <el-alert
          title="标准目录非法，已禁用预检与初始化"
          type="error"
          :description="previewData.error || '目录静态校验失败'"
          show-icon
          :closable="false"
        />
      </template>
      <template v-else>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="目录状态">{{ previewData.catalogStatus }}</el-descriptions-item>
          <el-descriptions-item label="目录版本">{{ previewData.catalogVersion }}</el-descriptions-item>
          <el-descriptions-item label="总条目">
            {{ previewData.total }}（L1 {{ previewData.level1Count }} / L2 {{ previewData.level2Count }} / L3 {{ previewData.level3Count }}）
          </el-descriptions-item>
          <el-descriptions-item label="已初始化 / 待创建 / 冲突">
            <span class="catalog-ok">{{ previewData.initialized }}</span> /
            <span>{{ previewData.missing }}</span> /
            <span class="catalog-conflict">{{ previewData.conflicted }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <el-divider content-position="left">冲突明细</el-divider>
        <div v-if="previewData.conflicts && previewData.conflicts.length" class="catalog-conflict-box">
          <div v-for="(item, idx) in previewData.conflicts" :key="idx" class="catalog-conflict-item">{{ item }}</div>
        </div>
        <div v-else class="catalog-empty">无冲突</div>
        <el-divider content-position="left">条目状态</el-divider>
        <el-collapse v-if="previewData.items && previewData.items.length">
          <el-collapse-item :title="`已初始化（${initializedItems.length}）`" name="init">
            <div v-if="initializedItems.length" class="catalog-code-list">
              <el-tag v-for="it in initializedItems" :key="'i-' + it.code" size="mini" type="success" class="catalog-code-tag">{{ it.code }}</el-tag>
            </div>
            <div v-else class="catalog-empty">无</div>
          </el-collapse-item>
          <el-collapse-item :title="`待创建（${missingItems.length}）`" name="missing">
            <div v-if="missingItems.length" class="catalog-code-list">
              <el-tag v-for="it in missingItems" :key="'m-' + it.code" size="mini" class="catalog-code-tag">{{ it.code }}</el-tag>
            </div>
            <div v-else class="catalog-empty">无</div>
          </el-collapse-item>
          <el-collapse-item :title="`冲突（${conflictItems.length}）`" name="conflict">
            <div v-if="conflictItems.length" class="catalog-code-list">
              <el-tag v-for="it in conflictItems" :key="'c-' + it.code" size="mini" type="warning" class="catalog-code-tag">{{ it.code }}</el-tag>
            </div>
            <div v-else class="catalog-empty">无</div>
          </el-collapse-item>
        </el-collapse>
      </template>
      <div slot="footer" class="dialog-footer">
        <el-button @click="previewVisible = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listMaterialCategory,
  getMaterialCategory,
  addMaterialCategory,
  updateMaterialCategory,
  delMaterialCategory,
  deactivateMaterialCategory,
  listMaterialCategoryTree,
  listMaterialCategoryHistory,
  previewMaterialCategoryCatalog,
  bootstrapMaterialCategory
} from '@/api/mdm/materialCategory'
import HistorySnapshot from '@/components/HistorySnapshot/index.vue'

export default {
  name: 'MdmMaterialCategory',
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
      categoryList: [],
      title: '',
      open: false,
      effectiveDateRange: [],
      queryParams: {
        page: 1,
        size: 10,
        parentCode: undefined,
        includeInactive: false
      },
      form: {},
      historyVisible: false,
      historyLoading: false,
      historyList: [],
      previewVisible: false,
      previewData: {},
      historyFields: [
        { prop: 'code', label: '分类编码' },
        { prop: 'name', label: '分类名称' },
        { prop: 'nameLocal', label: '本地化名称' },
        { prop: 'parentCode', label: '父分类编码' },
        { prop: 'description', label: '描述' },
        { prop: 'version', label: '版本' },
        { prop: 'status', label: '状态', type: 'status' },
        { prop: 'effectiveFrom', label: '生效开始时间', type: 'date' },
        { prop: 'effectiveTo', label: '生效结束时间', type: 'date' }
      ],
      historyCode: '',
      rules: {
        code: [
          { required: true, message: '分类编码不能为空', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '分类名称不能为空', trigger: 'blur' }
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
      listMaterialCategory(this.queryParams).then(response => {
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
        parentCode: undefined,
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
      this.queryParams.parentCode = undefined
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
      this.title = '添加物料分类'
    },
    handleUpdate(row) {
      this.reset()
      const code = row.code || this.codes[0]
      getMaterialCategory(code).then(response => {
        this.form = response.data
        if (this.form.effectiveFrom && this.form.effectiveTo) {
          this.effectiveDateRange = [this.form.effectiveFrom, this.form.effectiveTo]
        }
        this.open = true
        this.title = '修改物料分类'
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateMaterialCategory(this.form.code, this.form).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addMaterialCategory(this.form).then(response => {
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
      this.$modal.confirm('是否确认停用物料分类"' + code + '"？').then(function() {
        return deactivateMaterialCategory(code, '')
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('停用成功')
      }).catch(() => {})
    },
    handleDelete(row) {
      // 行内删除：单条；工具栏批量删除：遍历所有勾选项
      const codes = (row && row.code) ? [row.code] : (this.codes || [])
      if (!codes.length) return
      this.$modal.confirm('是否确认删除物料分类"' + codes.join('、') + '"？').then(() => {
        return Promise.all(codes.map(code => delMaterialCategory(code, '')))
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    handleExport() {
      this.download('edd-mdm/api/mpt/material/category/v1/export', {
        ...this.queryParams
      }, `materialCategory_${new Date().getTime()}.xlsx`)
    },
    handleHistory(row) {
      this.historyCode = row.code
      this.historyVisible = true
      this.loadHistory()
    },
    loadHistory() {
      this.historyLoading = true
      listMaterialCategoryHistory(this.historyCode).then(response => {
        this.historyList = response.data.rows
        this.historyLoading = false
      })
    },
    handleCatalogPreview() {
      previewMaterialCategoryCatalog().then(response => {
        this.previewData = response.data
        this.previewVisible = true
      })
    },
    handleCatalogBootstrap() {
      this.$modal.confirm('是否执行物料分类标准目录初始化？将按 L1→L2→L3 拓扑幂等导入 101 项（4 L1 + 19 L2 + 78 L3）为 ACTIVE；已存在且一致则跳过，冲突仅报告、不覆盖已有业务数据。').then(() => {
        return bootstrapMaterialCategory()
      }).then((response) => {
        const r = response.data
        if (r.catalogStatus === 'INVALID') {
          this.$modal.msgError('标准目录非法，初始化已禁用：' + (r.error || ''))
          return
        }
        this.$modal.msgSuccess('标准目录初始化完成：新建 ' + r.created + '，跳过 ' + r.skipped + '，冲突 ' + r.conflicted + '，失败 ' + r.failed + '，依赖失败 ' + r.dependencyFailed)
        this.getList()
      }).catch(() => {})
    }
  },
  computed: {
    initializedItems() {
      return (this.previewData.items || []).filter(i => i.status === 'Initialized')
    },
    missingItems() {
      return (this.previewData.items || []).filter(i => i.status === 'Missing')
    },
    conflictItems() {
      return (this.previewData.items || []).filter(i => i.status === 'Conflict')
    }
  }
}
</script>

<style scoped>
.catalog-ok {
  color: #67c23a;
}
.catalog-conflict {
  color: #e6a23c;
}
.catalog-conflict-box {
  max-height: 180px;
  overflow-y: auto;
  padding: 4px 8px;
  background: #fdf6ec;
  border-radius: 4px;
}
.catalog-conflict-item {
  color: #e6a23c;
  line-height: 1.6;
  font-size: 13px;
}
.catalog-code-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.catalog-code-tag {
  margin: 0 0 4px 0;
}
.catalog-empty {
  color: #909399;
  font-size: 13px;
}
</style>
