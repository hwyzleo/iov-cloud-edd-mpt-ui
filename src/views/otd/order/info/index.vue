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

    <el-table v-loading="loading" :data="orderList">
      <el-table-column label="订单号" prop="orderNo" fixed="left" width="170"/>
      <el-table-column label="订单类型" align="center" width="110">
        <template slot-scope="scope">
          <span>{{ dash(scope.row.orderTypeName || scope.row.orderType) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="订单来源" align="center" width="110">
        <template slot-scope="scope">
          <span>{{ dash(scope.row.orderSourceName || scope.row.orderSource) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="订单状态" align="center" width="150">
        <template slot-scope="scope">
          <el-tooltip :content="'状态时间：' + timeText(scope.row.orderStateTime)" placement="top">
            <span>{{ getVehicleSaleOrderStateLabel(scope.row.orderState) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="下单时间" align="center" width="160">
        <template slot-scope="scope">
          <span>{{ timeText(scope.row.orderTime || scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="锁单时间" align="center" width="160">
        <template slot-scope="scope">
          <span>{{ timeText(scope.row.lockTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="品牌" align="center" width="110">
        <template slot-scope="scope">
          <span>{{ dash(scope.row.brandName || scope.row.brandCode) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="销售车型" align="center" width="140">
        <template slot-scope="scope">
          <el-link
            type="primary"
            @click="openSaleModelTab(scope.row.saleModel)"
          >{{ dash(scope.row.saleModelName || scope.row.saleModel) }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="上牌城市" align="center" width="110">
        <template slot-scope="scope">
          <span>{{ dash(scope.row.licenseCity) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="生产配置" align="center" width="200">
        <template slot-scope="scope">
          <el-link
            type="primary"
            @click="openModelConfigTab(scope.row.buildConfigCode || scope.row.configurationCode)"
          >{{ dash(scope.row.buildConfigCode || scope.row.configurationCode) }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center" fixed="right" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleDetail(scope.row)"
            v-hasPermi="['completeVehicle:order:info:query']"
          >详细
          </el-button>
          <el-dropdown trigger="click" @command="command => handleMoreCommand(command, scope.row)">
            <el-button size="mini" type="text" icon="el-icon-more">更多</el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="auditPass" v-hasPermi="['completeVehicle:order:info:audit']">审核通过</el-dropdown-item>
              <el-dropdown-item command="auditReject" v-hasPermi="['completeVehicle:order:info:audit']">审核驳回</el-dropdown-item>
              <el-dropdown-item command="lock" v-hasPermi="['completeVehicle:order:info:lock']">锁单</el-dropdown-item>
              <el-dropdown-item command="close" v-hasPermi="['completeVehicle:order:info:close']">关闭订单</el-dropdown-item>
              <el-dropdown-item command="delete" divided v-hasPermi="['completeVehicle:order:info:physicalDelete']">物理删除</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
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

    <!-- 订单详情抽屉：时间线/支付/补款/退款/协议/交付 -->
    <order-detail-drawer :order-id="detailOrderId" :visible.sync="detailVisible"/>

    <!-- 审核驳回 -->
    <el-dialog title="审核驳回" :visible.sync="rejectDialog.visible" width="480px" append-to-body>
      <el-form ref="rejectForm" :model="rejectDialog" :rules="rejectRules" label-width="100px" size="small">
        <el-form-item label="订单号">
          <span>{{ rejectDialog.orderNo }}</span>
        </el-form-item>
        <el-form-item label="驳回分类" prop="rejectCategory">
          <el-select v-model="rejectDialog.rejectCategory" placeholder="请选择驳回分类" style="width: 100%">
            <el-option v-for="item in rejectCategories" :key="item" :label="item" :value="item"/>
          </el-select>
        </el-form-item>
        <el-form-item label="驳回原因" prop="rejectReason">
          <el-input v-model="rejectDialog.rejectReason" type="textarea" :rows="3" placeholder="请输入驳回原因"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="rejectDialog.visible = false">取 消</el-button>
        <el-button size="small" type="primary" :loading="rejectDialog.loading" @click="submitReject">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listOrder,
  physicalDeleteOrder,
  auditPass,
  auditReject,
  lockOrder,
  closeOrder
} from '@/api/otd/order/info'
import OrderDetailDrawer from './detail'

export default {
  name: 'VehicleSaleOrder',
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
      // 车辆销售订单表格数据
      orderList: [],
      // 日期范围
      dateRange: [],
      // 详情抽屉
      detailVisible: false,
      detailOrderId: '',
      // 驳回分类（后端存自由文本，此处提供常用选项）
      rejectCategories: ['客户信息有误', '配置不可售', '支付异常', '重复下单', '其他'],
      rejectDialog: {
        visible: false,
        loading: false,
        orderId: '',
        orderNo: '',
        rejectCategory: '客户信息有误',
        rejectReason: ''
      },
      rejectRules: {
        rejectCategory: [{ required: true, message: '请选择驳回分类', trigger: 'change' }],
        rejectReason: [{ required: true, message: '请输入驳回原因', trigger: 'blur' }]
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
  created() {
    this.getList()
  },
  methods: {
    /** 查询车辆销售订单列表 */
    getList() {
      this.loading = true
      listOrder(this.addDateRange(this.queryParams, this.dateRange))
        .then(response => {
          this.orderList = response.data.items || []
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
    /** 空值占位 */
    dash(value) {
      if (value === null || value === undefined || value === '') {
        return '-'
      }
      return value
    },
    /** 时间格式化 */
    timeText(value) {
      if (value === null || value === undefined || value === '') {
        return '-'
      }
      return this.parseTime(value) || '-'
    },
    /** 跳转销售车型页 */
    openSaleModelTab(saleModelCode) {
      if (!saleModelCode) {
        return
      }
      const params = { saleCode: saleModelCode }
      this.$tab.openPage('销售车型管理', '/otd/saleModel', params)
    },
    /** 跳转车型配置页 */
    openModelConfigTab(modelConfigCode) {
      if (!modelConfigCode) {
        return
      }
      const params = { modelConfigCode: modelConfigCode }
      this.$tab.openPage('车型配置管理', '/tsp/vmd/modelConfig', params)
    },
    /** 查看订单详情 */
    handleDetail(row) {
      if (!row.orderId) {
        this.$modal.msgError('该订单缺少业务 ID（orderId），无法查询详情')
        return
      }
      this.detailOrderId = row.orderId
      this.detailVisible = true
    },
    /** 更多操作（审核/锁单/关闭/删除） */
    handleMoreCommand(command, row) {
      if (!row.orderId) {
        this.$modal.msgError('该订单缺少业务 ID（orderId），无法执行操作')
        return
      }
      if (command === 'auditPass') {
        this.handleAuditPass(row)
      } else if (command === 'auditReject') {
        this.handleAuditReject(row)
      } else if (command === 'lock') {
        this.handleLock(row)
      } else if (command === 'close') {
        this.handleClose(row)
      } else if (command === 'delete') {
        this.handleDelete(row)
      }
    },
    /** 审核通过 */
    handleAuditPass(row) {
      this.$modal.confirm('是否确认审核通过订单"' + row.orderNo + '"？')
        .then(() => auditPass(row.orderId))
        .then(() => {
          this.$modal.msgSuccess('审核通过')
          this.getList()
        })
        .catch(() => {})
    },
    /** 审核驳回（需填驳回分类与原因） */
    handleAuditReject(row) {
      this.rejectDialog = {
        visible: true,
        loading: false,
        orderId: row.orderId,
        orderNo: row.orderNo,
        rejectCategory: '客户信息有误',
        rejectReason: ''
      }
    },
    /** 提交驳回 */
    submitReject() {
      this.$refs['rejectForm'].validate(valid => {
        if (!valid) {
          return
        }
        this.rejectDialog.loading = true
        auditReject(this.rejectDialog.orderId, this.rejectDialog.rejectCategory, this.rejectDialog.rejectReason)
          .then(() => {
            this.$modal.msgSuccess('已驳回')
            this.rejectDialog.visible = false
            this.getList()
          })
          .catch(() => {})
          .then(() => {
            this.rejectDialog.loading = false
          })
      })
    },
    /** 锁单 */
    handleLock(row) {
      this.$modal.confirm('锁单后生产配置将不可修改，是否确认锁单订单"' + row.orderNo + '"？')
        .then(() => lockOrder(row.orderId))
        .then(() => {
          this.$modal.msgSuccess('锁单成功')
          this.getList()
        })
        .catch(() => {})
    },
    /** 关闭订单 */
    handleClose(row) {
      this.$prompt('关闭后订单进入关闭状态，请输入关闭原因', '关闭订单 ' + row.orderNo, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '关闭原因不能为空'
      }).then(({ value }) => {
        return closeOrder(row.orderId, value.trim())
      }).then(() => {
        this.$modal.msgSuccess('订单已关闭')
        this.getList()
      }).catch(() => {})
    },
    /** 物理删除订单 */
    handleDelete(row) {
      if (!row.orderId) {
        this.$modal.msgError('该订单缺少业务 ID（orderId），无法删除')
        return
      }
      this.$prompt('物理删除会清除订单及其全部关联数据且不可恢复，请输入删除原因', '确认物理删除订单 ' + row.orderNo, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '删除原因不能为空'
      }).then(({ value }) => {
        return physicalDeleteOrder(row.orderId, {
          orderNo: row.orderNo,
          reason: value,
          complianceFlag: true
        })
      }).then(response => {
        const data = response.data || {}
        this.$modal.msgSuccess('删除完成，共删除 ' + (data.totalDeletedRecords || 0) + ' 条记录')
        this.getList()
      }).catch(() => {})
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
