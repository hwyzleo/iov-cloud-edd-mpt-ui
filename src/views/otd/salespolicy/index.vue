<template>
  <div class="app-container">
    <el-card shadow="never">
      <div slot="header" class="clearfix">
        <span>销售策略管理 - {{ saleModelCode }}</span>
        <el-button style="float: right; padding: 3px 0" type="text" @click="goBack">返回列表</el-button>
      </div>

      <el-descriptions :column="3" border size="small" style="margin-bottom: 20px;">
        <el-descriptions-item label="销售代码">{{ saleModelInfo.saleModelCode }}</el-descriptions-item>
        <el-descriptions-item label="销售车型名称">{{ saleModelInfo.name }}</el-descriptions-item>
        <el-descriptions-item label="Variant代码">{{ saleModelInfo.variantCode }}</el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="Configuration白名单" name="configPolicy">
          <ConfigPolicyList :saleModelCode="saleModelCode"/>
        </el-tab-pane>
        <el-tab-pane label="OptionCode销售策略" name="optionPolicy">
          <OptionPolicyList :saleModelCode="saleModelCode"/>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { getSaleModel } from '@/api/otd/salemodel'
import ConfigPolicyList from './components/ConfigPolicyList.vue'
import OptionPolicyList from './components/OptionPolicyList.vue'

export default {
  name: 'SalesPolicy',
  components: {
    ConfigPolicyList,
    OptionPolicyList
  },
  data() {
    return {
      saleModelCode: '',
      saleModelInfo: {},
      activeTab: 'configPolicy'
    }
  },
  created() {
    this.saleModelCode = this.$route.params.saleModelCode
    this.getSaleModelInfo()
  },
  methods: {
    getSaleModelInfo() {
      // 根据saleModelCode获取销售车型信息
      // 这里需要调用后端API获取销售车型详情
      // 暂时使用模拟数据
      this.saleModelInfo = {
        saleModelCode: this.saleModelCode,
        name: '销售车型名称',
        variantCode: 'VARIANT001'
      }
    },
    goBack() {
      this.$router.push({ path: '/otd/salemodel' })
    }
  }
}
</script>
