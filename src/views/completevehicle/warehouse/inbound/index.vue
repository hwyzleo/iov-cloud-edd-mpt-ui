<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane v-if="hasPreInboundPermission" label="入库预报" name="preInbound">
        <pre-inbound-order v-if="activeTab === 'preInbound'"/>
      </el-tab-pane>
      <el-tab-pane v-if="hasInboundTaskPermission" label="到货通知" name="inboundTask">
        <inbound-task v-if="activeTab === 'inboundTask'"/>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import PreInboundOrder from '@/views/completevehicle/warehouse/pdcpreinboundorder/index'
import InboundTask from '@/views/completevehicle/warehouse/inboundtask/index'

/**
 * 入库管理容器页（OTD-WMS-DSN-CR-003 术语更正）
 * <p>
 * 一个入口聚合两类入库单据，按权限分别可见：
 * - 入库预报：车辆在工厂下线时的首次到库预报（PENDING_ARRIVAL → ARRIVED → COMPLETED）
 * - 到货通知：承运方交车后告知某仓库将到货（PENDING → ARRIVED → COMPLETED），与仓库层级无关
 */
export default {
  name: "InboundManage",
  components: {PreInboundOrder, InboundTask},
  data() {
    return {
      activeTab: 'preInbound'
    };
  },
  computed: {
    /** 入库预报权限（沿用预入库单权限点） */
    hasPreInboundPermission() {
      return this.$auth && this.$auth.hasPermi
        ? this.$auth.hasPermi('completeVehicle:warehouse:preInboundOrder:list')
        : false;
    },
    /** 到货通知权限 */
    hasInboundTaskPermission() {
      return this.$auth && this.$auth.hasPermi
        ? this.$auth.hasPermi('completeVehicle:warehouse:inboundTask:list')
        : false;
    }
  },
  created() {
    this.activeTab = this.hasPreInboundPermission ? 'preInbound'
      : (this.hasInboundTaskPermission ? 'inboundTask' : 'preInbound');
  },
  methods: {
    handleTabClick() {
      // 切换页签时由子组件自行加载数据（v-if 重新挂载）
    }
  }
};
</script>
