<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="ICCID" prop="iccid">
        <el-input v-model="queryParams.iccid" placeholder="请输入ICCID" clearable style="width: 240px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="IMSI" prop="imsi">
        <el-input v-model="queryParams.imsi" placeholder="请输入IMSI" clearable style="width: 240px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="MSISDN" prop="msisdn">
        <el-input v-model="queryParams.msisdn" placeholder="请输入MSISDN" clearable style="width: 240px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="运营商" prop="sourceMno">
        <el-select v-model="queryParams.sourceMno" placeholder="请选择运营商" clearable style="width: 240px">
          <el-option v-for="dict in mnoOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="来源类型" prop="sourceType">
        <el-select v-model="queryParams.sourceType" placeholder="请选择来源类型" clearable style="width: 240px">
          <el-option v-for="dict in sourceTypeOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd" v-hasPermi="['ccs:simInfo:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="el-icon-upload2" size="mini" @click="handleBatchAdd" v-hasPermi="['ccs:simInfo:batchAdd']">批量导入</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-refresh" size="mini" @click="handleSync" v-hasPermi="['ccs:simInfo:sync']">同步数据</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleBatchDelete" v-hasPermi="['ccs:simInfo:remove']">批量删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="simList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="ICCID" align="center" prop="iccid" min-width="200" show-overflow-tooltip />
      <el-table-column label="IMSI" align="center" prop="imsi" min-width="160" show-overflow-tooltip />
      <el-table-column label="MSISDN" align="center" prop="msisdn" min-width="140" show-overflow-tooltip />
      <el-table-column label="运营商" align="center" prop="sourceMno" width="100">
        <template slot-scope="scope">
          <el-tag :type="getMnoTagType(scope.row.sourceMno)">{{ getMnoLabel(scope.row.sourceMno) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="来源类型" align="center" prop="sourceType" width="120">
        <template slot-scope="scope">
          <el-tag :type="getSourceTypeTagType(scope.row.sourceType)">{{ getSourceTypeLabel(scope.row.sourceType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="SIM状态" align="center" prop="simStatus" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.simStatus === 1 ? 'success' : 'info'">{{ scope.row.simStatus === 1 ? '测试' : '正常' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="绑定状态" align="center" prop="bindingStatus" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.bindingStatus === 0 ? 'warning' : 'success'">{{ scope.row.bindingStatus === 0 ? '未绑定' : '已绑定' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="实名状态" align="center" prop="realnameStatus" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.realnameStatus === 1 ? 'danger' : 'success'">{{ scope.row.realnameStatus === 1 ? '未实名' : '已实名' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="短信" align="center" prop="smsStatus" width="70">
        <template slot-scope="scope">
          <el-tag :type="scope.row.smsStatus ? 'success' : 'info'" size="mini">{{ scope.row.smsStatus ? '开' : '关' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="数据" align="center" prop="dataStatus" width="70">
        <template slot-scope="scope">
          <el-tag :type="scope.row.dataStatus ? 'success' : 'info'" size="mini">{{ scope.row.dataStatus ? '开' : '关' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="语音" align="center" prop="voiceStatus" width="70">
        <template slot-scope="scope">
          <el-tag :type="scope.row.voiceStatus ? 'success' : 'info'" size="mini">{{ scope.row.voiceStatus ? '开' : '关' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createdTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createdTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['ccs:simInfo:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" v-hasPermi="['ccs:simInfo:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改SIM信息对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="ICCID" prop="iccid">
              <el-input v-model="form.iccid" placeholder="请输入ICCID" maxlength="20" :disabled="!!form.iccid && title === '修改SIM信息'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="IMSI" prop="imsi">
              <el-input v-model="form.imsi" placeholder="请输入IMSI" maxlength="15" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="MSISDN" prop="msisdn">
              <el-input v-model="form.msisdn" placeholder="请输入MSISDN" maxlength="13" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="运营商" prop="mnoType">
              <el-select v-model="form.mnoType" placeholder="请选择运营商" style="width: 100%">
                <el-option v-for="dict in mnoOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog title="批量导入SIM信息" :visible.sync="batchOpen" width="600px" append-to-body>
      <el-form ref="batchForm" :model="batchForm" :rules="batchRules" label-width="100px">
        <el-form-item label="SIM信息列表" prop="simList">
          <el-input v-model="batchForm.simListStr" type="textarea" :rows="10" placeholder="请输入JSON格式的SIM信息列表，格式示例：
[
  {&quot;iccid&quot;:&quot;89860123456789012345&quot;,&quot;imsi&quot;:&quot;460001234567890&quot;,&quot;msisdn&quot;:&quot;13800138000&quot;,&quot;mnoType&quot;:&quot;UNKNOWN&quot;}
]" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitBatchForm">确 定</el-button>
        <el-button @click="batchOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 同步数据对话框 -->
    <el-dialog title="同步SIM数据" :visible.sync="syncOpen" width="600px" append-to-body>
      <el-form ref="syncForm" :model="syncForm" :rules="syncRules" label-width="100px">
        <el-form-item label="Hex编码数据" prop="hexData">
          <el-input v-model="syncForm.hexData" type="textarea" :rows="10" placeholder="请输入Hex编码的JSON数据" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitSyncForm">确 定</el-button>
        <el-button @click="syncOpen = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listSim, getSim, addSim, batchAddSim, updateSim, delSim, batchDelSim, syncSimData } from '@/api/iov/sim'

export default {
  name: 'Sim',
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // SIM信息表格数据
      simList: [],
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      // 是否显示批量导入弹出层
      batchOpen: false,
      // 是否显示同步数据弹出层
      syncOpen: false,
      // 运营商选项
      mnoOptions: [
        { value: 'CMCC', label: '中国移动' },
        { value: 'CUCC', label: '中国联通' },
        { value: 'UNKNOWN', label: '未知' }
      ],
      // 来源类型选项
      sourceTypeOptions: [
        { value: 'cmcc_file', label: '中国移动文件' },
        { value: 'cucc_push', label: '中国联通推送' },
        { value: 'manual_save', label: '手动录入' },
        { value: 'manual_batch', label: '批量导入' },
        { value: 'sync_data', label: '数据同步' }
      ],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        iccid: undefined,
        imsi: undefined,
        msisdn: undefined,
        sourceMno: undefined,
        sourceType: undefined
      },
      // 表单参数
      form: {},
      // 批量导入表单参数
      batchForm: {
        simListStr: ''
      },
      // 同步数据表单参数
      syncForm: {
        hexData: ''
      },
      // 表单校验
      rules: {
        iccid: [
          { required: true, message: 'ICCID不能为空', trigger: 'blur' },
          { pattern: /^\d{19,20}$/, message: 'ICCID必须为19-20位数字', trigger: 'blur' }
        ],
        imsi: [
          { required: true, message: 'IMSI不能为空', trigger: 'blur' },
          { pattern: /^\d{15}$/, message: 'IMSI必须为15位数字', trigger: 'blur' }
        ],
        msisdn: [
          { required: true, message: 'MSISDN不能为空', trigger: 'blur' },
          { pattern: /^(86)?1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ],
        mnoType: [
          { required: true, message: '请选择运营商', trigger: 'change' }
        ]
      },
      // 批量导入表单校验
      batchRules: {
        simListStr: [
          { required: true, message: 'SIM信息列表不能为空', trigger: 'blur' }
        ]
      },
      // 同步数据表单校验
      syncRules: {
        hexData: [
          { required: true, message: 'Hex编码数据不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询SIM信息列表 */
    getList() {
      this.loading = true
      listSim(this.queryParams).then(response => {
        this.simList = response.data.list
        this.total = response.data.total
        this.loading = false
      })
    },
    /** 获取运营商标签类型 */
    getMnoTagType(mno) {
      const types = {
        'CMCC': 'danger',
        'CUCC': 'primary',
        'UNKNOWN': 'info'
      }
      return types[mno] || 'info'
    },
    /** 获取运营商标签文本 */
    getMnoLabel(mno) {
      const labels = {
        'CMCC': '中国移动',
        'CUCC': '中国联通',
        'UNKNOWN': '未知'
      }
      return labels[mno] || mno
    },
    /** 获取来源类型标签类型 */
    getSourceTypeTagType(sourceType) {
      const types = {
        'cmcc_file': 'danger',
        'cucc_push': 'primary',
        'manual_save': 'success',
        'manual_batch': 'warning',
        'sync_data': 'info'
      }
      return types[sourceType] || 'info'
    },
    /** 获取来源类型标签文本 */
    getSourceTypeLabel(sourceType) {
      const labels = {
        'cmcc_file': '中国移动文件',
        'cucc_push': '中国联通推送',
        'manual_save': '手动录入',
        'manual_batch': '批量导入',
        'sync_data': '数据同步'
      }
      return labels[sourceType] || sourceType
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {
        iccid: undefined,
        imsi: undefined,
        msisdn: undefined,
        mnoType: undefined
      }
      this.resetForm('form')
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.iccid)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加SIM信息'
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const iccid = row.iccid
      getSim(iccid).then(response => {
        this.form = {
          iccid: response.data.iccid,
          imsi: response.data.imsi,
          msisdn: response.data.msisdn,
          mnoType: response.data.sourceMno
        }
        this.open = true
        this.title = '修改SIM信息'
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.title === '修改SIM信息') {
            updateSim(this.form.iccid, this.form).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addSim(this.form).then(response => {
              this.$modal.msgSuccess('新增成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const iccid = row.iccid
      this.$modal.confirm('是否确认删除ICCID为"' + iccid + '"的数据项？').then(function() {
        return delSim(iccid)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    /** 批量删除按钮操作 */
    handleBatchDelete() {
      const iccids = this.ids
      this.$modal.confirm('是否确认删除选中的' + iccids.length + '条数据项？').then(function() {
        return batchDelSim(iccids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    /** 批量导入按钮操作 */
    handleBatchAdd() {
      this.batchForm.simListStr = ''
      this.batchOpen = true
    },
    /** 提交批量导入表单 */
    submitBatchForm() {
      this.$refs['batchForm'].validate(valid => {
        if (valid) {
          try {
            const simList = JSON.parse(this.batchForm.simListStr)
            if (!Array.isArray(simList)) {
              this.$modal.msgError('请输入JSON数组格式')
              return
            }
            batchAddSim({ simList: simList }).then(response => {
              this.$modal.msgSuccess('批量导入成功')
              this.batchOpen = false
              this.getList()
            })
          } catch (e) {
            this.$modal.msgError('JSON格式错误，请检查输入')
          }
        }
      })
    },
    /** 同步数据按钮操作 */
    handleSync() {
      this.syncForm.hexData = ''
      this.syncOpen = true
    },
    /** 提交同步数据表单 */
    submitSyncForm() {
      this.$refs['syncForm'].validate(valid => {
        if (valid) {
          syncSimData(this.syncForm).then(response => {
            this.$modal.msgSuccess('同步成功')
            this.syncOpen = false
            this.getList()
          })
        }
      })
    }
  }
}
</script>
