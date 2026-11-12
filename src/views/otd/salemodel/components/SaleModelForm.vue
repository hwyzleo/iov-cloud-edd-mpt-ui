<template>
  <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
    <el-form ref="form" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="销售代码" prop="saleModelCode">
        <el-input v-model="form.saleModelCode" :readonly="form.id !== undefined" placeholder="请输入销售代码" />
      </el-form-item>
      <el-form-item label="销售车型名称" prop="modelName">
        <el-input v-model="form.modelName" placeholder="请输入销售车型名称" />
      </el-form-item>
      <el-form-item label="车系代码" prop="carlineCode">
        <el-select v-model="form.carlineCode" :disabled="form.id !== undefined" placeholder="请选择车系" clearable>
          <el-option
            v-for="carline in carlineOptions"
            :key="carline.code"
            :label="carline.nameLocal + '(' + carline.name + ')'"
            :value="carline.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="图标">
        <div class="image-field">
          <el-input v-model="form.icon" placeholder="请输入图标URL或点击上传" />
          <el-upload
            class="image-field-upload"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :disabled="uploadingKey !== null"
            :on-change="file => handleImageUpload(file, 'icon')"
          >
            <el-button size="small" :loading="uploadingKey === 'icon'" icon="el-icon-upload2">上传</el-button>
          </el-upload>
        </div>
        <el-image
          v-if="form.icon && isValidImage(form.icon)"
          :src="form.icon"
          style="width: 100px; margin-top: 5px;"
          fit="cover"
        >
          <div slot="error" class="image-slot">
            <i class="el-icon-picture-outline"></i>
          </div>
        </el-image>
      </el-form-item>
      <el-form-item
        v-for="(image, index) in form.images"
        :key="'image-' + index"
        :label="'图片 ' + (index + 1)"
      >
        <div class="image-field">
          <el-input v-model="form.images[index]" placeholder="请输入图片URL或点击上传" />
          <el-upload
            class="image-field-upload"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :disabled="uploadingKey !== null"
            :on-change="file => handleImageUpload(file, index)"
          >
            <el-button
              size="small"
              :loading="uploadingKey === ('image-' + index)"
              icon="el-icon-upload2"
            >上传</el-button>
          </el-upload>
          <el-button size="small" icon="el-icon-delete" @click="removeImage(index)">删除</el-button>
        </div>
        <el-image
          v-if="form.images[index] && isValidImage(form.images[index])"
          :src="form.images[index]"
          style="width: 100%; margin-top: 5px;"
          fit="cover"
        >
          <div slot="error" class="image-slot">
            <i class="el-icon-picture-outline"></i>
          </div>
        </el-image>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-plus" size="mini" @click="addImage">添加图片</el-button>
      </el-form-item>
      <el-form-item label="启用意向金">
        <el-switch v-model="form.earnestMoney" :active-value="true" :inactive-value="false" />
      </el-form-item>
      <el-form-item label="启用定金">
        <el-switch v-model="form.downPayment" :active-value="true" :inactive-value="false" />
      </el-form-item>
      <el-form-item label="营销文案">
        <el-input v-model="form.marketingCopy" type="textarea" placeholder="请输入营销文案" />
      </el-form-item>
      <el-form-item label="排序权重" prop="sortWeight">
        <el-input-number v-model="form.sortWeight" controls-position="right" :min="0" />
      </el-form-item>
      <el-form-item label="可售区域">
        <el-input v-model="form.availableRegions" placeholder="请输入可售区域，多个用逗号分隔" />
      </el-form-item>
      <el-form-item label="销售渠道">
        <el-input v-model="form.channels" placeholder="请输入销售渠道，多个用逗号分隔" />
      </el-form-item>
      <el-form-item label="生效时间" prop="effectiveFrom">
        <el-date-picker v-model="form.effectiveFrom" type="datetime" placeholder="请选择生效时间" />
      </el-form-item>
      <el-form-item label="失效时间">
        <el-date-picker v-model="form.effectiveTo" type="datetime" placeholder="请选择失效时间" />
      </el-form-item>
      <el-form-item label="上下架状态">
        <el-radio-group v-model="form.listingStatus">
          <el-radio label="active">上架</el-radio>
          <el-radio label="off_shelf">下架</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="cancel">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { addSaleModel, updateSaleModel, createSaleModelImageTicket, completeSaleModelImage } from '@/api/otd/salemodel'
