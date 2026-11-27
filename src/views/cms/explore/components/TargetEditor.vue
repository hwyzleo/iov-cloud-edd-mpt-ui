<template>
  <div class="explore-target-editor">
    <el-form-item label="跳转类型">
      <el-select
        v-model="target.type"
        :clearable="optional && !topicMode"
        placeholder="请选择跳转类型"
        style="width: 100%"
        @change="handleTypeChange"
      >
        <el-option
          v-for="type in targetTypes"
          :key="type"
          :label="targetTypeLabel(type)"
          :value="type"
        />
      </el-select>
    </el-form-item>

    <template v-if="target.type === 'ARTICLE'">
      <el-form-item label="目标文章修订">
        <el-select v-model="articleKey" filterable placeholder="仅已发布文章" style="width: 100%" @change="handleArticleChange">
          <el-option
            v-for="article in articles"
            :key="article.articleId + '::' + article.revisionId"
            :label="(article.title || article.articleId) + ' · 修订#' + (article.revisionNo || '-')"
            :value="article.articleId + '::' + article.revisionId"
          />
        </el-select>
      </el-form-item>
    </template>

    <template v-if="target.type === 'TOPIC' && !topicMode">
      <el-form-item label="目标专题修订">
        <el-select v-model="topicKey" filterable placeholder="仅已发布专题" style="width: 100%" @change="handleTopicChange">
          <el-option
            v-for="topic in topics"
            :key="topic.topicId + '::' + topic.revisionId"
            :label="(topic.name || topic.topicId) + ' · 修订#' + (topic.revisionNo || '-')"
            :value="topic.topicId + '::' + topic.revisionId"
          />
        </el-select>
      </el-form-item>
    </template>

    <el-form-item v-if="topicMode && target.type === 'TOPIC'" label="专题详情">
      <span class="topic-detail-tip">
        卡片点击后打开本专题详情页（封面/图集 + 名称 + 摘要 + 文章列表），无需选择目标专题。
      </span>
    </el-form-item>

    <template v-if="target.type === 'H5'">
      <el-form-item label="H5 地址">
        <el-input v-model="target.url" placeholder="必须为白名单 origin 的绝对 HTTPS 地址" />
      </el-form-item>
    </template>

    <template v-if="target.type === 'NATIVE'">
      <el-form-item label="原生路由">
        <el-select v-model="target.routeCode" filterable placeholder="元数据下发的 routeCode" style="width: 100%">
          <el-option v-for="code in metadata.nativeRouteCodes || []" :key="code" :label="code" :value="code" />
        </el-select>
      </el-form-item>
      <el-form-item label="受控参数">
        <div v-for="(row, index) in paramRows" :key="index" class="param-row">
          <el-select v-model="row.key" filterable placeholder="参数键" style="width: 45%">
            <el-option v-for="key in metadata.nativeParamKeys || []" :key="key" :label="key" :value="key" />
          </el-select>
          <el-input v-model="row.value" placeholder="参数值" style="width: 45%; margin-left: 6px" />
          <el-button type="text" icon="el-icon-delete" @click="removeParam(index)" />
        </div>
        <el-button type="text" icon="el-icon-plus" @click="addParam">添加参数</el-button>
      </el-form-item>
    </template>
  </div>
</template>

<script>
export default {
  name: 'ExploreTargetEditor',
  props: {
    value: {
      type: Object,
      default: null
    },
    articles: {
      type: Array,
      default: () => []
    },
    topics: {
      type: Array,
      default: () => []
    },
    metadata: {
      type: Object,
      default: () => ({})
    },
    optional: {
      type: Boolean,
      default: false
    },
    /**
     * 专题编辑模式：专题详情的跳转目标恒为本专题，不渲染目标专题选择器
     */
    topicMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      target: this.emptyTarget(),
      articleKey: '',
      topicKey: '',
      paramRows: []
    }
  },
  computed: {
    targetTypes() {
      return this.metadata.targetTypes || ['ARTICLE', 'TOPIC', 'H5', 'NATIVE']
    }
  },
  watch: {
    value: {
      handler(value) {
        this.syncFromValue(value)
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    emptyTarget() {
      return { type: '', articleId: '', topicId: '', revisionId: '', url: '', routeCode: '', params: {}}
    },
    syncFromValue(value) {
      if (!value || !value.type) {
        this.target = this.emptyTarget()
        this.articleKey = ''
        this.topicKey = ''
        this.paramRows = []
        return
      }
      this.target = {
        type: value.type,
        articleId: value.articleId || (value.type === 'ARTICLE' ? value.refId : '') || '',
        topicId: value.topicId || (value.type === 'TOPIC' ? value.refId : '') || '',
        revisionId: value.revisionId || '',
        url: value.url || '',
        routeCode: value.routeCode || '',
        params: value.params || {}
      }
      this.articleKey = this.target.articleId && this.target.revisionId
        ? this.target.articleId + '::' + this.target.revisionId : ''
      this.topicKey = this.target.topicId && this.target.revisionId
        ? this.target.topicId + '::' + this.target.revisionId : ''
      this.paramRows = Object.keys(this.target.params || {}).map(key => ({
        key: key,
        value: this.target.params[key]
      }))
    },
    handleTypeChange() {
      this.articleKey = ''
      this.topicKey = ''
      this.paramRows = []
      this.target.articleId = ''
      this.target.topicId = ''
      this.target.revisionId = ''
      this.target.url = ''
      this.target.routeCode = ''
      this.target.params = {}
      this.emit()
    },
    handleArticleChange(value) {
      const parts = (value || '').split('::')
      this.target.articleId = parts[0] || ''
      this.target.revisionId = parts[1] || ''
      this.emit()
    },
    handleTopicChange(value) {
      const parts = (value || '').split('::')
      this.target.topicId = parts[0] || ''
      this.target.revisionId = parts[1] || ''
      this.emit()
    },
    addParam() {
      this.paramRows.push({ key: '', value: '' })
    },
    removeParam(index) {
      this.paramRows.splice(index, 1)
      this.collectParams()
    },
    collectParams() {
      const params = {}
      this.paramRows.forEach(row => {
        if (row.key) {
          params[row.key] = row.value
        }
      })
      this.target.params = params
    },
    emit() {
      this.collectParams()
      if (!this.target.type) {
        this.$emit('input', null)
        return
      }
      const payload = { type: this.target.type }
      if (this.target.type === 'ARTICLE') {
        payload.articleId = this.target.articleId
        payload.revisionId = this.target.revisionId
      } else if (this.target.type === 'TOPIC') {
        if (!this.topicMode) {
          payload.topicId = this.target.topicId
          payload.revisionId = this.target.revisionId
        }
      } else if (this.target.type === 'H5') {
        payload.url = this.target.url
      } else if (this.target.type === 'NATIVE') {
        payload.routeCode = this.target.routeCode
        payload.params = this.target.params
      }
      this.$emit('input', payload)
    },
    targetTypeLabel(type) {
      const labels = { ARTICLE: '文章详情', TOPIC: '专题详情', H5: 'H5 页面', NATIVE: '原生页面' }
      if (type === 'TOPIC' && this.topicMode) {
        return '专题详情（本专题）'
      }
      return labels[type] || type
    }
  }
}
</script>

<style scoped>
.topic-detail-tip {
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
}

.param-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}
</style>
