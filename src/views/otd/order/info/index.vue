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
            v-for="item in orderStateOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
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
      <el-table-column label="订单号" prop="orderNo" fixed="left" width="150"/>
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
      <el-table-column label="操作" width="300" align="center" fixed="right" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleDetail(scope.row)"
            v-hasPermi="['completeVehicle:order:info:query']"
          >详细
          </el-button>
          <el-button
            v-if="isFinalPaymentPaid(scope.row)"
            size="mini"
            type="text"
            icon="el-icon-check"
            v-hasPermi="['completeVehicle:order:delivery:complete']"
            @click="handleCompleteDelivery(scope.row)"
          >确认交付</el-button>
          <el-button
            v-if="isDelivered(scope.row)"
            size="mini"
            type="text"
            icon="el-icon-finished"
            v-hasPermi="['completeVehicle:order:info:complete']"
            @click="handleCompleteOrder(scope.row)"
          >完成订单</el-button>
          <el-dropdown trigger="click" @command="command => handleMoreCommand(command, scope.row)">
            <el-button size="mini" type="text" icon="el-icon-more">更多</el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item v-if="canAudit(scope.row)" command="auditPass" v-hasPermi="['completeVehicle:order:info:audit']">审核通过</el-dropdown-item>
              <el-dropdown-item v-if="canAudit(scope.row)" command="auditReject" v-hasPermi="['completeVehicle:order:info:audit']">审核驳回</el-dropdown-item>
              <el-dropdown-item v-if="canLock(scope.row)" command="lock" v-hasPermi="['completeVehicle:order:info:lock']">锁单</el-dropdown-item>
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

    <!-- 确认交付（仅 620 尾款已付款展示） -->
    <el-dialog title="确认交付" :visible.sync="deliveryDialog.visible" width="480px" append-to-body>
      <el-alert
        title="确认后订单将推进为已交付（650），不可撤销，请核对车辆与资料已现场移交。"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-form label-width="80px" style="margin-top: 16px" size="small">
        <el-form-item label="订单号">
          <span>{{ deliveryDialog.orderNo }}</span>
        </el-form-item>
        <el-form-item label="交付备注">
          <el-input
            v-model="deliveryDialog.remark"
            type="textarea"
            :rows="3"
            maxlength="255"
            show-word-limit
            placeholder="可选，默认“管理后台确认交付”"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="deliveryDialog.visible = false">取 消</el-button>
        <el-button size="small" type="primary" :loading="deliveryDialog.loading" @click="submitCompleteDelivery">确 认</el-button>
      </div>
    </el-dialog>

    <!-- 完成订单（仅 650 已交付展示，OTD-VSO-DSN-CR-016） -->
    <el-dialog title="完成订单" :visible.sync="completeDialog.visible" width="480px" append-to-body>
      <el-alert
        title="确认后订单将推进为已完成（900），不可撤销，请确认交付资料与手续已核查完毕。"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-form label-width="80px" style="margin-top: 16px" size="small">
        <el-form-item label="订单号">
          <span>{{ completeDialog.orderNo }}</span>
        </el-form-item>
        <el-form-item label="办结备注">
          <el-input
            v-model="completeDialog.remark"
            type="textarea"
            :rows="3"
            maxlength="255"
            show-word-limit
            placeholder="可选，默认“管理后台人工核查完成”"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="completeDialog.visible = false">取 消</el-button>
        <el-button size="small" type="primary" :loading="completeDialog.loading" @click="submitCompleteOrder">确 认</el-button>
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
  closeOrder,
  completeOrder
} from '@/api/otd/order/info'
import OrderDetailDrawer from './detail'
import { completeOrderDelivery } from '@/api/otd/order/detail'
import { orderStateLabel, orderStateOptions } from '@/utils/otd/orderState'

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
      // 确认交付（仅 620 展示）
      deliveryDialog: {
        visible: false,
        loading: false,
        orderId: '',
        orderNo: '',
        remark: ''
      },
      // 完成订单（仅 650 展示，OTD-VSO-DSN-CR-016）
      completeDialog: {
        visible: false,
        loading: false,
        orderId: '',
        orderNo: '',
        remark: ''
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
    /** 状态筛选：字典优先，补齐字典缺失的 600/620/630/650 等状态 */
    orderStateOptions() {
      const dictList = (this.dict && this.dict.type && this.dict.type.iov_vehicle_sale_order_state) || []
      return orderStateOptions(dictList)
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
      const dictList = (this.dict && this.dict.type && this.dict.type.iov_vehicle_sale_order_state) || []
      return orderStateLabel(vehicleSaleOrderState, dictList)
    },
    /** 仅 350 待审核允许审核通过/驳回 */
    canAudit(row) {
      return Number(row.orderState) === 350
    },
    /** 310 定金已付 / 360 审核通过允许锁单 */
    canLock(row) {
      return [310, 360].indexOf(Number(row.orderState)) >= 0
    },
    /** 仅 620 尾款已付款允许确认交付 */
    isFinalPaymentPaid(row) {
      return Number(row.orderState) === 620
    },
    /** 仅 650 已交付允许完成订单（OTD-VSO-DSN-CR-016） */
    isDelivered(row) {
      return Number(row.orderState) === 650
    },
    /** 打开确认交付弹窗 */
    handleCompleteDelivery(row) {
      if (!row.orderId) {
        this.$modal.msgError('该订单缺少业务 ID（orderId），无法确认交付')
        return
      }
      this.deliveryDialog = {
        visible: true,
        loading: false,
        orderId: row.orderId,
        orderNo: row.orderNo,
        remark: ''
      }
    },
    /** 提交确认交付 */
    submitCompleteDelivery() {
      if (this.deliveryDialog.loading) {
        return
      }
      this.deliveryDialog.loading = true
      completeOrderDelivery(this.deliveryDialog.orderId, (this.deliveryDialog.remark || '').trim())
        .then(() => {
          this.$modal.msgSuccess('确认交付成功')
          this.deliveryDialog.visible = false
          this.getList()
        })
        .catch(() => {})
        .then(() => {
          this.deliveryDialog.loading = false
        })
    },
    /** 打开完成订单二次确认弹窗（仅 650） */
    handleCompleteOrder(row) {
      if (!this.isDelivered(row)) {
        return
      }
      if (!row.orderId) {
        this.$modal.msgError('该订单缺少业务 ID（orderId），无法完成订单')
        return
      }
      this.completeDialog = {
        visible: true,
        loading: false,
        orderId: row.orderId,
        orderNo: row.orderNo,
        remark: ''
      }
    },
    /** 提交完成订单（650 → 900） */
    submitCompleteOrder() {
      if (this.completeDialog.loading) {
        return
      }
      this.completeDialog.loading = true
      completeOrder(this.completeDialog.orderId, (this.completeDialog.remark || '').trim())
        .then(() => {
          this.$modal.msgSuccess('订单已完成')
          this.completeDialog.visible = false
          this.getList()
        })
        .catch(() => {})
        .then(() => {
          this.completeDialog.loading = false
        })
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
