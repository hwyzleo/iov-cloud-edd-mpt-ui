<template>
  <div class="app-container">
    <el-tabs v-model="activeType" @tab-click="handleTabChange">
      <el-tab-pane label="认证授权策略" name="auth" />
      <el-tab-pane label="流量治理策略" name="traffic" />
      <el-tab-pane label="灰度策略" name="canary" />
    </el-tabs>

    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true">
      <el-form-item label="策略名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入策略名称"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="enabled">
        <el-select v-model="queryParams.enabled" clearable placeholder="全部" style="width: 120px">
          <el-option label="启用" :value="true" />
          <el-option label="停用" :value="false" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['edd:sgw:policy:add']"
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['edd:sgw:policy:export']"
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
        >导出</el-button>
      </el-col>
      <right-toolbar :show-search.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="policyList">
      <el-table-column label="策略编码" prop="policyCode" min-width="150" />
      <el-table-column label="名称" prop="policyName" min-width="150" />
      <el-table-column label="状态" width="80" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.enabled ? 'success' : 'info'" size="mini">
            {{ scope.row.enabled ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="activeType === 'auth'" label="访问模式" width="120" align="center">
        <template slot-scope="scope">{{ accessModeText(scope.row.accessMode) }}</template>
      </el-table-column>
      <el-table-column v-if="activeType === 'auth'" label="客户端类型" min-width="140">
        <template slot-scope="scope">{{ joinText(scope.row.allowedClientTypes) }}</template>
      </el-table-column>
      <el-table-column v-if="activeType === 'auth'" label="scope / 权限点" min-width="220">
        <template slot-scope="scope">
          <div>scope：{{ joinText(scope.row.requiredScopes) }}</div>
          <div>权限点：{{ joinText(scope.row.requiredPermissions) }}</div>
        </template>
      </el-table-column>

      <el-table-column v-if="activeType === 'traffic'" label="超时(ms)" width="130" align="center">
        <template slot-scope="scope">
          {{ scope.row.connectTimeoutMillis }} / {{ scope.row.responseTimeoutMillis }}
        </template>
      </el-table-column>
      <el-table-column v-if="activeType === 'traffic'" label="限流规则" width="90" align="center">
        <template slot-scope="scope">{{ (scope.row.rateLimits || []).length }}</template>
      </el-table-column>
      <el-table-column v-if="activeType === 'traffic'" label="并发上限" width="90" align="center">
        <template slot-scope="scope">{{ scope.row.maxConcurrentRequests || '-' }}</template>
      </el-table-column>
      <el-table-column v-if="activeType === 'traffic'" label="熔断/重试" min-width="160">
        <template slot-scope="scope">
          <div>熔断：{{ scope.row.circuitBreaker ? '已配置' : '-' }}</div>
          <div>重试：{{ scope.row.retry ? ('最多 ' + scope.row.retry.maxAttempts + ' 次') : '-' }}</div>
        </template>
      </el-table-column>

      <el-table-column v-if="activeType === 'canary'" label="稳定键" width="150" align="center">
        <template slot-scope="scope">{{ stableKeyText(scope.row.stableKey) }}</template>
      </el-table-column>
      <el-table-column v-if="activeType === 'canary'" label="规则数" width="90" align="center">
        <template slot-scope="scope">{{ (scope.row.rules || []).length }}</template>
      </el-table-column>
      <el-table-column v-if="activeType === 'canary'" label="灰度目标" min-width="220">
        <template slot-scope="scope">{{ canaryTargetsText(scope.row) }}</template>
      </el-table-column>

      <el-table-column label="修改时间" width="170" align="center">
        <template slot-scope="scope">{{ parseTime(scope.row.modifyTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-hasPermi="['edd:sgw:policy:edit']"
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
          >修改</el-button>
          <el-button
            v-hasPermi="['edd:sgw:policy:add']"
            size="mini"
            type="text"
            icon="el-icon-copy-document"
            @click="handleCopy(scope.row)"
          >复制</el-button>
          <el-button
            v-hasPermi="['edd:sgw:policy:remove']"
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <policy-editor :visible.sync="open" :type="activeType" :policy-code="currentPolicyCode" @success="getList" />

    <el-dialog title="复制策略草稿" :visible.sync="copyOpen" width="480px" append-to-body>
      <el-form :model="copyForm" label-width="100px" size="small">
        <el-form-item label="源策略">
          <el-input :value="copyForm.sourceCode" disabled />
        </el-form-item>
        <el-form-item label="新编码" required>
          <el-input v-model="copyForm.newCode" placeholder="请输入新策略编码" />
        </el-form-item>
        <el-form-item label="新名称">
          <el-input v-model="copyForm.newName" placeholder="默认在原名称后追加副本" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" size="small" @click="submitCopy">确 定</el-button>
        <el-button size="small" @click="copyOpen = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { copyPolicy, delPolicy, listPolicy } from '@/api/edd/sgw/policy'
import { exportPolicies } from '@/api/edd/sgw/export'
import { ACCESS_MODES, STABLE_KEYS, labelOf } from '@/views/edd/sgw/sgw-options'
import PolicyEditor from '@/views/edd/sgw/components/PolicyEditor'

export default {
  name: 'SgwPolicy',
  components: { PolicyEditor },
  data() {
    return {
      activeType: 'auth',
      loading: false,
      showSearch: true,
      policyList: [],
      total: 0,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: null,
        enabled: null
      },
      open: false,
      currentPolicyCode: null,
      copyOpen: false,
      copyForm: {
        sourceCode: null,
        newCode: '',
        newName: ''
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listPolicy(this.activeType, {
        page: this.queryParams.pageNum,
        size: this.queryParams.pageSize,
        name: this.queryParams.name,
        enabled: this.queryParams.enabled
      }).then(response => {
        this.policyList = response.data ? response.data.items : []
        this.total = response.data ? response.data.total : 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    handleTabChange() {
      this.queryParams.pageNum = 1
      this.policyList = []
      this.total = 0
      this.getList()
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.queryParams.enabled = null
      this.handleQuery()
    },
    handleAdd() {
      this.currentPolicyCode = null
      this.open = true
    },
    handleUpdate(row) {
      this.currentPolicyCode = row.policyCode
      this.open = true
    },
    handleCopy(row) {
      this.copyForm = {
        sourceCode: row.policyCode,
        newCode: '',
        newName: ''
      }
      this.copyOpen = true
    },
    submitCopy() {
      if (!this.copyForm.newCode) {
        this.$modal.msgWarning('请输入新策略编码')
        return
      }
      copyPolicy(this.activeType, this.copyForm.sourceCode, {
        newCode: this.copyForm.newCode,
        newName: this.copyForm.newName
      }).then(() => {
        this.$modal.msgSuccess('复制成功（草稿）')
        this.copyOpen = false
        this.getList()
      })
    },
    handleDelete(row) {
      this.$modal.confirm('是否确认删除策略草稿"' + row.policyCode + '"？策略仍被路由引用时会被拒绝。').then(() => {
        return delPolicy(this.activeType, row.policyCode)
      }).then(() => {
        this.$modal.msgSuccess('删除成功（草稿）')
        this.getList()
      }).catch(() => {})
    },
    handleExport() {
      exportPolicies(this.activeType).then(() => {
        this.$modal.msgSuccess('导出完成')
      }).catch(() => {})
    },
    accessModeText(mode) {
      return labelOf(ACCESS_MODES, mode)
    },
    stableKeyText(key) {
      return labelOf(STABLE_KEYS, key)
    },
    joinText(values) {
      return Array.isArray(values) && values.length ? values.join(', ') : '-'
    },
    canaryTargetsText(row) {
      const rules = Array.isArray(row.rules) ? row.rules : []
      const targets = []
      rules.forEach(rule => {
        (rule.targets || []).forEach(target => {
          const value = target.type === 'SERVICE' ? target.serviceId : target.uri
          if (value) {
            targets.push(value + '(' + target.weight + '%)')
          }
        })
      })
      return targets.length ? targets.join(', ') : '-'
    }
  }
}
</script>
