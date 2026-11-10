<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="订单号" prop="orderNo">
        <el-input
          v-model="queryParams.orderNo"
          placeholder="请输入订单号"
          clearable
          style="width: 160px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="订单状态" prop="orderState">
        <el-select
          v-model="queryParams.orderState"
          placeholder="订单状态"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="dict in dict.type.iov_vehicle_sale_order_state"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!-- 后端按 created_at_business（下单时间）过滤 -->
      <el-form-item label="下单时间">
        <el-date-picker
          v-model="dateRange"
          style="width: 240px"
          value-format="yyyy-MM-dd"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="orderChangeConfigList">
      <el-table-column label="订单号" prop="orderNo" fixed="left" width="170"/>
      <el-table-column label="订单状态" align="center" width="150">
        <template slot-scope="scope">
          <el-tooltip :content="'状态时间：' + timeText(scope.row.orderStateTime)" placement="top">
            <span>{{ getVehicleSaleOrderStateLabel(scope.row.orderState) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="车型配置代码" align="center" width="200">
        <template slot-scope="scope">
          <el-link
            type="primary"
            @click="openModelConfigTab(scope.row.modelConfigCode || scope.row.configurationCode)"
          >{{ dash(scope.row.modelConfigCode || scope.row.configurationCode) }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="销售车型" align="center" width="150">
        <template slot-scope="scope">
          <el-link
            type="primary"
            @click="openSaleModelTab(scope.row.saleModel)"
          >{{ dash(scope.row.saleModelName || scope.row.saleModel) }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="上牌城市" align="center" width="130">
        <template slot-scope="scope">
          <span>{{ dash(scope.row.licenseCity) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="交付门店" prop="deliveryStoreName" width="180">
        <template slot-scope="scope">
          <span>{{ dash(scope.row.deliveryStoreName) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="锁单时间" align="center" prop="lockTime" width="160">
        <template slot-scope="scope">
          <span>{{ timeText(scope.row.lockTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="170" align="center" fixed="right" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleModify(scope.row)"
            v-if="canModify(scope.row)"
            v-hasPermi="['completeVehicle:order:changeModel:edit']"
          >改配
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleDetail(scope.row)"
            v-hasPermi="['completeVehicle:order:changeModel:list']"
          >查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 订单改配 -->
    <el-dialog title="订单改配" :visible.sync="modify.visible" width="780px" append-to-body>
      <div v-loading="modify.loading">
        <el-form label-width="120px" size="small">
          <el-form-item label="订单号">
            <span>{{ modify.orderNo }}</span>
            <span class="form-tip">当前配置：{{ dash(modify.currentConfigCode) }}</span>
          </el-form-item>
          <el-form-item label="当前总价">
            <span>{{ moneyText(modify.currentTotal) }}</span>
          </el-form-item>
          <el-form-item label="目标车型版本" required>
            <el-select
              v-model="modify.variantCode"
              placeholder="请选择目标版本"
              style="width: 100%"
              @change="handleVariantChange"
            >
              <el-option
                v-for="variant in variantList"
                :key="variant.variantCode"
                :label="variantLabel(variant)"
                :value="variant.variantCode"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="选装配置" required>
            <div v-loading="modify.loadingOptions" class="option-wrapper">
              <el-empty v-if="!optionFamilies.length" description="当前版本无可选装配置" :image-size="60"/>
              <div v-for="family in optionFamilies" :key="family.optionFamilyCode" class="option-family">
                <div class="option-family-title">{{ family.optionFamilyName || family.optionFamilyCode }}</div>
                <el-checkbox-group v-model="modify.optionCodes">
                  <el-checkbox
                    v-for="option in family.options || []"
                    :key="option.optionCode"
                    :label="option.optionCode"
                  >
                    {{ option.optionName || option.optionCode }}
                    <span v-if="option.optionPrice !== null && option.optionPrice !== undefined" class="option-price">
                      ￥{{ option.optionPrice }}
                    </span>
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="预计新总价">
            <span>{{ moneyText(newTotal) }}</span>
            <span class="form-tip" :class="diffClass">{{ diffText }}</span>
          </el-form-item>
          <el-form-item label="改配原因">
            <el-input
              v-model="modify.reason"
              type="textarea"
              :rows="3"
              maxlength="256"
              show-word-limit
              placeholder="选填，最多 256 字"
            />
          </el-form-item>
        </el-form>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="modify.visible = false">取 消</el-button>
        <el-button size="small" type="primary" :loading="modify.submitting" @click="submitModify">提交改配</el-button>
      </div>
    </el-dialog>

    <order-detail-drawer :order-id="detailOrderId" :visible.sync="detailVisible"/>
  </div>
</template>

<script>
import {
  listModelConfigChangeableOrder,
  modifyOrderConfig
} from '@/api/otd/order/changemodel'
import { getOrderDetail } from '@/api/otd/order/detail'
import { getVariantPolicy, getAvailableOptionPolicies } from '@/api/otd/salespolicy'
import OrderDetailDrawer from '../info/detail'

export default {
  name: 'OrderChangeConfig',
  components: { OrderDetailDrawer },
  dicts: ['iov_vehicle_sale_order_state'],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 可改配订单列表
      orderChangeConfigList: [],
      // 日期范围
      dateRange: [],
      // 详情抽屉
      detailVisible: false,
      detailOrderId: '',
      // 可改配版本与选装
      variantList: [],
      optionFamilies: [],
      // 改配表单
      modify: {
        visible: false,
        loading: false,
        loadingOptions: false,
        submitting: false,
        orderId: '',
        orderNo: '',
        saleModel: '',
        modelCode: '',
        currentConfigCode: '',
        currentTotal: null,
        variantCode: '',
        optionCodes: [],
        reason: ''
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        orderNo: undefined,
        orderState: undefined
      }
    }
  },
  computed: {
    // 目标配置总价 = 目标 Variant 价 + 已选选装价
    newTotal() {
      if (!this.modify.variantCode) {
        return null
      }
      const variant = this.variantList.find(item => item.variantCode === this.modify.variantCode)
      if (!variant) {
        return null
      }
      let total = Number(variant.variantPrice || 0)
      const priceMap = this.optionPriceMap()
      this.modify.optionCodes.forEach(code => {
        total += Number(priceMap[code] || 0)
      })
      return total
    },
    diffText() {
      if (this.newTotal === null || this.modify.currentTotal === null || this.modify.currentTotal === undefined) {
        return ''
      }
      const diff = Number((this.newTotal - Number(this.modify.currentTotal)).toFixed(2))
      if (diff > 0) {
        return '差额 ￥' + diff.toFixed(2) + '（提交后生成补款任务）'
      }
      if (diff < 0) {
        return '差额 ￥' + diff.toFixed(2) + '（提交后生成退款任务）'
      }
      return '无价格差额'
    },
    diffClass() {
      if (this.newTotal === null || this.modify.currentTotal === null || this.modify.currentTotal === undefined) {
        return ''
      }
      const diff = Number((this.newTotal - Number(this.modify.currentTotal)).toFixed(2))
      if (diff > 0) {
        return 'diff-up'
      }
      if (diff < 0) {
        return 'diff-down'
      }
      return ''
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询可改配车辆销售订单列表 */
    getList() {
      this.loading = true
      listModelConfigChangeableOrder(this.addDateRange(this.queryParams, this.dateRange))
        .then(response => {
          this.orderChangeConfigList = response.data.items || []
          this.total = response.data.total || 0
        })
        .catch(() => {})
        .then(() => {
          this.loading = false
        })
    },
    /** 获取车辆销售订单状态标签 */
    getVehicleSaleOrderStateLabel(vehicleSaleOrderState) {
      if (vehicleSaleOrderState === null || vehicleSaleOrderState === undefined) {
        return '-'
      }
      if (!this.dict || !this.dict.type || !this.dict.type.iov_vehicle_sale_order_state) {
        return vehicleSaleOrderState
      }
      const item = this.dict.type.iov_vehicle_sale_order_state.find(
        dict => dict.value == vehicleSaleOrderState
      )
      return item ? item.label : vehicleSaleOrderState
    },
    /** 后端允许改配的状态：210 意向金已付 / 300 定金待付 / 310 定金已付 */
    canModify(row) {
      return [210, 300, 310].indexOf(Number(row.orderState)) >= 0
    },
    dash(value) {
      if (value === null || value === undefined || value === '') {
        return '-'
      }
      return value
    },
    timeText(value) {
      if (value === null || value === undefined || value === '') {
        return '-'
      }
      return this.parseTime(value) || '-'
    },
    moneyText(value) {
      if (value === null || value === undefined || value === '') {
        return '-'
      }
      const amount = (typeof value === 'object') ? value.amount : value
      if (amount === null || amount === undefined || amount === '') {
        return '-'
      }
      const num = Number(amount)
      if (isNaN(num)) {
        return String(amount)
      }
      return '￥' + num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    variantLabel(variant) {
      const price = (variant.variantPrice === null || variant.variantPrice === undefined)
        ? '' : '  ￥' + variant.variantPrice
      return (variant.variantName || variant.variantCode) + '（' + variant.variantCode + '）' + price
    },
    /** 选装代码 → 价格 */
    optionPriceMap() {
      const map = {}
      this.optionFamilies.forEach(family => {
        (family.options || []).forEach(option => {
          map[option.optionCode] = option.optionPrice
        })
      })
      return map
    },
    openSaleModelTab(saleModelCode) {
      if (!saleModelCode) {
        return
      }
      this.$tab.openPage('销售车型管理', '/otd/saleModel', { saleCode: saleModelCode })
    },
    openModelConfigTab(modelConfigCode) {
      if (!modelConfigCode) {
        return
      }
      this.$tab.openPage('车型配置管理', '/tsp/vmd/modelConfig', { modelConfigCode: modelConfigCode })
    },
    handleDetail(row) {
      if (!row.orderId) {
        this.$modal.msgError('该订单缺少业务 ID（orderId），无法查询详情')
        return
      }
      this.detailOrderId = row.orderId
      this.detailVisible = true
    },
    /** 打开改配对话框：先取订单详情回填当前配置 */
    handleModify(row) {
      if (!row.orderId) {
        this.$modal.msgError('该订单缺少业务 ID（orderId），无法改配')
        return
      }
      this.variantList = []
      this.optionFamilies = []
      this.modify = {
        visible: true,
        loading: true,
        loadingOptions: false,
        submitting: false,
        orderId: row.orderId,
        orderNo: row.orderNo,
        saleModel: row.saleModel,
        modelCode: '',
        currentConfigCode: row.modelConfigCode || row.configurationCode || '',
        currentTotal: null,
        variantCode: '',
        optionCodes: [],
        reason: ''
      }
      getOrderDetail(row.orderId)
        .then(response => {
          const detail = response.data || {}
          this.modify.saleModel = detail.saleModel || row.saleModel
          this.modify.modelCode = detail.modelCode || ''
          this.modify.currentConfigCode = detail.configurationCode || this.modify.currentConfigCode
          const dealTotal = detail.orderAmount && detail.orderAmount.dealPriceTotal
          this.modify.currentTotal = (dealTotal && typeof dealTotal === 'object') ? dealTotal.amount : dealTotal
          this.modify.variantCode = detail.variantCode || ''
          this.modify.optionCodes = detail.optionCodes || []
          this.loadVariants()
        })
        .catch(() => {})
        .then(() => {
          this.modify.loading = false
        })
    },
    /** 加载可售版本 */
    loadVariants() {
      if (!this.modify.saleModel) {
        this.$modal.msgError('该订单缺少销售车型编码，无法加载可改配版本')
        return
      }
      getVariantPolicy(this.modify.saleModel, this.modify.modelCode)
        .then(response => {
          this.variantList = response.data || []
          if (this.modify.variantCode) {
            this.loadOptions()
          }
        })
        .catch(() => {})
    },
    handleVariantChange() {
      this.modify.optionCodes = []
      this.loadOptions()
    },
    /** 按版本加载可选装（按选装族分组） */
    loadOptions() {
      if (!this.modify.variantCode) {
        this.optionFamilies = []
        return
      }
      this.modify.loadingOptions = true
      getAvailableOptionPolicies(this.modify.saleModel, this.modify.variantCode)
        .then(response => {
          this.optionFamilies = response.data || []
        })
        .catch(() => {})
        .then(() => {
          this.modify.loadingOptions = false
        })
    },
    /** 提交改配 */
    submitModify() {
      if (!this.modify.variantCode) {
        this.$modal.msgError('请选择目标车型版本')
        return
      }
      if (!this.modify.optionCodes.length) {
        this.$modal.msgError('请至少选择一个选装配置（后端要求 optionCodes 非空）')
        return
      }
      this.modify.submitting = true
      modifyOrderConfig(this.modify.orderId, {
        variantCode: this.modify.variantCode,
        optionCodes: this.modify.optionCodes,
        reason: this.modify.reason
      })
        .then(() => {
          this.$modal.msgSuccess('改配已提交' + (this.diffText ? '，' + this.diffText : ''))
          this.modify.visible = false
          this.getList()
        })
        .catch(() => {})
        .then(() => {
          this.modify.submitting = false
        })
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = []
      this.resetForm('queryForm')
      this.handleQuery()
    }
  }
}
</script>

<style scoped>
.form-tip {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}

.option-wrapper {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px 12px;
  max-height: 240px;
  overflow-y: auto;
  width: 100%;
}

.option-family {
  margin-bottom: 8px;
}

.option-family-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
}

.option-price {
  color: #909399;
  font-size: 12px;
  margin-left: 2px;
}

.diff-up {
  color: #e6a23c;
}

.diff-down {
  color: #67c23a;
}
</style>
