<template>
  <div class="explore-image-field">
    <el-upload
      v-if="!value || !value.url"
      :action="uploadUrl"
      :headers="headers"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      accept="image/jpeg,image/png,image/webp"
    >
      <el-button size="small" icon="el-icon-upload2">上传图片</el-button>
      <div slot="tip" class="el-upload__tip">JPEG / PNG / WebP，≤5MB，需为素材白名单 HTTPS 域名</div>
    </el-upload>
    <div v-else class="image-preview">
      <img :src="value.url" :alt="value.url">
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
import { getToken } from '@/utils/auth'

export default {
  name: 'ExploreImageField',
  props: {
    // ExploreImage: { url, width, height, mime, size }
    value: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      uploadUrl: process.env.VUE_APP_BASE_API + '/file/upload',
      headers: { Authorization: 'Bearer ' + getToken() }
    }
  },
  methods: {
    beforeUpload(file) {
      const allowed = ['image/jpeg', 'image/png', 'image/webp']
      if (allowed.indexOf(file.type) < 0) {
        this.$modal.msgError('仅允许 JPEG / PNG / WebP 图片')
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        this.$modal.msgError('图片大小不能超过 5MB')
        return false
      }
      return true
    },
    async handleSuccess(res, file) {
      if (!res || res.code !== 200 || !res.data || !res.data.url) {
        this.$modal.msgError((res && res.msg) || '图片上传失败')
        return
      }
      const raw = (file && file.raw) || file
      const dimensions = await this.measure(raw, res.data.url)
      this.$emit('input', {
        url: res.data.url,
        width: dimensions.width,
        height: dimensions.height,
        mime: (raw && raw.type) || this.inferMime(res.data.url),
        size: (raw && raw.size) || 1
      })
    },
    handleError() {
      this.$modal.msgError('图片上传失败，请重试')
    },
    measure(file, url) {
      return new Promise(resolve => {
        const image = new Image()
        image.onload = () => {
          const result = { width: image.naturalWidth, height: image.naturalHeight }
          if (file && URL.revokeObjectURL) {
            URL.revokeObjectURL(image.src)
          }
          resolve(result)
        }
        image.onerror = () => resolve({ width: 0, height: 0 })
        image.src = file && URL.createObjectURL ? URL.createObjectURL(file) : url
      })
    },
    inferMime(url) {
      const lower = (url || '').toLowerCase()
      if (lower.endsWith('.png')) return 'image/png'
      if (lower.endsWith('.webp')) return 'image/webp'
      return 'image/jpeg'
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
