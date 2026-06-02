<template>
  <div>
    <el-alert
      title="说明"
      type="info"
      :closable="false"
      style="margin-bottom: 15px;"
    >
      <template slot="default">
        展示指定版本下 MDM 全部配置。勾选即加入白名单，取消勾选即移除。
        <span style="color: #E6A23C;">空白名单视为 ALL 全开（该版本下全部配置都可售）。</span>
      </template>
    </el-alert>

    <el-row :gutter="10" class="mb8">
      <el-col :span="6">
        <el-select v-model="selectedVariantCode" placeholder="请选择版本" clearable @change="handleVariantChange" size="small">
          <el-option
            v-for="item in variantOptions"
            :key="item.variantCode"
            :label="item.variantCode + ' - ' + item.variantName"
            :value="item.variantCode"
          />
        </el-select>
      </el-col>
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
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-check"
          size="mini"
          :disabled="!hasChanges"
          @click="handleSubmit"
          v-hasPermi="['otd:saleModel:edit']"
        >保存修改
        </el-button>
      </el-col>
    </el-row>

    <el-table
      v-loading="loading"
      :data="configList"
      size="small"
      border
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" :selectable="isSelectable"/>
      <el-table-column label="配置代码" prop="configurationCode" width="160" show-overflow-tooltip/>
      <el-table-column label="指导价" align="center" width="120">
        <template slot-scope="scope">
          <span style="color: #67C23A;">￥{{ scope.row.guidePrice || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="选项" prop="optionCodes" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.optionCodes ? scope.row.optionCodes.join(', ') : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="白名单状态" align="center" width="120">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.inWhitelist" type="success" size="mini">已加入</el-tag>
          <el-tag v-else type="info" size="mini">未加入</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="启用状态" align="center" width="100">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.policyStatus === 'active'" type="success" size="mini">启用</el-tag>
          <el-tag v-else-if="scope.row.inWhitelist" type="danger" size="mini">禁用</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { getAvailableConfigPolicies, createConfigPolicy, deleteConfigPolicy } from '@/api/otd/salespolicy'
import { getVariantPolicy } from '@/api/otd/salespolicy'

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
      configList: [],
      variantOptions: [],
      selectedVariantCode: '',
      selectedConfigs: [],
      originalWhitelist: [],
      hasChanges: false
    }
  },
  created() {
    this.getVariantOptions()
  },
  methods: {
    getVariantOptions() {
      // 获取所有版本选项（从车型策略中获取）
      getVariantPolicy(this.saleModelCode).then(response => {
        this.variantOptions = response.data || []
        if (this.variantOptions.length > 0) {
          this.selectedVariantCode = this.variantOptions[0].variantCode
          this.getList()
        }
      })
    },
    handleVariantChange() {
      this.getList()
    },
    getList() {
      if (!this.selectedVariantCode) {
        this.configList = []
        return
      }
      this.loading = true
      getAvailableConfigPolicies(this.saleModelCode, this.selectedVariantCode).then(response => {
        this.configList = response.data || []
        // 记录原始白名单状态
        this.originalWhitelist = this.configList
          .filter(item => item.inWhitelist)
          .map(item => item.configurationCode)
        this.hasChanges = false
        this.loading = false
      })
    },
    isSelectable(row) {
      return true
    },
    handleSelectionChange(selection) {
      this.selectedConfigs = selection.map(item => item.configurationCode)
      // 检查是否有变更
      const currentWhitelist = selection
        .filter(item => item.inWhitelist)
        .map(item => item.configurationCode)
      this.hasChanges = JSON.stringify(this.selectedConfigs.sort()) !== JSON.stringify(this.originalWhitelist.sort())
    },
    getModelCodeByVariant(variantCode) {
      const variant = this.variantOptions.find(item => item.variantCode === variantCode)
      return variant ? variant.modelCode : ''
    },
    handleSubmit() {
      // 找出需要添加的（选中的但不在原白名单中的）
      const toAdd = this.selectedConfigs.filter(code => !this.originalWhitelist.includes(code))
      // 找出需要删除的（在原白名单中但未选中的）
      const toRemove = this.originalWhitelist.filter(code => !this.selectedConfigs.includes(code))

      const promises = []
      if (toAdd.length > 0) {
        promises.push(createConfigPolicy(this.saleModelCode, { 
          modelCode: this.getModelCodeByVariant(this.selectedVariantCode),
          variantCode: this.selectedVariantCode,
          configurationCodes: toAdd, 
          status: 'active' 
        }))
      }
      if (toRemove.length > 0) {
        toRemove.forEach(code => {
          promises.push(deleteConfigPolicy(this.saleModelCode, this.selectedVariantCode, code))
        })
      }

      if (promises.length === 0) {
        this.$modal.msgInfo('没有变更需要保存')
        return
      }

      Promise.all(promises).then(() => {
        this.$modal.msgSuccess('保存成功')
        this.getList()
      }).catch(() => {
        this.$modal.msgError('保存失败')
      })
    }
  }
}
</script>
