<template>
  <el-dialog
    :title="mode === 'create' ? '新增协议内容' : '编辑协议内容'"
    :visible="visible"
    width="900px"
    append-to-body
    :close-on-click-modal="false"
    @update:visible="updateVisible"
    @close="updateVisible(false)"
  >
    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="mb8"
      title="正文以服务端清洗后的安全 HTML 为准；保存后请核对返回的实际正文与调整标记。同一范围内不同“内容语言”是各自独立的草稿与发布包。"
    />
    <el-form ref="form" :model="form" :rules="rules" label-width="110px" size="small">
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="协议类型" prop="agreementType">
            <el-select v-model="form.agreementType" :disabled="mode === 'edit'" style="width: 100%">
              <el-option
                v-for="type in metadata.agreementTypes"
                :key="type"
                :label="agreementTypeLabel(type)"
                :value="type"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="内容语言" prop="locale">
            <el-select
              v-model="form.locale"
              :disabled="mode === 'edit'"
              placeholder="省略则由服务端补默认"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="locale in metadata.locales"
                :key="locale"
                :label="localeLabel(locale)"
                :value="locale"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="市场" prop="market">
            <el-select
              v-model="form.market"
              :disabled="mode === 'edit'"
              placeholder="省略补 DEFAULT"
              clearable
              style="width: 100%"
            >
              <el-option v-for="market in metadata.markets" :key="market" :label="market" :value="market" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="品牌" prop="brandCode">
            <el-select
              v-model="form.brandCode"
              :disabled="mode === 'edit'"
              placeholder="省略补 DEFAULT"
              clearable
              style="width: 100%"
              @change="handleBrandChange"
            >
              <el-option v-for="brand in metadata.brands" :key="brand" :label="brand" :value="brand" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="车系" prop="carLineCode">
            <el-select
              v-model="form.carLineCode"
              :disabled="mode === 'edit'"
              placeholder="省略补 DEFAULT"
              clearable
              style="width: 100%"
            >
              <el-option v-for="carLine in carLineOptions" :key="carLine" :label="carLine" :value="carLine" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="标题" prop="title">
            <el-input v-model="form.title" maxlength="255" placeholder="例如：隐私政策" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="业务版本" prop="version">
            <el-input v-model="form.version" maxlength="64" placeholder="例如：1.0（同身份同版本不可复用）" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="协议日期" prop="agreementDate">
            <el-date-picker
              v-model="form.agreementDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="选择日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="mode === 'edit'">
          <el-form-item label="乐观锁版本">
            <el-input :value="form.lockVersion" disabled />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="协议正文" prop="body">
        <el-tabs v-model="bodyMode" style="width: 100%">
          <el-tab-pane label="可视化编辑" name="visual">
            <editor v-model="form.body" :height="320" />
          </el-tab-pane>
          <el-tab-pane label="HTML 源码" name="source">
            <el-input
              v-model="form.body"
              type="textarea"
              :rows="14"
              placeholder="仅支持段落/标题/加粗/斜体/下划线/列表/换行与绝对 HTTPS 链接；脚本、样式、事件与外部资源会被移除"
            />
          </el-tab-pane>
        </el-tabs>
        <div class="editor-tip">
          允许标签：p、br、h1~h4、strong、em、u、ol、ul、li、a；链接仅接受绝对 HTTPS 地址。
        </div>
      </el-form-item>

      <!-- 保存后必须展示服务端实际保存内容，避免用清洗前原文核对 -->
      <el-card v-if="savedResult" shadow="never" class="saved-card">
        <div slot="header">
          <span>服务端保存结果</span>
          <el-tag size="mini" style="margin-left: 8px">{{ savedResult.sanitizerVersion }}</el-tag>
          <el-tag
            size="mini"
            :type="savedResult.adjusted ? 'warning' : 'success'"
            style="margin-left: 8px"
          >{{ savedResult.adjusted ? '已按策略清洗调整' : '未被清洗调整' }}</el-tag>
          <el-tag size="mini" type="info" style="margin-left: 8px">lockVersion={{ savedResult.lockVersion }}</el-tag>
        </div>
        <div class="saved-body" v-html="savedResult.body"></div>
      </el-card>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="updateVisible(false)">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保 存</el-button>
    </div>
  </el-dialog>
