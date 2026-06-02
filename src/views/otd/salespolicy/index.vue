<template>
  <div class="app-container">
    <el-card shadow="never">
      <div slot="header" class="clearfix">
        <span>销售策略管理 - {{ saleModelCode }}</span>
        <el-button style="float: right; padding: 3px 0" type="text" @click="goBack">返回列表</el-button>
      </div>

      <el-descriptions :column="3" border size="small" style="margin-bottom: 20px;">
        <el-descriptions-item label="销售代码">{{ saleModelInfo.saleModelCode }}</el-descriptions-item>
        <el-descriptions-item label="销售车型名称">{{ saleModelInfo.modelName }}</el-descriptions-item>
        <el-descriptions-item label="车系代码">{{ saleModelInfo.carlineCode }}</el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="车型销售策略" name="modelPolicy">
          <ModelPolicyList :saleModelCode="saleModelCode"/>
        </el-tab-pane>
        <el-tab-pane label="版本销售策略" name="variantPolicy">
          <VariantPolicyList :saleModelCode="saleModelCode"/>
        </el-tab-pane>
        <el-tab-pane label="配置白名单" name="configPolicy">
          <ConfigPolicyList :saleModelCode="saleModelCode"/>
        </el-tab-pane>
        <el-tab-pane label="选项销售策略" name="optionPolicy">
          <OptionPolicyList :saleModelCode="saleModelCode"/>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { getSaleModelByCode } from '@/api/otd/salemodel'
import ModelPolicyList from './components/ModelPolicyList.vue'
import VariantPolicyList from './components/VariantPolicyList.vue'
import ConfigPolicyList from './components/ConfigPolicyList.vue'
import OptionPolicyList from './components/OptionPolicyList.vue'

export default {
  name: 'SalesPolicy',
  components: {
    ModelPolicyList,
    VariantPolicyList,
    ConfigPolicyList,
    OptionPolicyList
  },
  data() {
    return {
      saleModelCode: '',
      saleModelInfo: {},
      activeTab: 'modelPolicy'
    }
  },
  created() {
    this.saleModelCode = this.$route.params.saleModelCode
    this.getSaleModelInfo()
  },
  methods: {
    getSaleModelInfo() {
      getSaleModelByCode(this.saleModelCode).then(response => {
        this.saleModelInfo = response.data
      })
    },
    goBack() {
      this.$router.push({ path: '/otd/salemodel' })
    }
  }
}
</script>
