<template>
  <el-drawer
    :title="title"
    :visible="visible"
    size="46%"
    append-to-body
    @update:visible="updateVisible"
    @close="updateVisible(false)"
  >
    <div v-if="content" class="drawer-body">
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="协议类型">{{ content.agreementType }}</el-descriptions-item>
        <el-descriptions-item label="内容语言">{{ content.locale || '-' }}</el-descriptions-item>
        <el-descriptions-item label="业务版本">V{{ content.version }}</el-descriptions-item>
        <el-descriptions-item label="协议日期">{{ content.agreementDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="范围" :span="2">
          {{ content.scene }} / {{ content.market }} / {{ content.locale }} /
          {{ content.brandCode }} / {{ content.carLineCode }}
        </el-descriptions-item>
        <el-descriptions-item label="修订标识" :span="2">{{ content.revisionId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="内容摘要" :span="2">{{ content.contentHash || '-' }}</el-descriptions-item>
        <el-descriptions-item label="清洗策略" :span="2">{{ content.sanitizerVersion || '-' }}</el-descriptions-item>
        <el-descriptions-item label="正文格式" :span="2">{{ content.contentType || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        class="mb8 mt8"
        title="以下正文为服务端返回的安全 HTML 快照，摘要用于一致性校验，不代表数字签名或用户同意证明。"
      />

      <div class="body-preview" v-html="content.body"></div>
    </div>
    <div v-else class="drawer-body">暂无内容</div>
  </el-drawer>
</template>

<script>
export default {
  name: 'AgreementViewDrawer',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '协议正文'
    },
    content: {
      type: Object,
      default: null
    }
  },
  methods: {
    updateVisible(value) {
      this.$emit('update:visible', value)
    }
  }
}
</script>

<style scoped>
.drawer-body {
  padding: 0 20px 20px;
}

.mt8 {
  margin-top: 12px;
}

.body-preview {
  margin-top: 12px;
  padding: 12px 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  line-height: 1.8;
  word-break: break-word;
}
</style>