</template>

<script>
import Editor from '@/components/Editor'
import { createAgreementDraft, updateAgreementDraft } from '@/api/cms/agreement'
import {
  buildDraftCreatePayload,
  buildDraftUpdatePayload,
  carLinesOfBrand,
  agreementTypeLabel,
  localeLabel,
  DEFAULT_SCENE
} from '@/utils/cms/agreement'

function emptyForm() {
  return {
    agreementType: 'PRIVACY_POLICY',
    scene: DEFAULT_SCENE,
    market: undefined,
    locale: undefined,
    brandCode: undefined,
    carLineCode: undefined,
    title: '',
    version: '1.0',
    agreementDate: undefined,
    body: '',
    lockVersion: undefined
  }
}

export default {
  name: 'DraftEditDialog',
  components: { Editor },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    mode: {
      type: String,
      default: 'create'
    },
    metadata: {
      type: Object,
      default: () => ({})
    },
    draft: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      form: emptyForm(),
      bodyMode: 'visual',
      submitting: false,
      savedResult: null,
      rules: {
        agreementType: [{ required: true, message: '请选择协议类型', trigger: 'change' }],
        title: [{ required: true, message: '请输入协议标题', trigger: 'blur' }],
        version: [{ required: true, message: '请输入业务版本', trigger: 'blur' }],
        agreementDate: [{ required: true, message: '请选择协议日期', trigger: 'change' }],
        body: [{ required: true, message: '请输入协议正文', trigger: 'blur' }]
      }
    }
  },
  computed: {
    carLineOptions() {
      return carLinesOfBrand(this.metadata, this.form.brandCode)
    }
  },
  watch: {
    visible(value) {
      if (!value) {
        return
      }
      this.savedResult = null
      this.bodyMode = 'visual'
      this.form = this.mode === 'edit' && this.draft ? this.fromDraft(this.draft) : emptyForm()
      this.$nextTick(() => {
        this.$refs.form && this.$refs.form.clearValidate()
      })
    }
  },
  methods: {
    agreementTypeLabel,
    localeLabel,
    fromDraft(draft) {
      return {
        agreementType: draft.agreementType,
        scene: draft.scene,
        market: draft.market,
        locale: draft.locale,
        brandCode: draft.brandCode,
        carLineCode: draft.carLineCode,
        title: draft.title,
        version: draft.version,
        agreementDate: draft.agreementDate,
        body: draft.body,
        lockVersion: draft.lockVersion
      }
    },
    handleBrandChange() {
      if (this.form.carLineCode && !this.carLineOptions.includes(this.form.carLineCode)) {
        this.form.carLineCode = undefined
      }
    },
    updateVisible(value) {
      this.$emit('update:visible', value)
    },
    handleSubmit() {
      this.$refs.form.validate((valid) => {
        if (!valid) {
          return
        }
        this.submitting = true
        const request = this.mode === 'edit'
          ? updateAgreementDraft(this.draft.draftId, buildDraftUpdatePayload(this.form))
          : createAgreementDraft(buildDraftCreatePayload(this.form))
        request.then((response) => {
          this.savedResult = response.data
          this.$modal.msgSuccess(this.mode === 'edit' ? '修改成功' : '新增成功')
          this.$emit('success', response.data)
          if (this.mode === 'edit') {
            this.form = this.fromDraft(response.data)
          }
        }).catch(() => {
          // 版本冲突（105005）等错误由请求拦截器统一提示，这里保持弹窗开着便于用户基于最新版本重试
        }).finally(() => {
          this.submitting = false
        })
      })
    }
  }
}
</script>

<style scoped>
.editor-tip {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
}

.saved-card {
  margin-top: 10px;
}

.saved-body {
  max-height: 220px;
  overflow: auto;
  line-height: 1.7;
}
</style>
