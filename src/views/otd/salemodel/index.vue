<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="销售代码" prop="saleModelCode">
        <el-input
          v-model="queryParams.saleModelCode"
          placeholder="请输入销售代码"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="销售车型名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入销售车型名称"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="车系代码" prop="carlineCode">
        <el-input
          v-model="queryParams.carlineCode"
          placeholder="请输入车系代码"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="上下架状态" prop="listingStatus">
        <el-select v-model="queryParams.listingStatus" placeholder="请选择状态" clearable style="width: 120px">
          <el-option label="上架" value="active"/>
          <el-option label="下架" value="off_shelf"/>
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="dateRange"
          style="width: 240px"
          value-format="yyyy-MM-dd"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
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
          v-hasPermi="['otd:saleModel:add']"
        >新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['otd:saleModel:edit']"
        >修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['otd:saleModel:remove']"
        >删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['otd:saleModel:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"/>
    </el-row>

    <el-table v-loading="loading" :data="saleModelList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="销售代码" prop="saleModelCode" width="120"/>
      <el-table-column label="销售车型名称" prop="modelName" show-overflow-tooltip/>
      <el-table-column label="车系代码" prop="carlineCode" width="120"/>
      <el-table-column label="启用意向金" align="center" width="100">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.earnestMoney"
            :active-value="true"
            :inactive-value="false"
            disabled
          />
        </template>
      </el-table-column>
      <el-table-column label="启用定金" align="center" width="100">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.downPayment"
            :active-value="true"
            :inactive-value="false"
            disabled
          />
        </template>
      </el-table-column>
      <el-table-column label="上下架状态" align="center" width="100">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.listingStatus === 'active'" type="success" size="mini">上架</el-tag>
          <el-tag v-else type="info" size="mini">下架</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="排序" prop="sortWeight" align="center" width="60"/>
      <el-table-column label="操作" align="center" width="280" class-name="small-padding fixed-width">
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
            icon="el-icon-setting"
            @click="handleSalesPolicy(scope.row)"
            v-hasPermi="['otd:saleModel:edit']"
          >销售策略
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-refresh"
            @click="handleSyncMdm(scope.row)"
            v-hasPermi="['otd:saleModel:edit']"
          >同步MDM
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['otd:saleModel:remove']"
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

    <SaleModelForm
      :open.sync="openForm"
      :title="formTitle"
      :formData="form"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script>
import { listSaleModel, getSaleModel, delSaleModel, syncMdmData } from '@/api/otd/salemodel'
import SaleModelForm from './components/SaleModelForm.vue'

export default {
  name: 'SaleModel',
  components: {
    SaleModelForm
  },
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      saleModelList: [],
      dateRange: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        saleModelCode: undefined,
        name: undefined,
        carlineCode: undefined,
        listingStatus: undefined
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
      listSaleModel(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.saleModelList = response.data.items
        this.total = response.data.total
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.dateRange = []
      this.resetForm('queryForm')
      this.handleQuery()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    handleAdd() {
      this.form = {}
      this.formTitle = '添加销售车型'
      this.openForm = true
    },
    handleFormSuccess() {
      this.openForm = false
      this.getList()
    },
    handleUpdate(row) {
      const id = row.id || this.ids
      getSaleModel(id).then(response => {
        this.form = response.data
        this.formTitle = '修改销售车型'
        this.openForm = true
      })
    },
    handleSalesPolicy(row) {
      this.$router.push({ path: '/otd/saleConfig/salesPolicy/' + row.saleModelCode })
    },
    handleSyncMdm(row) {
      this.$modal.confirm('是否确认同步MDM数据？这将强制刷新该carlineCode的本地MDM投影').then(() => {
        return syncMdmData(row.saleModelCode)
      }).then(response => {
        this.$modal.msgSuccess('同步成功')
        this.getList()
      }).catch(() => {})
    },
    handleDelete(row) {
      const ids = row.id ? [row.id] : this.ids
      this.$modal.confirm('是否确认删除销售车型ID为"' + ids + '"的数据项？').then(function() {
        return delSaleModel(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    handleExport() {
      this.download('otd-vso/mpt/saleModel/v1/export', {
        ...this.queryParams
      }, `sale_model_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>
