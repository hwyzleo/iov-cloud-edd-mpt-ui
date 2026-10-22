<template>
  <div class="app-container">
    <el-page-header style="margin-bottom: 16px;" content="业务密钥开通批次阻塞治理" @back="goBack" />
    <blocking-governance ref="governance" :request-id="routeRequestId" :certificate-request-id="routeCertificateRequestId" />
  </div>
</template>

<script>
import BlockingGovernance from './blockingGovernance'

/**
 * 业务密钥开通批次——运维"一键清理阻塞"独立治理页（VMD-DSN-CR-065）。
 *
 * 支持从告警/监控按 requestId 深链跳转：
 *   - ?requestId=xxx              真实开通批次 requestId（kp-*），直接进入诊断
 *   - ?certificateRequestId=xxx   证书申请 requestId（MPT-CERT-*），先证书维度寻址再定位批次
 * 两套 ID 不得混用（后端诊断/清理接口仅接受 kp-*）。
 * 页面仅做 UI 编排，权限（vmd:security:businessKey:provisioning:query/terminate）
 * 由按钮 v-hasPermi 与服务端 RBAC 双重约束。
 */
export default {
  name: 'BusinessKeyProvisioning',
  components: { BlockingGovernance },
  data() {
    return {
      routeRequestId: '',
      routeCertificateRequestId: ''
    }
  },
  watch: {
    // 深链参数变化时自动刷新（如从告警以新 requestId 跳转）
    '$route.query.requestId': {
      handler(val) {
        this.routeRequestId = (val || '').trim()
      },
      immediate: true
    },
    '$route.query.certificateRequestId': {
      handler(val) {
        this.routeCertificateRequestId = (val || '').trim()
      },
      immediate: true
    }
  },
  methods: {
    goBack() {
      this.$router.go(-1)
    }
  }
}
</script>
