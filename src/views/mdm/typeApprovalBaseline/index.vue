<template>
  <div class="app-container">
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true">
      <el-form-item label="SWIN编码" prop="swinCode">
        <el-input v-model="queryParams.swinCode" placeholder="请输入SWIN编码" clearable style="width: 160px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="锚定层级" prop="anchorType">
        <el-select v-model="queryParams.anchorType" placeholder="请选择锚定层级" clearable style="width: 150px">
          <el-option v-for="item in anchorTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="锚点编码" prop="anchorCode">
        <el-input v-model="queryParams.anchorCode" placeholder="请输入锚点编码" clearable style="width: 160px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="基线状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择基线状态" clearable style="width: 150px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="基线编码" prop="code">
        <el-input v-model="queryParams.code" placeholder="请输入基线编码" clearable style="width: 160px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button v-hasPermi="['mdm:ee:typeApprovalBaseline:add']" type="primary" plain icon="el-icon-plus" size="mini" @click="handleProject">生成基线</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button v-hasPermi="['mdm:ee:typeApprovalBaseline:remove']" type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleBatchDelete">批量删除</el-button>
      </el-col>
      <right-toolbar :show-search.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="baselineList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="基线编码" prop="taBaselineCode" width="200" show-overflow-tooltip />
      <el-table-column label="SWIN编码" prop="swinCode" width="150" show-overflow-tooltip />
      <el-table-column label="锚定层级" prop="anchorType" width="100" align="center">
        <template slot-scope="scope">{{ getAnchorTypeLabel(scope.row.anchorType) }}</template>
      </el-table-column>
      <el-table-column label="锚点编码" prop="anchorCode" width="150" show-overflow-tooltip />
      <el-table-column label="基线状态" prop="status" width="100" align="center">
        <template slot-scope="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">{{ getStatusLabel(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="投影摘要" prop="projectionDigest" min-width="120" show-overflow-tooltip />
      <el-table-column label="生效时间" align="center" width="140">
        <template slot-scope="scope"><span>{{ parseTime(scope.row.effectiveFrom, "{y}-{m}-{d} {h}:{i}") }}</span></template>
      </el-table-column>
      <el-table-column label="版本" prop="version" width="60" align="center" />
      <el-table-column label="创建人" prop="createBy" width="100" />
      <el-table-column label="创建时间" align="center" width="140">
        <template slot-scope="scope"><span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}") }}</span></template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="280" fixed="right" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button v-hasPermi="['mdm:ee:typeApprovalBaseline:query']" size="mini" type="text" icon="el-icon-view" @click="handleDetail(scope.row)">详情</el-button>
          <el-button v-if="scope.row.status === 'DRAFT'" v-hasPermi="['mdm:ee:typeApprovalBaseline:release']" size="mini" type="text" icon="el-icon-open" @click="handleRelease(scope.row)">发布</el-button>
          <el-button v-if="scope.row.status === 'RELEASED'" v-hasPermi="['mdm:ee:typeApprovalBaseline:freeze']" size="mini" type="text" icon="el-icon-lock" @click="handleFreeze(scope.row)">冻结</el-button>
          <el-button v-if="scope.row.status === 'DRAFT'" v-hasPermi="['mdm:ee:typeApprovalBaseline:remove']" size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)">删除</el-button>
          <el-button v-if="scope.row.status !== 'DRAFT'" v-hasPermi="['mdm:ee:typeApprovalBaseline:remove']" size="mini" type="text" icon="el-icon-delete-solid" @click="handleForceDelete(scope.row)">强制删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="queryParams.page" :limit.sync="queryParams.size" @pagination="getList" />

    <!-- 生成基线对话框 -->
    <el-dialog title="生成型式批准基线" :visible.sync="projectOpen" width="500px" append-to-body>
      <el-form ref="projectForm" :model="projectForm" :rules="projectRules" label-width="100px">
        <el-form-item label="SWIN编码" prop="swinCode">
          <el-select v-model="projectForm.swinCode" placeholder="请输入SWIN编码搜索" filterable remote clearable reserve-keyword style="width: 100%" :remote-method="remoteSwinSearch" :loading="swinLoading">
            <el-option v-for="item in swinOptions" :key="item.code" :label="item.name" :value="item.code" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" :loading="projectLoading" @click="submitProject">确 定</el-button>
        <el-button @click="projectOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 基线详情对话框 -->
    <el-dialog title="基线详情" :visible.sync="detailOpen" width="900px" append-to-body>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="基线编码">{{ detail.taBaselineCode }}</el-descriptions-item>
        <el-descriptions-item label="SWIN编码">{{ detail.swinCode }}</el-descriptions-item>
        <el-descriptions-item label="锚定层级">{{ getAnchorTypeLabel(detail.anchorType) }}</el-descriptions-item>
        <el-descriptions-item label="锚点编码">{{ detail.anchorCode }}</el-descriptions-item>
        <el-descriptions-item label="基线状态">
          <el-tag :type="getStatusTagType(detail.status)">{{ getStatusLabel(detail.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="版本">{{ detail.version }}</el-descriptions-item>
        <el-descriptions-item label="投影摘要" :span="2">{{ detail.projectionDigest }}</el-descriptions-item>
        <el-descriptions-item label="来源基线范围" :span="2">{{ detail.sourceBaselineScope }}</el-descriptions-item>
        <el-descriptions-item label="生效时间">{{ parseTime(detail.effectiveFrom, "{y}-{m}-{d} {h}:{i}") }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.remark }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ detail.createBy }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(detail.createTime, "{y}-{m}-{d} {h}:{i}") }}</el-descriptions-item>
        <el-descriptions-item label="修改人">{{ detail.modifyBy }}</el-descriptions-item>
        <el-descriptions-item label="修改时间">{{ parseTime(detail.modifyTime, "{y}-{m}-{d} {h}:{i}") }}</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">基线项列表</el-divider>
      <el-table v-loading="detailLoading" :data="detail.items || []" size="small" border max-height="300">
        <el-table-column label="车载节点" prop="vehicleNodeCode" width="120" />
        <el-table-column label="零件编码" prop="partCode" width="160" />
        <el-table-column label="批准版本" prop="approvedVersion" width="100" />
        <el-table-column label="来源基线" prop="sourceBaselineCode" min-width="160" show-overflow-tooltip />
        <el-table-column label="创建人" prop="createBy" width="100" />
        <el-table-column label="创建时间" align="center" width="140">
          <template slot-scope="scope"><span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}") }}</span></template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listTypeApprovalBaseline,
  projectTypeApprovalBaseline,
  releaseTypeApprovalBaseline,
  freezeTypeApprovalBaseline,
  delTypeApprovalBaseline
} from '@/api/mdm/typeApprovalBaseline'
import { listSwinDefinition } from '@/api/mdm/swinDefinition'

