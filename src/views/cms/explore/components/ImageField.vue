<template>
  <div class="explore-image-field">
    <el-upload
      v-if="!value || !value.url"
      :show-file-list="false"
      :http-request="handleUpload"
      :before-upload="beforeUpload"
      :on-error="handleError"
      accept="image/jpeg,image/png,image/webp"
    >
      <el-button size="small" icon="el-icon-upload2" :loading="uploading">上传图片</el-button>
      <div slot="tip" class="el-upload__tip">JPEG / PNG / WebP，≤10MB；经 EDD-OSS 直传 COS，需为素材白名单 HTTPS 域名</div>
    </el-upload>
    <div v-else class="image-preview">
      <img :src="value.url" :alt="value.url" />
      <div class="image-meta">
        {{ value.width }} × {{ value.height }} · {{ value.mime }} · {{ formatSize(value.size) }}
      </div>
      <div class="image-actions">
        <el-button size="mini" @click="clear">更换</el-button>
        <el-button size="mini" type="danger" plain @click="clear">移除</el-button>
      </div>
      <div class="image-url">{{ value.url }}</div>
    </div>
  </div>
</template>

<script>
import { generateExploreAsset, completeExploreAsset } from '@/api/cms/explore'

const MAX_FILE_SIZE = 10 * 1024 * 1024

// 与 EDD-OSS 后端 ImageMimeType 白名单一致
const ALLOWED_EXTENSIONS = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp']
}

export default {
  name: 'ExploreImageField',
  props: {
    // ExploreImage: { url, width, height, mime, size }
    value: {
      type: Object,
      default: null
    },
    // CMS 素材域名白名单（元数据下发），用于上传后提前提示
    allowedHosts: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      uploading: false
    }
  },
  methods: {
    beforeUpload(file) {
      if (!this.resolveContentType(file)) {
        this.$modal.msgError('仅允许 JPEG / PNG / WebP 图片')
        return false
      }
      if (file.size > MAX_FILE_SIZE) {
        this.$modal.msgError('图片大小不能超过 10MB')
        return false
      }
      this.uploading = true
      return true
    },
    /**
     * EDD-OSS 默认素材上传：申请 → 浏览器直传 COS → 完成确认。
     * 不经过 /file/upload，避免网关找不到服务。
     */
    async handleUpload(options) {
      const file = options.file
      const contentType = this.resolveContentType(file)
      if (!contentType) {
        this.uploading = false
        options.onError(new Error('仅允许 JPEG / PNG / WebP 图片'))
        return
      }
      let stage = '申请上传'
      try {
        const prepareResponse = await generateExploreAsset({
          originalFilename: file.name,
          contentType: contentType,
          size: file.size
        })
        const prepare = prepareResponse.data || {}
        if (!prepare.objectId || !prepare.uploadUrl) {
          throw new Error('素材服务未返回上传任务')
        }
        stage = '图片直传 COS'
        const uploadResponse = await fetch(prepare.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': prepare.contentType || contentType },
          body: file
        })
        if (!uploadResponse.ok) {
          throw new Error('COS 返回 HTTP ' + uploadResponse.status)
        }
        stage = '完成确认'
        const completeResponse = await completeExploreAsset(prepare.objectId)
        const object = completeResponse.data || {}
        if (!object.accessUrl) {
          throw new Error('素材服务未返回 accessUrl')
        }
        const dimensions = await this.measure(file)
        this.warnIfHostNotAllowed(object.accessUrl)
        this.$emit('input', {
          url: object.accessUrl,
          width: dimensions.width,
          height: dimensions.height,
          mime: object.actualContentType || object.declaredContentType || contentType,
          size: object.actualSize || object.declaredSize || file.size
        })
        this.uploading = false
        options.onSuccess(completeResponse)
      } catch (error) {
        this.uploading = false
        const detail = error && error.message ? error.message : '未知错误'
        if (stage === '图片直传 COS') {
          this.$modal.msgError(`图片直传 COS 失败（${detail}）。请检查 Bucket CORS 是否允许当前站点 PUT、是否允许 Content-Type 请求头，或预签名地址是否过期。`)
        } else {
          this.$modal.msgError(stage + '失败：' + detail)
        }
        options.onError(error)
      }
    },
    resolveContentType(file) {
      const name = file.name || ''
      const ext = (name.indexOf('.') >= 0 ? name.split('.').pop() : '').toLowerCase()
      let contentType = (file.type || '').toLowerCase()
      if (!ALLOWED_EXTENSIONS[contentType]) {
        contentType = Object.keys(ALLOWED_EXTENSIONS)
          .find(mime => ALLOWED_EXTENSIONS[mime].indexOf(ext) >= 0)
      }
      if (!contentType) return null
      if (ALLOWED_EXTENSIONS[contentType].indexOf(ext) < 0) return null
      return contentType
    },
    measure(file) {
      return new Promise(resolve => {
        const image = new Image()
        image.onload = () => {
          const result = { width: image.naturalWidth, height: image.naturalHeight }
          if (URL.revokeObjectURL) {
            URL.revokeObjectURL(image.src)
          }
          resolve(result)
        }
        image.onerror = () => resolve({ width: 0, height: 0 })
        image.src = URL.createObjectURL(file)
      })
    },
    warnIfHostNotAllowed(url) {
      try {
        const host = new URL(url).host.toLowerCase()
        const allowed = (this.allowedHosts || [])
          .filter(item => item && item.trim())
          .map(item => item.trim().toLowerCase())
        if (allowed.length === 0) {
          this.$modal.msgWarning('CMS 素材白名单为空，保存时会拒绝该图片。请配置 cms.explore.allowed-asset-hosts 后再试。')
        } else if (allowed.indexOf(host) < 0) {
          this.$modal.msgWarning('素材域名 ' + host + ' 不在 CMS 白名单，保存时会拒绝该图片。')
        }
      } catch (error) {
        // URL 解析失败由后端最终校验
      }
    },
    handleError() {
      this.uploading = false
      this.$modal.msgError('图片上传失败，请重试')
    },
    formatSize(size) {
      if (!size) return '-'
      if (size < 1024) return size + ' B'
      if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
      return (size / 1024 / 1024).toFixed(2) + ' MB'
    },
    clear() {
      this.$emit('input', null)
    }
  }
}
</script>

<style scoped>
.explore-image-field {
  width: 100%;
}
.image-preview img {
  max-width: 220px;
  max-height: 140px;
  border-radius: 4px;
  display: block;
}
.image-meta {
  margin-top: 4px;
  color: #606266;
  font-size: 12px;
}
.image-actions {
  margin-top: 6px;
}
.image-url {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
  word-break: break-all;
}
</style>
