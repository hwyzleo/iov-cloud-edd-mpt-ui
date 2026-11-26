<template>
  <div class="app-container explore-page">
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <!-- ================= 页面编排 ================= -->
      <el-tab-pane label="页面编排" name="page">
        <el-form :inline="true" size="small">
          <el-form-item label="频道">
            <el-select v-model="channelCode" style="width: 160px" @change="handleChannelChange">
              <el-option
                v-for="channel in channels"
                :key="channel.channelCode"
                :label="channel.name + ' (' + channel.channelCode + ')'"
                :value="channel.channelCode"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-tag type="info">草稿 lockVersion：{{ page.lockVersion }}</el-tag>
            <el-tag v-if="currentReleaseId" type="success" style="margin-left: 8px">
              当前版本：{{ currentReleaseId }}
            </el-tag>
          </el-form-item>
          <el-form-item>
            <el-button
              v-hasPermi="['mkt:cms:explore:edit']"
              type="primary"
              size="mini"
              icon="el-icon-check"
              @click="handleSavePage"
            >保存草稿</el-button>
            <el-button size="mini" icon="el-icon-view" :disabled="!page.pageId" @click="handlePreview">手机预览</el-button>
            <el-button
              v-hasPermi="['mkt:cms:explore:publish']"
              type="success"
              size="mini"
              icon="el-icon-upload2"
              @click="openPublish"
            >发布</el-button>
            <el-button
              v-hasPermi="['mkt:cms:explore:publish']"
              size="mini"
              icon="el-icon-time"
              @click="handleCancelSchedule"
            >取消定时</el-button>
            <el-button
              v-hasPermi="['mkt:cms:explore:offline']"
              type="danger"
              size="mini"
              plain
              icon="el-icon-remove-outline"
              @click="handleOfflinePage"
            >立即下线</el-button>
          </el-form-item>
        </el-form>

        <el-alert
          v-if="!page.pageId"
          title="当前频道尚无草稿，添加组件后保存即创建草稿（首次 lockVersion 为 0）。"
          type="info"
          :closable="false"
          style="margin-bottom: 12px"
        />

        <div class="component-list">
          <div
            v-for="(component, ci) in page.components"
            :key="component.componentId || component.type"
            class="component-card"
            draggable="true"
            @dragstart="dragComponent = ci"
            @dragover.prevent
            @drop="dropComponent(ci)"
          >
            <div class="component-header">
              <span class="drag-handle">⋮⋮</span>
              <strong>{{ componentTypeLabel(component.type) }}</strong>
              <el-input-number v-model="component.sortNo" :min="0" :step="10" size="mini" controls-position="right" style="width: 100px" />
              <span class="component-actions">
                <el-button type="text" icon="el-icon-plus" @click="openSelector(component.type)">添加条目</el-button>
                <el-button type="text" icon="el-icon-top" @click="moveComponent(ci, -1)" />
                <el-button type="text" icon="el-icon-bottom" @click="moveComponent(ci, 1)" />
                <el-button type="text" icon="el-icon-delete" style="color: #f56c6c" @click="removeComponent(ci)" />
              </span>
            </div>

            <div v-if="!component.items || component.items.length === 0" class="empty-items">
              暂无条目，点击「添加条目」从已发布内容中选择
            </div>
            <div
              v-for="(item, ii) in component.items"
              :key="item.itemId || (item.refRevisionId + '-' + ii)"
              class="item-row"
              draggable="true"
              @dragstart.stop="dragItem = { ci: ci, ii: ii }"
              @dragover.prevent
              @drop.stop="dropItem(ci, ii)"
            >
              <span class="drag-handle">⋮⋮</span>
              <span class="item-sort">#{{ item.sortNo }}</span>
              <span class="item-title">{{ itemTitle(item) }}</span>
              <el-tag size="mini" type="info">{{ item.itemType }}</el-tag>
              <span class="item-ref">{{ item.refRevisionId }}</span>
              <span class="item-time">{{ formatTime(item.startAt) }} ~ {{ formatTime(item.endAt) }}</span>
              <span class="item-actions">
                <el-button type="text" icon="el-icon-top" @click="moveItem(ci, ii, -1)" />
                <el-button type="text" icon="el-icon-bottom" @click="moveItem(ci, ii, 1)" />
                <el-button type="text" icon="el-icon-delete" style="color: #f56c6c" @click="removeItem(ci, ii)" />
              </span>
            </div>
          </div>
        </div>

        <div class="add-component">
          <el-button
            v-for="type in metadata.componentTypes || []"
            :key="type"
            size="mini"
            :disabled="hasComponent(type)"
            @click="addComponent(type)"
          >+ {{ componentTypeLabel(type) }}</el-button>
        </div>
      </el-tab-pane>

      <!-- ================= 频道 ================= -->
      <el-tab-pane label="频道" name="channel">
        <el-table v-loading="loading.channel" :data="channelRows" size="small" border>
          <el-table-column prop="channelCode" label="频道编码" width="140" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="sortNo" label="排序" width="90" />
          <el-table-column prop="status" label="状态" width="110">
            <template slot-scope="scope">
              <el-tag :type="scope.row.status === 'ENABLED' ? 'success' : 'info'">
                {{ scope.row.status === 'ENABLED' ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lockVersion" label="lockVersion" width="110" />
          <el-table-column label="操作" width="100">
            <template slot-scope="scope">
              <el-button v-hasPermi="['mkt:cms:explore:edit']" type="text" size="mini" @click="openChannel(scope.row)">修改</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ================= Banner ================= -->
      <el-tab-pane label="Banner" name="banner">
        <el-form :inline="true" size="small">
          <el-form-item label="状态">
            <el-select v-model="query.banner.status" clearable placeholder="全部" style="width: 120px" @change="loadBanners">
              <el-option label="已发布" value="PUBLISHED" />
              <el-option label="已下线" value="OFFLINE" />
            </el-select>
          </el-form-item>
          <el-form-item label="标题">
            <el-input v-model="query.banner.keyword" clearable placeholder="模糊匹配" @keyup.enter.native="loadBanners" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="mini" icon="el-icon-search" @click="loadBanners">搜索</el-button>
            <el-button v-hasPermi="['mkt:cms:explore:add']" type="success" size="mini" icon="el-icon-plus" @click="openBanner()">新增 Banner</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="loading.banner" :data="bannerRows" size="small" border>
          <el-table-column label="主图" width="110">
            <template slot-scope="scope">
              <img v-if="scope.row.image" :src="scope.row.image.url" class="thumb">
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" />
          <el-table-column label="跳转目标" width="220">
            <template slot-scope="scope">{{ targetLabel(scope.row.target) }}</template>
          </el-table-column>
          <el-table-column prop="defaultSortNo" label="默认排序" width="100" />
          <el-table-column prop="revisionStatus" label="修订状态" width="110" />
          <el-table-column prop="status" label="根状态" width="100" />
          <el-table-column label="操作" width="220">
            <template slot-scope="scope">
              <el-button v-hasPermi="['mkt:cms:explore:edit']" type="text" size="mini" @click="openBanner(scope.row)">修改</el-button>
              <el-button
                v-hasPermi="['mkt:cms:explore:publish']"
                type="text"
                size="mini"
                :disabled="scope.row.revisionStatus !== 'DRAFT'"
                @click="handlePublishBanner(scope.row)"
              >发布</el-button>
              <el-button
                v-hasPermi="['mkt:cms:explore:offline']"
                type="text"
                size="mini"
                style="color: #f56c6c"
                :disabled="scope.row.status === 'OFFLINE'"
                @click="handleOfflineBanner(scope.row)"
              >下线</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ================= 专题 ================= -->
      <el-tab-pane label="专题" name="topic">
        <el-form :inline="true" size="small">
          <el-form-item label="状态">
            <el-select v-model="query.topic.status" clearable placeholder="全部" style="width: 120px" @change="loadTopics">
              <el-option label="已发布" value="PUBLISHED" />
              <el-option label="已下线" value="OFFLINE" />
            </el-select>
          </el-form-item>
          <el-form-item label="名称">
            <el-input v-model="query.topic.keyword" clearable placeholder="模糊匹配" @keyup.enter.native="loadTopics" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="mini" icon="el-icon-search" @click="loadTopics">搜索</el-button>
            <el-button v-hasPermi="['mkt:cms:explore:add']" type="success" size="mini" icon="el-icon-plus" @click="openTopic()">新增专题</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="loading.topic" :data="topicRows" size="small" border>
          <el-table-column label="封面" width="110">
            <template slot-scope="scope">
              <img v-if="scope.row.cover" :src="scope.row.cover.url" class="thumb">
            </template>
          </el-table-column>
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="summary" label="摘要" show-overflow-tooltip />
          <el-table-column label="跳转目标" width="220">
            <template slot-scope="scope">{{ targetLabel(scope.row.target) }}</template>
          </el-table-column>
          <el-table-column prop="revisionStatus" label="修订状态" width="110" />
          <el-table-column prop="status" label="根状态" width="100" />
          <el-table-column label="操作" width="220">
            <template slot-scope="scope">
              <el-button v-hasPermi="['mkt:cms:explore:edit']" type="text" size="mini" @click="openTopic(scope.row)">修改</el-button>
              <el-button
                v-hasPermi="['mkt:cms:explore:publish']"
                type="text"
                size="mini"
                :disabled="scope.row.revisionStatus !== 'DRAFT'"
                @click="handlePublishTopic(scope.row)"
              >发布</el-button>
              <el-button
                v-hasPermi="['mkt:cms:explore:offline']"
                type="text"
                size="mini"
                style="color: #f56c6c"
                :disabled="scope.row.status === 'OFFLINE'"
                @click="handleOfflineTopic(scope.row)"
              >下线</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ================= 文章 ================= -->
      <el-tab-pane label="文章" name="article">
        <el-form :inline="true" size="small">
          <el-form-item label="来源">
            <el-select v-model="query.article.sourceType" clearable placeholder="全部" style="width: 150px" @change="loadArticles">
              <el-option label="官方文章" value="OFFICIAL" />
              <el-option label="用户内容引用" value="UGC_REFERENCE" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.article.status" clearable placeholder="全部" style="width: 120px" @change="loadArticles">
              <el-option label="已发布" value="PUBLISHED" />
              <el-option label="已下线" value="OFFLINE" />
            </el-select>
          </el-form-item>
          <el-form-item label="标题">
            <el-input v-model="query.article.title" clearable placeholder="模糊匹配" @keyup.enter.native="loadArticles" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="mini" icon="el-icon-search" @click="loadArticles">搜索</el-button>
            <el-button v-hasPermi="['mkt:cms:explore:add']" type="success" size="mini" icon="el-icon-plus" @click="openArticle()">新增文章</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="loading.article" :data="articleRows" size="small" border>
          <el-table-column label="封面" width="110">
            <template slot-scope="scope">
              <img v-if="scope.row.cover" :src="scope.row.cover.url" class="thumb">
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="sourceType" label="来源" width="140" />
          <el-table-column prop="summary" label="摘要" show-overflow-tooltip />
          <el-table-column prop="revisionNo" label="修订号" width="90" />
          <el-table-column prop="revisionStatus" label="修订状态" width="110" />
          <el-table-column prop="status" label="根状态" width="100" />
          <el-table-column label="操作" width="220">
            <template slot-scope="scope">
              <el-button v-hasPermi="['mkt:cms:explore:edit']" type="text" size="mini" @click="openArticle(scope.row)">修改</el-button>
              <el-button
                v-hasPermi="['mkt:cms:explore:publish']"
                type="text"
                size="mini"
                :disabled="scope.row.revisionStatus !== 'DRAFT'"
                @click="handlePublishArticle(scope.row)"
              >发布</el-button>
              <el-button
                v-hasPermi="['mkt:cms:explore:offline']"
                type="text"
                size="mini"
                style="color: #f56c6c"
                :disabled="scope.row.status === 'OFFLINE'"
                @click="handleOfflineArticle(scope.row)"
              >下线</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination
          v-show="pageState.article.total > 0"
          :total="pageState.article.total"
          :page.sync="query.article.pageNum"
          :limit.sync="query.article.pageSize"
          @pagination="loadArticles"
        />
      </el-tab-pane>

      <!-- ================= 发布记录 ================= -->
      <el-tab-pane label="发布记录" name="release">
        <el-form :inline="true" size="small">
          <el-form-item label="频道">
            <el-select v-model="channelCode" style="width: 160px" @change="loadReleases">
              <el-option
                v-for="channel in channels"
                :key="channel.channelCode"
                :label="channel.name + ' (' + channel.channelCode + ')'"
                :value="channel.channelCode"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.release.status" clearable placeholder="全部" style="width: 130px" @change="loadReleases">
              <el-option label="已生效" value="PUBLISHED" />
              <el-option label="待生效" value="SCHEDULED" />
              <el-option label="已到期" value="EXPIRED" />
              <el-option label="已下线" value="OFFLINE" />
              <el-option label="已取消" value="CANCELED" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="mini" icon="el-icon-search" @click="loadReleases">搜索</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="loading.release" :data="releaseRows" size="small" border>
          <el-table-column prop="pageVersion" label="版本" width="80" />
          <el-table-column prop="releaseId" label="发布版本标识" min-width="200" />
          <el-table-column prop="status" label="状态" width="110" />
          <el-table-column prop="effectiveAt" label="生效时间" width="180" />
          <el-table-column prop="expireAt" label="到期时间" width="180" />
          <el-table-column prop="publishedAt" label="发布时间" width="180" />
          <el-table-column prop="publishedBy" label="发布人" width="120" />
          <el-table-column label="操作" width="180">
            <template slot-scope="scope">
              <el-button type="text" size="mini" @click="openReleaseDetail(scope.row)">查看快照</el-button>
              <el-button v-hasPermi="['mkt:cms:explore:edit']" type="text" size="mini" @click="handleCopyRelease(scope.row)">复制为草稿</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination
          v-show="pageState.release.total > 0"
          :total="pageState.release.total"
          :page.sync="query.release.pageNum"
          :limit.sync="query.release.pageSize"
          @pagination="loadReleases"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- ================= 频道编辑 ================= -->
    <el-dialog title="维护频道" :visible.sync="dialogs.channel" width="420px" append-to-body>
      <el-form :model="channelForm" label-width="100px" size="small">
        <el-form-item label="频道编码"><el-input v-model="channelForm.channelCode" disabled /></el-form-item>
        <el-form-item label="名称"><el-input v-model="channelForm.name" maxlength="64" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="channelForm.sortNo" :min="0" :step="10" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="channelForm.status">
            <el-option label="启用" value="ENABLED" />
            <el-option label="停用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item label="lockVersion"><el-input-number v-model="channelForm.lockVersion" disabled /></el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="dialogs.channel = false">取消</el-button>
        <el-button size="small" type="primary" @click="submitChannel">保存</el-button>
      </span>
    </el-dialog>

    <!-- ================= Banner 编辑 ================= -->
    <el-dialog :title="bannerForm.bannerId ? '修改 Banner' : '新增 Banner'" :visible.sync="dialogs.banner" width="640px" append-to-body>
      <el-form :model="bannerForm" label-width="110px" size="small">
        <el-form-item label="标题"><el-input v-model="bannerForm.title" maxlength="255" /></el-form-item>
        <el-form-item label="主图">
          <image-field v-model="bannerForm.image" />
        </el-form-item>
        <target-editor v-model="bannerForm.target" :articles="articleOptions" :topics="topicOptions" :metadata="metadata" />
        <el-form-item label="默认排序"><el-input-number v-model="bannerForm.defaultSortNo" :min="0" :step="10" /></el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="dialogs.banner = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submitBanner">保存草稿</el-button>
      </span>
    </el-dialog>

    <!-- ================= 专题编辑 ================= -->
    <el-dialog :title="topicForm.topicId ? '修改专题' : '新增专题'" :visible.sync="dialogs.topic" width="720px" append-to-body>
      <el-form :model="topicForm" label-width="110px" size="small">
        <el-form-item label="名称"><el-input v-model="topicForm.name" maxlength="128" /></el-form-item>
        <el-form-item label="摘要"><el-input v-model="topicForm.summary" type="textarea" :rows="2" maxlength="1024" /></el-form-item>
        <el-form-item label="封面"><image-field v-model="topicForm.cover" /></el-form-item>
        <target-editor v-model="topicForm.target" :articles="articleOptions" :topics="topicOptions" :metadata="metadata" optional />
        <el-form-item label="文章选择">
          <el-select v-model="topicArticlePick" filterable placeholder="仅已发布文章" style="width: 100%" @change="addTopicArticle">
            <el-option
              v-for="article in articleOptions"
              :key="article.articleId + '::' + article.revisionId"
              :label="(article.title || article.articleId) + ' · 修订#' + article.revisionNo"
              :value="article.articleId + '::' + article.revisionId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="文章顺序">
          <div v-if="topicForm.items.length === 0" class="empty-items">尚未选择文章</div>
          <div v-for="(item, index) in topicForm.items" :key="item.articleRevisionId" class="selected-row">
            <span class="item-sort">#{{ (index + 1) * 10 }}</span>
            <span class="item-title">{{ item.title || item.articleRevisionId }}</span>
            <span class="item-ref">{{ item.articleRevisionId }}</span>
            <el-button type="text" icon="el-icon-top" @click="moveTopicArticle(index, -1)" />
            <el-button type="text" icon="el-icon-bottom" @click="moveTopicArticle(index, 1)" />
            <el-button type="text" icon="el-icon-delete" style="color: #f56c6c" @click="removeTopicArticle(index)" />
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="dialogs.topic = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submitTopic">保存草稿</el-button>
      </span>
    </el-dialog>

    <!-- ================= 文章编辑 ================= -->
    <el-dialog :title="articleForm.articleId ? '修改文章' : '新增文章'" :visible.sync="dialogs.article" width="760px" append-to-body>
      <el-form :model="articleForm" label-width="110px" size="small">
        <el-form-item label="来源类型">
          <el-radio-group v-model="articleForm.sourceType" :disabled="!!articleForm.articleId">
            <el-radio label="OFFICIAL">官方文章</el-radio>
            <el-radio label="UGC_REFERENCE">用户内容引用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标题"><el-input v-model="articleForm.title" maxlength="255" /></el-form-item>
        <el-form-item label="摘要"><el-input v-model="articleForm.summary" type="textarea" :rows="2" maxlength="1024" /></el-form-item>
        <el-form-item label="封面"><image-field v-model="articleForm.cover" /></el-form-item>
        <el-form-item label="作者显示名"><el-input v-model="articleForm.authorName" maxlength="128" /></el-form-item>
        <el-form-item label="作者头像 URL"><el-input v-model="articleForm.authorAvatarUrl" /></el-form-item>
        <el-form-item label="展示时间">
          <el-date-picker v-model="articleForm.displayAt" type="datetime" placeholder="默认当前时间" style="width: 100%" />
        </el-form-item>
        <template v-if="articleForm.sourceType === 'OFFICIAL'">
          <el-form-item label="安全 HTML 正文">
            <el-input v-model="articleForm.body" type="textarea" :rows="10" placeholder="允许段落、标题、强调、列表、安全链接与受控图片；脚本/iframe/SVG 等会被清洗" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="来源内容标识"><el-input v-model="articleForm.sourceContentId" maxlength="128" /></el-form-item>
          <el-form-item label="原生路由">
            <el-select v-model="articleForm.nativeRouteCode" filterable style="width: 100%">
              <el-option v-for="code in metadata.nativeRouteCodes || []" :key="code" :label="code" :value="code" />
            </el-select>
          </el-form-item>
        </template>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="dialogs.article = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submitArticle">保存草稿</el-button>
      </span>
    </el-dialog>

    <!-- ================= 页面条目选择 ================= -->
    <el-dialog title="选择已发布内容" :visible.sync="dialogs.selector" width="760px" append-to-body>
      <el-table v-loading="loading.selector" :data="selectorRows" size="small" border @row-click="selectItem">
        <el-table-column label="封面" width="100">
          <template slot-scope="scope">
            <img v-if="itemCover(scope.row)" :src="itemCover(scope.row)" class="thumb">
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题 / 名称" />
        <el-table-column prop="revisionId" label="修订标识" min-width="180" />
        <el-table-column prop="revisionNo" label="修订号" width="80" />
        <el-table-column label="操作" width="90">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click.stop="selectItem(scope.row)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- ================= 发布页面 ================= -->
    <el-dialog title="发布页面" :visible.sync="dialogs.publish" width="520px" append-to-body>
      <el-form :model="publishForm" label-width="120px" size="small">
        <el-form-item label="当前版本">
          <el-input :value="publishForm.expectedReleaseId || '（无当前版本）'" disabled />
        </el-form-item>
        <el-form-item label="requestId">
          <el-input v-model="publishForm.requestId" />
        </el-form-item>
        <el-form-item label="发布类型">
          <el-radio-group v-model="publishForm.publishType">
            <el-radio label="IMMEDIATE">立即发布</el-radio>
            <el-radio label="SCHEDULED">定时发布</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="publishForm.publishType === 'SCHEDULED'" label="生效时间">
          <el-date-picker v-model="publishForm.effectiveAt" type="datetime" style="width: 100%" />
        </el-form-item>
        <el-form-item label="到期时间">
          <el-date-picker v-model="publishForm.expireAt" type="datetime" placeholder="可选；到期后不回退旧版本" style="width: 100%" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="dialogs.publish = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submitPublish">确认发布</el-button>
      </span>
    </el-dialog>

    <!-- ================= 手机预览 ================= -->
    <el-dialog title="手机预览（未发布）" :visible.sync="dialogs.preview" width="420px" append-to-body>
      <div v-if="previewData" class="phone">
        <div class="phone-channel">{{ previewData.channel && previewData.channel.name }}</div>
        <div class="phone-body">
          <div v-for="component in previewData.components || []" :key="component.componentId" class="phone-component">
            <template v-if="component.type === 'BANNER_CAROUSEL'">
              <el-carousel height="150px" :interval="5000" indicator-position="outside">
                <el-carousel-item v-for="item in component.items" :key="item.itemId">
                  <img :src="item.image && item.image.url" class="banner-image">
                </el-carousel-item>
              </el-carousel>
            </template>
            <template v-else-if="component.type === 'TOPIC_GRID'">
              <div class="topic-grid">
                <div v-for="item in component.items" :key="item.itemId" class="topic-cell">
                  <img :src="item.cover && item.cover.url">
                  <div class="topic-name">{{ item.name }}</div>
                </div>
              </div>
            </template>
            <template v-else-if="component.type === 'ARTICLE_FEED'">
              <div v-for="item in component.items" :key="item.itemId" class="article-card">
                <img v-if="item.cover" :src="item.cover.url">
                <div class="article-info">
                  <div class="article-title">{{ item.title }}</div>
                  <div class="article-summary">{{ item.summary }}</div>
                  <div class="article-meta">{{ item.authorName }} · {{ formatTime(item.displayAt) }}</div>
                </div>
              </div>
            </template>
          </div>
        </div>
        <div class="preview-tag">预览未发布</div>
      </div>
      <div v-else class="empty-items">暂无预览数据</div>
    </el-dialog>

    <!-- ================= 发布版本快照 ================= -->
    <el-dialog title="发布版本快照" :visible.sync="dialogs.release" width="760px" append-to-body>
      <div v-if="releaseDetail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="发布版本">{{ releaseDetail.releaseId }}</el-descriptions-item>
          <el-descriptions-item label="版本号">{{ releaseDetail.pageVersion }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ releaseDetail.status }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ releaseDetail.publishedAt }}</el-descriptions-item>
          <el-descriptions-item label="生效时间">{{ releaseDetail.effectiveAt }}</el-descriptions-item>
          <el-descriptions-item label="到期时间">{{ releaseDetail.expireAt }}</el-descriptions-item>
        </el-descriptions>
        <div v-for="component in releaseDetail.components || []" :key="component.componentId" class="snapshot-component">
          <strong>{{ componentTypeLabel(component.type) }}（排序 {{ component.sortNo }}）</strong>
          <div v-for="item in component.items" :key="item.itemId" class="snapshot-item">
            <span>#{{ item.sortNo }}</span>
            <span>{{ itemTitle(item) }}</span>
            <span class="item-ref">{{ item.refRevisionId }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import ImageField from './components/ImageField'
import TargetEditor from './components/TargetEditor'
import {
  getExploreMetadata,
  listExploreChannels,
  updateExploreChannel,
  listExploreArticles,
  getExploreArticle,
  createExploreArticle,
  updateExploreArticle,
  publishExploreArticle,
  offlineExploreArticle,
  listExploreTopics,
  getExploreTopic,
  createExploreTopic,
  updateExploreTopic,
  publishExploreTopic,
  offlineExploreTopic,
  listExploreBanners,
  createExploreBanner,
  updateExploreBanner,
  publishExploreBanner,
  offlineExploreBanner,
  getExplorePage,
  saveExplorePage,
  getExploreCurrentPage,
  publishExplorePage,
  cancelExploreSchedule,
  offlineExplorePage,
  listExploreReleases,
  getExploreRelease,
  copyExploreReleaseToDraft,
  previewExploreDraft
} from '@/api/cms/explore'

export default {
  name: 'ExploreManagement',
  components: { ImageField, TargetEditor },
  data() {
    return {
      activeTab: 'page',
      metadata: {},
      channels: [],
      channelCode: '',
      currentReleaseId: null,
      page: { pageId: null, lockVersion: 0, components: [] },
      previewData: null,
      loading: {
        channel: false,
        banner: false,
        topic: false,
        article: false,
        release: false,
        selector: false
      },
      saving: false,
      channelRows: [],
      bannerRows: [],
      topicRows: [],
      articleRows: [],
      releaseRows: [],
      selectorRows: [],
      selectorType: '',
      articleOptions: [],
      topicOptions: [],
      pageState: {
        article: { total: 0 },
        release: { total: 0 }
      },
      query: {
        banner: { status: '', keyword: '' },
        topic: { status: '', keyword: '' },
        article: { sourceType: '', status: '', title: '', pageNum: 1, pageSize: 10 },
        release: { status: '', pageNum: 1, pageSize: 10 }
      },
      dialogs: {
        channel: false,
        banner: false,
        topic: false,
        article: false,
        selector: false,
        publish: false,
        preview: false,
        release: false
      },
      channelForm: {},
      bannerForm: this.emptyBanner(),
      topicForm: this.emptyTopic(),
      articleForm: this.emptyArticle(),
      topicArticlePick: '',
      publishForm: {
        requestId: '',
        expectedReleaseId: null,
        publishType: 'IMMEDIATE',
        effectiveAt: null,
        expireAt: null
      },
      releaseDetail: null,
      dragComponent: null,
      dragItem: null,
      loadedTabs: {}
    }
  },
  created() {
    this.init()
  },
  methods: {
    async init() {
      const [metadataRes, channelsRes] = await Promise.all([getExploreMetadata(), listExploreChannels()])
      this.metadata = metadataRes.data || {}
      this.channels = channelsRes.data || []
      this.channelRows = this.channels
      if (this.channels.length > 0) {
        this.channelCode = this.channels[0].channelCode
        await this.loadPage()
      }
      this.loadedTabs.page = true
    },
    handleTabClick(tab) {
      const name = tab.name
      if (name === 'channel') this.loadChannels()
      if (name === 'banner') this.loadBanners()
      if (name === 'topic') this.loadTopics()
      if (name === 'article') this.loadArticles()
      if (name === 'release') this.loadReleases()
    },
    handleChannelChange() {
      this.loadPage()
      if (this.activeTab === 'release') this.loadReleases()
    },
    async loadChannels() {
      this.loading.channel = true
      try {
        const res = await listExploreChannels()
        this.channels = res.data || []
        this.channelRows = this.channels
      } finally {
        this.loading.channel = false
      }
    },
    // ---------------- 页面编排 ----------------
    async loadPage() {
      if (!this.channelCode) return
      const [pageRes, currentRes] = await Promise.all([
        getExplorePage(this.channelCode),
        getExploreCurrentPage(this.channelCode)
      ])
      const data = pageRes.data || {}
      this.page = {
        pageId: data.pageId,
        lockVersion: data.lockVersion || 0,
        components: data.components || []
      }
      this.currentReleaseId = (currentRes.data && currentRes.data.releaseId) || null
    },
    hasComponent(type) {
      return this.page.components.some(component => component.type === type)
    },
    addComponent(type) {
      if (this.hasComponent(type)) return
      this.page.components.push({ type: type, sortNo: (this.page.components.length + 1) * 10, items: [], config: {}})
    },
    removeComponent(index) {
      this.$modal.confirm('确认移除该组件及其全部条目？').then(() => {
        this.page.components.splice(index, 1)
      }).catch(() => {})
    },
    moveComponent(index, offset) {
      const target = index + offset
      if (target < 0 || target >= this.page.components.length) return
      const list = this.page.components
      const [current] = list.splice(index, 1)
      list.splice(target, 0, current)
    },
    dropComponent(targetIndex) {
      if (this.dragComponent === null || this.dragComponent === targetIndex) return
      const list = this.page.components
      const [current] = list.splice(this.dragComponent, 1)
      list.splice(targetIndex, 0, current)
      this.dragComponent = null
    },
    moveItem(ci, ii, offset) {
      const items = this.page.components[ci].items
      const target = ii + offset
      if (target < 0 || target >= items.length) return
      const [current] = items.splice(ii, 1)
      items.splice(target, 0, current)
      this.reindexItems(ci)
    },
    dropItem(ci, targetIndex) {
      if (!this.dragItem || this.dragItem.ci !== ci || this.dragItem.ii === targetIndex) return
      const items = this.page.components[ci].items
      const [current] = items.splice(this.dragItem.ii, 1)
      items.splice(targetIndex, 0, current)
      this.reindexItems(ci)
      this.dragItem = null
    },
    removeItem(ci, ii) {
      this.page.components[ci].items.splice(ii, 1)
      this.reindexItems(ci)
    },
    reindexItems(ci) {
      this.page.components[ci].items.forEach((item, index) => {
        item.sortNo = (index + 1) * 10
      })
    },
    async handleSavePage() {
      this.saving = true
      try {
        await saveExplorePage(this.channelCode, {
          lockVersion: this.page.lockVersion,
          components: this.page.components.map(component => ({
            type: component.type,
            sortNo: component.sortNo,
            config: component.config || {},
            items: (component.items || []).map(item => ({
              itemType: item.itemType,
              refId: item.refId,
              refRevisionId: item.refRevisionId,
              sortNo: item.sortNo,
              startAt: this.toIso(item.startAt),
              endAt: this.toIso(item.endAt)
            }))
          }))
        })
        this.$modal.msgSuccess('草稿已保存')
        await this.loadPage()
      } finally {
        this.saving = false
      }
    },
    async handlePreview() {
      const res = await previewExploreDraft(this.page.pageId)
      this.previewData = res.data
      this.dialogs.preview = true
    },
    async openPublish() {
      const res = await getExploreCurrentPage(this.channelCode)
      this.publishForm = {
        requestId: this.generateRequestId(),
        expectedReleaseId: (res.data && res.data.releaseId) || null,
        publishType: 'IMMEDIATE',
        effectiveAt: null,
        expireAt: null
      }
      this.dialogs.publish = true
    },
    async submitPublish() {
      if (this.publishForm.publishType === 'SCHEDULED' && !this.publishForm.effectiveAt) {
        this.$modal.msgError('定时发布必须选择生效时间')
        return
      }
      this.saving = true
      try {
        await publishExplorePage(this.channelCode, {
          requestId: this.publishForm.requestId,
          expectedReleaseId: this.publishForm.expectedReleaseId,
          publishType: this.publishForm.publishType,
          effectiveAt: this.toIso(this.publishForm.effectiveAt),
          expireAt: this.toIso(this.publishForm.expireAt)
        })
        this.$modal.msgSuccess('页面已发布')
        this.dialogs.publish = false
        await this.loadPage()
      } finally {
        this.saving = false
      }
    },
    handleCancelSchedule() {
      this.$modal.confirm('确认取消该频道待生效版本？当前页面不受影响。').then(async() => {
        await cancelExploreSchedule(this.channelCode)
        this.$modal.msgSuccess('已取消待生效版本')
        await this.loadPage()
      }).catch(() => {})
    },
    handleOfflinePage() {
      this.$modal.confirm('确认立即下线该频道页面？将同时取消待生效版本，历史仍可查。').then(async() => {
        await offlineExplorePage(this.channelCode)
        this.$modal.msgSuccess('页面已下线')
        await this.loadPage()
      }).catch(() => {})
    },
    openSelector(componentType) {
      this.selectorType = componentType
      this.dialogs.selector = true
      this.loadSelectorRows()
    },
    async loadSelectorRows() {
      this.loading.selector = true
      try {
        if (this.selectorType === 'BANNER_CAROUSEL') {
          const res = await listExploreBanners({ status: 'PUBLISHED', pageNum: 1, pageSize: 100 })
          this.selectorRows = (res.data.items || []).filter(row => row.revisionStatus === 'PUBLISHED')
        } else if (this.selectorType === 'TOPIC_GRID') {
          const res = await listExploreTopics({ status: 'PUBLISHED', pageNum: 1, pageSize: 100 })
          this.selectorRows = (res.data.items || []).filter(row => row.revisionStatus === 'PUBLISHED')
        } else {
          const res = await listExploreArticles({ status: 'PUBLISHED', pageNum: 1, pageSize: 100 })
          this.selectorRows = (res.data.items || []).filter(row => row.revisionStatus === 'PUBLISHED')
        }
      } finally {
        this.loading.selector = false
      }
    },
    selectItem(row) {
      const component = this.page.components.find(item => item.type === this.selectorType)
      if (!component) {
        this.$modal.msgError('请先添加对应组件')
        return
      }
      const revisionId = row.revisionId
      if (component.items.some(item => item.refRevisionId === revisionId)) {
        this.$modal.msgError('该内容修订已在组件中')
        return
      }
      const itemType = this.selectorType === 'BANNER_CAROUSEL' ? 'BANNER'
        : this.selectorType === 'TOPIC_GRID' ? 'TOPIC' : 'ARTICLE'
      component.items.push({
        itemType: itemType,
        refId: row.bannerId || row.topicId || row.articleId,
        refRevisionId: revisionId,
        sortNo: (component.items.length + 1) * 10,
        display: {
          title: row.title,
          name: row.name,
          summary: row.summary,
          cover: row.cover,
          image: row.image,
          authorName: row.authorName,
          displayAt: row.displayAt
        }
      })
      this.dialogs.selector = false
    },
    // ---------------- 频道 ----------------
    openChannel(row) {
      this.channelForm = Object.assign({}, row)
      this.dialogs.channel = true
    },
    async submitChannel() {
      await updateExploreChannel(this.channelForm.channelCode, {
        name: this.channelForm.name,
        sortNo: this.channelForm.sortNo,
        status: this.channelForm.status,
        lockVersion: this.channelForm.lockVersion
      })
      this.$modal.msgSuccess('频道已更新')
      this.dialogs.channel = false
      await this.loadChannels()
    },
    // ---------------- Banner ----------------
    async loadBanners() {
      this.loading.banner = true
      try {
        const res = await listExploreBanners({
          status: this.query.banner.status,
          keyword: this.query.banner.keyword,
          pageNum: 1,
          pageSize: 100
        })
        this.bannerRows = res.data.items || []
      } finally {
        this.loading.banner = false
      }
    },
    emptyBanner() {
      return { bannerId: null, title: '', image: null, target: null, defaultSortNo: 0, lockVersion: null }
    },
    openBanner(row) {
      this.loadTargetOptions()
      if (!row) {
        this.bannerForm = this.emptyBanner()
      } else {
        this.bannerForm = {
          bannerId: row.bannerId,
          title: row.title,
          image: row.image,
          target: this.toTargetPayload(row.target),
          defaultSortNo: row.defaultSortNo || 0,
          lockVersion: row.lockVersion
        }
      }
      this.dialogs.banner = true
    },
    async submitBanner() {
      if (!this.bannerForm.image) {
        this.$modal.msgError('请上传 Banner 主图')
        return
      }
      if (!this.bannerForm.target || !this.bannerForm.target.type) {
        this.$modal.msgError('请选择 Banner 跳转目标')
        return
      }
      this.saving = true
      try {
        const payload = {
          title: this.bannerForm.title,
          image: this.bannerForm.image,
          target: this.bannerForm.target,
          defaultSortNo: this.bannerForm.defaultSortNo,
          lockVersion: this.bannerForm.lockVersion
        }
        if (this.bannerForm.bannerId) {
          await updateExploreBanner(this.bannerForm.bannerId, payload)
        } else {
          await createExploreBanner(payload)
        }
        this.$modal.msgSuccess('Banner 草稿已保存')
        this.dialogs.banner = false
        await this.loadBanners()
        await this.loadPage()
      } finally {
        this.saving = false
      }
    },
    handlePublishBanner(row) {
      this.$modal.confirm('确认发布该 Banner 修订？').then(async() => {
        await publishExploreBanner(row.bannerId, row.revisionId)
        this.$modal.msgSuccess('Banner 已发布')
        await this.loadBanners()
      }).catch(() => {})
    },
    handleOfflineBanner(row) {
      this.$modal.confirm('确认立即下线该 Banner？手机端将实时不再展示。').then(async() => {
        await offlineExploreBanner(row.bannerId)
        this.$modal.msgSuccess('Banner 已下线')
        await this.loadBanners()
      }).catch(() => {})
    },
    // ---------------- 专题 ----------------
    async loadTopics() {
      this.loading.topic = true
      try {
        const res = await listExploreTopics({
          status: this.query.topic.status,
          keyword: this.query.topic.keyword,
          pageNum: 1,
          pageSize: 100
        })
        this.topicRows = res.data.items || []
      } finally {
        this.loading.topic = false
      }
    },
    emptyTopic() {
      return { topicId: null, name: '', summary: '', cover: null, target: null, items: [], lockVersion: null }
    },
    async openTopic(row) {
      await this.loadTargetOptions()
      if (!row) {
        this.topicForm = this.emptyTopic()
      } else {
        const res = await getExploreTopic(row.topicId)
        const detail = res.data || {}
        this.topicForm = {
          topicId: detail.topicId,
          name: detail.name,
          summary: detail.summary,
          cover: detail.cover,
          target: this.toTargetPayload(detail.target),
          items: (detail.items || []).map(item => ({
            articleRevisionId: item.articleRevisionId,
            title: item.title || (item.display && item.display.title)
          })),
          lockVersion: detail.lockVersion
        }
      }
      this.topicArticlePick = ''
      this.dialogs.topic = true
    },
    addTopicArticle(value) {
      if (!value) return
      const article = this.articleOptions.find(item => item.articleId + '::' + item.revisionId === value)
      if (!article) return
      if (this.topicForm.items.some(item => item.articleRevisionId === article.revisionId)) {
        this.$modal.msgError('该文章修订已选择')
        return
      }
      this.topicForm.items.push({ articleRevisionId: article.revisionId, title: article.title })
      this.topicArticlePick = ''
    },
    moveTopicArticle(index, offset) {
      const target = index + offset
      if (target < 0 || target >= this.topicForm.items.length) return
      const [current] = this.topicForm.items.splice(index, 1)
      this.topicForm.items.splice(target, 0, current)
    },
    removeTopicArticle(index) {
      this.topicForm.items.splice(index, 1)
    },
    async submitTopic() {
      this.saving = true
      try {
        const payload = {
          name: this.topicForm.name,
          summary: this.topicForm.summary,
          cover: this.topicForm.cover,
          target: this.topicForm.target,
          articleRevisionIds: this.topicForm.items.map(item => item.articleRevisionId),
          lockVersion: this.topicForm.lockVersion
        }
        if (this.topicForm.topicId) {
          await updateExploreTopic(this.topicForm.topicId, payload)
        } else {
          await createExploreTopic(payload)
        }
        this.$modal.msgSuccess('专题草稿已保存')
        this.dialogs.topic = false
        await this.loadTopics()
        await this.loadPage()
      } finally {
        this.saving = false
      }
    },
    handlePublishTopic(row) {
      this.$modal.confirm('确认发布该专题修订？').then(async() => {
        await publishExploreTopic(row.topicId, row.revisionId)
        this.$modal.msgSuccess('专题已发布')
        await this.loadTopics()
      }).catch(() => {})
    },
    handleOfflineTopic(row) {
      this.$modal.confirm('确认立即下线该专题？手机端将实时不再展示。').then(async() => {
        await offlineExploreTopic(row.topicId)
        this.$modal.msgSuccess('专题已下线')
        await this.loadTopics()
      }).catch(() => {})
    },
    // ---------------- 文章 ----------------
    async loadArticles() {
      this.loading.article = true
      try {
        const res = await listExploreArticles({
          sourceType: this.query.article.sourceType,
          status: this.query.article.status,
          title: this.query.article.title,
          pageNum: this.query.article.pageNum,
          pageSize: this.query.article.pageSize
        })
        this.articleRows = res.data.items || []
        this.pageState.article.total = res.data.total || 0
      } finally {
        this.loading.article = false
      }
    },
    emptyArticle() {
      return {
        articleId: null,
        sourceType: 'OFFICIAL',
        title: '',
        summary: '',
        cover: null,
        authorName: '',
        authorAvatarUrl: '',
        displayAt: null,
        body: '',
        sourceContentId: '',
        nativeRouteCode: '',
        lockVersion: null
      }
    },
    async openArticle(row) {
      if (!row) {
        this.articleForm = this.emptyArticle()
      } else {
        const res = await getExploreArticle(row.articleId)
        const detail = res.data || {}
        this.articleForm = {
          articleId: detail.articleId,
          sourceType: detail.sourceType,
          title: detail.title,
          summary: detail.summary,
          cover: detail.cover,
          authorName: detail.authorName,
          authorAvatarUrl: detail.authorAvatarUrl,
          displayAt: detail.displayAt ? new Date(detail.displayAt) : null,
          body: detail.body || '',
          sourceContentId: detail.sourceContentId || '',
          nativeRouteCode: detail.nativeRouteCode || '',
          lockVersion: detail.lockVersion
        }
      }
      this.dialogs.article = true
    },
    async submitArticle() {
      this.saving = true
      try {
        const payload = {
          sourceType: this.articleForm.sourceType,
          title: this.articleForm.title,
          summary: this.articleForm.summary,
          cover: this.articleForm.cover,
          authorName: this.articleForm.authorName,
          authorAvatarUrl: this.articleForm.authorAvatarUrl,
          displayAt: this.toIso(this.articleForm.displayAt),
          body: this.articleForm.sourceType === 'OFFICIAL' ? this.articleForm.body : null,
          sourceContentId: this.articleForm.sourceType === 'UGC_REFERENCE' ? this.articleForm.sourceContentId : null,
          nativeRouteCode: this.articleForm.sourceType === 'UGC_REFERENCE' ? this.articleForm.nativeRouteCode : null,
          lockVersion: this.articleForm.lockVersion
        }
        if (this.articleForm.articleId) {
          await updateExploreArticle(this.articleForm.articleId, payload)
        } else {
          await createExploreArticle(payload)
        }
        this.$modal.msgSuccess('文章草稿已保存')
        this.dialogs.article = false
        await this.loadArticles()
        await this.loadPage()
      } finally {
        this.saving = false
      }
    },
    handlePublishArticle(row) {
      this.$modal.confirm('确认发布该文章修订？').then(async() => {
        await publishExploreArticle(row.articleId, row.revisionId)
        this.$modal.msgSuccess('文章已发布')
        await this.loadArticles()
      }).catch(() => {})
    },
    handleOfflineArticle(row) {
      this.$modal.confirm('确认立即下线该文章？手机端将实时不再展示。').then(async() => {
        await offlineExploreArticle(row.articleId)
        this.$modal.msgSuccess('文章已下线')
        await this.loadArticles()
      }).catch(() => {})
    },
    // ---------------- 发布记录 ----------------
    async loadReleases() {
      if (!this.channelCode) return
      this.loading.release = true
      try {
        const res = await listExploreReleases(this.channelCode, {
          status: this.query.release.status,
          pageNum: this.query.release.pageNum,
          pageSize: this.query.release.pageSize
        })
        this.releaseRows = res.data.items || []
        this.pageState.release.total = res.data.total || 0
      } finally {
        this.loading.release = false
      }
    },
    async openReleaseDetail(row) {
      const res = await getExploreRelease(row.releaseId)
      this.releaseDetail = res.data
      this.dialogs.release = true
    },
    handleCopyRelease(row) {
      this.$modal.confirm('确认将该历史版本复制为当前频道草稿？历史版本不会被修改。').then(async() => {
        await copyExploreReleaseToDraft(row.releaseId)
        this.$modal.msgSuccess('已复制为新草稿')
        await this.loadPage()
      }).catch(() => {})
    },
    // ---------------- 工具 ----------------
    async loadTargetOptions() {
      const [articlesRes, topicsRes] = await Promise.all([
        listExploreArticles({ status: 'PUBLISHED', pageNum: 1, pageSize: 100 }),
        listExploreTopics({ status: 'PUBLISHED', pageNum: 1, pageSize: 100 })
      ])
      this.articleOptions = (articlesRes.data.items || []).filter(row => row.revisionStatus === 'PUBLISHED')
      this.topicOptions = (topicsRes.data.items || []).filter(row => row.revisionStatus === 'PUBLISHED')
    },
    toTargetPayload(target) {
      if (!target || !target.type) return null
      const payload = { type: target.type }
      if (target.type === 'ARTICLE') {
        payload.articleId = target.articleId
        payload.revisionId = target.revisionId
      } else if (target.type === 'TOPIC') {
        payload.topicId = target.topicId
        payload.revisionId = target.revisionId
      } else if (target.type === 'H5') {
        payload.url = target.url
      } else if (target.type === 'NATIVE') {
        payload.routeCode = target.routeCode
        payload.params = target.params
      }
      return payload
    },
    componentTypeLabel(type) {
      const labels = { BANNER_CAROUSEL: 'Banner 轮播', TOPIC_GRID: '专题网格', ARTICLE_FEED: '文章信息流' }
      return labels[type] || type
    },
    targetLabel(target) {
      if (!target || !target.type) return '-'
      if (target.type === 'ARTICLE') return '文章：' + (target.articleId || '')
      if (target.type === 'TOPIC') return '专题：' + (target.topicId || '')
      if (target.type === 'H5') return 'H5：' + (target.url || '')
      if (target.type === 'NATIVE') return '原生：' + (target.routeCode || '')
      return target.type
    },
    itemTitle(item) {
      if (!item) return '-'
      if (item.title) return item.title
      if (item.name) return item.name
      if (item.display) return item.display.title || item.display.name || item.refId
      return item.refId
    },
    itemCover(row) {
      if (!row) return ''
      const cover = row.image || row.cover
      return cover ? cover.url : ''
    },
    formatTime(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (isNaN(date.getTime())) return value
      return date.toLocaleString()
    },
    toIso(value) {
      if (!value) return null
      const date = new Date(value)
      return isNaN(date.getTime()) ? null : date.toISOString()
    },
    generateRequestId() {
      return 'ui_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)
    }
  }
}
</script>

<style scoped>
.explore-page .component-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.component-card {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 10px 12px;
  background: #fff;
}
.component-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.component-actions {
  margin-left: auto;
}
.drag-handle {
  cursor: move;
  color: #909399;
  letter-spacing: -2px;
}
.empty-items {
  color: #909399;
  font-size: 13px;
  padding: 10px 0;
}
.item-row,
.selected-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 4px;
  border-bottom: 1px dashed #ebeef5;
}
.item-title {
  min-width: 160px;
  font-weight: 600;
}
.item-ref {
  color: #909399;
  font-size: 12px;
  word-break: break-all;
}
.item-time {
  color: #909399;
  font-size: 12px;
  margin-left: auto;
}
.item-actions {
  margin-left: 8px;
}
.add-component {
  margin-top: 12px;
}
.thumb {
  width: 72px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
}
.phone {
  width: 340px;
  margin: 0 auto;
  border: 12px solid #303133;
  border-radius: 26px;
  overflow: hidden;
  background: #121212;
  color: #fff;
  position: relative;
}
.phone-channel {
  padding: 12px 14px;
  font-size: 18px;
  font-weight: 700;
}
.phone-body {
  max-height: 560px;
  overflow-y: auto;
  padding: 0 12px 20px;
}
.phone-component {
  margin-bottom: 14px;
}
.banner-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}
.topic-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.topic-cell img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 8px;
}
.topic-name {
  font-size: 12px;
  text-align: center;
  margin-top: 4px;
}
.article-card {
  display: flex;
  gap: 8px;
  background: #1f1f1f;
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
}
.article-card img {
  width: 92px;
  height: 68px;
  object-fit: cover;
  border-radius: 6px;
}
.article-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}
.article-summary {
  font-size: 11px;
  color: #b1b3b8;
  max-height: 32px;
  overflow: hidden;
}
.article-meta {
  font-size: 10px;
  color: #7d7f85;
  margin-top: 4px;
}
.preview-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #e6a23c;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
}
.snapshot-component {
  margin-top: 10px;
  border-top: 1px solid #ebeef5;
  padding-top: 8px;
}
.snapshot-item {
  display: flex;
  gap: 10px;
  font-size: 12px;
  padding: 4px 0;
}
</style>
