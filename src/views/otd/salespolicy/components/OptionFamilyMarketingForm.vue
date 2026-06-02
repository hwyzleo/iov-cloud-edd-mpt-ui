<template>
  <el-dialog :title="title" :visible.sync="dialogVisible" width="600px" append-to-body @close="handleClose">
    <el-form ref="form" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="选项族代码">
        <el-input v-model="form.optionFamilyCode" disabled/>
      </el-form-item>
      <el-form-item label="营销标题">
        <el-input v-model="form.marketingTitle" placeholder="请输入营销标题（为空时使用MDM默认名称）"/>
      </el-form-item>
      <el-form-item label="营销图片">
        <el-input v-model="form.marketingImage" placeholder="请输入营销图片URL"/>
      </el-form-item>
      <el-form-item label="营销描述">
        <el-input v-model="form.marketingDescription" type="textarea" :rows="3" placeholder="请输入营销描述"/>
      </el-form-item>
      <el-form-item label="排序权重">
        <el-input-number v-model="form.sortWeight" controls-position="right" :min="0"/>
      </el-form-item>
      <el-form-item label="生效时间">
        <el-date-picker v-model="form.effectiveFrom" type="datetime" placeholder="请选择生效时间" style="width: 100%;"/>
      </el-form-item>
      <el-form-item label="失效时间">
        <el-date-picker v-model="form.effectiveTo" type="datetime" placeholder="请选择失效时间" style="width: 100%;"/>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="cancel">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { saveOptionFamilyPolicy } from '@/api/otd/optionFamilyPolicy'

export default {
  name: 'OptionFamilyMarketingForm',
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
    },
    saleModelCode: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      dialogVisible: false,
      form: {
        id: undefined,
        optionFamilyCode: undefined,
        marketingTitle: undefined,
        marketingImage: undefined,
        marketingDescription: undefined,
        sortWeight: 0,
        effectiveFrom: undefined,
        effectiveTo: undefined
      },
      rules: {}
    }
  },
  watch: {
    open: {
      handler(val) {
        this.dialogVisible = val
      },
      immediate: true
    },
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
  methods: {
    resetForm() {
      this.form = {
        id: undefined,
        optionFamilyCode: undefined,
        marketingTitle: undefined,
        marketingImage: undefined,
        marketingDescription: undefined,
        sortWeight: 0,
        effectiveFrom: undefined,
        effectiveTo: undefined
      }
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          const submitData = {
            ...this.form,
            effectiveFrom: this.form.effectiveFrom ? Math.floor(new Date(this.form.effectiveFrom).getTime() / 1000) : null,
            effectiveTo: this.form.effectiveTo ? Math.floor(new Date(this.form.effectiveTo).getTime() / 1000) : null
          }
          saveOptionFamilyPolicy(this.saleModelCode, submitData).then(response => {
            this.$modal.msgSuccess('保存成功')
            this.$emit('success')
          })
        }
      })
    },
    cancel() {
      this.$emit('update:open', false)
    },
    handleClose() {
      this.$emit('update:open', false)
    }
  }
}
</script>
