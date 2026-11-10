<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="销售车型" prop="saleModelCode">
        <el-input
          v-model="queryParams.saleModelCode"
          placeholder="GLOBAL 表示全局协议"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="协议代码" prop="agreementCode">
        <el-input
          v-model="queryParams.agreementCode"
          placeholder="请输入协议代码"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="协议状态" prop="agreementStatus">
        <el-select v-model="queryParams.agreementStatus" placeholder="协议状态" clearable style="width: 130px">
          <el-option
            v-for="(label, value) in AGREEMENT_STATUS"
            :key="value"
            :label="label"
            :value="value"
          />
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
          v-hasPermi="['completeVehicle:order:agreement:edit']"
        >新增协议
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="agreementList">
      <el-table-column label="协议代码" prop="agreementCode" min-width="160" fixed="left"/>
      <el-table-column label="销售车型" align="center" width="140">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.saleModelCode === 'GLOBAL'" size="mini" type="info">全局</el-tag>
          <span v-else>{{ scope.row.saleModelCode }}</span>
        </template>
      </el-table-column>
      <el-table-column label="版本号" align="center" width="90">
        <template slot-scope="scope">V{{ scope.row.versionNo }}</template>
      </el-table-column>
      <el-table-column label="协议标题" prop="title" min-width="200" show-overflow-tooltip/>
      <el-table-column label="状态" align="center" width="100">
        <template slot-scope="scope">
          <el-tag size="mini" :type="statusTagType(scope.row.agreementStatus)">
            {{ agreementStatusLabel(scope.row.agreementStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="生效开始" align="center" width="160">
        <template slot-scope="scope">{{ timeText(scope.row.effectiveFrom) }}</template>
      </el-table-column>
      <el-table-column label="生效结束" align="center" width="160">
        <template slot-scope="scope">{{ timeText(scope.row.effectiveTo) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="170" fixed="right" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handlePreview(scope.row)"
          >查看
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['completeVehicle:order:agreement:edit']"
          >编辑
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-remove-outline"
            @click="handleOffShelf(scope.row)"
            :disabled="scope.row.agreementStatus === 'off_shelf'"
            v-hasPermi="['completeVehicle:order:agreement:remove']"
          >下架
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

    <!-- 新增/编辑协议 -->
    <el-dialog :title="title" :visible.sync="open" width="820px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="110px" size="small">
        <el-form-item label="协议代码" prop="agreementCode">
          <el-input
            v-model="form.agreementCode"
            :readonly="!!form.agreementId"
            placeholder="如 VEHICLE_PURCHASE"
          />
        </el-form-item>
        <el-form-item label="销售车型" prop="saleModelCode">
          <el-input
            v-model="form.saleModelCode"
            :readonly="!!form.agreementId"
            placeholder="留空表示全局协议（GLOBAL）"
          />
        </el-form-item>
        <el-form-item label="版本号" prop="versionNo">
          <el-input-number
            v-model="form.versionNo"
            :min="1"
            :step="1"
            :disabled="!!form.agreementId"
            controls-position="right"
          />
          <span class="form-tip">同一车型 + 协议代码下版本号不可重复</span>
        </el-form-item>
        <el-form-item label="协议状态" prop="agreementStatus">
          <el-select v-model="form.agreementStatus" placeholder="请选择状态" style="width: 220px">
            <el-option
              v-for="(label, value) in AGREEMENT_STATUS"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="生效时间">
          <el-date-picker
            v-model="form.effectiveFrom"
            type="datetime"
            value-format="timestamp"
            placeholder="生效开始时间（可空）"
            style="width: 220px"
          />
          <span style="margin: 0 8px;">至</span>
          <el-date-picker
            v-model="form.effectiveTo"
            type="datetime"
            value-format="timestamp"
            placeholder="生效结束时间（可空）"
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="协议标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入协议标题"/>
        </el-form-item>
        <el-form-item label="协议简介">
          <el-input v-model="form.intro" type="textarea" :rows="2" placeholder="选填"/>
        </el-form-item>
        <el-form-item label="协议详情" prop="detail">
          <el-input v-model="form.detail" type="textarea" :rows="10" placeholder="请输入协议全文"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="cancel">取 消</el-button>
        <el-button size="small" type="primary" :loading="submitting" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 协议预览 -->
    <el-dialog :title="preview.title" :visible.sync="preview.visible" width="720px" append-to-body>
      <div class="agreement-content">{{ preview.content }}</div>
      <div slot="footer">
        <el-button size="small" @click="preview.visible = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listPurchaseAgreement,
  savePurchaseAgreement,
  offShelfPurchaseAgreement
} from '@/api/otd/purchaseAgreement'

// 镜像后端 PurchaseAgreementStatus
const AGREEMENT_STATUS = {
  draft: '草稿',
  active: '生效',
  off_shelf: '下架'
}

export default {
  name: 'PurchaseAgreement',
  dicts: [],
  data() {
    return {
      AGREEMENT_STATUS: AGREEMENT_STATUS,
      // 遮罩层
      loading: true,
      // 提交中
      submitting: false,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 协议列表
      agreementList: [],
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      // 表单参数
      form: {},
      // 预览
      preview: {
        visible: false,
        title: '',
        content: ''
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        saleModelCode: undefined,
        agreementCode: undefined,
        agreementStatus: undefined
      },
      // 表单校验
      rules: {
        agreementCode: [{ required: true, message: '协议代码不能为空', trigger: 'blur' }],
        versionNo: [{ required: true, message: '协议版本号不能为空', trigger: 'blur' }],
        title: [{ required: true, message: '协议标题不能为空', trigger: 'blur' }],
        detail: [{ required: true, message: '协议详情不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询协议模板列表 */
    getList() {
      this.loading = true
      listPurchaseAgreement(this.queryParams)
        .then(response => {
          this.agreementList = response.data.items || []
          this.total = response.data.total || 0
        })
        .catch(() => {})
        .then(() => {
          this.loading = false
        })
    },
    agreementStatusLabel(status) {
      return AGREEMENT_STATUS[status] || status || '-'
    },
    statusTagType(status) {
      if (status === 'active') {
        return 'success'
      }
      if (status === 'off_shelf') {
        return 'danger'
      }
      return 'info'
    },
    timeText(value) {
      if (value === null || value === undefined || value === '') {
        return '-'
      }
      return this.parseTime(value) || '-'
    },
    /** 取消按钮 */
    cancel() {
      this.open = false
      this.reset()
    },
    /** 表单重置 */
    reset() {
      this.form = {
        agreementId: undefined,
        agreementCode: undefined,
        saleModelCode: '',
        versionNo: 1,
        title: undefined,
        intro: undefined,
        detail: undefined,
        agreementStatus: 'draft',
        effectiveFrom: undefined,
        effectiveTo: undefined
      }
      this.resetForm('form')
    },
    /** 新增 */
    handleAdd() {
      this.reset()
      this.title = '新增购车协议'
      this.open = true
    },
    /** 编辑 */
    handleUpdate(row) {
      this.reset()
      this.form = {
        agreementId: row.agreementId,
        agreementCode: row.agreementCode,
        saleModelCode: row.saleModelCode,
        versionNo: row.versionNo,
        title: row.title,
        intro: row.intro,
        detail: row.detail,
        agreementStatus: row.agreementStatus || 'draft',
        effectiveFrom: row.effectiveFrom,
        effectiveTo: row.effectiveTo
      }
      this.title = '编辑购车协议'
      this.open = true
    },
    /** 查看协议全文 */
    handlePreview(row) {
      this.preview = {
        visible: true,
        title: (row.title || row.agreementCode) + '（V' + row.versionNo + '）',
        content: (row.intro ? row.intro + '\n\n' : '') + (row.detail || '')
      }
    },
    /** 提交 */
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (!valid) {
          return
        }
        if (this.form.effectiveFrom && this.form.effectiveTo
          && this.form.effectiveFrom > this.form.effectiveTo) {
          this.$modal.msgError('生效开始时间不能晚于生效结束时间')
          return
        }
        this.submitting = true
        savePurchaseAgreement(this.form)
          .then(() => {
            this.$modal.msgSuccess(this.form.agreementId ? '修改成功' : '新增成功')
            this.open = false
            this.getList()
          })
          .catch(() => {})
          .then(() => {
            this.submitting = false
          })
      })
    },
    /** 下架 */
    handleOffShelf(row) {
      this.$modal.confirm('下架后该版本协议将不再对 C 端展示（订单已有确认快照不受影响），是否确认下架？')
        .then(() => offShelfPurchaseAgreement(row.agreementId))
        .then(() => {
          this.$modal.msgSuccess('已下架')
          this.getList()
        })
        .catch(() => {})
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm('queryForm')
      this.queryParams.pageNum = 1
      this.getList()
    }
  }
}
</script>

<style scoped>
.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.agreement-content {
  max-height: 60vh;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.6;
}
</style>
