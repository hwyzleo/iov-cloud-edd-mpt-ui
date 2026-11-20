<template>
  <div class="app-container">
    <!-- 筛选：范围 + 内容语言 + 标题/版本 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="协议类型" prop="agreementType">
        <el-select v-model="queryParams.agreementType" placeholder="全部" clearable style="width: 140px">
          <el-option
            v-for="type in metadata.agreementTypes"
            :key="type"
            :label="agreementTypeLabel(type)"
            :value="type"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="内容语言" prop="locale">
        <el-select v-model="queryParams.locale" placeholder="全部内容语言" clearable style="width: 170px">
          <el-option
            v-for="locale in metadata.locales"
            :key="locale"
            :label="localeLabel(locale)"
            :value="locale"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="市场" prop="market">
        <el-select v-model="queryParams.market" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="market in metadata.markets" :key="market" :label="market" :value="market" />
        </el-select>
      </el-form-item>
      <el-form-item label="品牌" prop="brandCode">
        <el-select v-model="queryParams.brandCode" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="brand in metadata.brands" :key="brand" :label="brand" :value="brand" />
        </el-select>
      </el-form-item>
      <el-form-item label="车系" prop="carLineCode">
        <el-select v-model="queryParams.carLineCode" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="carLine in metadata.carLines" :key="carLine" :label="carLine" :value="carLine" />
        </el-select>
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="标题模糊匹配"
          clearable
          style="width: 160px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="业务版本" prop="version">
        <el-input
          v-model="queryParams.version"
          placeholder="精确匹配"
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
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleCreate"
          v-hasPermi="['mkt:cms:agreement:add']"
        >新增协议内容
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-upload2"
          size="mini"
          @click="handlePublish"
          v-hasPermi="['mkt:cms:agreement:publish']"
        >发布协议包
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-refresh"
          size="mini"
          @click="refreshCurrent"
        >刷新当前包
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 当前发布包（按筛选范围精确查询；无当前包时明确提示，不跨语言/市场回退） -->
    <el-card v-if="currentBundle" class="mb8" shadow="never">
      <div slot="header">
        <span>当前发布包</span>
        <el-tag size="mini" type="success" style="margin-left: 8px">{{ currentBundle.bundleId }}</el-tag>
        <span style="float: right; color: #909399">{{ timeText(currentBundle.publishedAt) }}</span>
      </div>
      <el-row :gutter="12">
        <el-col :span="12" v-for="item in currentBundle.agreements" :key="item.revisionId">
          <div class="agreement-item">
            <div>
              <el-tag size="mini">{{ agreementTypeLabel(item.agreementType) }}</el-tag>
              <span style="margin-left: 8px">{{ item.title }} · V{{ item.version }}</span>
            </div>
            <div class="agreement-meta">
              <span>{{ localeLabel(item.locale) }}</span>
              <span>{{ item.revisionId }}</span>
              <span>{{ item.contentHash }}</span>
            </div>
            <el-button type="text" size="mini" @click="handleViewCurrent(item)">查看正文</el-button>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-alert
      v-else-if="currentChecked"
      title="当前范围没有已发布的协议包"
      type="info"
      :closable="false"
      show-icon
      class="mb8"
    />

    <el-tabs v-model="activeTab" @tab-click="handleTabChange">
      <!-- 草稿 -->
      <el-tab-pane label="草稿" name="draft">
        <el-table v-loading="loading" :data="draftList">
          <el-table-column label="类型" align="center" width="110">
            <template slot-scope="scope">
              <el-tag size="mini" :type="scope.row.agreementType === 'PRIVACY_POLICY' ? '' : 'warning'">
                {{ agreementTypeLabel(scope.row.agreementType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="内容语言" align="center" width="150">
            <template slot-scope="scope">{{ localeLabel(scope.row.locale) }}</template>
          </el-table-column>
          <el-table-column label="范围" align="center" width="220" show-overflow-tooltip>
            <template slot-scope="scope">
              {{ scope.row.market }} / {{ scope.row.brandCode }} / {{ scope.row.carLineCode }}
            </template>
          </el-table-column>
          <el-table-column label="标题" prop="title" min-width="180" show-overflow-tooltip/>
          <el-table-column label="业务版本" align="center" width="100">
            <template slot-scope="scope">V{{ scope.row.version }}</template>
          </el-table-column>
          <el-table-column label="协议日期" align="center" width="110" prop="agreementDate"/>
          <el-table-column label="乐观锁" align="center" width="90">
            <template slot-scope="scope">{{ scope.row.lockVersion }}</template>
          </el-table-column>
          <el-table-column label="最近修改" align="center" width="160">
            <template slot-scope="scope">{{ timeText(scope.row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="200" fixed="right" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button size="mini" type="text" icon="el-icon-view" @click="handleViewDraft(scope.row)">查看</el-button>
              <el-button
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleEdit(scope.row)"
                v-hasPermi="['mkt:cms:agreement:edit']"
              >编辑</el-button>
              <el-button
                size="mini"
                type="text"
                icon="el-icon-finished"
                @click="handleFreeze(scope.row)"
                v-hasPermi="['mkt:cms:agreement:freeze']"
              >定稿</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="draftTotal > 0"
          :total="draftTotal"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getDraftList"
        />
      </el-tab-pane>

      <!-- 修订 -->
      <el-tab-pane label="修订（不可变快照）" name="revision">
        <el-checkbox v-model="publishedOnly" @change="getRevisionList">仅看已发布</el-checkbox>
        <el-table v-loading="loading" :data="revisionList">
          <el-table-column label="类型" align="center" width="110">
            <template slot-scope="scope">{{ agreementTypeLabel(scope.row.agreementType) }}</template>
          </el-table-column>
          <el-table-column label="内容语言" align="center" width="150">
            <template slot-scope="scope">{{ localeLabel(scope.row.locale) }}</template>
          </el-table-column>
          <el-table-column label="范围" align="center" width="220" show-overflow-tooltip>
            <template slot-scope="scope">
              {{ scope.row.market }} / {{ scope.row.brandCode }} / {{ scope.row.carLineCode }}
            </template>
          </el-table-column>
          <el-table-column label="标题" prop="title" min-width="160" show-overflow-tooltip/>
          <el-table-column label="业务版本" align="center" width="100">
            <template slot-scope="scope">V{{ scope.row.version }}</template>
          </el-table-column>
          <el-table-column label="内容摘要" prop="contentHash" min-width="220" show-overflow-tooltip/>
          <el-table-column label="定稿时间" align="center" width="160">
            <template slot-scope="scope">{{ timeText(scope.row.frozenAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="110" fixed="right">
            <template slot-scope="scope">
              <el-button size="mini" type="text" icon="el-icon-view" @click="handleViewRevision(scope.row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="revisionTotal > 0"
          :total="revisionTotal"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getRevisionList"
        />
      </el-tab-pane>

      <!-- 发布包 -->
      <el-tab-pane label="发布包" name="bundle">
        <el-table v-loading="loading" :data="bundleList">
          <el-table-column label="发布包" prop="bundleId" min-width="200" show-overflow-tooltip/>
          <el-table-column label="内容语言" align="center" width="150">
            <template slot-scope="scope">{{ localeLabel(scope.row.locale) }}</template>
          </el-table-column>
          <el-table-column label="范围" align="center" width="220" show-overflow-tooltip>
            <template slot-scope="scope">
              {{ scope.row.market }} / {{ scope.row.brandCode }} / {{ scope.row.carLineCode }}
            </template>
          </el-table-column>
          <el-table-column label="隐私政策修订" prop="privacyRevisionId" min-width="180" show-overflow-tooltip/>
          <el-table-column label="用户协议修订" prop="userRevisionId" min-width="180" show-overflow-tooltip/>
          <el-table-column label="发布人" prop="publishedBy" align="center" width="110"/>
          <el-table-column label="发布时间" align="center" width="160">
            <template slot-scope="scope">{{ timeText(scope.row.publishedAt) }}</template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="bundleTotal > 0"
          :total="bundleTotal"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getBundleList"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 新建/编辑草稿 -->
    <draft-edit-dialog
      :visible.sync="draftDialogVisible"
      :mode="draftDialogMode"
      :metadata="metadata"
      :draft="currentDraft"
      @success="handleDraftSaved"
    />

    <!-- 发布协议包 -->
    <publish-dialog
      :visible.sync="publishDialogVisible"
      :metadata="metadata"
      :scope="queryParams"
      :current-bundle="currentBundle"
      @success="handlePublishSuccess"
    />

    <!-- 正文查看 -->
    <agreement-view-drawer
      :visible.sync="viewDrawerVisible"
      :title="viewDrawerTitle"
      :content="viewDrawerContent"
    />
  </div>
</template>

<script>
import {
  getAgreementMetadata,
  listAgreementDraft,
  getAgreementDraft,
  freezeAgreementDraft,
  listAgreementRevision,
  getAgreementRevision,
  listAgreementBundle,
  getCurrentAgreementBundle
} from '@/api/cms/agreement'
import {
  buildAgreementSearchParams,
  buildScopeParams,
  agreementTypeLabel,
  localeLabel,
  DEFAULT_SCENE
} from '@/utils/cms/agreement'
import DraftEditDialog from './components/DraftEditDialog'
import PublishDialog from './components/PublishDialog'
import AgreementViewDrawer from './components/AgreementViewDrawer'

export default {
  name: 'CmsAgreement',
  components: { DraftEditDialog, PublishDialog, AgreementViewDrawer },
  data() {
    return {
      loading: false,
      showSearch: true,
      activeTab: 'draft',
      publishedOnly: false,
      metadata: {
        agreementTypes: [],
        scenes: [],
        markets: [],
        locales: [],
        brands: [],
        carLines: [],
        carLinesByBrand: {}
      },
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        agreementType: undefined,
        scene: DEFAULT_SCENE,
        market: undefined,
        locale: undefined,
        brandCode: undefined,
        carLineCode: undefined,
        title: undefined,
        version: undefined
      },
      draftList: [],
      draftTotal: 0,
      revisionList: [],
      revisionTotal: 0,
      bundleList: [],
      bundleTotal: 0,
      currentBundle: null,
      currentChecked: false,
      draftDialogVisible: false,
      draftDialogMode: 'create',
      currentDraft: null,
      publishDialogVisible: false,
      viewDrawerVisible: false,
      viewDrawerTitle: '',
      viewDrawerContent: null
    }
  },
  created() {
    this.getMetadata()
    this.getDraftList()
    this.refreshCurrent()
  },
  methods: {
    agreementTypeLabel,
    localeLabel,
    timeText(value) {
      if (!value) {
        return '-'
      }
      return this.parseTime(value, '{y}-{m}-{d} {h}:{i}:{s}')
    },
    getMetadata() {
      getAgreementMetadata().then((response) => {
        this.metadata = response.data || this.metadata
      }).catch(() => {})
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
      this.refreshCurrent()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        agreementType: undefined,
        scene: DEFAULT_SCENE,
        market: undefined,
        locale: undefined,
        brandCode: undefined,
        carLineCode: undefined,
        title: undefined,
        version: undefined
      }
      this.getList()
      this.refreshCurrent()
    },
    handleTabChange() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    getList() {
      if (this.activeTab === 'revision') {
        this.getRevisionList()
      } else if (this.activeTab === 'bundle') {
        this.getBundleList()
      } else {
        this.getDraftList()
      }
    },
    getDraftList() {
      this.loading = true
      listAgreementDraft(buildAgreementSearchParams(this.queryParams)).then((response) => {
        this.draftList = response.data.items || []
        this.draftTotal = response.data.total || 0
      }).finally(() => {
        this.loading = false
      })
    },
    getRevisionList() {
      this.loading = true
      const params = buildAgreementSearchParams(this.queryParams)
      if (this.publishedOnly) {
        params.published = true
      }
      listAgreementRevision(params).then((response) => {
        this.revisionList = response.data.items || []
        this.revisionTotal = response.data.total || 0
      }).finally(() => {
        this.loading = false
      })
    },
    getBundleList() {
      this.loading = true
      listAgreementBundle(buildAgreementSearchParams(this.queryParams)).then((response) => {
        this.bundleList = response.data.items || []
        this.bundleTotal = response.data.total || 0
      }).finally(() => {
        this.loading = false
      })
    },
    refreshCurrent() {
      this.currentChecked = false
      getCurrentAgreementBundle(buildScopeParams(this.queryParams)).then((response) => {
        this.currentBundle = response.data
        this.currentChecked = true
      }).catch(() => {
        // 范围合法但没有当前包时后端返回 404 + 105002，这里按“暂无当前包”展示
        this.currentBundle = null
        this.currentChecked = true
      })
    },
    handleCreate() {
      this.draftDialogMode = 'create'
      this.currentDraft = null
      this.draftDialogVisible = true
    },
    handleEdit(row) {
      getAgreementDraft(row.draftId).then((response) => {
        this.draftDialogMode = 'edit'
        this.currentDraft = response.data
        this.draftDialogVisible = true
      })
    },
    handleViewDraft(row) {
      getAgreementDraft(row.draftId).then((response) => {
        this.viewDrawerTitle = this.agreementTypeLabel(row.agreementType) + ' · 草稿 V' + row.version
        this.viewDrawerContent = response.data
        this.viewDrawerVisible = true
      })
    },
    handleFreeze(row) {
      this.$modal.confirm(
        '确认对草稿 V' + row.version + '（乐观锁 lockVersion=' + row.lockVersion + '）执行定稿？定稿后正文不可修改。'
      ).then(() => {
        return freezeAgreementDraft(row.draftId, row.lockVersion)
      }).then((response) => {
        this.$modal.msgSuccess('定稿成功：' + response.data.revisionId)
        this.getDraftList()
        this.refreshCurrent()
      }).catch(() => {})
    },
    handlePublish() {
      this.publishDialogVisible = true
    },
    handlePublishSuccess() {
      this.getList()
      this.refreshCurrent()
    },
    handleDraftSaved() {
      this.getList()
      this.refreshCurrent()
    },
    handleViewCurrent(item) {
      this.viewDrawerTitle = this.agreementTypeLabel(item.agreementType) + ' · 当前发布版本 V' + item.version
      this.viewDrawerContent = item
      this.viewDrawerVisible = true
    },
    handleViewRevision(row) {
      getAgreementRevision(row.revisionId).then((response) => {
        this.viewDrawerTitle = this.agreementTypeLabel(row.agreementType) + ' · 修订 V' + row.version
        this.viewDrawerContent = response.data
        this.viewDrawerVisible = true
      })
    }
  }
}
</script>

<style scoped>
.agreement-item {
  padding: 8px 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.agreement-meta {
  margin: 6px 0;
  color: #909399;
  font-size: 12px;
  display: flex;
  flex-direction: column;
}
</style>