const ANCHOR_TYPE_OPTIONS = [
  { label: '配置', value: 'CONFIGURATION' },
  { label: '版本', value: 'VARIANT' }
]

const ANCHOR_TYPE_MAP = {
  'CONFIGURATION': '配置',
  'VARIANT': '版本'
}

const STATUS_OPTIONS = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已发布', value: 'RELEASED' },
  { label: '已冻结', value: 'FROZEN' }
]

const STATUS_MAP = {
  'DRAFT': '草稿',
  'RELEASED': '已发布',
  'FROZEN': '已冻结'
}

const STATUS_TAG_MAP = {
  'DRAFT': 'warning',
  'RELEASED': 'success',
  'FROZEN': 'info'
}

export default {
  name: 'MdmTypeApprovalBaseline',
  data() {
    return {
      anchorTypeOptions: ANCHOR_TYPE_OPTIONS,
      statusOptions: STATUS_OPTIONS,
      loading: true,
      ids: [],
      codes: [],
      multiple: true,
      showSearch: true,
      total: 0,
      baselineList: [],
      queryParams: {
        page: 1,
        size: 10,
        swinCode: undefined,
        anchorType: undefined,
        anchorCode: undefined,
        status: undefined,
        code: undefined
      },
      // 生成基线
      projectOpen: false,
      projectLoading: false,
      swinOptions: [],
      swinLoading: false,
      projectForm: {
        swinCode: undefined
      },
      projectRules: {
        swinCode: [{ required: true, message: 'SWIN编码不能为空', trigger: 'change' }]
      },
      // 详情
      detailOpen: false,
      detailLoading: false,
      detail: {}
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listTypeApprovalBaseline(this.queryParams).then(response => {
        this.baselineList = response.data.list
        this.total = response.data.total
        this.loading = false
      })
    },
    getAnchorTypeLabel(type) {
      return ANCHOR_TYPE_MAP[type] || type
    },
    getStatusLabel(status) {
      return STATUS_MAP[status] || status
    },
    getStatusTagType(status) {
      return STATUS_TAG_MAP[status] || ''
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
      this.codes = selection.map(item => item.taBaselineCode)
      this.multiple = !selection.length
    },
    remoteSwinSearch(query) {
      if (query !== '') {
        this.swinLoading = true
        listSwinDefinition({ swinCode: query, includeInactive: false, page: 1, size: 20 }).then(response => {
          this.swinOptions = response.data.rows.map(item => ({
            code: item.swinCode,
            name: item.swinCode
          }))
          this.swinLoading = false
        }).catch(() => {
          this.swinLoading = false
        })
      } else {
        this.swinOptions = []
      }
    },
    handleProject() {
      this.projectForm = { swinCode: undefined }
      this.swinOptions = []
      this.projectOpen = true
      this.$nextTick(() => {
        this.$refs['projectForm'] && this.$refs['projectForm'].resetFields()
      })
    },
    submitProject() {
      this.$refs['projectForm'].validate(valid => {
        if (valid) {
          this.projectLoading = true
          projectTypeApprovalBaseline(this.projectForm).then(response => {
            this.$modal.msgSuccess('生成成功')
            this.projectOpen = false
            this.projectLoading = false
            this.getList()
          }).catch(() => {
            this.projectLoading = false
          })
        }
      })
    },
    handleRelease(row) {
      this.$modal.confirm('是否确认发布型式批准基线"' + row.taBaselineCode + '"？发布后状态将变为已发布。').then(() => {
        return releaseTypeApprovalBaseline(row.taBaselineCode)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('发布成功')
      }).catch(() => {})
    },
    handleFreeze(row) {
      this.$modal.confirm('是否确认冻结型式批准基线"' + row.taBaselineCode + '"？冻结后表示型批通过，不可再修改。').then(() => {
        return freezeTypeApprovalBaseline(row.taBaselineCode)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('冻结成功')
      }).catch(() => {})
    },
    handleDelete(row) {
      const code = row.taBaselineCode || this.codes[0]
      this.$modal.confirm('是否确认删除型式批准基线"' + code + '"？').then(() => {
        return delTypeApprovalBaseline(code, false)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    handleForceDelete(row) {
      const code = row.taBaselineCode
      this.$modal.confirm('是否确认强制删除型式批准基线"' + code + '"？此操作将跳过下游引用检查！').then(() => {
        return delTypeApprovalBaseline(code, true)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('强制删除成功')
      }).catch(() => {})
    },
    handleBatchDelete() {
      const codes = this.codes
      this.$modal.confirm('是否确认批量删除选中的 ' + codes.length + ' 条型式批准基线？').then(() => {
        const promises = codes.map(code => delTypeApprovalBaseline(code, false))
        return Promise.all(promises)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('批量删除成功')
      }).catch(() => {})
    },
    handleDetail(row) {
      this.detailOpen = true
      this.detailLoading = true
      this.detail = row
      this.detailLoading = false
    }
  }
}
</script>
