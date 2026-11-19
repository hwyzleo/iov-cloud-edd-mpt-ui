<template>
  <el-drawer
    :visible.sync="visibleLocal"
    direction="rtl"
    size="72%"
    :with-header="false"
    append-to-body
    custom-class="order-detail-drawer"
  >
    <div class="order-detail" v-loading="detailLoading" element-loading-text="正在加载订单详情">
      <div class="detail-header">
        <div class="detail-title">
          <span class="text">订单详情</span>
          <span class="order-no">{{ detail.orderNo || orderId }}</span>
          <el-tag v-if="detail.orderState !== undefined && detail.orderState !== null" size="small" effect="dark">
            {{ stateText(detail.orderState) }}
          </el-tag>
        </div>
        <div class="detail-header-actions">
          <el-button
            v-if="canCompleteDelivery"
            size="mini"
            type="primary"
            icon="el-icon-check"
            v-hasPermi="['completeVehicle:order:delivery:complete']"
            @click="openCompleteDelivery"
          >确认交付</el-button>
          <el-button
            v-if="canCompleteOrder"
            size="mini"
            type="primary"
            icon="el-icon-finished"
            v-hasPermi="['completeVehicle:order:info:complete']"
            @click="openCompleteOrder"
          >完成订单</el-button>
          <el-button size="mini" icon="el-icon-close" @click="visibleLocal = false">关闭</el-button>
        </div>
      </div>

      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <!-- 订单信息 -->
        <el-tab-pane label="订单信息" name="info">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="订单号">{{ dash(detail.orderNo) }}</el-descriptions-item>
            <el-descriptions-item label="订单业务ID">{{ dash(detail.orderId) }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">{{ stateText(detail.orderState) }}</el-descriptions-item>
            <el-descriptions-item label="状态时间">{{ timeText(detail.orderStateTime) }}</el-descriptions-item>
            <el-descriptions-item label="订单类型">{{ dash(detail.orderTypeName || detail.orderType) }}</el-descriptions-item>
            <el-descriptions-item label="订单来源">{{ dash(detail.orderSourceName || detail.orderSource) }}</el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ timeText(detail.orderTime || detail.createTime) }}</el-descriptions-item>
            <el-descriptions-item label="品牌">{{ dash(detail.brandName || detail.brandCode) }}</el-descriptions-item>
            <el-descriptions-item label="销售车型">{{ dash(detail.saleModelName || detail.saleModel) }}</el-descriptions-item>
            <el-descriptions-item label="车型名称">{{ dash(detail.modelName || vehicle.modelName) }}</el-descriptions-item>
            <el-descriptions-item label="配置版本">{{ dash(detail.variantName || vehicle.variantName) }}</el-descriptions-item>
            <el-descriptions-item label="配置代码">{{ dash(detail.configurationCode || vehicle.configurationCode) }}</el-descriptions-item>
            <el-descriptions-item label="上牌城市">{{ dash(detail.licenseCity || detail.licenseCityName) }}</el-descriptions-item>
            <el-descriptions-item label="交付门店">{{ dash(detail.deliveryStoreName || detail.deliveryStoreCode) }}</el-descriptions-item>
            <el-descriptions-item label="下单门店">{{ dash(detail.orderStoreName || detail.orderStoreCode) }}</el-descriptions-item>
            <el-descriptions-item label="归属门店">{{ dash(detail.ownerStoreName || detail.ownerStoreCode) }}</el-descriptions-item>
            <el-descriptions-item label="归属区域">{{ dash(detail.ownerRegionName || detail.ownerRegionCode) }}</el-descriptions-item>
            <el-descriptions-item label="交付区域">{{ dash(detail.deliveryRegionName || detail.deliveryRegionCode) }}</el-descriptions-item>
            <el-descriptions-item label="客户类型">{{ dash(detail.customerType) }}</el-descriptions-item>
            <el-descriptions-item label="支付方式">{{ dash(detail.paymentMethod) }}</el-descriptions-item>
            <el-descriptions-item label="购车计划">{{ dash(detail.purchasePlan) }}</el-descriptions-item>
            <el-descriptions-item label="购车人">{{ dash(detail.orderPersonName) }}</el-descriptions-item>
            <el-descriptions-item label="证件号码">
              {{ dash(detail.orderPersonIdNum) }}
              <span class="hint-inline" v-if="!detail.orderPersonIdNum">（未采集/不对外输出）</span>
            </el-descriptions-item>
            <el-descriptions-item label="交付人员">{{ dash(detail.deliveryPersonName) }}</el-descriptions-item>
            <el-descriptions-item label="交付 VIN">{{ dash(detail.deliveryVin) }}</el-descriptions-item>
            <el-descriptions-item label="锁单时间">{{ timeText(detail.lockTime) }}</el-descriptions-item>
            <el-descriptions-item label="意向金支付时间">{{ timeText(detail.earnestMoneyTime) }}</el-descriptions-item>
            <el-descriptions-item label="定金支付/转定金时间">{{ timeText(detail.downPaymentTime) }}</el-descriptions-item>
            <el-descriptions-item label="支付状态">{{ label(PAY_STATE, detail.payState) }}</el-descriptions-item>
            <el-descriptions-item label="交付预约">{{ dash(detail.appointmentNo) }}</el-descriptions-item>
            <el-descriptions-item label="预约时间">{{ timeText(detail.appointmentTime) }}</el-descriptions-item>
            <el-descriptions-item label="预约状态">{{ label(APPOINTMENT_STATUS, detail.appointmentStatus) }}</el-descriptions-item>
          </el-descriptions>

          <div class="section-title">金额信息</div>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="整车价格">{{ moneyText(amount.vehiclePrice) }}</el-descriptions-item>
            <el-descriptions-item label="选装合计">{{ moneyText(amount.optionPrice) }}</el-descriptions-item>
            <el-descriptions-item label="成交总价">{{ moneyText(amount.dealPriceTotal) }}</el-descriptions-item>
            <el-descriptions-item label="意向金">{{ moneyText(amount.depositAmount) }}</el-descriptions-item>
            <el-descriptions-item label="定金">{{ moneyText(amount.downPaymentAmount) }}</el-descriptions-item>
            <el-descriptions-item label="尾款">{{ moneyText(amount.tailPaymentAmount) }}</el-descriptions-item>
            <el-descriptions-item label="已支付金额">{{ moneyText(amount.paidTotal) }}</el-descriptions-item>
            <el-descriptions-item label="已退款金额">{{ moneyText(amount.refundTotal) }}</el-descriptions-item>
            <el-descriptions-item label="待支付金额">{{ moneyText(amount.unpaidTotal) }}</el-descriptions-item>
            <el-descriptions-item label="应收金额">{{ moneyText(amount.receivableTotal) }}</el-descriptions-item>
            <el-descriptions-item label="净应收金额">{{ moneyText(amount.netReceivableTotal) }}</el-descriptions-item>
            <el-descriptions-item label="小定升级超额">{{ amount.upgradedFromSmall ? '是' : '否' }}</el-descriptions-item>
          </el-descriptions>

          <template v-if="optionBreakdown.length > 0">
            <div class="section-title">选装明细</div>
            <el-table :data="optionBreakdown" size="mini" border>
              <el-table-column label="选装代码" prop="optionCode" min-width="120"/>
              <el-table-column label="选装族" prop="optionFamilyName" min-width="120"/>
              <el-table-column label="选装名称" prop="optionName" min-width="140"/>
              <el-table-column label="价格" min-width="100" align="right">
                <template slot-scope="scope">{{ moneyText(scope.row.optionPrice) }}</template>
              </el-table-column>
            </el-table>
          </template>
        </el-tab-pane>

        <!-- 时间线 -->
        <el-tab-pane label="时间线" name="timeline">
          <div v-loading="loadingTab.timeline" class="tab-body">
            <el-empty v-if="!timeline.length" description="暂无时间线记录（历史订单可能未回填）"/>
            <el-timeline v-else>
              <el-timeline-item
                v-for="(item, index) in timeline"
                :key="index"
                :timestamp="timeText(item.eventTime)"
                placement="top"
                :type="item.result === 'fail' ? 'danger' : 'primary'"
              >
                <div class="timeline-title">
                  {{ item.eventName || item.eventType }}
                  <el-tag v-if="item.result" size="mini" :type="item.result === 'fail' ? 'danger' : 'success'">
                    {{ item.result === 'fail' ? '失败' : '成功' }}
                  </el-tag>
                </div>
                <div class="timeline-desc">
                  <span v-if="item.beforeStatus || item.afterStatus">
                    状态：{{ stateText(item.beforeStatus) }} → {{ stateText(item.afterStatus) }}
                  </span>
                  <span v-if="item.operatorId">操作人：{{ item.operatorId }}</span>
                  <span v-if="item.operatorRole">操作角色：{{ item.operatorRole }}</span>
                  <span v-if="item.operateSource">操作来源：{{ item.operateSource }}</span>
                  <span v-if="item.relatedDocNo">关联单号：{{ item.relatedDocNo }}</span>
                  <span v-if="item.failReason">失败原因：{{ item.failReason }}</span>
                  <span v-if="item.eventRemark">备注：{{ item.eventRemark }}</span>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-tab-pane>

        <!-- 支付记录 -->
        <el-tab-pane label="支付记录" name="payments">
          <div v-loading="loadingTab.payments" class="tab-body">
            <el-empty v-if="!payments.length" description="暂无支付记录"/>
            <el-table v-else :data="payments" size="mini" border>
              <el-table-column label="支付单号" prop="paymentNo" min-width="170"/>
              <el-table-column label="支付阶段" min-width="100">
                <template slot-scope="scope">{{ label(PAYMENT_STAGE, scope.row.paymentStage) }}</template>
              </el-table-column>
              <el-table-column label="支付渠道" prop="paymentChannel" min-width="100"/>
              <el-table-column label="金额" min-width="100" align="right">
                <template slot-scope="scope">{{ moneyText(scope.row.paymentAmount) }}</template>
              </el-table-column>
              <el-table-column label="状态" min-width="100">
                <template slot-scope="scope">
                  <el-tag size="mini" :type="tagType(scope.row.paymentStatus)">
                    {{ label(PAYMENT_STATUS, scope.row.paymentStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="支付时间" min-width="150">
                <template slot-scope="scope">{{ timeText(scope.row.payTime) }}</template>
              </el-table-column>
              <el-table-column label="支付截止时间" min-width="150">
                <template slot-scope="scope">{{ timeText(scope.row.expireTime) }}</template>
              </el-table-column>
              <el-table-column label="外部交易号" prop="externalTradeNo" min-width="150"/>
              <el-table-column label="失败原因" prop="failReason" min-width="140"/>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 补款任务 -->
        <el-tab-pane label="补款任务" name="supplements">
          <div v-loading="loadingTab.supplements" class="tab-body">
            <el-empty v-if="!supplements.length" description="暂无补款任务"/>
            <el-table v-else :data="supplements" size="mini" border>
              <el-table-column label="补款单号" prop="supplementaryNo" min-width="170"/>
              <el-table-column label="补款金额" min-width="110" align="right">
                <template slot-scope="scope">{{ moneyText(scope.row.supplementaryAmount) }}</template>
              </el-table-column>
              <el-table-column label="币种" prop="currency" min-width="80"/>
              <el-table-column label="状态" min-width="100">
                <template slot-scope="scope">
                  <el-tag size="mini" :type="tagType(scope.row.supplementaryStatus)">
                    {{ label(SUPPLEMENT_STATUS, scope.row.supplementaryStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="配置版本" prop="configVersionNo" min-width="90" align="center"/>
              <el-table-column label="支付截止时间" min-width="150">
                <template slot-scope="scope">{{ timeText(scope.row.expireTime) }}</template>
              </el-table-column>
              <el-table-column label="创建时间" min-width="150">
                <template slot-scope="scope">{{ timeText(scope.row.createTime) }}</template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 退款记录 -->
        <el-tab-pane label="退款记录" name="refunds">
          <div v-loading="loadingTab.refunds" class="tab-body">
            <el-empty v-if="!refunds.length" description="暂无退款记录"/>
            <el-table v-else :data="refunds" size="mini" border row-key="refundNo">
              <el-table-column type="expand">
                <template slot-scope="scope">
                  <el-table :data="scope.row.items || []" size="mini" border class="inner-table">
                    <el-table-column label="退款明细号" prop="refundItemId" min-width="170"/>
                    <el-table-column label="原支付单号" prop="paymentNo" min-width="170"/>
                    <el-table-column label="退款金额" min-width="100" align="right">
                      <template slot-scope="item">{{ moneyText(item.row.refundAmount) }}</template>
                    </el-table-column>
                    <el-table-column label="状态" min-width="90">
                      <template slot-scope="item">
                        <el-tag size="mini" :type="tagType(item.row.refundStatus)">
                          {{ label(REFUND_STATUS, item.row.refundStatus) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="外部退款单号" prop="externalRefundNo" min-width="150"/>
                    <el-table-column label="失败原因" prop="failReason" min-width="140"/>
                  </el-table>
                </template>
              </el-table-column>
              <el-table-column label="退款单号" prop="refundNo" min-width="170"/>
              <el-table-column label="退款场景" min-width="110">
                <template slot-scope="scope">{{ label(REFUND_SCENE, scope.row.refundScene) }}</template>
              </el-table-column>
              <el-table-column label="退款金额" min-width="100" align="right">
                <template slot-scope="scope">{{ moneyText(scope.row.refundAmount) }}</template>
              </el-table-column>
              <el-table-column label="手续费" min-width="100" align="right">
                <template slot-scope="scope">{{ moneyText(scope.row.refundFee) }}</template>
              </el-table-column>
              <el-table-column label="状态" min-width="90">
                <template slot-scope="scope">
                  <el-tag size="mini" :type="tagType(scope.row.refundStatus)">
                    {{ label(REFUND_STATUS, scope.row.refundStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="申请时间" min-width="150">
                <template slot-scope="scope">{{ timeText(scope.row.applyTime) }}</template>
              </el-table-column>
              <el-table-column label="完成时间" min-width="150">
                <template slot-scope="scope">{{ timeText(scope.row.refundTime) }}</template>
              </el-table-column>
              <el-table-column label="失败原因" prop="failReason" min-width="140"/>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 协议确认 -->
        <el-tab-pane label="协议确认" name="agreements">
          <div v-loading="loadingTab.agreements" class="tab-body">
            <el-empty v-if="!agreements.length" description="暂无协议确认记录"/>
            <el-table v-else :data="agreements" size="mini" border>
              <el-table-column label="协议代码" prop="agreementCode" min-width="160"/>
              <el-table-column label="版本号" prop="versionNo" min-width="80" align="center"/>
              <el-table-column label="协议标题" prop="title" min-width="200"/>
              <el-table-column label="操作" width="100" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="mini" @click="showAgreement(scope.row)">查看全文</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 交付信息 -->
        <el-tab-pane label="交付信息" name="delivery">
          <div v-if="canCompleteDelivery" class="delivery-actions">
            <el-button
              type="primary"
              size="small"
              icon="el-icon-check"
              v-hasPermi="['completeVehicle:order:delivery:complete']"
              @click="openCompleteDelivery"
            >确认交付</el-button>
            <span class="hint-inline">仅尾款已支付（620）订单可确认交付，实际交付时间取服务端时间</span>
          </div>
          <div v-loading="loadingTab.delivery" class="tab-body">
            <el-empty v-if="!delivery" description="尚未创建交付预约"/>
            <template v-else>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="预约单号">{{ dash(delivery.appointmentNo) }}</el-descriptions-item>
                <el-descriptions-item label="预约状态">
                  {{ label(APPOINTMENT_STATUS, delivery.appointmentStatus) }}
                </el-descriptions-item>
                <el-descriptions-item label="预约时间">{{ timeText(delivery.appointmentTime) }}</el-descriptions-item>
                <el-descriptions-item label="交付方式">{{ dash(delivery.deliveryMode) }}</el-descriptions-item>
                <el-descriptions-item label="交付门店">{{ dash(delivery.appointmentStoreCode) }}</el-descriptions-item>
                <el-descriptions-item label="交付地点">{{ dash(delivery.appointmentPlace) }}</el-descriptions-item>
                <el-descriptions-item label="交付人员">
                  {{ dash(delivery.deliveryPersonName || delivery.deliveryPersonId) }}
                </el-descriptions-item>
                <el-descriptions-item label="交付车辆">{{ dash(delivery.vehicleVin) }}</el-descriptions-item>
                <el-descriptions-item label="是否已交付">{{ delivery.delivered ? '是' : '否' }}</el-descriptions-item>
              </el-descriptions>

              <template v-if="delivery.records && delivery.records.length > 0">
                <div class="section-title">交付记录</div>
                <el-table :data="delivery.records" size="mini" border>
                  <el-table-column label="交付记录号" prop="deliveryRecordId" min-width="170"/>
                  <el-table-column label="交付状态" prop="deliveryStatus" min-width="100"/>
                  <el-table-column label="实际交付时间" min-width="150">
                    <template slot-scope="scope">{{ timeText(scope.row.actualDeliveryTime) }}</template>
                  </el-table-column>
                  <el-table-column label="交付地点" prop="deliveryPlace" min-width="160"/>
                  <el-table-column label="交付车辆" prop="vehicleVin" min-width="170"/>
                </el-table>
              </template>
            </template>
          </div>
        </el-tab-pane>
      </el-tabs>

      <el-dialog
        title="确认交付"
        :visible.sync="deliveryDialog.visible"
        width="480px"
        append-to-body
      >
        <el-alert
          title="确认后订单将推进为已交付（650），不可撤销，请核对车辆与资料已现场移交。"
          type="warning"
          :closable="false"
          show-icon
        />
        <el-form label-width="80px" style="margin-top: 16px">
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
        <div slot="footer">
          <el-button size="small" @click="deliveryDialog.visible = false">取 消</el-button>
          <el-button
            size="small"
            type="primary"
            :loading="deliveryDialog.submitting"
            @click="submitCompleteDelivery"
          >确 认</el-button>
        </div>
      </el-dialog>

      <el-dialog
        title="完成订单"
        :visible.sync="completeDialog.visible"
        width="480px"
        append-to-body
      >
        <el-alert
          title="确认后订单将推进为已完成（900），不可撤销，请确认交付资料与手续已核查完毕。"
          type="warning"
          :closable="false"
          show-icon
        />
        <el-form label-width="80px" style="margin-top: 16px">
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
        <div slot="footer">
          <el-button size="small" @click="completeDialog.visible = false">取 消</el-button>
          <el-button
            size="small"
            type="primary"
            :loading="completeDialog.submitting"
            @click="submitCompleteOrder"
          >确 认</el-button>
        </div>
      </el-dialog>

      <el-dialog
        :title="agreementDialog.title"
        :visible.sync="agreementDialog.visible"
        width="720px"
        append-to-body
      >
        <div class="agreement-content">{{ agreementDialog.content }}</div>
        <div slot="footer">
          <el-button size="small" @click="agreementDialog.visible = false">关 闭</el-button>
        </div>
      </el-dialog>
    </div>
  </el-drawer>
</template>

<script>
import {
  getOrderDetail,
  listOrderTimeline,
  listOrderPayments,
  listOrderSupplements,
  listOrderRefunds,
  listOrderAgreements,
  getOrderDelivery,
  completeOrderDelivery
} from '@/api/otd/order/detail'
import { completeOrder } from '@/api/otd/order/info'
import { orderStateLabel } from '@/utils/otd/orderState'

// 以下枚举镜像后端定义（PaymentStatus / PaymentStage / RefundStatus / RefundScene /
// SupplementaryPaymentStatus / DeliveryAppointmentStatus），后端字典未落库前先本地映射
const PAYMENT_STATUS = {
  PENDING_PAYMENT: '待支付',
  PARTIALLY_PAID: '部分支付',
  PAID: '已支付',
  PROCESSING: '处理中',
  PAYMENT_FAILED: '支付失败',
  CANCELLED: '已取消',
  REFUNDED: '已退款',
  PARTIALLY_REFUNDED: '部分退款',
  REFUNDING: '退款中',
  REFUND_FAILED: '退款失败',
  CLOSED: '已关闭'
}
const PAYMENT_STAGE = {
  EARNEST_MONEY: '意向金',
  DOWN_PAYMENT: '定金',
  TAIL_PAYMENT: '尾款',
  FINANCE_DISBURSEMENT: '金融放款'
}
const REFUND_STATUS = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '失败'
}
const REFUND_SCENE = {
  full_refund: '全额退款',
  partial_refund: '部分退款',
  excess_refund: '超额退款'
}
const SUPPLEMENT_STATUS = {
  pending: '待支付',
  completed: '已完成',
  cancelled: '已取消',
  expired: '已过期'
}
const APPOINTMENT_STATUS = {
  booked: '已预约',
  completed: '已完成',
  cancelled: '已取消'
}
// 订单支付状态（PayState 枚举，值为数字）
const PAY_STATE = {
  10: '意向金已支付',
  15: '意向金已退款',
  20: '定金已支付',
  25: '定金已退款',
  30: '尾款已支付',
  35: '尾款已退款'
}
const TAG_SUCCESS = ['paid', 'completed', 'success', 'delivered', 'active', 'booked']
const TAG_WARNING = ['pending', 'pending_payment', 'processing', 'refunding', 'partially_paid']
const TAG_DANGER = ['failed', 'payment_failed', 'cancelled', 'expired', 'refund_failed', 'off_shelf']

export default {
  name: 'OrderDetailDrawer',
  dicts: ['iov_vehicle_sale_order_state'],
  props: {
    // 是否显示抽屉
    visible: {
      type: Boolean,
      default: false
    },
    // 订单业务 ID（vso_order.order_id），不是数据库主键
    orderId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      PAYMENT_STATUS: PAYMENT_STATUS,
      PAYMENT_STAGE: PAYMENT_STAGE,
      REFUND_STATUS: REFUND_STATUS,
      REFUND_SCENE: REFUND_SCENE,
      SUPPLEMENT_STATUS: SUPPLEMENT_STATUS,
      APPOINTMENT_STATUS: APPOINTMENT_STATUS,
      PAY_STATE: PAY_STATE,
      activeTab: 'info',
      detailLoading: false,
      detail: {},
      // 各 tab 是否已加载过，避免重复请求
      loadedTab: {},
      loadingTab: {},
      timeline: [],
      payments: [],
      supplements: [],
      refunds: [],
      agreements: [],
      delivery: null,
      deliveryDialog: {
        visible: false,
        remark: '',
        submitting: false
      },
      // 完成订单（仅 650 展示，OTD-VSO-DSN-CR-016）
      completeDialog: {
        visible: false,
        remark: '',
        submitting: false
      },
      agreementDialog: {
        visible: false,
        title: '',
        content: ''
      }
    }
  },
  computed: {
    visibleLocal: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    // orderAmount 中的金额为 Money 值对象（{ amount, currency }）
    amount() {
      return this.detail.orderAmount || {}
    },
    vehicle() {
      return this.detail.vehicleInfo || {}
    },
    optionBreakdown() {
      return this.detail.optionBreakdown || this.vehicle.optionBreakdown || []
    },
    /** 仅尾款已支付（620）订单展示确认交付入口；650 及其他状态不展示 */
    canCompleteDelivery() {
      return Number(this.detail.orderState) === 620
    },
    /** 仅已交付（650）订单展示完成订单入口；900 及其他状态隐藏（OTD-VSO-DSN-CR-016） */
    canCompleteOrder() {
      return Number(this.detail.orderState) === 650
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.reload()
      }
    },
    orderId() {
      if (this.visible) {
        this.reload()
      }
    }
  },
  methods: {
    /** 重新打开时重置并加载基础信息 */
    reload() {
      this.activeTab = 'info'
      this.detail = {}
      this.timeline = []
      this.payments = []
      this.supplements = []
      this.refunds = []
      this.agreements = []
      this.delivery = null
      this.deliveryDialog.visible = false
      this.deliveryDialog.remark = ''
      this.deliveryDialog.submitting = false
      this.completeDialog.visible = false
      this.completeDialog.remark = ''
      this.completeDialog.submitting = false
      this.loadedTab = {}
      this.loadingTab = {}
      this.agreementDialog.visible = false
      if (!this.orderId) {
        return
      }
      this.detailLoading = true
      getOrderDetail(this.orderId)
        .then(response => {
          this.detail = response.data || {}
        })
        .catch(() => {})
        .then(() => {
          this.detailLoading = false
        })
    },
    /** tab 切换时按需加载 */
    handleTabClick() {
      this.loadTab(this.activeTab)
    },
    loadTab(name) {
      if (!this.orderId || this.loadedTab[name] || this.loadingTab[name] || name === 'info') {
        return
      }
      this.$set(this.loadingTab, name, true)
      let request = null
      if (name === 'timeline') {
        request = listOrderTimeline(this.orderId).then(response => {
          this.timeline = response.data || []
        })
      } else if (name === 'payments') {
        request = listOrderPayments(this.orderId).then(response => {
          this.payments = response.data || []
        })
      } else if (name === 'supplements') {
        request = listOrderSupplements(this.orderId).then(response => {
          this.supplements = response.data || []
        })
      } else if (name === 'refunds') {
        request = listOrderRefunds(this.orderId).then(response => {
          this.refunds = response.data || []
        })
      } else if (name === 'agreements') {
        request = listOrderAgreements(this.orderId).then(response => {
          this.agreements = response.data || []
        })
      } else if (name === 'delivery') {
        // 未创建预约时后端返回 data=null，属正常情况
        request = getOrderDelivery(this.orderId).then(response => {
          this.delivery = response.data || null
        })
      }
      if (!request) {
        this.$set(this.loadingTab, name, false)
        return
      }
      request
        .catch(() => {})
        .then(() => {
          this.$set(this.loadingTab, name, false)
          this.$set(this.loadedTab, name, true)
        })
    },
    showAgreement(row) {
      const intro = row.intro ? row.intro + '\n\n' : ''
      this.agreementDialog = {
        visible: true,
        title: (row.title || row.agreementCode) + '（V' + row.versionNo + '）',
        content: intro + (row.detail || '')
      }
    },
    /** 打开确认交付二次确认弹窗 */
    openCompleteDelivery() {
      if (!this.canCompleteDelivery) {
        return
      }
      this.deliveryDialog = {
        visible: true,
        remark: '',
        submitting: false
      }
    },
    /** 提交确认交付：成功后刷新详情、交付信息与时间线 */
    submitCompleteDelivery() {
      if (this.deliveryDialog.submitting) {
        return
      }
      this.deliveryDialog.submitting = true
      completeOrderDelivery(this.orderId, (this.deliveryDialog.remark || '').trim())
        .then(() => {
          this.$modal.msgSuccess('确认交付成功')
          this.deliveryDialog.visible = false
          this.refreshAfterDelivery()
        })
        .catch(() => {})
        .then(() => {
          this.deliveryDialog.submitting = false
        })
    },
    /** 交付成功后重新加载详情；时间线/交付信息缓存失效 */
    refreshAfterDelivery() {
      this.$set(this.loadedTab, 'delivery', false)
      this.$set(this.loadedTab, 'timeline', false)
      this.timeline = []
      this.detailLoading = true
      getOrderDetail(this.orderId)
        .then(response => {
          this.detail = response.data || {}
        })
        .catch(() => {})
        .then(() => {
          this.detailLoading = false
          this.activeTab = 'delivery'
          this.loadTab('delivery')
        })
    },
    /** 打开完成订单二次确认弹窗（仅 650） */
    openCompleteOrder() {
      if (!this.canCompleteOrder) {
        return
      }
      this.completeDialog = {
        visible: true,
        remark: '',
        submitting: false
      }
    },
    /** 提交完成订单：成功后刷新详情、交付信息与时间线 */
    submitCompleteOrder() {
      if (this.completeDialog.submitting) {
        return
      }
      this.completeDialog.submitting = true
      completeOrder(this.orderId, (this.completeDialog.remark || '').trim())
        .then(() => {
          this.$modal.msgSuccess('订单已完成')
          this.completeDialog.visible = false
          this.refreshAfterComplete()
        })
        .catch(() => {})
        .then(() => {
          this.completeDialog.submitting = false
        })
    },
    /** 办结成功后重新加载详情；时间线/交付信息缓存失效 */
    refreshAfterComplete() {
      this.$set(this.loadedTab, 'delivery', false)
      this.$set(this.loadedTab, 'timeline', false)
      this.timeline = []
      this.detailLoading = true
      getOrderDetail(this.orderId)
        .then(response => {
          this.detail = response.data || {}
        })
        .catch(() => {})
        .then(() => {
          this.detailLoading = false
          this.activeTab = 'info'
        })
    },
    /** 订单状态：字典优先，字典缺失时回退本地完整枚举映射 */
    stateText(state) {
      const dictList = (this.dict && this.dict.type && this.dict.type.iov_vehicle_sale_order_state) || []
      return orderStateLabel(state, dictList)
    },
    label(map, value) {
      if (value === null || value === undefined || value === '') {
        return '-'
      }
      return map[value] || value
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
      return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    tagType(status) {
      const key = String(status || '').toLowerCase()
      if (TAG_SUCCESS.indexOf(key) >= 0) {
        return 'success'
      }
      if (TAG_WARNING.indexOf(key) >= 0) {
        return 'warning'
      }
      if (TAG_DANGER.indexOf(key) >= 0) {
        return 'danger'
      }
      return 'info'
    }
  }
}
</script>

<style scoped>
.order-detail {
  padding: 0 20px 20px 20px;
  min-height: 200px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 12px;
}

.detail-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-title .text {
  font-size: 16px;
  font-weight: 600;
  margin-right: 12px;
}

.detail-title .order-no {
  color: #606266;
  margin-right: 12px;
}

.tab-body {
  min-height: 120px;
}

.delivery-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 18px 0 10px 0;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.timeline-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.timeline-desc span {
  display: block;
  color: #909399;
  font-size: 12px;
  line-height: 20px;
}

.inner-table {
  margin: 6px 12px;
}

.hint-inline {
  color: #c0c4cc;
  font-size: 12px;
}

.agreement-content {
  max-height: 60vh;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.6;
}
</style>
