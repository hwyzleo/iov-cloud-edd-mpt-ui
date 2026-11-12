<template>
  <div class="marketing-image-field">
    <div class="marketing-image-field__toolbar">
      <el-input
        class="marketing-image-field__input"
        :value="value"
        :placeholder="placeholder"
        clearable
        @input="handleInput"
      />
      <el-upload
        class="marketing-image-field__upload"
        action="#"
        :auto-upload="false"
        :show-file-list="false"
        :disabled="uploading"
        :on-change="handleFileChange"
      >
        <el-button size="small" :loading="uploading" :disabled="uploading" icon="el-icon-upload2">上传</el-button>
      </el-upload>
      <el-button
        v-if="value"
        size="small"
        icon="el-icon-delete"
        :disabled="uploading"
        @click="handleClear"
      >清空</el-button>
    </div>
    <el-image
      v-if="previewUrl"
      :src="previewUrl"
      :preview-src-list="[previewUrl]"
      :style="previewStyle"
      class="marketing-image-field__preview"
      fit="cover"
    >
      <div slot="error" class="marketing-image-field__error">
        <i class="el-icon-picture-outline" />
      </div>
    </el-image>
    <div v-if="uploading" class="marketing-image-field__hint">
      图片上传中，完成后将自动回填访问地址…
    </div>
  </div>
</template>

<script>
import { createSaleModelImageTicket, completeSaleModelImage } from '@/api/otd/salemodel'
import { UPLOAD_STAGE, isPreviewableUrl, validateImageFile } from '@/utils/otd/marketingImage'

/**
 * 营销图片字段（OTD-VSO-DSN-CR-004 §4.1）
 * - 贴地址与上传双模式，统一对外只输出 accessUrl 字符串，保存契约不变
 * - 完整复用 OTD-VSO-DSN-CR-003 的上传链路：申请凭证 → 浏览器直传 COS → 完成确认
 * - 任何阶段失败都不覆盖原有值；任务序号用于忽略过期响应
 */
