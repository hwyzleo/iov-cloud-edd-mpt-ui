<template>
  <el-tabs v-model="activeTab" type="border-card">
    <el-tab-pane label="路由" name="routes">
      <el-table :data="routes" size="mini" max-height="420">
        <el-table-column label="编码" prop="routeCode" min-width="140" />
        <el-table-column label="名称" prop="routeName" min-width="140" />
        <el-table-column label="优先级" prop="priority" width="80" align="center" />
        <el-table-column label="状态" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.enabled ? 'success' : 'info'" size="mini">
              {{ scope.row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="匹配路径" min-width="180">
          <template slot-scope="scope">
            {{ (scope.row.match && scope.row.match.paths ? scope.row.match.paths : []).join(', ') }}
          </template>
        </el-table-column>
        <el-table-column label="方法" width="140">
          <template slot-scope="scope">
            {{ (scope.row.match && scope.row.match.methods ? scope.row.match.methods : []).join(', ') }}
          </template>
        </el-table-column>
        <el-table-column label="目标" min-width="180">
          <template slot-scope="scope">
            {{ targetLabel(scope.row.target) }}
          </template>
        </el-table-column>
        <el-table-column label="策略引用" min-width="180">
          <template slot-scope="scope">
            <div>认证：{{ scope.row.authPolicyCode || '-' }}</div>
            <div>流量：{{ scope.row.trafficPolicyCode || '-' }}</div>
            <div>灰度：{{ scope.row.canaryPolicyCode || '-' }}</div>
          </template>
        </el-table-column>
      </el-table>
    </el-tab-pane>

    <el-tab-pane label="认证授权策略" name="auth">
      <el-table :data="authPolicies" size="mini" max-height="420">
        <el-table-column label="编码" prop="policyCode" min-width="140" />
        <el-table-column label="名称" prop="policyName" min-width="140" />
        <el-table-column label="访问模式" width="120" align="center">
          <template slot-scope="scope">{{ accessModeLabel(scope.row.accessMode) }}</template>
        </el-table-column>
        <el-table-column label="客户端类型" min-width="140">
          <template slot-scope="scope">{{ (scope.row.allowedClientTypes || []).join(', ') }}</template>
        </el-table-column>
        <el-table-column label="scope" min-width="160">
          <template slot-scope="scope">{{ (scope.row.requiredScopes || []).join(', ') }}</template>
        </el-table-column>
        <el-table-column label="权限点" min-width="160">
          <template slot-scope="scope">{{ (scope.row.requiredPermissions || []).join(', ') }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.enabled ? 'success' : 'info'" size="mini">
              {{ scope.row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-tab-pane>

    <el-tab-pane label="流量治理策略" name="traffic">
      <el-table :data="trafficPolicies" size="mini" max-height="420">
        <el-table-column label="编码" prop="policyCode" min-width="140" />
        <el-table-column label="名称" prop="policyName" min-width="140" />
        <el-table-column label="连接超时(ms)" prop="connectTimeoutMillis" width="120" align="center" />
        <el-table-column label="响应超时(ms)" prop="responseTimeoutMillis" width="120" align="center" />
        <el-table-column label="限流规则" width="100" align="center">
          <template slot-scope="scope">{{ (scope.row.rateLimits || []).length }}</template>
        </el-table-column>
        <el-table-column label="并发上限" prop="maxConcurrentRequests" width="100" align="center" />
        <el-table-column label="熔断" width="90" align="center">
          <template slot-scope="scope">{{ scope.row.circuitBreaker ? '已配置' : '-' }}</template>
        </el-table-column>
        <el-table-column label="重试" width="90" align="center">
          <template slot-scope="scope">
            {{ scope.row.retry ? ('最多 ' + scope.row.retry.maxAttempts + ' 次') : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.enabled ? 'success' : 'info'" size="mini">
              {{ scope.row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-tab-pane>

    <el-tab-pane label="灰度策略" name="canary">
      <el-table :data="canaryPolicies" size="mini" max-height="420">
        <el-table-column label="编码" prop="policyCode" min-width="140" />
        <el-table-column label="名称" prop="policyName" min-width="140" />
        <el-table-column label="稳定键" width="150" align="center">
          <template slot-scope="scope">{{ stableKeyLabel(scope.row.stableKey) }}</template>
        </el-table-column>
        <el-table-column label="规则数" width="90" align="center">
          <template slot-scope="scope">{{ (scope.row.rules || []).length }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.enabled ? 'success' : 'info'" size="mini">
              {{ scope.row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-tab-pane>
  </el-tabs>
</template>

<script>
import { ACCESS_MODES, STABLE_KEYS, labelOf } from '@/views/edd/sgw/sgw-options'

export default {
  name: 'SgwVersionSnapshot',
  props: {
    snapshot: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      activeTab: 'routes'
    }
  },
  computed: {
    routes() {
      return this.snapshot && Array.isArray(this.snapshot.routes) ? this.snapshot.routes : []
    },
    authPolicies() {
      return this.snapshot && Array.isArray(this.snapshot.authPolicies) ? this.snapshot.authPolicies : []
    },
    trafficPolicies() {
      return this.snapshot && Array.isArray(this.snapshot.trafficPolicies) ? this.snapshot.trafficPolicies : []
    },
    canaryPolicies() {
      return this.snapshot && Array.isArray(this.snapshot.canaryPolicies) ? this.snapshot.canaryPolicies : []
    }
  },
  methods: {
    targetLabel(target) {
      if (!target) {
        return '-'
      }
      if (target.type === 'SERVICE') {
        return 'SERVICE → ' + target.serviceId
      }
      return target.type + ' → ' + target.uri
    },
    accessModeLabel(mode) {
      return labelOf(ACCESS_MODES, mode)
    },
    stableKeyLabel(key) {
      return labelOf(STABLE_KEYS, key)
    }
  }
}
</script>
