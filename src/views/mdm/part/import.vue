<template>
  <div class="app-container">
    <el-card>
      <div slot="header">
        <span>零件批量导入</span>
      </div>

      <!-- 步骤条 -->
      <el-steps :active="active" finish-status="success">
        <el-step title="上传文件" />
        <el-step title="数据预览" />
        <el-step title="导入结果" />
      </el-steps>

      <!-- 步骤1：上传文件 -->
      <div v-if="active === 0" style="margin-top: 20px;">
        <el-upload
          ref="upload"
          action=""
          :auto-upload="false"
          :on-change="handleFileChange"
          :file-list="fileList"
          accept=".xlsx,.xls"
          :limit="1"
        >
          <el-button slot="trigger" size="small" type="primary">选取文件</el-button>
          <div slot="tip" class="el-upload__tip">只能上传 xlsx/xls 文件，且不超过 10MB</div>
        </el-upload>
        <el-button style="margin-top: 12px;" type="primary" @click="next">下一步</el-button>
      </div>

      <!-- 步骤2：数据预览 -->
      <div v-if="active === 1" style="margin-top: 20px;">
        <el-table :data="previewData" border style="width: 100%">
          <el-table-column prop="code" label="零件编码" width="120" />
          <el-table-column prop="name" label="零件名称" width="150" />
          <el-table-column prop="categoryCode" label="物料分类" width="120" />
          <el-table-column prop="partType" label="零件类型" width="100" />
          <el-table-column prop="isSoftware" label="是否软件" width="80" />
          <el-table-column prop="isAssembly" label="是否总成件" width="100" />
        </el-table>
        <div style="margin-top: 12px;">
          <el-button @click="prev">上一步</el-button>
          <el-button type="primary" @click="handleImport">开始导入</el-button>
        </div>
      </div>

      <!-- 步骤3：导入结果 -->
      <div v-if="active === 2" style="margin-top: 20px;">
        <el-result
          :icon="importResult.success ? 'success' : 'error'"
          :title="importResult.success ? '导入成功' : '导入失败'"
          :sub-title="importResult.message"
        >
          <template slot="extra">
            <el-button type="primary" size="medium" @click="resetForm">继续导入</el-button>
            <el-button size="medium" @click="goBack">返回列表</el-button>
          </template>
        </el-result>
      </div>
    </el-card>
  </div>
</template>

<script>
import { importPart } from '@/api/mdm/part'
import * as XLSX from 'xlsx'

export default {
  name: 'PartImport',
  data() {
    return {
      active: 0,
      fileList: [],
      previewData: [],
      importResult: {
        success: false,
        message: ''
      }
    }
  },
  methods: {
    handleFileChange(file) {
      this.fileList = [file]
      this.parseExcel(file.raw)
    },
    parseExcel(file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)
          this.previewData = jsonData.map(row => ({
            code: row['零件编码'] || row['code'] || '',
            name: row['零件名称'] || row['name'] || '',
            categoryCode: row['物料分类'] || row['categoryCode'] || '',
            partType: row['零件类型'] || row['partType'] || '',
            isSoftware: row['是否软件'] === '是' || row['isSoftware'] === true || false,
            isAssembly: row['是否总成件'] === '是' || row['isAssembly'] === true || false
          }))
        } catch (error) {
          this.$modal.msgError('文件解析失败，请检查文件格式')
        }
      }
      reader.readAsArrayBuffer(file)
    },
    next() {
      if (this.active === 0 && this.previewData.length === 0) {
        this.$modal.msgWarning('请先上传文件')
        return
      }
      if (this.active++ > 2) this.active = 0
    },
    prev() {
      if (this.active-- < 0) this.active = 0
    },
    handleImport() {
      if (this.previewData.length === 0) {
        this.$modal.msgWarning('没有可导入的数据')
        return
      }

      this.$modal.confirm('确认导入 ' + this.previewData.length + ' 条数据？').then(() => {
        const importData = this.previewData.map(row => ({
          ...row,
          operator: this.$store.state.user.name
        }))

        return importPart(importData)
      }).then(response => {
        this.importResult = {
          success: true,
          message: '成功导入 ' + this.previewData.length + ' 条数据'
        }
        this.active = 2
      }).catch(error => {
        this.importResult = {
          success: false,
          message: error.message || '导入失败，请重试'
        }
        this.active = 2
      })
    },
    resetForm() {
      this.active = 0
      this.fileList = []
      this.previewData = []
      this.importResult = {
        success: false,
        message: ''
      }
    },
    goBack() {
      this.$router.push('/mdm/part')
    }
  }
}
</script>

<style scoped>
.el-steps {
  margin-bottom: 20px;
}
</style>
