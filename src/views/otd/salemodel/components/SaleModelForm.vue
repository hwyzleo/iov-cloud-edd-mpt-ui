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
            :label="carline.code + ' - ' + carline.name"
            :value="carline.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="图标">
        <el-input v-model="form.icon" placeholder="请输入图标URL" />
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
        <el-input v-model="form.images[index]" placeholder="请输入图片URL">
          <el-button slot="append" icon="el-icon-delete" @click="removeImage(index)" />
        </el-input>
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
import { addSaleModel, updateSaleModel } from '@/api/otd/salemodel'
import { listSeries } from '@/api/mdm/carline'

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
