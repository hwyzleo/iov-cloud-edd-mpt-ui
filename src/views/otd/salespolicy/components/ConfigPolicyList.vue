<template>
  <div>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['otd:saleModel:edit']"
        >添加Configuration
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-upload2"
          size="mini"
          @click="handleImport"
          v-hasPermi="['otd:saleModel:edit']"
        >批量导入
        </el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="configPolicyList" size="small" border style="width: 100%">
      <el-table-column label="配置代码" prop="configurationCode" width="160" show-overflow-tooltip/>
      <el-table-column label="配置名称" prop="configurationName" show-overflow-tooltip/>
      <el-table-column label="状态" align="center" width="100">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.status === 'active'" type="success" size="mini">启用</el-tag>
          <el-tag v-else type="info" size="mini">禁用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="影响订单数" align="center" width="100">
        <template slot-scope="scope">
          <span>{{ scope.row.affectedOrderCount || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template slot-scope="scope">
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

    <!-- 添加Configuration对话框 -->
    <el-dialog title="添加Configuration" :visible.sync="openAdd" width="500px" append-to-body>
      <el-form ref="addForm" :model="addForm" :rules="addRules" label-width="100px">
        <el-form-item label="Configuration" prop="configurationCodes">
          <el-select
            v-model="addForm.configurationCodes"
            multiple
            filterable
            remote
            reserve-keyword
            placeholder="请输入Configuration代码"
            :remote-method="searchConfiguration"
            :loading="searchLoading"
            style="width: 100%"
          >
            <el-option
              v-for="item in configurationOptions"
              :key="item.configurationCode"
              :label="item.configurationCode + ' - ' + item.configurationName"
              :value="item.configurationCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="addForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitAdd">确 定</el-button>
        <el-button @click="openAdd = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog title="批量导入Configuration白名单" :visible.sync="openImport" width="500px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="上传文件">
          <el-upload
            ref="upload"
            :limit="1"
            accept=".csv"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-exceed="handleExceed"
            :file-list="fileList"
          >
            <el-button slot="trigger" size="small" type="primary">选取文件</el-button>
            <div slot="tip" class="el-upload__tip">只能上传csv文件，且不超过500行</div>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-button type="text" @click="downloadTemplate">下载模板</el-button>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitImport">确 定</el-button>
        <el-button @click="openImport = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getConfigPolicy, createConfigPolicy, deleteConfigPolicy, importConfigPolicy } from '@/api/otd/salespolicy'

export default {
  name: 'ConfigPolicyList',
  props: {
    saleModelCode: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      configPolicyList: [],
      openAdd: false,
      openImport: false,
      searchLoading: false,
      configurationOptions: [],
      addForm: {
        configurationCodes: [],
        status: 'active'
      },
      addRules: {
        configurationCodes: [
          { required: true, message: '请选择Configuration', trigger: 'change', type: 'array' }
        ]
      },
      fileList: []
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      getConfigPolicy(this.saleModelCode).then(response => {
        this.configPolicyList = response.data || []
        this.loading = false
      })
    },
    handleAdd() {
      this.addForm = {
        configurationCodes: [],
        status: 'active'
      }
      this.configurationOptions = []
      this.openAdd = true
    },
    searchConfiguration(query) {
      if (query) {
        this.searchLoading = true
        // 调用后端API搜索Configuration
        // 这里需要根据实际情况实现
        setTimeout(() => {
          this.searchLoading = false
        }, 500)
      }
    },
    submitAdd() {
      this.$refs['addForm'].validate(valid => {
        if (valid) {
          createConfigPolicy(this.saleModelCode, this.addForm).then(response => {
            this.$modal.msgSuccess('添加成功')
            this.openAdd = false
            this.getList()
          })
        }
      })
    },
    handleDelete(row) {
      this.$confirm('是否确认删除Configuration"' + row.configurationCode + '"？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deleteConfigPolicy(this.saleModelCode, row.configurationCode)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    handleImport() {
      this.fileList = []
      this.openImport = true
    },
    handleFileChange(file) {
      this.fileList = [file]
    },
    handleExceed() {
      this.$modal.msgWarning('只能上传一个文件')
    },
    submitImport() {
      if (this.fileList.length === 0) {
        this.$modal.msgWarning('请选择文件')
        return
      }
      importConfigPolicy(this.saleModelCode, this.fileList[0].raw).then(response => {
        this.$modal.msgSuccess('导入成功')
        this.openImport = false
        this.getList()
      })
    },
    downloadTemplate() {
      // 下载导入模板
      const csvContent = 'configurationCode,status\nCONFIG001,active\nCONFIG002,active'
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'config_policy_template.csv'
      link.click()
      window.URL.revokeObjectURL(url)
    }
  }
}
</script>
