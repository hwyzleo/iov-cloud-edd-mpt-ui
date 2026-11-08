<template>
  <div class="app-container">
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true">
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="全部" style="width: 150px">
          <el-option v-for="(label, value) in statuses" :key="value" :label="label" :value="value" />
        </el-select>
      </el-form-item>
      <el-form-item label="目标版本" prop="targetVersionNo">
        <el-input
          v-model="queryParams.targetVersionNo"
          placeholder="版本号"
          clearable
          style="width: 120px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar :show-search.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="publicationList">
      <el-table-column label="发布ID" min-width="220">
        <template slot-scope="scope">
          <span :title="scope.row.publicationId">{{ shortId(scope.row.publicationId) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="90" align="center">
        <template slot-scope="scope">{{ typeText(scope.row.type) }}</template>
      </el-table-column>
      <el-table-column label="目标版本" prop="targetVersionNo" width="90" align="center" />
      <el-table-column label="来源版本" width="90" align="center">
        <template slot-scope="scope">{{ scope.row.sourceVersionNo || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="140" align="center">
        <template slot-scope="scope">
          <el-tag :type="statusTagType(scope.row.status)" size="mini">
            {{ statusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="实例结果" width="110" align="center">
        <template slot-scope="scope">{{ instanceSummary(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="操作者" prop="actor" width="110" align="center" />
      <el-table-column label="创建时间" width="170" align="center">
        <template slot-scope="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="失败信息" prop="errorMessage" :show-overflow-tooltip="true" min-width="160" />
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-hasPermi="['edd:sgw:publication:query']"
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleDetail(scope.row)"
          >详情</el-button>
          <el-button
            v-if="retryable(scope.row)"
            v-hasPermi="['edd:sgw:publication:retry']"
            size="mini"
            type="text"
            icon="el-icon-refresh-right"
            @click="handleRetry(scope.row)"
          >重试</el-button>
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

    <publication-detail :visible.sync="detailOpen" :publication-id="publicationId" @success="getList" />
  </div>
</template>

<script>
import { listPublications, retryPublication } from '@/api/edd/sgw/publication'
import PublicationDetail from '@/views/edd/sgw/components/PublicationDetail'
import {
  INSTANCE_STATUS,
  PUBLICATION_STATUS,
  PUBLICATION_TYPES,
  isRetryableStatus,
  publicationStatusLabel,
  statusTagType
} from '@/views/edd/sgw/sgw-options'

export default {
  name: 'SgwPublication',
  components: { PublicationDetail },
  data() {
    return {
      loading: false,
      showSearch: true,
      publicationList: [],
      total: 0,
      statuses: PUBLICATION_STATUS,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        status: null,
        targetVersionNo: null
      },
      detailOpen: false,
      publicationId: null
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listPublications({
        page: this.queryParams.pageNum,
        size: this.queryParams.pageSize,
        status: this.queryParams.status,
        targetVersionNo: this.queryParams.targetVersionNo || null
      }).then(response => {
        this.publicationList = response.data ? response.data.items : []
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
      this.queryParams.status = null
      this.queryParams.targetVersionNo = null
      this.handleQuery()
    },
    handleDetail(row) {
      this.publicationId = row.publicationId
      this.detailOpen = true
    },
    handleRetry(row) {
      this.$modal.confirm('是否确认重试该发布？将创建新的发布尝试，不改变目标版本内容。').then(() => {
        return retryPublication(row.publicationId)
      }).then(response => {
        this.$modal.msgSuccess('已创建重试发布')
        this.publicationId = response.data.publicationId
        this.detailOpen = true
        this.getList()
      }).catch(() => {})
    },
    retryable(row) {
      return isRetryableStatus(row.status)
    },
    statusLabel(status) {
      return publicationStatusLabel(status)
    },
    statusTagType(status) {
      return statusTagType(status)
    },
    typeText(type) {
      return PUBLICATION_TYPES[type] || type
    },
    shortId(id) {
      return id ? id.substring(0, 18) + '…' : '-'
    },
    instanceSummary(row) {
      const instances = Array.isArray(row.instances) ? row.instances : []
      if (!instances.length) {
        return '-'
      }
      const succeeded = instances.filter(item => item.status === 'SUCCEEDED').length
      return succeeded + '/' + instances.length + ' 成功'
    },
    instanceStatusLabel(status) {
      return INSTANCE_STATUS[status] || status
    }
  }
}
</script>
