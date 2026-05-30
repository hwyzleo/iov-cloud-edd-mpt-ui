<template>
  <div>
    <el-tabs v-model="activeView" type="border-card">
      <!-- 可用 OptionCode 列表（按 OptionFamily 分组） -->
      <el-tab-pane label="可选 OptionCode" name="available">
        <el-alert
          title="说明"
          type="info"
          :closable="false"
          style="margin-bottom: 15px;"
        >
          <template slot="default">
            展示该 Variant 下 MDM 全部 OptionCode（按 OptionFamily 分组）。
            <span style="color: #E6A23C;">点击 OptionCode 可添加或编辑销售策略。</span>
          </template>
        </el-alert>

        <div v-loading="loadingAvailable" style="max-height: 600px; overflow-y: auto;">
          <el-empty v-if="!availableFamilies || availableFamilies.length === 0" description="暂无可用 OptionCode" :image-size="80"/>

          <el-card
            v-for="family in availableFamilies"
            :key="family.optionFamilyCode"
            shadow="hover"
            style="margin-bottom: 15px;"
            :body-style="{ padding: '15px' }"
          >
            <div slot="header" class="family-header">
              <el-row type="flex" align="middle">
                <el-col :span="8">
                  <el-tag type="success" size="small" style="margin-right: 8px;">OptionFamily</el-tag>
                  <span style="font-weight: 500; font-size: 14px;">{{ family.optionFamilyCode }}</span>
                </el-col>
                <el-col :span="16">
                  <span style="color: #606266;">{{ family.optionFamilyName }}</span>
                </el-col>
              </el-row>
            </div>

            <el-table
              :data="family.options"
              size="small"
              border
              style="width: 100%"
            >
              <el-table-column label="Option Code" prop="optionCode" width="160" show-overflow-tooltip/>
              <el-table-column label="Option Name" prop="optionName" show-overflow-tooltip/>
              <el-table-column label="策略状态" align="center" width="120">
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.inPolicy && scope.row.saleStatus === 'active'" type="success" size="mini">已上架</el-tag>
                  <el-tag v-else-if="scope.row.inPolicy && scope.row.saleStatus === 'off_shelf'" type="info" size="mini">已下架</el-tag>
                  <el-tag v-else-if="scope.row.inPolicy && scope.row.saleStatus === 'coming_soon'" type="warning" size="mini">即将上市</el-tag>
                  <el-tag v-else type="info" size="mini">未配置</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="价格" align="center" width="120">
                <template slot-scope="scope">
                  <span v-if="scope.row.optionPrice" style="color: #67C23A;">￥{{ scope.row.optionPrice }}</span>
                  <span v-else style="color: #909399;">-</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" width="120">
                <template slot-scope="scope">
                  <el-button
                    size="mini"
                    type="text"
                    icon="el-icon-edit"
                    @click="handleEditOption(family, scope.row)"
                    v-hasPermi="['otd:saleModel:edit']"
                  >{{ scope.row.inPolicy ? '编辑' : '添加' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 已配置的销售策略列表 -->
      <el-tab-pane label="已配置策略" name="configured">
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

        <el-table v-loading="loadingConfigured" :data="optionPolicyList" size="small" border style="width: 100%">
          <el-table-column label="选项代码" prop="optionCode" width="160" show-overflow-tooltip/>
          <el-table-column label="选项族代码" prop="optionFamilyCode" width="160" show-overflow-tooltip/>
          <el-table-column label="销售状态" align="center" width="120">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.saleStatus === 'active'" type="success" size="mini">上架</el-tag>
              <el-tag v-else-if="scope.row.saleStatus === 'off_shelf'" type="info" size="mini">下架</el-tag>
              <el-tag v-else type="warning" size="mini">即将上市</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="选项价格" align="center" width="120">
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
          @pagination="getConfiguredList"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- OptionCode 策略表单 -->
    <OptionPolicyForm
      :open.sync="openForm"
      :title="formTitle"
      :formData="form"
      :saleModelCode="saleModelCode"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script>
import { getAvailableOptionPolicies, getOptionPolicy, deleteOptionPolicy } from '@/api/otd/salespolicy'
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
      activeView: 'available',
      loadingAvailable: false,
      loadingConfigured: false,
      availableFamilies: [],
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
    this.getAvailableList()
    this.getConfiguredList()
  },
  methods: {
    getAvailableList() {
      this.loadingAvailable = true
      getAvailableOptionPolicies(this.saleModelCode).then(response => {
        this.availableFamilies = response.data || []
        this.loadingAvailable = false
      })
    },
    getConfiguredList() {
      this.loadingConfigured = true
      getOptionPolicy(this.saleModelCode, this.queryParams).then(response => {
        this.optionPolicyList = response.data.items || []
        this.total = response.data.total || 0
        this.loadingConfigured = false
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getConfiguredList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    handleEditOption(family, option) {
      this.form = {
        optionCode: option.optionCode,
        optionFamilyCode: family.optionFamilyCode,
        saleStatus: option.saleStatus || 'active',
        optionPrice: option.optionPrice || 0
      }
      if (option.inPolicy) {
        // 如果已有策略，需要获取完整信息
        // 这里简单处理，让用户在表单中修改
        this.formTitle = '编辑销售策略'
      } else {
        this.formTitle = '添加销售策略'
      }
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
        this.$modal.msgSuccess('删除成功')
        this.handleFormSuccess()
      }).catch(() => {})
    },
    handleFormSuccess() {
      this.openForm = false
      this.getAvailableList()
      this.getConfiguredList()
    }
  }
}
</script>

<style scoped>
.family-header {
  padding: 0;
}
</style>
