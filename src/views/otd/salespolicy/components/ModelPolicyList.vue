<template>
  <div>
    <el-alert
      title="说明"
      type="info"
      :closable="false"
      style="margin-bottom: 15px;"
    >
      <template slot="default">
        展示该车系下 MDM 全部车型。可配置每个车型的销售状态、营销信息等。
        <span style="color: #E6A23C;">空表视为 ALL 全开（该车系下全部车型都可售）。</span>
      </template>
    </el-alert>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-refresh"
          size="mini"
          @click="getList"
          v-hasPermi="['otd:saleModel:edit']"
        >刷新
        </el-button>
      </el-col>

    </el-row>

    <el-table
      v-loading="loading"
      :data="modelPolicyList"
      size="small"
      border
      style="width: 100%"
    >
      <el-table-column label="车型代码" prop="modelCode" width="140" show-overflow-tooltip/>
      <el-table-column label="车型名称" prop="modelName" width="150" show-overflow-tooltip/>
      <el-table-column label="MDM状态" align="center" width="100">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.status === 'active'" type="success" size="mini">启用</el-tag>
          <el-tag v-else-if="scope.row.status === 'inactive'" type="info" size="mini">停用</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="销售状态" align="center" width="100">
        <template slot-scope="scope">
          <template v-if="scope.row.inPolicy">
            <el-tag v-if="scope.row.saleStatus === 'active'" type="success" size="mini">在售</el-tag>
            <el-tag v-else-if="scope.row.saleStatus === 'off_shelf'" type="info" size="mini">下架</el-tag>
            <el-tag v-else-if="scope.row.saleStatus === 'coming_soon'" type="warning" size="mini">即将上市</el-tag>
          </template>
          <el-tag v-else type="info" size="mini">未配置</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-if="scope.row.inPolicy"
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['otd:saleModel:edit']"
          >编辑
          </el-button>
          <el-button
            v-else
            size="mini"
            type="text"
            icon="el-icon-plus"
            @click="handleAddSingle(scope.row)"
            v-hasPermi="['otd:saleModel:edit']"
          >添加
          </el-button>
          <el-button
            v-if="scope.row.inPolicy"
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['otd:saleModel:edit']"
          >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/修改对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogOpen" width="600px" append-to-body>
      <el-form ref="policyForm" :model="policyForm" :rules="policyRules" label-width="120px">
        <el-alert
          title="提示"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 15px;"
        >
          <template slot="default">
            营销信息将在提交时更新，GET接口不再返回这些字段。
          </template>
        </el-alert>
        <el-form-item label="车型" prop="modelCode">
          <el-input v-model="policyForm.modelCode" disabled />
        </el-form-item>
        <el-form-item label="销售状态" prop="saleStatus">
          <el-radio-group v-model="policyForm.saleStatus">
            <el-radio label="active">在售</el-radio>
            <el-radio label="off_shelf">下架</el-radio>
            <el-radio label="coming_soon">即将上市</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="营销名称">
          <el-input v-model="policyForm.marketingName" placeholder="请输入营销名称"/>
        </el-form-item>
        <el-form-item label="营销图片">
          <el-input v-model="policyForm.marketingImage" placeholder="请输入营销图片URL"/>
        </el-form-item>
        <el-form-item label="营销文案">
          <el-input v-model="policyForm.marketingCopy" type="textarea" placeholder="请输入营销文案"/>
        </el-form-item>
        <el-form-item label="可售区域">
          <el-input v-model="policyForm.availableRegions" placeholder="请输入可售区域，多个用逗号分隔"/>
        </el-form-item>
        <el-form-item label="销售渠道">
          <el-input v-model="policyForm.channels" placeholder="请输入销售渠道，多个用逗号分隔"/>
        </el-form-item>
        <el-form-item label="排序权重">
          <el-input-number v-model="policyForm.sortWeight" controls-position="right" :min="0"/>
        </el-form-item>
        <el-form-item label="生效时间">
          <el-date-picker v-model="policyForm.effectiveFrom" type="datetime" placeholder="请选择生效时间"/>
        </el-form-item>
        <el-form-item label="失效时间">
          <el-date-picker v-model="policyForm.effectiveTo" type="datetime" placeholder="请选择失效时间"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitPolicyForm">确 定</el-button>
        <el-button @click="dialogOpen = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getModelPolicy, getModelPolicyDetail, createModelPolicy, deleteModelPolicy } from '@/api/otd/salespolicy'

