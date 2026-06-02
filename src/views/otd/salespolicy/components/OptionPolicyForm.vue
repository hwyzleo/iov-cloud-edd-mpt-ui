<template>
  <el-dialog :title="title" :visible.sync="dialogVisible" width="600px" append-to-body @close="handleClose">
    <el-form ref="form" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="选项值" prop="optionCode">
        <el-input v-model="form.optionCode" :readonly="form.id !== undefined" placeholder="请输入选项值"/>
      </el-form-item>
      <el-form-item label="销售状态" prop="saleStatus">
        <el-select v-model="form.saleStatus" placeholder="请选择销售状态">
          <el-option label="上架" value="active"/>
          <el-option label="下架" value="off_shelf"/>
          <el-option label="即将上市" value="coming_soon"/>
        </el-select>
      </el-form-item>
      <el-form-item label="选项值价格" prop="optionPrice">
        <el-input-number v-model="form.optionPrice" :precision="2" :min="0" controls-position="right"/>
      </el-form-item>
      <el-form-item label="可售区域">
        <el-input v-model="form.availableRegions" placeholder="请输入可售区域，多个用逗号分隔"/>
      </el-form-item>
      <el-form-item label="销售渠道">
        <el-input v-model="form.channels" placeholder="请输入销售渠道，多个用逗号分隔"/>
      </el-form-item>
      <el-form-item label="捆绑销售">
        <el-input v-model="form.bundleWith" placeholder="请输入捆绑销售选项代码，多个用逗号分隔"/>
      </el-form-item>
      <el-form-item label="互斥选项">
        <el-input v-model="form.mutexWith" placeholder="请输入互斥选项代码，多个用逗号分隔"/>
      </el-form-item>
      <el-form-item label="营销标题">
        <el-input v-model="form.marketingTitle" placeholder="请输入营销标题"/>
      </el-form-item>
      <el-form-item label="营销图片">
        <el-input v-model="form.marketingImage" placeholder="请输入营销图片URL"/>
      </el-form-item>
      <el-form-item label="排序权重">
        <el-input-number v-model="form.sortWeight" controls-position="right" :min="0"/>
      </el-form-item>
      <el-form-item label="生效时间">
        <el-date-picker v-model="form.effectiveFrom" type="datetime" placeholder="请选择生效时间"/>
      </el-form-item>
      <el-form-item label="失效时间">
        <el-date-picker v-model="form.effectiveTo" type="datetime" placeholder="请选择失效时间"/>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="cancel">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { createOptionPolicy, updateOptionPolicy } from '@/api/otd/salespolicy'

export default {
  name: 'OptionPolicyForm',
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
    },
    variantCode: {
      type: String,
      default: ''
    },
    modelCode: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      dialogVisible: false,
      form: {
        id: undefined,
        optionCode: undefined,
        saleStatus: 'active',
        optionPrice: 0,
        availableRegions: undefined,
        channels: undefined,
        bundleWith: undefined,
        mutexWith: undefined,
        marketingTitle: undefined,
        marketingImage: undefined,
        sortWeight: 0,
        effectiveFrom: undefined,
        effectiveTo: undefined
      },
      rules: {
        optionCode: [
          { required: true, message: '选项值不能为空', trigger: 'blur' }
        ],
        saleStatus: [
          { required: true, message: '销售状态不能为空', trigger: 'change' }
        ],
        optionPrice: [
          { required: true, message: '选项值价格不能为空', trigger: 'blur' }
        ]
      }
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
        optionCode: undefined,
        saleStatus: 'active',
        optionPrice: 0,
        availableRegions: undefined,
        channels: undefined,
        bundleWith: undefined,
        mutexWith: undefined,
        marketingTitle: undefined,
        marketingImage: undefined,
        sortWeight: 0,
        effectiveFrom: undefined,
        effectiveTo: undefined
      }
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          // 校验bundleWith和mutexWith是否矛盾
          if (this.form.bundleWith && this.form.mutexWith) {
            const bundleWithArr = this.form.bundleWith.split(',')
            const mutexWithArr = this.form.mutexWith.split(',')
            const conflict = bundleWithArr.some(item => mutexWithArr.includes(item))
            if (conflict) {
              this.$modal.msgError('bundleWith和mutexWith存在矛盾配置')
              return
            }
          }

          const submitData = {
            ...this.form,
            modelCode: this.modelCode,
            variantCode: this.variantCode,
            availableRegions: this.form.availableRegions ? this.form.availableRegions.split(',').map(s => s.trim()).filter(s => s) : [],
            channels: this.form.channels ? this.form.channels.split(',').map(s => s.trim()).filter(s => s) : [],
            bundleWith: this.form.bundleWith ? this.form.bundleWith.split(',').map(s => s.trim()).filter(s => s) : [],
            mutexWith: this.form.mutexWith ? this.form.mutexWith.split(',').map(s => s.trim()).filter(s => s) : [],
            effectiveFrom: this.form.effectiveFrom ? Math.floor(new Date(this.form.effectiveFrom).getTime() / 1000) : null,
            effectiveTo: this.form.effectiveTo ? Math.floor(new Date(this.form.effectiveTo).getTime() / 1000) : null
          }

          if (this.form.id != null) {
            updateOptionPolicy(this.saleModelCode, this.form.id, submitData).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.$emit('success')
            })
          } else {
            createOptionPolicy(this.saleModelCode, submitData).then(response => {
              this.$modal.msgSuccess('新增成功')
              this.$emit('success')
            })
          }
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
