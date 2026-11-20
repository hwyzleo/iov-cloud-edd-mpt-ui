<template>
  <el-dialog
    title="发布协议包"
    :visible="visible"
    width="760px"
    append-to-body
    :close-on-click-modal="false"
    @update:visible="updateVisible"
    @close="updateVisible(false)"
  >
    <el-alert
      type="warning"
      :closable="false"
      show-icon
      class="mb8"
      title="一个发布包必须且仅包含一份隐私政策与一份用户协议，两份修订必须同范围同内容语言；发布后原子切换当前包，旧包内容不变。"
    />
    <el-form ref="form" :model="form" label-width="130px" size="small">
      <el-form-item label="发布范围">
        <el-tag size="mini">{{ form.scene }}</el-tag>
        <el-tag size="mini" style="margin-left: 6px">{{ localeLabel(form.locale || 'zh-CN') }}</el-tag>
        <el-tag size="mini" style="margin-left: 6px">{{ form.market || 'DEFAULT' }}</el-tag>
        <el-tag size="mini" style="margin-left: 6px">{{ form.brandCode || 'DEFAULT' }}</el-tag>
        <el-tag size="mini" style="margin-left: 6px">{{ form.carLineCode || 'DEFAULT' }}</el-tag>
      </el-form-item>
      <el-form-item label="当前包（发布前提）">
        <span v-if="currentBundleId">{{ currentBundleId }}</span>
        <el-tag v-else size="mini" type="info">首次发布（expectedBundleId = null）</el-tag>
      </el-form-item>
      <el-form-item label="隐私政策修订" prop="privacyRevisionId">
        <el-select v-model="form.privacyRevisionId" filterable placeholder="选择已定稿的隐私政策修订" style="width: 100%">
          <el-option
            v-for="item in privacyOptions"
            :key="item.revisionId"
            :label="revisionLabel(item)"
            :value="item.revisionId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="用户协议修订" prop="userAgreementRevisionId">
        <el-select v-model="form.userAgreementRevisionId" filterable placeholder="选择已定稿的用户协议修订" style="width: 100%">
          <el-option
            v-for="item in userAgreementOptions"
            :key="item.revisionId"
            :label="revisionLabel(item)"
            :value="item.revisionId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="幂等请求标识">
        <el-input v-model="form.requestId" readonly>
          <el-button slot="append" size="mini" @click="regenerateRequestId">重新生成</el-button>
        </el-input>
        <div class="tip">同一标识重试会复用原发布结果；不同命令复用同一标识会被拒绝（105007）。</div>
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="updateVisible(false)">取 消</el-button>
      <el-button type="primary" :loading="submitting" :disabled="!publishable" @click="handleSubmit">发 布</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { listAgreementRevision, publishAgreementBundle } from '@/api/cms/agreement'
import {
  buildPublishPayload,
  buildScopeParams,
  buildAgreementSearchParams,
  canPublish,
  nextRequestId,
  localeLabel,
  DEFAULT_SCENE
} from '@/utils/cms/agreement'

export default {
  name: 'PublishDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    metadata: {
      type: Object,
      default: () => ({})
    },
    scope: {
      type: Object,
      default: () => ({})
    },
    currentBundle: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      form: {
        scene: DEFAULT_SCENE,
        market: undefined,
        locale: undefined,
        brandCode: undefined,
        carLineCode: undefined,
        privacyRevisionId: undefined,
        userAgreementRevisionId: undefined,
        requestId: '',
        expectedBundleId: null
      },
      privacyOptions: [],
      userAgreementOptions: [],
      submitting: false
    }
  },
  computed: {
    currentBundleId() {
      return this.currentBundle ? this.currentBundle.bundleId : null
    },
    publishable() {
      return canPublish(this.form)
    }
  },
  watch: {
    visible(value) {
      if (!value) {
        return
      }
      const scopeParams = buildScopeParams(this.scope)
      this.form = {
        scene: scopeParams.scene,
        market: scopeParams.market,
        locale: scopeParams.locale,
        brandCode: scopeParams.brandCode,
        carLineCode: scopeParams.carLineCode,
        privacyRevisionId: undefined,
        userAgreementRevisionId: undefined,
        requestId: nextRequestId(),
        expectedBundleId: this.currentBundleId
      }
      this.loadRevisions()
    }
  },
  methods: {
    localeLabel,
    revisionLabel(item) {
      return item.title + ' · V' + item.version + ' · ' + item.revisionId
    },
    loadRevisions() {
      const params = buildAgreementSearchParams({
        ...this.form,
        pageNum: 1,
        pageSize: 100,
        published: false
      })
      listAgreementRevision({ ...params, agreementType: 'PRIVACY_POLICY' }).then((response) => {
        this.privacyOptions = response.data.items || []
      })
      listAgreementRevision({ ...params, agreementType: 'USER_AGREEMENT' }).then((response) => {
        this.userAgreementOptions = response.data.items || []
      })
    },
    regenerateRequestId() {
      this.form.requestId = nextRequestId()
    },
    updateVisible(value) {
      this.$emit('update:visible', value)
    },
    handleSubmit() {
      this.submitting = true
      publishAgreementBundle(buildPublishPayload(this.form)).then((response) => {
        this.$modal.msgSuccess('发布成功：' + response.data.bundleId)
        this.updateVisible(false)
        this.$emit('success', response.data)
      }).catch(() => {
        // 发布冲突（105006）/幂等冲突（105007）由请求拦截器提示；保持弹窗以便重新生成 requestId 或刷新当前包
      }).finally(() => {
        this.submitting = false
      })
    }
  }
}
</script>

<style scoped>
.tip {
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
}
</style>
