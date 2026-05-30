<template>
  <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
    <el-form ref="form" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="销售代码" prop="saleModelCode">
        <el-input v-model="form.saleModelCode" :readonly="form.id !== undefined" placeholder="请输入销售代码"/>
      </el-form-item>
      <el-form-item label="销售车型名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入销售车型名称"/>
      </el-form-item>
      <el-form-item label="Variant代码" prop="variantCode">
        <el-input v-model="form.variantCode" :readonly="form.id !== undefined" placeholder="请输入Variant代码"/>
      </el-form-item>
      <el-form-item label="基础价格" prop="basePrice">
        <el-input-number v-model="form.basePrice" :precision="2" :min="0" controls-position="right"/>
      </el-form-item>
      <el-form-item label="意向金价格" prop="earnestMoneyPrice">
        <el-input-number v-model="form.earnestMoneyPrice" :precision="2" :min="0" controls-position="right"/>
      </el-form-item>
      <el-form-item label="定金价格" prop="downPaymentPrice">
        <el-input-number v-model="form.downPaymentPrice" :precision="2" :min="0" controls-position="right"/>
      </el-form-item>
      <el-form-item label="启用意向金">
        <el-switch
          v-model="form.earnestMoney"
          :active-value="true"
          :inactive-value="false"
        />
      </el-form-item>
      <el-form-item label="启用定金">
        <el-switch
          v-model="form.downPayment"
          :active-value="true"
          :inactive-value="false"
        />
      </el-form-item>
      <el-form-item label="图标">
        <el-input v-model="form.icon" placeholder="请输入图标URL"/>
      </el-form-item>
      <el-form-item label="营销文案">
        <el-input v-model="form.marketingCopy" type="textarea" placeholder="请输入营销文案"/>
      </el-form-item>
      <el-form-item label="排序权重" prop="sortWeight">
        <el-input-number v-model="form.sortWeight" controls-position="right" :min="0"/>
      </el-form-item>
      <el-form-item label="可售区域">
        <el-input v-model="form.availableRegions" placeholder="请输入可售区域，多个用逗号分隔"/>
      </el-form-item>
      <el-form-item label="销售渠道">
        <el-input v-model="form.channels" placeholder="请输入销售渠道，多个用逗号分隔"/>
      </el-form-item>
      <el-form-item label="生效时间" prop="effectiveFrom">
        <el-date-picker v-model="form.effectiveFrom" type="datetime" placeholder="请选择生效时间"/>
      </el-form-item>
      <el-form-item label="失效时间">
        <el-date-picker v-model="form.effectiveTo" type="datetime" placeholder="请选择失效时间"/>
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
      form: {
        id: undefined,
        saleModelCode: undefined,
        name: undefined,
        variantCode: undefined,
        basePrice: 0,
        earnestMoneyPrice: 0,
        downPaymentPrice: 0,
        earnestMoney: true,
        downPayment: true,
        icon: undefined,
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
        name: [
          { required: true, message: '销售车型名称不能为空', trigger: 'blur' }
        ],
        variantCode: [
          { required: true, message: 'Variant代码不能为空', trigger: 'blur' }
        ],
        basePrice: [
          { required: true, message: '基础价格不能为空', trigger: 'blur' }
        ],
        earnestMoneyPrice: [
          { required: true, message: '意向金价格不能为空', trigger: 'blur' }
        ],
        downPaymentPrice: [
          { required: true, message: '定金价格不能为空', trigger: 'blur' }
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
  methods: {
    resetForm() {
      this.form = {
        id: undefined,
        saleModelCode: undefined,
        name: undefined,
        variantCode: undefined,
        basePrice: 0,
        earnestMoneyPrice: 0,
        downPaymentPrice: 0,
        earnestMoney: true,
        downPayment: true,
        icon: undefined,
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
          if (this.form.id !== undefined) {
            updateSaleModel(this.form).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.$emit('success')
            })
          } else {
            addSaleModel(this.form).then(response => {
              this.$modal.msgSuccess('新增成功')
              this.$emit('success')
            })
          }
        }
      })
    },
    cancel() {
      this.$emit('update:open', false)
    }
  }
}
</script>
