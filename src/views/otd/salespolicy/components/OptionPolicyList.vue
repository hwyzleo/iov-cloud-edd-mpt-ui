<template>
  <div>
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
    </el-row>

    <el-tabs v-model="activeView" type="border-card">
      <!-- 可用 OptionCode 列表（按 OptionFamily 分组） -->
      <el-tab-pane label="可选选项值" name="available">
        <el-alert
          title="说明"
          type="info"
          :closable="false"
          style="margin-bottom: 15px;"
        >
          <template slot="default">
            展示指定版本下 MDM 全部选项值（按选项族分组）。
            <span style="color: #E6A23C;">点击选项值可添加或编辑销售策略。</span>
          </template>
        </el-alert>

        <div v-loading="loadingAvailable" style="max-height: 600px; overflow-y: auto;">
          <el-empty v-if="!availableFamilies || availableFamilies.length === 0" description="暂无可用选项值" :image-size="80"/>

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
                  <el-tag type="success" size="small" style="margin-right: 8px;">选项族</el-tag>
                  <span style="font-weight: 500; font-size: 14px;">{{ family.optionFamilyCode }}</span>
                </el-col>
                <el-col :span="12">
                  <span style="color: #606266;">{{ family.optionFamilyName }}</span>
                </el-col>
                <el-col :span="4" style="text-align: right;">
                  <el-button
                    size="mini"
                    type="text"
                    icon="el-icon-edit"
                    @click.stop="handleEditFamilyMarketing(family)"
                    v-hasPermi="['otd:saleModel:edit']"
                  >编辑营销
                  </el-button>
                  <el-button
                    v-if="hasFamilyMarketing(family.optionFamilyCode)"
                    size="mini"
                    type="text"
                    icon="el-icon-delete"
                    @click.stop="handleDeleteFamilyMarketing(family)"
                    v-hasPermi="['otd:saleModel:edit']"
                  >删除营销
                  </el-button>
                </el-col>
              </el-row>
              <div v-if="hasFamilyMarketing(family.optionFamilyCode)" class="family-marketing-info">
                <el-descriptions :column="3" size="mini" style="margin-top: 8px;">
                  <el-descriptions-item label="营销标题">{{ getFamilyMarketingTitle(family.optionFamilyCode) || '-' }}</el-descriptions-item>
                  <el-descriptions-item label="排序权重">{{ getFamilyMarketingSortWeight(family.optionFamilyCode) }}</el-descriptions-item>
                  <el-descriptions-item label="生效时间">{{ getFamilyMarketingEffectiveFrom(family.optionFamilyCode) || '-' }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </div>

            <el-table
              :data="family.options"
              size="small"
              border
              style="width: 100%"
            >
              <el-table-column label="选项值代码" prop="optionCode" width="160" show-overflow-tooltip/>
              <el-table-column label="选项值名称" prop="optionName" show-overflow-tooltip/>
              <el-table-column label="营销标题" prop="marketingTitle" width="150" show-overflow-tooltip/>
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
          <el-table-column label="选项值代码" prop="optionCode" width="160" show-overflow-tooltip/>
          <el-table-column label="选项族代码" prop="optionFamilyCode" width="160" show-overflow-tooltip/>
          <el-table-column label="营销标题" prop="marketingTitle" width="150" show-overflow-tooltip/>
          <el-table-column label="销售状态" align="center" width="120">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.saleStatus === 'active'" type="success" size="mini">上架</el-tag>
              <el-tag v-else-if="scope.row.saleStatus === 'off_shelf'" type="info" size="mini">下架</el-tag>
              <el-tag v-else type="warning" size="mini">即将上市</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="选项值价格" align="center" width="120">
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
      :variantCode="selectedVariantCode"
      :modelCode="getModelCodeByVariant(selectedVariantCode)"
      @success="handleFormSuccess"
    />

    <!-- OptionFamily 营销表单 -->
    <OptionFamilyMarketingForm
      :open.sync="openFamilyForm"
      :title="familyFormTitle"
      :formData="familyForm"
      :saleModelCode="saleModelCode"
      @success="handleFamilyFormSuccess"
    />
  </div>
</template>

<script>
import { getAvailableOptionPolicies, getOptionPolicy, getOptionPolicyDetail, deleteOptionPolicy } from '@/api/otd/salespolicy'
import { getVariantPolicy } from '@/api/otd/salespolicy'
import { getOptionFamilyPolicyList, deleteOptionFamilyPolicy } from '@/api/otd/optionFamilyPolicy'
import OptionPolicyForm from './OptionPolicyForm.vue'
import OptionFamilyMarketingForm from './OptionFamilyMarketingForm.vue'

export default {
  name: 'OptionPolicyList',
  components: {
    OptionPolicyForm,
    OptionFamilyMarketingForm
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
      variantOptions: [],
      selectedVariantCode: '',
      total: 0,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        optionFamilyCode: undefined,
        saleStatus: undefined
      },
      openForm: false,
      formTitle: '',
      form: {},
      familyMarketingList: [],
      openFamilyForm: false,
      familyFormTitle: '',
      familyForm: {}
    }
  },
  created() {
    this.getVariantOptions()
  },
  methods: {
    getVariantOptions() {
      getVariantPolicy(this.saleModelCode).then(response => {
        this.variantOptions = response.data || []
        if (this.variantOptions.length > 0) {
          this.selectedVariantCode = this.variantOptions[0].variantCode
          this.getAvailableList()
          this.getConfiguredList()
          this.getFamilyMarketingList()
        }
      })
    },
    handleVariantChange() {
      this.getAvailableList()
      this.getConfiguredList()
    },
    getModelCodeByVariant(variantCode) {
      const variant = this.variantOptions.find(item => item.variantCode === variantCode)
      return variant ? variant.modelCode : ''
    },
    getAvailableList() {
      if (!this.selectedVariantCode) {
        this.availableFamilies = []
        return
      }
      this.loadingAvailable = true
      getAvailableOptionPolicies(this.saleModelCode, this.selectedVariantCode).then(response => {
        this.availableFamilies = response.data || []
        this.loadingAvailable = false
      })
    },
    getConfiguredList() {
      if (!this.selectedVariantCode) {
        this.optionPolicyList = []
        return
      }
      this.loadingConfigured = true
      getOptionPolicy(this.saleModelCode, { ...this.queryParams, variantCode: this.selectedVariantCode }).then(response => {
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
      this.formTitle = option.inPolicy ? '编辑销售策略' : '添加销售策略'
      // 先设置基本信息
      this.form = {
        id: option.id,
        optionCode: option.optionCode,
        optionFamilyCode: family.optionFamilyCode,
        saleStatus: option.saleStatus || 'active',
        optionPrice: option.optionPrice || 0,
        availableRegions: '',
        channels: '',
        bundleWith: '',
        mutexWith: '',
        marketingTitle: '',
        marketingImage: '',
        sortWeight: 0,
        effectiveFrom: null,
        effectiveTo: null
      }
      this.openForm = true
      // 如果已有策略，调用详情接口获取完整数据
      if (option.inPolicy && option.id) {
        getOptionPolicyDetail(this.saleModelCode, option.id).then(response => {
          if (response.data) {
            const detail = response.data
            this.form = {
              id: detail.id,
              optionCode: detail.optionCode,
              optionFamilyCode: detail.optionFamilyCode,
              saleStatus: detail.saleStatus || 'active',
              optionPrice: detail.optionPrice || 0,
              availableRegions: Array.isArray(detail.availableRegions) ? detail.availableRegions.join(', ') : (detail.availableRegions || ''),
              channels: Array.isArray(detail.channels) ? detail.channels.join(', ') : (detail.channels || ''),
              bundleWith: Array.isArray(detail.bundleWith) ? detail.bundleWith.join(', ') : (detail.bundleWith || ''),
              mutexWith: Array.isArray(detail.mutexWith) ? detail.mutexWith.join(', ') : (detail.mutexWith || ''),
              marketingTitle: detail.marketingTitle || '',
              marketingImage: detail.marketingImage || '',
              sortWeight: detail.sortWeight !== undefined ? detail.sortWeight : 0,
              effectiveFrom: detail.effectiveFrom || null,
              effectiveTo: detail.effectiveTo || null
            }
          }
        }).catch(() => {
          this.$modal.msgError('获取策略详情失败')
        })
      }
    },
    handleUpdate(row) {
      this.formTitle = '修改销售策略'
      // 先设置基本信息
      this.form = {
        id: row.id,
        optionCode: row.optionCode,
        optionFamilyCode: row.optionFamilyCode,
        saleStatus: row.saleStatus || 'active',
        optionPrice: row.optionPrice || 0,
        availableRegions: '',
        channels: '',
        bundleWith: '',
        mutexWith: '',
        marketingTitle: '',
        marketingImage: '',
        sortWeight: 0,
        effectiveFrom: null,
        effectiveTo: null
      }
      this.openForm = true
      // 调用详情接口获取完整数据
      getOptionPolicyDetail(this.saleModelCode, row.id).then(response => {
        if (response.data) {
          const detail = response.data
          this.form = {
            id: detail.id,
            optionCode: detail.optionCode,
            optionFamilyCode: detail.optionFamilyCode,
            saleStatus: detail.saleStatus || 'active',
            optionPrice: detail.optionPrice || 0,
            availableRegions: Array.isArray(detail.availableRegions) ? detail.availableRegions.join(', ') : (detail.availableRegions || ''),
            channels: Array.isArray(detail.channels) ? detail.channels.join(', ') : (detail.channels || ''),
            bundleWith: Array.isArray(detail.bundleWith) ? detail.bundleWith.join(', ') : (detail.bundleWith || ''),
            mutexWith: Array.isArray(detail.mutexWith) ? detail.mutexWith.join(', ') : (detail.mutexWith || ''),
            marketingTitle: detail.marketingTitle || '',
            marketingImage: detail.marketingImage || '',
            sortWeight: detail.sortWeight !== undefined ? detail.sortWeight : 0,
            effectiveFrom: detail.effectiveFrom || null,
            effectiveTo: detail.effectiveTo || null
          }
        }
      }).catch(() => {
        this.$modal.msgError('获取策略详情失败')
      })
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
    },
    getFamilyMarketingList() {
      getOptionFamilyPolicyList(this.saleModelCode).then(response => {
        this.familyMarketingList = response.data || []
      })
    },
    hasFamilyMarketing(optionFamilyCode) {
      return this.familyMarketingList.some(item => item.optionFamilyCode === optionFamilyCode)
    },
    getFamilyMarketingData(optionFamilyCode) {
      return this.familyMarketingList.find(item => item.optionFamilyCode === optionFamilyCode) || {}
    },
    getFamilyMarketingTitle(optionFamilyCode) {
      const data = this.getFamilyMarketingData(optionFamilyCode)
      return data.marketingTitle
    },
    getFamilyMarketingSortWeight(optionFamilyCode) {
      const data = this.getFamilyMarketingData(optionFamilyCode)
      return data.sortWeight || 0
    },
    getFamilyMarketingEffectiveFrom(optionFamilyCode) {
      const data = this.getFamilyMarketingData(optionFamilyCode)
      return data.effectiveFrom
    },
    handleEditFamilyMarketing(family) {
      const existingData = this.getFamilyMarketingData(family.optionFamilyCode)
      this.familyForm = {
        ...existingData,
        optionFamilyCode: family.optionFamilyCode
      }
      this.familyFormTitle = this.hasFamilyMarketing(family.optionFamilyCode) ? '编辑选项族营销' : '添加选项族营销'
      this.openFamilyForm = true
    },
    handleDeleteFamilyMarketing(family) {
      this.$confirm('是否确认删除选项族"' + family.optionFamilyCode + '"的营销信息？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deleteOptionFamilyPolicy(this.saleModelCode, family.optionFamilyCode)
      }).then(() => {
        this.$modal.msgSuccess('删除成功')
        this.getFamilyMarketingList()
      }).catch(() => {})
    },
    handleFamilyFormSuccess() {
      this.openFamilyForm = false
      this.getFamilyMarketingList()
    }
  }
}
</script>

<style scoped>
.family-header {
  padding: 0;
}
.family-marketing-info {
  background-color: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  margin-top: 8px;
}
</style>
