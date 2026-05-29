<template>
  <div>
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true">
      <el-form-item label="选项族代码" prop="optionFamilyCode">
        <el-input
          v-model="queryParams.optionFamilyCode"
          placeholder="请输入选项族代码"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="销售状态" prop="saleStatus">
        <el-select v-model="queryParams.saleStatus" placeholder="请选择状态" clearable style="width: 120px">
          <el-option label="上架" value="active"/>
          <el-option label="下架" value="off_shelf"/>
          <el-option label="即将上市" value="coming_soon"/>
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
          v-hasPermi="['otd:saleModel:edit']"
        >添加销售策略
        </el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="optionPolicyList" size="small" border style="width: 100%">
      <el-table-column label="选项代码" prop="optionCode" width="120" show-overflow-tooltip/>
      <el-table-column label="选项名称" prop="optionName" show-overflow-tooltip/>
      <el-table-column label="选项族代码" prop="optionFamilyCode" width="120" show-overflow-tooltip/>
      <el-table-column label="销售状态" align="center" width="100">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.saleStatus === 'active'" type="success" size="mini">上架</el-tag>
          <el-tag v-else-if="scope.row.saleStatus === 'off_shelf'" type="info" size="mini">下架</el-tag>
          <el-tag v-else type="warning" size="mini">即将上市</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="选项价格" align="center" width="100">
        <template slot-scope="scope">
          <span style="color: #67C23A;">￥{{ scope.row.optionPrice || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="可售区域" prop="availableRegions" show-overflow-tooltip/>
      <el-table-column label="销售渠道" prop="channels" show-overflow-tooltip/>
      <el-table-column label="生效时间" width="160">
        <template slot-scope="scope">
          <span>{{ scope.row.effectiveFrom }}</span>
        </template>
      </el-table-column>
      <el-table-column label="失效时间" width="160">
        <template slot-scope="scope">
          <span>{{ scope.row.effectiveTo }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['otd:saleModel:edit']"
          >修改
          </el-button>
          <el-button
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

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <OptionPolicyForm
      :open.sync="openForm"
      :title="formTitle"
      :formData="form"
      :saleModelCode="saleModelCode"
      @success="getList"
    />
  </div>
</template>

<script>
import { getOptionPolicy, deleteOptionPolicy } from '@/api/otd/salespolicy'
import OptionPolicyForm from './OptionPolicyForm.vue'

export default {
  name: 'OptionPolicyList',
  components: {
    OptionPolicyForm
  },
  props: {
    saleModelCode: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      optionPolicyList: [],
      total: 0,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        optionFamilyCode: undefined,
        saleStatus: undefined
      },
      openForm: false,
      formTitle: '',
      form: {}
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      getOptionPolicy(this.saleModelCode, this.queryParams).then(response => {
        this.optionPolicyList = response.data.items || []
        this.total = response.data.total || 0
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    handleAdd() {
      this.form = {}
      this.formTitle = '添加销售策略'
      this.openForm = true
    },
    handleUpdate(row) {
      this.form = { ...row }
      this.formTitle = '修改销售策略'
      this.openForm = true
    },
    handleDelete(row) {
      this.$confirm('是否确认删除选项代码"' + row.optionCode + '"的销售策略？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deleteOptionPolicy(this.saleModelCode, row.id)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    }
  }
}
</script>
