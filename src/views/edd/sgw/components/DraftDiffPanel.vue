<template>
  <div v-loading="loading" class="draft-diff-panel">
    <el-descriptions :column="3" border size="small" class="draft-diff-summary">
      <el-descriptions-item label="基准版本">{{ baseVersionLabel(diff && diff.baseVersionNo) }}</el-descriptions-item>
      <el-descriptions-item label="草稿修订号">
        {{ diff && diff.draftRevision !== null && diff.draftRevision !== undefined ? diff.draftRevision : '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="变更统计">
        <el-tag type="success" size="mini">新增 {{ total.ADDED }}</el-tag>
        <el-tag type="warning" size="mini" style="margin-left: 6px">修改 {{ total.MODIFIED }}</el-tag>
        <el-tag type="danger" size="mini" style="margin-left: 6px">删除 {{ total.REMOVED }}</el-tag>
      </el-descriptions-item>
    </el-descriptions>

    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon class="draft-diff-alert" />

    <el-empty
      v-else-if="!loading && empty"
      :description="emptyText"
      :image-size="60"
    />

    <el-collapse v-else v-model="expanded" class="draft-diff-groups">
      <el-collapse-item
        v-for="group in groups"
        :key="group.objectType"
        :name="group.objectType"
        :disabled="!group.items.length"
      >
        <template slot="title">
          <span class="draft-diff-group-title">{{ group.label }}</span>
          <el-tag v-if="group.summary.ADDED" type="success" size="mini" style="margin-left: 8px">
            新增 {{ group.summary.ADDED }}
          </el-tag>
          <el-tag v-if="group.summary.MODIFIED" type="warning" size="mini" style="margin-left: 6px">
            修改 {{ group.summary.MODIFIED }}
          </el-tag>
          <el-tag v-if="group.summary.REMOVED" type="danger" size="mini" style="margin-left: 6px">
            删除 {{ group.summary.REMOVED }}
          </el-tag>
          <span v-if="!group.items.length" class="draft-diff-group-empty">无变化</span>
        </template>

        <el-table :data="group.items" size="mini" row-key="code" max-height="360">
          <el-table-column type="expand" width="40">
            <template slot-scope="scope">
              <div class="draft-diff-detail">
                <template v-if="scope.row.changeType === 'MODIFIED'">
                  <el-table :data="visibleFieldDiffs(scope.row.fields)" size="mini" border>
                    <el-table-column label="字段路径" prop="path" min-width="220" />
                    <el-table-column label="变更类型" width="100" align="center">
                      <template slot-scope="field">
                        <el-tag :type="changeTagType(field.row.changeType)" size="mini">
                          {{ changeTypeLabel(field.row.changeType) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="变更前值" min-width="200">
                      <template slot-scope="field">{{ formatDiffValue(field.row.beforeValue) }}</template>
                    </el-table-column>
                    <el-table-column label="变更后值" min-width="200">
                      <template slot-scope="field">{{ formatDiffValue(field.row.afterValue) }}</template>
                    </el-table-column>
                  </el-table>
                  <div v-if="!fieldDiffCount(scope.row)" class="draft-diff-hint">{{ modifiedHint(scope.row) }}</div>
                </template>
                <template v-else>
                  <div class="draft-diff-content-header">
                    <span>{{ scope.row.changeType === 'ADDED' ? '新增对象完整内容' : '删除对象完整内容' }}</span>
                    <el-button type="text" size="mini" icon="el-icon-document-copy" @click="copyContent(scope.row)">
                      复制
                    </el-button>
                  </div>
                  <pre class="draft-diff-json">{{ formatDiffContent(contentOf(scope.row)) }}</pre>
                </template>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="编码" prop="code" min-width="220" />
          <el-table-column label="变化" width="100" align="center">
            <template slot-scope="scope">
              <el-tag :type="changeTagType(scope.row.changeType)" size="mini">
                {{ changeTypeLabel(scope.row.changeType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="字段变更" width="100" align="center">
            <template slot-scope="scope">
              {{ scope.row.changeType === 'MODIFIED' ? fieldDiffCount(scope.row) : '-' }}
            </template>
          </el-table-column>
        </el-table>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script>
import {
  baseVersionLabel,
  changeTagType,
  changeTypeLabel,
  EMPTY_DIFF_TEXT,
  fieldDiffCount,
  formatDiffContent,
  formatDiffValue,
  groupDiffItems,
  isDiffEmpty,
  modifiedHint,
  summarizeChanges,
  visibleFieldDiffs
} from '@/utils/sgw/draftDiff'

export default {
  name: 'SgwDraftDiffPanel',
  props: {
    diff: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      expanded: []
    }
  },
  computed: {
    groups() {
      return groupDiffItems(this.diff ? this.diff.items : [])
    },
    total() {
      return summarizeChanges(this.diff ? this.diff.items : [])
    },
    empty() {
      return isDiffEmpty(this.diff ? this.diff.items : [])
    },
    emptyText() {
      return EMPTY_DIFF_TEXT
    }
  },
  watch: {
    diff() {
      this.expanded = this.groups.filter(group => group.items.length).map(group => group.objectType)
    }
  },
  methods: {
    visibleFieldDiffs,
    fieldDiffCount,
    formatDiffValue,
    formatDiffContent,
    changeTypeLabel,
    changeTagType,
    baseVersionLabel,
    modifiedHint,
    contentOf(item) {
      return item.changeType === 'ADDED' ? item.after : item.before
    },
    copyContent(item) {
      const text = formatDiffContent(this.contentOf(item))
      if (!text) {
        return
      }
      const notify = () => this.$modal.msgSuccess('已复制到剪贴板')
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(notify).catch(() => this.fallbackCopy(text, notify))
        return
      }
      this.fallbackCopy(text, notify)
    },
    fallbackCopy(text, notify) {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        notify()
      } finally {
        document.body.removeChild(textarea)
      }
    }
  }
}
</script>

<style scoped>
.draft-diff-summary {
  margin-bottom: 12px;
}

.draft-diff-alert {
  margin-bottom: 12px;
}

.draft-diff-group-title {
  font-weight: 600;
}

.draft-diff-group-empty {
  color: #909399;
  margin-left: 8px;
  font-size: 12px;
}

.draft-diff-detail {
  padding: 8px 16px 12px 48px;
}

.draft-diff-content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  color: #606266;
}

.draft-diff-hint {
  color: #909399;
  font-size: 12px;
  padding-top: 8px;
}

.draft-diff-json {
  margin: 0;
  padding: 10px 12px;
  max-height: 320px;
  overflow: auto;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre;
}
</style>
