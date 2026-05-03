<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="销售代码" prop="saleCode">
        <el-input
          v-model="queryParams.saleCode"
          placeholder="请输入销售代码"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="销售车型名称" prop="modelName">
        <el-input
          v-model="queryParams.modelName"
          placeholder="请输入销售车型名称"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="dateRange"
          style="width: 240px"
          value-format="yyyy-MM-dd"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['completeVehicle:product:saleModel:add']"
        >新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['completeVehicle:product:saleModel:edit']"
        >修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['completeVehicle:product:saleModel:remove']"
        >删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['completeVehicle:product:saleModel:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="saleModelList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="销售代码" prop="saleCode" width="100"/>
      <el-table-column label="销售车型名称" prop="modelName"/>
      <el-table-column label="图片数量" align="center" width="120">
        <template slot-scope="scope">
          <span>{{ scope.row.images.length }}</span>
        </template>
      </el-table-column>
      <el-table-column label="是否允许意向金" align="center" width="120">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.earnestMoney"
            :active-value="true"
            :inactive-value="false"
            disabled
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="是否允许定金" align="center" width="120">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.downPayment"
            :active-value="true"
            :inactive-value="false"
            disabled
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="启用状态" align="center" width="100">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.enable"
            :active-value="true"
            :inactive-value="false"
            disabled
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="排序" prop="sort" align="center" width="60"/>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="250" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['completeVehicle:product:saleModel:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-picture"
            @click="handleImages(scope.row)"
            v-hasPermi="['completeVehicle:product:saleModel:edit']"
          >维护图片
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-setting"
            @click="handleConfig(scope.row)"
            v-hasPermi="['completeVehicle:product:saleModel:edit']"
          >车型配置
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['completeVehicle:product:saleModel:remove']"
          >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改销售车型配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="销售代码" prop="saleCode">
          <el-input v-model="form.saleCode" :readonly="form.id !== undefined" placeholder="请输入销售代码"/>
        </el-form-item>
        <el-form-item label="销售车型名称" prop="modelName">
          <el-input v-model="form.modelName" placeholder="请输入销售车型名称"/>
        </el-form-item>
        <el-form-item label="是否允许意向金">
          <el-radio-group v-model="form.earnestMoney">
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="意向金金额" v-show="form.earnestMoney">
          <el-input v-model="form.earnestMoneyPrice" placeholder="请输入意向金金额"/>
        </el-form-item>
        <el-form-item label="是否允许定金">
          <el-radio-group v-model="form.downPayment">
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="意向金金额" v-show="form.downPayment">
          <el-input v-model="form.downPaymentPrice" placeholder="请输入定金金额"/>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-radio-group v-model="form.enable">
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" controls-position="right" :min="0"/>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 图片维护对话框 -->
    <el-dialog :title="title" :visible.sync="openImages" width="600px" append-to-body>
      <el-form :model="form" label-width="120px">
        <el-form-item label="销售代码">
          <el-input v-model="form.saleCode" :disabled="true"/>
        </el-form-item>
        <el-form-item label="销售车型名称">
          <el-input v-model="form.modelName" :disabled="true"/>
        </el-form-item>
        <el-form-item
          v-for="(image, index) in form.images"
          :label="'图片地址 ' + (index + 1)"
          :key="index"
        >
          <el-row>
            <el-input v-model="form.images[index]" @input="validateImage(index)">
              <el-button slot="append" icon="el-icon-delete" @click="removeImage(index)"></el-button>
            </el-input>
          </el-row>
          <el-row>
            <el-image
              v-if="isValidImage(form.images[index])"
              :src="form.images[index]"
              style="width: 100%;"
              fit="cover"
            >
              <div slot="error" class="image-slot">
                <i class="el-icon-picture-outline"></i>
              </div>
            </el-image>
          </el-row>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-plus" @click="addImage">添加图片</el-button>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitImages">确 定</el-button>
        <el-button @click="cancelImages">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 车型配置列表对话框 -->
    <el-dialog :title="title" :visible.sync="openConfigList" width="1000px" append-to-body>
      <el-form :model="form" label-width="120px">
        <el-form-item label="销售代码">
          <el-input v-model="form.saleCode" :disabled="true"/>
        </el-form-item>
        <el-form-item label="销售车型名称">
          <el-input v-model="form.modelName" :disabled="true"/>
        </el-form-item>
      </el-form>
      <div class="dialog-body" style="max-height: 50vh; overflow-y: auto;">
        <el-table v-loading="loadingConfig" :data="saleModelConfigList">
          <el-table-column label="配置类型" prop="type" width="100">
            <template slot-scope="scope">
              <span>{{ getSaleModelConfigTypeLabel(scope.row.type) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="类型代码" prop="typeCode" width="110"/>
          <el-table-column label="类型名称" prop="typeName"/>
          <el-table-column label="类型价格" prop="typePrice" width="100"/>
          <el-table-column label="图片数量" align="center" width="80">
            <template slot-scope="scope">
              <span>{{ scope.row.typeImage.length }}</span>
            </template>
          </el-table-column>
          <el-table-column label="启用状态" align="center" width="80">
            <template slot-scope="scope">
              <el-switch
                v-model="scope.row.enable"
                :active-value="true"
                :inactive-value="false"
                disabled
              ></el-switch>
            </template>
          </el-table-column>
          <el-table-column label="排序" prop="sort" width="60"/>
          <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleUpdateConfig(scope.row)"
                v-hasPermi="['completeVehicle:product:saleModel:edit']"
              >修改
              </el-button>
              <el-button
                size="mini"
                type="text"
                icon="el-icon-delete"
                @click="handleDeleteConfig(form.id, scope.row)"
                v-hasPermi="['completeVehicle:product:saleModel:edit']"
              >删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleAddConfig(form.id)">新 增</el-button>
        <el-button @click="cancelConfigList">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 车型配置对话框 -->
    <el-dialog :title="title2" :visible.sync="openConfig" width="600px" append-to-body>
      <el-form ref="formConfig" :model="formConfig" :rules="rulesConfig" label-width="100px">
        <el-form-item label="销售代码">
          <el-input v-model="formConfig.saleCode" :readonly="true"/>
        </el-form-item>
        <el-form-item label="配置类型">
          <el-select
            v-model="formConfig.type"
            placeholder="配置类型"
            clearable
          >
            <el-option
              v-for="dict in dict.type.iov_sale_model_config_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="配置类型代码">
          <el-input v-model="formConfig.typeCode"/>
        </el-form-item>
        <el-form-item label="配置类型名称">
          <el-input v-model="formConfig.typeName"/>
        </el-form-item>
        <el-form-item label="配置类型价格">
          <el-input v-model="formConfig.typePrice"/>
        </el-form-item>
        <el-form-item label="配置类型描述">
          <el-input v-model="formConfig.typeDesc"/>
        </el-form-item>
        <el-form-item label="配置类型参数">
          <el-input v-model="formConfig.typeParam"/>
        </el-form-item>
        <el-form-item
          v-for="(image, index) in formConfig.typeImage"
          :label="'图片地址 ' + (index + 1)"
          :key="index"
        >
          <el-row>
            <el-input v-model="formConfig.typeImage[index]" @input="validateConfigImage(index)">
              <el-button slot="append" icon="el-icon-delete" @click="removeConfigImage(index)"></el-button>
            </el-input>
          </el-row>
          <el-row>
            <el-image
              v-if="isValidImage(formConfig.typeImage[index])"
              :src="formConfig.typeImage[index]"
              style="width: 100%;"
              fit="cover"
            >
              <div slot="error" class="image-slot">
                <i class="el-icon-picture-outline"></i>
              </div>
            </el-image>
          </el-row>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-plus" @click="addConfigImage">添加图片</el-button>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-radio-group v-model="formConfig.enable">
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formConfig.sort" controls-position="right" :min="0"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitConfig">确 定</el-button>
        <el-button @click="cancelConfig">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listSaleModel,
  listSaleModelConfig,
  getSaleModel,
  getSaleModelConfig,
  addSaleModel,
  addSaleModelConfig,
  updateSaleModel,
  updateSaleModelConfig,
  updateSaleModelImages,
  delSaleModel,
  delSaleModelConfig
} from "@/api/completevehicle/product/salemodel";

export default {
  name: "SaleModel",
  dicts: ['iov_sale_model_config_type'],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 遮罩层（车型配置）
      loadingConfig: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 销售车型表格数据
      saleModelList: [],
      // 销售车型配置表格数据
      saleModelConfigList: [],
      // 弹出层标题
      title: "",
      // 2级弹出层标题
      title2: "",
      // 是否显示弹出层
      open: false,
      // 是否显示弹出层（图片维护）
      openImages: false,
      // 是否显示弹出层（车型配置列表）
      openConfigList: false,
      // 是否显示弹出层（车型配置）
      openConfig: false,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 销售车型表单参数
      form: {},
      // 销售车型配置表单参数
      formConfig: {},
      // 销售车型表单校验
      rules: {
        saleCode: [
          {required: true, message: "销售代码不能为空", trigger: "blur"}
        ],
        modelName: [
          {required: true, message: "销售车型名称不能为空", trigger: "blur"}
        ],
        sort: [
          {required: true, message: "排序不能为空", trigger: "blur"}
        ]
      },
      // 销售车型配置表单校验
      rulesConfig: {
        saleCode: [
          {required: true, message: "销售代码不能为空", trigger: "blur"}
        ],
        modelName: [
          {required: true, message: "销售车型名称不能为空", trigger: "blur"}
        ],
        sort: [
          {required: true, message: "排序不能为空", trigger: "blur"}
        ]
      }
    };
  },
  created() {
    this.queryParams.saleCode = this.$route.query.saleCode;
    this.getList();
  },
  methods: {
    /** 查询销售车型列表 */
    getList() {
      this.loading = true;
      listSaleModel(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.saleModelList = response.data.items;
          this.total = response.data.total;
          this.loading = false;
        }
      );
    },
    /** 查询销售车型配置列表 */
    getListConfig(saleModelId) {
      this.loadingConfig = true;
      listSaleModelConfig(saleModelId).then(response => {
          this.saleModelConfigList = response.rows;
          this.loadingConfig = false;
        }
      );
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 取消按钮（维护图片） */
    cancelImages() {
      this.openImages = false;
      this.reset();
    },
    /** 取消按钮（车型配置列表） */
    cancelConfigList() {
      this.openConfigList = false;
      this.reset();
    },
    /** 取消按钮（车型配置） */
    cancelConfig() {
      this.openConfig = false;
      this.resetConfig();
    },
    /** 表单重置 */
    reset() {
      this.form = {
        saleCode: undefined,
        modelName: undefined,
        earnestMoney: true,
        earnestMoneyPrice: undefined,
        downPayment: true,
        downPaymentPrice: undefined,
        enable: true,
        sort: 99,
        images: ['']
      };
      this.resetForm("form");
    },
    /** 表单重置 */
    resetConfig() {
      this.formConfig = {
        id: undefined,
        saleCode: undefined,
        type: undefined,
        typeCode: undefined,
        typeName: undefined,
        typePrice: true,
        typeDesc: undefined,
        typeParam: undefined,
        enable: true,
        sort: 99,
        typeImage: ['']
      };
      this.resetForm("formConfig");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加销售车型";
      this.form = {
        earnestMoney: true,
        earnestMoneyPrice: 5000,
        downPayment: true,
        downPaymentPrice: 5000,
        enable: true,
        sort: 99
      };
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const saleModelId = row.id || this.ids
      getSaleModel(saleModelId).then(response => {
        this.form = response.data;
        this.open = true;
      });
      this.title = "修改销售车型";
    },
    /** 图片维护操作 */
    handleImages(row) {
      this.reset();
      getSaleModel(row.id).then(response => {
        this.form = response.data;
        this.openImages = true;
      });
      this.title = "图片维护";
    },
    /** 车型配置操作 */
    handleConfig(row) {
      this.reset();
      getSaleModel(row.id).then(response => {
        this.form = response.data;
      });
      listSaleModelConfig(row.id).then(response => {
        this.saleModelConfigList = response.rows;
        this.loadingConfig = false;
        this.openConfigList = true;
      });
      this.title = "车型配置";
    },
    /** 获取销售车型配置类型 */
    getSaleModelConfigTypeLabel(saleModelConfigType) {
      if (!this.dict || !this.dict.type || !this.dict.type.iov_sale_model_config_type) {
        return saleModelConfigType;
      }
      const item = this.dict.type.iov_sale_model_config_type.find(
        dict => dict.value === saleModelConfigType
      )
      return item ? item.label : saleModelConfigType
    },
    /** 添加图片 */
    addImage() {
      this.form.images.push('')
    },
    /** 添加配置图片 */
    addConfigImage() {
      this.formConfig.typeImage.push('')
    },
    /** 删除图片 */
    removeImage(index) {
      this.form.images.splice(index, 1)
    },
    /** 删除配置图片 */
    removeConfigImage(index) {
      this.formConfig.typeImage.splice(index, 1)
    },
    /** 验证图片URL是否有效 */
    validateImage(index) {
      const url = this.form.images[index]
      if (url && !this.isValidImage(url)) {
        this.$message.warning('请输入有效的图片URL地址')
      }
    },
    /** 验证配置图片URL是否有效 */
    validateConfigImage(index) {
      const url = this.formConfig.typeImage[index]
      if (url && !this.isValidImage(url)) {
        this.$message.warning('请输入有效的图片URL地址')
      }
    },
    /** 检查URL是否是有效的图片地址 */
    isValidImage(url) {
      return url && url.match(/\.(jpeg|jpg|gif|png)$/i) != null
    },
    /** 新增车型配置按钮操作 */
    handleAddConfig(saleModelId) {
      this.resetConfig();
      getSaleModel(saleModelId).then(response => {
        this.formConfig = {
          saleCode: response.data.saleCode,
          typeImage: [''],
          enable: true,
          sort: 99
        };
        this.openConfig = true;
      });
      this.title2 = "添加销售车型配置";
    },
    /** 修改车型配置按钮操作 */
    handleUpdateConfig(row) {
      this.resetConfig();
      const saleModelConfigId = row.id || this.ids
      getSaleModelConfig(this.form.id, saleModelConfigId).then(response => {
        this.formConfig = response.data;
        this.openConfig = true;
      });
      this.title2 = "修改销售车型配置";
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateSaleModel(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addSaleModel(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 提交按钮（维护图片） */
    submitImages: function () {
      if (this.form.id !== undefined) {
        updateSaleModelImages(this.form).then(response => {
          this.$modal.msgSuccess("修改成功");
          this.openImages = false;
          this.getList();
        });
      }
    },
    /** 提交按钮（车型配置） */
    submitConfig: function () {
      this.$refs["formConfig"].validate(valid => {
        if (valid) {
          if (this.formConfig.id !== undefined) {
            updateSaleModelConfig(this.form.id, this.formConfig).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.openConfig = false;
              this.getListConfig(this.form.id);
            });
          } else {
            addSaleModelConfig(this.form.id, this.formConfig).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.openConfig = false;
              this.getListConfig(this.form.id);
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const saleModelIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除销售车型ID为"' + saleModelIds + '"的数据项？').then(function () {
        return delSaleModel(saleModelIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 删除配置按钮操作 */
    handleDeleteConfig(saleModelId, row) {
      const saleModelConfigIds = row.id || this.ids;
      this.$modal.confirm('是否确认删除销售车型配置ID为"' + saleModelConfigIds + '"的数据项？').then(function () {
        console.log(saleModelId);
        return delSaleModelConfig(saleModelId, saleModelConfigIds);
      }).then(() => {
        this.getListConfig(saleModelId);
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('otd-vso/mpt/saleModel/export', {
        ...this.queryParams
      }, `sale_model_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