import { listSeries } from '@/api/mdm/carline'

// 单张图片最大字节数（10 MiB），与 EDD-OSS 图片白名单一致
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
// 允许的扩展名与 MIME 映射（与后端 ImageMimeType 白名单一致）
const ALLOWED_EXTENSIONS = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp']
}

export default {
  name: 'SaleModelForm',
  props: {
    open: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    formData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      carlineOptions: [],
      // 当前上传中的字段标识：'icon' 或 'image-{index}'，同一时间只允许一个上传任务
      uploadingKey: null,
      form: {
        id: undefined,
        saleModelCode: undefined,
        modelName: undefined,
        carlineCode: undefined,
        icon: undefined,
        images: [],
        earnestMoney: false,
        downPayment: false,
        marketingCopy: undefined,
        sortWeight: 99,
        availableRegions: undefined,
        channels: undefined,
        effectiveFrom: undefined,
        effectiveTo: undefined,
        listingStatus: 'active'
      },
      rules: {
        saleModelCode: [
          { required: true, message: '销售代码不能为空', trigger: 'blur' }
        ],
        modelName: [
          { required: true, message: '销售车型名称不能为空', trigger: 'blur' }
        ],
        carlineCode: [
          { required: true, message: '车系代码不能为空', trigger: 'change' }
        ],
        effectiveFrom: [
          { required: true, message: '生效时间不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  watch: {
    formData: {
      handler(val) {
        if (val && Object.keys(val).length > 0) {
          this.form = { ...val }
        } else {
          this.resetForm()
        }
      },
      deep: true,
      immediate: true
    }
  },
  created() {
    this.getCarlineOptions()
  },
  methods: {
    getCarlineOptions() {
      listSeries({ page: 1, size: 1000, includeInactive: false }).then(response => {
        this.carlineOptions = response.data.rows
      })
    },
    resetForm() {
      this.form = {
        id: undefined,
        saleModelCode: undefined,
        modelName: undefined,
        carlineCode: undefined,
        icon: undefined,
        images: [],
        earnestMoney: false,
        downPayment: false,
        marketingCopy: undefined,
        sortWeight: 99,
        availableRegions: undefined,
        channels: undefined,
        effectiveFrom: undefined,
        effectiveTo: undefined,
        listingStatus: 'active'
      }
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          const submitData = {
            ...this.form,
            availableRegions: this.form.availableRegions ? this.form.availableRegions.split(',').map(s => s.trim()).filter(s => s) : [],
            channels: this.form.channels ? this.form.channels.split(',').map(s => s.trim()).filter(s => s) : [],
            effectiveFrom: this.form.effectiveFrom ? Math.floor(new Date(this.form.effectiveFrom).getTime() / 1000) : null,
            effectiveTo: this.form.effectiveTo ? Math.floor(new Date(this.form.effectiveTo).getTime() / 1000) : null
          }
          if (this.form.id !== undefined) {
            updateSaleModel(submitData).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.$emit('success')
            })
          } else {
            addSaleModel(submitData).then(response => {
              this.$modal.msgSuccess('新增成功')
              this.$emit('success')
            })
          }
        }
      })
    },
    addImage() {
      this.form.images.push('')
    },
    /**
     * 上传图片（OTD-VSO-DSN-CR-003 §7）：前端预校验 → 申请凭证 → 浏览器直传 COS → 完成确认 → 回填地址
     * 失败不覆盖字段原值，按阶段提示。
     */
    handleImageUpload(file, target) {
      const raw = file && file.raw
      if (!raw || this.uploadingKey !== null) return
      const contentType = this.resolveContentType(raw)
      if (!contentType) {
        this.$modal.msgError('仅支持 JPEG / PNG / WebP 图片')
        return
      }
      if (!raw.size || raw.size > MAX_IMAGE_SIZE) {
        this.$modal.msgError('图片大小必须大于 0 且不超过 10 MiB')
        return
      }
      this.uploadingKey = target === 'icon' ? 'icon' : 'image-' + target
      let stage = '申请上传凭证'
      createSaleModelImageTicket({
        originalFilename: raw.name,
        contentType: contentType,
        size: raw.size
      }).then(response => {
        const ticket = response.data || {}
        if (!ticket.objectId || !ticket.uploadUrl) {
          throw new Error('未获取到有效上传凭证')
        }
        stage = '图片直传 COS'
        return this.putObjectToCos(ticket.uploadUrl, raw, ticket.contentType || contentType).then(() => {
          stage = '完成确认'
          return completeSaleModelImage(ticket.objectId, { uploadToken: ticket.uploadToken })
        })
      }).then(response => {
        const result = response.data || {}
        if (!result.accessUrl) {
          throw new Error('完成确认未返回可访问地址')
        }
        if (target === 'icon') {
          this.$set(this.form, 'icon', result.accessUrl)
        } else {
          this.$set(this.form.images, target, result.accessUrl)
        }
        this.uploadingKey = null
        this.$modal.msgSuccess('上传成功')
      }).catch(error => {
        this.uploadingKey = null
        this.notifyUploadFailure(stage, error)
      })
    },
    /**
     * 分阶段提示失败原因：浏览器直传 COS 使用 fetch，不经平台 axios 拦截器，
     * 必须在此显式提示，否则用户只会看到无响应。
     */
    notifyUploadFailure(stage, error) {
      console.error('[销售车型图片上传] ' + stage + ' 失败', error)
      if (stage === '图片直传 COS') {
        const detail = error && error.message ? error.message : '未知错误'
        this.$modal.msgError('图片直传 COS 失败（' + detail + '）。请用浏览器开发者工具 Network 查看 OPTIONS/PUT 请求：多为 Bucket CORS 未允许当前站点执行 PUT 或未允许 Content-Type 请求头，也可能是预签名地址已过期或图片超出限制。')
        return
      }
      // 申请与完成确认走平台 axios 拦截器，HTTP 错误已由拦截器提示，避免重复弹框
      if (!(error && error.response)) {
        this.$modal.msgError(stage + '失败：' + (error && error.message ? error.message : '网络或未知错误'))
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
    },
    /** 解析并校验文件 MIME 与扩展名一致性 */
    resolveContentType(file) {
      const name = file.name || ''
      const ext = (name.indexOf('.') >= 0 ? name.split('.').pop() : '').toLowerCase()
      let contentType = (file.type || '').toLowerCase()
      if (!ALLOWED_EXTENSIONS[contentType]) {
        contentType = Object.keys(ALLOWED_EXTENSIONS).find(mime => ALLOWED_EXTENSIONS[mime].indexOf(ext) >= 0)
      }
      if (!contentType) return null
      if (ALLOWED_EXTENSIONS[contentType].indexOf(ext) < 0) return null
      return contentType
    },
    removeImage(index) {
      this.form.images.splice(index, 1)
    },
    isValidImage(url) {
      return url && /\.(jpeg|jpg|gif|png|webp|svg)/i.test(url)
    },
    cancel() {
      this.$emit('update:open', false)
    }
  }
}
</script>

<style scoped>
.image-field {
  display: flex;
  align-items: center;
  width: 100%;
}

.image-field .el-input {
  flex: 1;
}

.image-field-upload,
.image-field .el-button {
  margin-left: 8px;
}
</style>