export default {
  name: 'ModelPolicyList',
  props: {
    saleModelCode: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      modelPolicyList: [],
      dialogOpen: false,
      dialogTitle: '',
      isEdit: false,
      policyForm: {
        saleModelCode: '',
        modelCode: '',
        saleStatus: 'active',
        marketingName: '',
        marketingImage: '',
        marketingCopy: '',
        availableRegions: '',
        channels: '',
        sortWeight: 99,
        effectiveFrom: null,
        effectiveTo: null
      },
      policyRules: {
        modelCode: [
          { required: true, message: '请选择车型', trigger: 'change' }
        ],
        saleStatus: [
          { required: true, message: '请选择销售状态', trigger: 'change' }
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
      getModelPolicy(this.saleModelCode).then(response => {
        const data = response.data || []
        // 显示所有车型列表（包括未配置策略的）
        this.modelPolicyList = data.map(item => ({
          ...item,
          saleStatus: item.inPolicy ? (item.saleStatus || 'active') : '未配置'
        }))
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    handleAddSingle(row) {
        this.dialogTitle = '添加车型销售策略'
      this.isEdit = false
      this.policyForm = {
        saleModelCode: this.saleModelCode,
        modelCode: row.modelCode,
        saleStatus: 'active',
        marketingName: '',
        marketingImage: '',
        marketingCopy: '',
        availableRegions: '',
        channels: '',
        sortWeight: 99,
        effectiveFrom: null,
        effectiveTo: null
      }
      this.dialogOpen = true
    },
    handleUpdate(row) {
      this.dialogTitle = '编辑车型销售策略'
      this.isEdit = true
      // 先设置基本信息，然后调用详情接口获取完整数据
      this.policyForm = {
        saleModelCode: this.saleModelCode,
        modelCode: row.modelCode,
        saleStatus: row.saleStatus || 'active',
        marketingName: '',
        marketingImage: '',
        marketingCopy: '',
        availableRegions: '',
        channels: '',
        sortWeight: 99,
        effectiveFrom: null,
        effectiveTo: null
      }
      this.dialogOpen = true
      // 调用详情接口获取完整策略数据
      getModelPolicyDetail(this.saleModelCode, row.modelCode).then(response => {
        if (response.data) {
          const detail = response.data
          this.policyForm = {
            saleModelCode: this.saleModelCode,
            modelCode: row.modelCode,
            saleStatus: detail.saleStatus || row.saleStatus || 'active',
            marketingName: detail.marketingName || '',
            marketingImage: detail.marketingImage || '',
            marketingCopy: detail.marketingCopy || '',
            availableRegions: Array.isArray(detail.availableRegions) ? detail.availableRegions.join(', ') : (detail.availableRegions || ''),
            channels: Array.isArray(detail.channels) ? detail.channels.join(', ') : (detail.channels || ''),
            sortWeight: detail.sortWeight !== undefined ? detail.sortWeight : 99,
            effectiveFrom: detail.effectiveFrom || null,
            effectiveTo: detail.effectiveTo || null
          }
        }
      }).catch(() => {
        this.$modal.msgError('获取策略详情失败')
      })
    },
    handleDelete(row) {
      this.$modal.confirm('是否确认删除车型[' + row.modelCode + ']的销售策略?').then(() => {
        return deleteModelPolicy(this.saleModelCode, row.modelCode)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    submitPolicyForm() {
      this.$refs['policyForm'].validate(valid => {
        if (valid) {
          const submitData = {
            ...this.policyForm,
            availableRegions: this.policyForm.availableRegions ? this.policyForm.availableRegions.split(',').map(s => s.trim()).filter(s => s) : [],
            channels: this.policyForm.channels ? this.policyForm.channels.split(',').map(s => s.trim()).filter(s => s) : []
          }
          createModelPolicy(this.saleModelCode, submitData).then(() => {
            this.$modal.msgSuccess(this.isEdit ? '修改成功' : '新增成功')
            this.dialogOpen = false
            this.getList()
          })
        }
      })
    }
  }
}
</script>
