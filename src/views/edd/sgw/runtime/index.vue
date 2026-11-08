<template>
  <div class="app-container">
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="仅展示服务发现中的实例与配置版本状态；容器日志与集中监控不在本基线范围。"
      style="margin-bottom: 12px"
    />
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['edd:sgw:runtime:list']"
          type="primary"
          plain
          icon="el-icon-refresh"
          size="mini"
          :loading="loading"
          @click="getList"
        >刷新</el-button>
      </el-col>
      <right-toolbar :show-search.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="instanceList">
      <el-table-column label="实例" prop="instanceId" min-width="180" />
      <el-table-column label="地址" prop="address" min-width="160" />
      <el-table-column label="服务发现" width="100" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.discovered ? 'success' : 'info'" size="mini">
            {{ scope.row.discovered ? '在线' : '离线' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="生效版本" width="100" align="center">
        <template slot-scope="scope">
          {{ scope.row.activeVersionNo ? ('v' + scope.row.activeVersionNo) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="最近发布状态" width="150" align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.lastPublicationStatus" :type="statusTagType(scope.row.lastPublicationStatus)" size="mini">
            {{ statusLabel(scope.row.lastPublicationStatus) }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="最近发布时间" width="170" align="center">
        <template slot-scope="scope">{{ parseTime(scope.row.lastPublicationTime) }}</template>
      </el-table-column>
      <el-table-column label="最近发布ID" min-width="200">
        <template slot-scope="scope">{{ scope.row.lastPublicationId || '-' }}</template>
      </el-table-column>
      <el-table-column label="最近错误" prop="lastError" :show-overflow-tooltip="true" min-width="180" />
    </el-table>
    <el-empty v-if="!loading && !instanceList.length" description="未发现运行中的服务网关实例" :image-size="80" />
  </div>
</template>

<script>
import { listRuntimeInstances } from '@/api/edd/sgw/runtime'
import { publicationStatusLabel, statusTagType } from '@/views/edd/sgw/sgw-options'

export default {
  name: 'SgwRuntime',
  data() {
    return {
      loading: false,
      showSearch: true,
      instanceList: []
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listRuntimeInstances().then(response => {
        this.instanceList = Array.isArray(response.data) ? response.data : []
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    statusLabel(status) {
      return publicationStatusLabel(status)
    },
    statusTagType(status) {
      return statusTagType(status)
    }
  }
}
</script>
