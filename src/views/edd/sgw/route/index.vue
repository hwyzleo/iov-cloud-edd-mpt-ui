<template>
  <div class="app-container">
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true">
      <el-form-item label="路由名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入路由名称"
          clearable
          style="width: 160px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="enabled">
        <el-select v-model="queryParams.enabled" clearable placeholder="全部" style="width: 120px">
          <el-option label="启用" :value="true" />
          <el-option label="停用" :value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="目标" prop="target">
        <el-input
          v-model="queryParams.target"
          placeholder="服务ID或直连主机"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="客户端类型" prop="clientType">
        <el-select v-model="queryParams.clientType" clearable placeholder="全部" style="width: 140px">
          <el-option v-for="item in clientTypes" :key="item.value" :label="item.label" :value="item.value" />
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
          v-hasPermi="['edd:sgw:route:add']"
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['edd:sgw:route:export']"
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
        >导出</el-button>
      </el-col>
      <right-toolbar :show-search.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="routeList">
      <el-table-column label="路由编码" prop="routeCode" min-width="150" />
      <el-table-column label="名称" prop="routeName" min-width="140" />
      <el-table-column label="优先级" prop="priority" width="80" align="center" />
      <el-table-column label="状态" width="80" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.enabled ? 'success' : 'info'" size="mini">
            {{ scope.row.enabled ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="匹配" min-width="200">
        <template slot-scope="scope">
          <div>{{ matchPaths(scope.row) }}</div>
          <div class="sgw-sub-text">{{ matchMethods(scope.row) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="目标" min-width="180">
        <template slot-scope="scope">{{ targetText(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="策略引用" min-width="170">
        <template slot-scope="scope">
          <div>认证：{{ scope.row.authPolicyCode || '-' }}</div>
          <div>流量：{{ scope.row.trafficPolicyCode || '-' }}</div>
          <div>灰度：{{ scope.row.canaryPolicyCode || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="修改时间" width="170" align="center">
        <template slot-scope="scope">{{ parseTime(scope.row.modifyTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-hasPermi="['edd:sgw:route:edit']"
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
          >修改</el-button>
          <el-button
            v-hasPermi="['edd:sgw:route:add']"
            size="mini"
            type="text"
            icon="el-icon-copy-document"
            @click="handleCopy(scope.row)"
          >复制</el-button>
          <el-button
            v-hasPermi="['edd:sgw:route:remove']"
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

    <route-editor :visible.sync="open" :route-code="currentRouteCode" @success="getList" />

    <el-dialog title="复制路由草稿" :visible.sync="copyOpen" width="480px" append-to-body>
      <el-form :model="copyForm" label-width="100px" size="small">
        <el-form-item label="源路由">
          <el-input :value="copyForm.sourceCode" disabled />
        </el-form-item>
        <el-form-item label="新编码" required>
          <el-input v-model="copyForm.newCode" placeholder="请输入新路由编码" />
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
import { copyRoute, delRoute, listRoute } from '@/api/edd/sgw/route'
import { exportRoutes } from '@/api/edd/sgw/export'
import { CLIENT_TYPES } from '@/views/edd/sgw/sgw-options'
import RouteEditor from '@/views/edd/sgw/components/RouteEditor'

export default {
  name: 'SgwRoute',
  components: { RouteEditor },
  data() {
    return {
      loading: false,
      showSearch: true,
      routeList: [],
      total: 0,
      clientTypes: CLIENT_TYPES,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: null,
        enabled: null,
        target: null,
        clientType: null
      },
      open: false,
      currentRouteCode: null,
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
      listRoute({
        page: this.queryParams.pageNum,
        size: this.queryParams.pageSize,
        name: this.queryParams.name,
        enabled: this.queryParams.enabled,
        target: this.queryParams.target,
        clientType: this.queryParams.clientType
      }).then(response => {
        this.routeList = response.data ? response.data.items : []
        this.total = response.data ? response.data.total : 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
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
      this.currentRouteCode = null
      this.open = true
    },
    handleUpdate(row) {
      this.currentRouteCode = row.routeCode
      this.open = true
    },
    handleCopy(row) {
      this.copyForm = {
        sourceCode: row.routeCode,
        newCode: '',
        newName: ''
      }
      this.copyOpen = true
    },
    submitCopy() {
      if (!this.copyForm.newCode) {
        this.$modal.msgWarning('请输入新路由编码')
        return
      }
      copyRoute(this.copyForm.sourceCode, {
        newCode: this.copyForm.newCode,
        newName: this.copyForm.newName
      }).then(() => {
        this.$modal.msgSuccess('复制成功（草稿）')
        this.copyOpen = false
        this.getList()
      })
    },
    handleDelete(row) {
      this.$modal.confirm('是否确认删除路由草稿"' + row.routeCode + '"？').then(() => {
        return delRoute(row.routeCode)
      }).then(() => {
        this.$modal.msgSuccess('删除成功（草稿）')
        this.getList()
      }).catch(() => {})
    },
    handleExport() {
      exportRoutes().then(() => {
        this.$modal.msgSuccess('导出完成')
      }).catch(() => {})
    },
    matchPaths(row) {
      const paths = row.match && row.match.paths ? row.match.paths : []
      return paths.length ? paths.join(', ') : '-'
    },
    matchMethods(row) {
      const methods = row.match && row.match.methods ? row.match.methods : []
      const clientTypes = row.match && row.match.clientTypes ? row.match.clientTypes : []
      const parts = []
      if (methods.length) {
        parts.push(methods.join('/'))
      }
      if (clientTypes.length) {
        parts.push('客户端：' + clientTypes.join('/'))
      }
      return parts.join('　') || '不限方法'
    },
    targetText(row) {
      if (!row.target) {
        return '-'
      }
      if (row.target.type === 'SERVICE') {
        return '服务发现 → ' + (row.target.serviceId || '-')
      }
      return row.target.type + ' → ' + (row.target.uri || '-')
    }
  }
}
</script>

<style scoped>
.sgw-sub-text {
  color: #909399;
  font-size: 12px;
  margin-top: 2px;
}
</style>
