<template>
  <div class="app-container">
    <el-card shadow="never" style="margin-bottom: 16px">
      <div slot="header" class="clearfix">
        <span>当前配置工作区</span>
        <el-button style="float: right; padding: 3px 0" type="text" icon="el-icon-refresh" @click="loadAll">
          刷新
        </el-button>
      </div>
      <el-descriptions v-if="workspace" :column="3" border size="small">
        <el-descriptions-item label="草稿修订号">{{ workspace.draftRevision }}</el-descriptions-item>
        <el-descriptions-item label="当前目标版本">{{ workspace.targetVersionNo || '未发布' }}</el-descriptions-item>
        <el-descriptions-item label="说明">发布后线上生效；草稿修改不影响当前流量</el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="暂无工作区信息" :image-size="60" />
    </el-card>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['edd:sgw:config:publish']"
          type="primary"
          plain
          icon="el-icon-upload2"
          size="mini"
          :loading="publishLoading"
          @click="handlePublish"
        >发布当前草稿</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['edd:sgw:config:query']"
          type="info"
          plain
          icon="el-icon-s-operation"
          size="mini"
          @click="handleOpenDiff"
        >版本对比</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['edd:sgw:config:query']"
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
        >导出配置</el-button>
      </el-col>
      <right-toolbar :show-search.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="versionList">
      <el-table-column label="版本号" prop="versionNo" width="90" align="center" />
      <el-table-column label="操作类型" width="100" align="center">
        <template slot-scope="scope">{{ operationText(scope.row.operation) }}</template>
      </el-table-column>
      <el-table-column label="当前" width="80" align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.current" type="success" size="mini">生效中</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="来源版本" prop="sourceVersionNo" width="100" align="center">
        <template slot-scope="scope">{{ scope.row.sourceVersionNo || '-' }}</template>
      </el-table-column>
      <el-table-column label="校验和" width="140" align="center">
        <template slot-scope="scope">
          <span :title="scope.row.checksum">{{ shortChecksum(scope.row.checksum) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="说明" prop="description" :show-overflow-tooltip="true" min-width="160" />
      <el-table-column label="创建者" prop="createBy" width="120" align="center" />
      <el-table-column label="创建时间" width="170" align="center">
        <template slot-scope="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="170" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-hasPermi="['edd:sgw:config:query']"
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleDetail(scope.row)"
          >详情</el-button>
          <el-button
            v-hasPermi="['edd:sgw:config:rollback']"
            size="mini"
            type="text"
            icon="el-icon-refresh-left"
            :disabled="scope.row.current"
            @click="handleRollback(scope.row)"
          >回滚</el-button>
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

    <el-dialog title="版本详情" :visible.sync="detailOpen" width="1100px" append-to-body>
      <div v-if="detail">
        <el-descriptions :column="4" border size="small" style="margin-bottom: 12px">
          <el-descriptions-item label="版本号">{{ detail.versionNo }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">{{ operationText(detail.operation) }}</el-descriptions-item>
          <el-descriptions-item label="来源版本">{{ detail.sourceVersionNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="是否生效">{{ detail.current ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="校验和" :span="2">{{ detail.checksum }}</el-descriptions-item>
          <el-descriptions-item label="创建者">{{ detail.createBy || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ parseTime(detail.createTime) }}</el-descriptions-item>
        </el-descriptions>
        <version-snapshot :snapshot="detail.snapshot" />
      </div>
    </el-dialog>

    <el-dialog title="版本对比" :visible.sync="diffOpen" width="900px" append-to-body>
      <el-form :inline="true" size="small">
        <el-form-item label="起始版本">
          <el-select v-model="diffForm.from" filterable placeholder="选择版本" style="width: 140px">
            <el-option v-for="version in allVersions" :key="'from-' + version.versionNo" :label="'v' + version.versionNo" :value="version.versionNo" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标版本">
          <el-select v-model="diffForm.to" filterable placeholder="选择版本" style="width: 140px">
            <el-option v-for="version in allVersions" :key="'to-' + version.versionNo" :label="'v' + version.versionNo" :value="version.versionNo" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="mini" icon="el-icon-s-operation" @click="loadDiff">对 比</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="diffItems" size="mini" max-height="420">
        <el-table-column label="对象类型" width="140" align="center">
          <template slot-scope="scope">{{ objectTypeText(scope.row.objectType) }}</template>
        </el-table-column>
        <el-table-column label="编码" prop="code" min-width="180" />
        <el-table-column label="变化" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="changeTagType(scope.row.changeType)" size="mini">
              {{ changeTypeText(scope.row.changeType) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!diffItems.length" description="暂无差异或尚未对比" :image-size="60" />
    </el-dialog>

    <publication-detail :visible.sync="publicationOpen" :publication-id="publicationId" />
  </div>
</template>

<script>
import {
  diffConfigVersions,
  getConfigVersion,
  getWorkspace,
  listConfigVersions,
  publishConfig,
  rollbackConfig
} from '@/api/edd/sgw/configVersion'
import { exportConfig } from '@/api/edd/sgw/export'
import VersionSnapshot from '@/views/edd/sgw/components/VersionSnapshot'
import PublicationDetail from '@/views/edd/sgw/components/PublicationDetail'
import { CHANGE_TYPES, CONFIG_OPERATIONS, OBJECT_TYPES } from '@/views/edd/sgw/sgw-options'

export default {
  name: 'SgwConfigVersion',
  components: { VersionSnapshot, PublicationDetail },
  data() {
    return {
      loading: false,
      showSearch: true,
      workspace: null,
      versionList: [],
      allVersions: [],
      total: 0,
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      detailOpen: false,
      detail: null,
      diffOpen: false,
      diffForm: {
        from: null,
        to: null
      },
      diffItems: [],
      publishLoading: false,
      publicationOpen: false,
      publicationId: null
    }
  },
  created() {
    this.loadAll()
  },
  methods: {
    loadAll() {
      this.getWorkspace()
      this.getList()
    },
    getWorkspace() {
      getWorkspace().then(response => {
        this.workspace = response.data
      })
    },
    getList() {
      this.loading = true
      listConfigVersions({
        page: this.queryParams.pageNum,
        size: this.queryParams.pageSize
      }).then(response => {
        this.versionList = response.data ? response.data.items : []
        this.total = response.data ? response.data.total : 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    handlePublish() {
      if (!this.workspace) {
        this.$modal.msgWarning('工作区信息未加载')
        return
      }
      this.$modal.confirm(
        '是否确认发布当前草稿（修订号 ' + this.workspace.draftRevision + '）？发布后各实例加载成功才会生效。'
      ).then(() => {
        this.publishLoading = true
        return publishConfig({ draftRevision: this.workspace.draftRevision })
      }).then(response => {
        this.publishLoading = false
        this.$modal.msgSuccess('已提交发布，正在等待实例确认')
        this.publicationId = response.data.publicationId
        this.publicationOpen = true
        this.loadAll()
      }).catch(() => {
        this.publishLoading = false
      })
    },
    handleRollback(row) {
      if (!this.workspace) {
        this.$modal.msgWarning('工作区信息未加载')
        return
      }
      this.$modal.confirm(
        '是否确认回滚到版本 v' + row.versionNo + '？将创建新的回滚版本并发布，历史版本不受影响。'
      ).then(() => {
        return rollbackConfig(row.versionNo, { draftRevision: this.workspace.draftRevision })
      }).then(response => {
        this.$modal.msgSuccess('已提交回滚发布')
        this.publicationId = response.data.publicationId
        this.publicationOpen = true
        this.loadAll()
      }).catch(() => {})
    },
    handleDetail(row) {
      getConfigVersion(row.versionNo).then(response => {
        this.detail = response.data
        this.detailOpen = true
      })
    },
    handleOpenDiff() {
      this.diffItems = []
      this.diffOpen = true
      listConfigVersions({ page: 1, size: 200 }).then(response => {
        this.allVersions = response.data ? response.data.items : []
        if (this.allVersions.length >= 2) {
          this.diffForm.from = this.allVersions[1].versionNo
          this.diffForm.to = this.allVersions[0].versionNo
        }
      })
    },
    loadDiff() {
      if (this.diffForm.from === null || this.diffForm.to === null) {
        this.$modal.msgWarning('请选择起始版本与目标版本')
        return
      }
      diffConfigVersions(this.diffForm.from, this.diffForm.to).then(response => {
        this.diffItems = response.data && Array.isArray(response.data.items) ? response.data.items : []
      })
    },
    handleExport() {
      exportConfig().then(() => {
        this.$modal.msgSuccess('导出完成')
      }).catch(() => {})
    },
    operationText(operation) {
      return CONFIG_OPERATIONS[operation] || operation
    },
    shortChecksum(checksum) {
      return checksum ? checksum.substring(0, 12) + '…' : '-'
    },
    objectTypeText(type) {
      return OBJECT_TYPES[type] || type
    },
    changeTypeText(type) {
      return CHANGE_TYPES[type] || type
    },
    changeTagType(type) {
      return type === 'ADDED' ? 'success' : (type === 'REMOVED' ? 'danger' : 'warning')
    }
  }
}
</script>