export default {
  name: 'MarketingImageField',
  props: {
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '请输入营销图片URL或点击上传'
    },
    previewWidth: {
      type: [String, Number],
      default: 100
    }
  },
  data() {
    return {
      // 是否有进行中的上传任务
      uploading: false,
      // 任务序号：父级回写地址、切换记录、组件销毁时递增，用于忽略迟到回调
      taskSeq: 0,
      // 本组件最后一次对外输出的值，用于区分「外部改写」与「自身回填」
      emittedValue: this.value
    }
  },
  computed: {
    previewUrl() {
      return isPreviewableUrl(this.value) ? this.value.trim() : ''
    },
    previewStyle() {
      const width = typeof this.previewWidth === 'number' ? this.previewWidth + 'px' : this.previewWidth
      return { width: width }
    }
  },
  watch: {
    value(val) {
      // 上传中父级把字段改成别的值（切换记录、重置表单、手工输入），放弃进行中的上传
      if (this.uploading && val !== this.emittedValue) {
        this.resetUploadState()
      }
      this.emittedValue = val
    }
  },
  beforeDestroy() {
    this.resetUploadState()
  },
  methods: {
    /** 供父表单保存前检查，避免未回填地址即提交 */
    isUploading() {
      return this.uploading
    },
    /** 供父表单在打开/切换记录时调用，丢弃迟到的上传结果 */
    resetUploadState() {
      this.taskSeq += 1
      if (this.uploading) {
        this.uploading = false
        this.$emit('uploading-change', false)
      }
    },
    handleInput(val) {
      this.emittedValue = val
      this.$emit('input', val)
    },
    handleClear() {
      if (this.uploading) return
      this.handleInput('')
    },
    handleFileChange(file) {
      const raw = file && file.raw
      if (!raw) return
      if (this.uploading) {
        this.$modal.msgWarning('图片正在上传，请等待本次上传完成')
        return
      }
      const checked = validateImageFile(raw)
      if (!checked.ok) {
        this.$modal.msgError(checked.message)
        return
      }
      this.startUpload(raw, checked.contentType)
    },
    startUpload(raw, contentType) {
      const taskId = ++this.taskSeq
      this.uploading = true
      this.$emit('uploading-change', true)
      let stage = UPLOAD_STAGE.TICKET
      createSaleModelImageTicket({
        originalFilename: raw.name,
        contentType: contentType,
        size: raw.size
      }).then(response => {
        if (!this.isActiveTask(taskId)) return null
        const ticket = (response && response.data) || {}
        if (!ticket.objectId || !ticket.uploadUrl) {
          throw new Error('未获取到有效上传凭证')
        }
        stage = UPLOAD_STAGE.COS
        return this.putObjectToCos(ticket.uploadUrl, raw, ticket.contentType || contentType).then(() => {
          if (!this.isActiveTask(taskId)) return null
          stage = UPLOAD_STAGE.COMPLETE
          return completeSaleModelImage(ticket.objectId, { uploadToken: ticket.uploadToken })
        })
      }).then(response => {
        if (!this.isActiveTask(taskId) || !response) return
        const result = response.data || {}
        if (!result.accessUrl) {
          throw new Error('完成确认未返回可访问地址')
        }
        this.finishTask()
        // 仅回填公开访问地址，objectId / uploadToken / uploadUrl / File 一律不外泄
        this.emittedValue = result.accessUrl
        this.$emit('input', result.accessUrl)
        this.$modal.msgSuccess('上传成功')
      }).catch(error => {
        if (!this.isActiveTask(taskId)) return
        this.finishTask()
        this.notifyUploadFailure(stage, error)
      })
    },
    isActiveTask(taskId) {
      return this.taskSeq === taskId
    },
    finishTask() {
      if (!this.uploading) return
      this.uploading = false
      this.$emit('uploading-change', false)
    },
    /**
     * 分阶段提示失败原因：浏览器直传 COS 使用 fetch，不经平台 axios 拦截器，
     * 必须在此显式提示，否则用户只会看到无响应。
     */
    notifyUploadFailure(stage, error) {
      // 仅记录阶段、状态码与错误消息，禁止输出 uploadToken、预签名地址与 COS 凭证
      // （axios 错误对象里带着请求体，直接打印会把 uploadToken 泄露到控制台）
      const status = error && error.response ? error.response.status : undefined
      const message = error && error.message ? error.message : '未知错误'
      console.error('[营销图片上传] ' + stage + ' 失败', { status: status, message: message })
      if (stage === UPLOAD_STAGE.COS) {
        this.$modal.msgError('图片直传 COS 失败（' + message + '）。请用浏览器开发者工具 Network 查看 OPTIONS/PUT 请求：多为 Bucket CORS 未允许当前站点执行 PUT 或未允许 Content-Type 请求头，也可能是预签名地址已过期或图片超出限制。')
        return
      }
      // 申请与完成确认走平台 axios 拦截器，HTTP 错误已由拦截器提示，避免重复弹框
      if (!(error && error.response)) {
        this.$modal.msgError(stage + '失败：' + message)
      }
    },
    /** 浏览器直传 COS：独立 fetch，仅携带 Content-Type，不携带后台凭证或 Cookie */
    putObjectToCos(uploadUrl, file, contentType) {
      return fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
        credentials: 'omit'
      }).then(response => {
        if (!response.ok) {
          throw new Error('COS 返回 HTTP ' + response.status)
        }
        return response
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.marketing-image-field__toolbar {
  display: flex;
  align-items: center;
  width: 100%;
}

.marketing-image-field__input {
  flex: 1;
}

.marketing-image-field__upload {
  margin-left: 8px;
}

.marketing-image-field__preview {
  margin-top: 5px;
}

.marketing-image-field__error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 20px;
}

.marketing-image-field__hint {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
  line-height: 18px;
}
</style>
