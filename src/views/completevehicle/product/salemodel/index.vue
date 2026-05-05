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
      <el-table-column label="生产配置数" align="center" width="100">
        <template slot-scope="scope">
          <span>{{ scope.row.buildConfigCount || 0 }}</span>
        </template>
      </el-table-column>
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
      <el-table-column label="操作" align="center" width="280" class-name="small-padding fixed-width">
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
            icon="el-icon-connection"
            @click="handleBuildConfig(scope.row)"
            v-hasPermi="['completeVehicle:product:saleModel:edit']"
          >生产配置
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
        <el-form-item label="定金金额" v-show="form.downPayment">
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

    <!-- 车型配置维护对话框 -->
    <el-dialog :title="title2" :visible.sync="openConfig" width="600px" append-to-body>
      <el-form ref="formConfig" :model="formConfig" :rules="rulesConfig" label-width="100px">
        <el-form-item label="销售代码">
          <el-input v-model="formConfig.saleCode" :disabled="true"/>
        </el-form-item>
        <el-form-item label="配置类型">
          <el-input v-model="formConfig.type" :disabled="true"/>
        </el-form-item>
        <el-form-item label="配置代码">
          <el-input v-model="formConfig.typeCode" :disabled="true"/>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="formConfig.typeName" placeholder="请输入名称"/>
        </el-form-item>
        <el-form-item label="配置价格" prop="typePrice">
          <el-input-number v-model="formConfig.typePrice" :precision="2" :min="0" controls-position="right"/>
        </el-form-item>
        <el-form-item label="配置描述">
          <el-input v-model="formConfig.typeDesc" type="textarea" placeholder="请输入配置描述"/>
        </el-form-item>
        <el-form-item label="配置参数">
          <el-input v-model="formConfig.typeParam" type="textarea" placeholder="请输入配置参数"/>
        </el-form-item>
        <el-form-item
          v-for="(image, index) in formConfig.typeImage"
          :label="'图片 ' + (index + 1)"
          :key="index"
        >
          <el-row>
            <el-input v-model="formConfig.typeImage[index]" placeholder="请输入图片URL">
              <el-button slot="append" icon="el-icon-delete" @click="removeConfigImage(index)"></el-button>
            </el-input>
          </el-row>
          <el-row v-if="formConfig.typeImage[index]">
            <el-image
              :src="formConfig.typeImage[index]"
              style="width: 100%; max-height: 200px;"
              fit="contain"
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
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitConfig">确 定</el-button>
        <el-button @click="cancelConfig">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 生产配置关联管理对话框 -->
    <el-dialog :title="title" :visible.sync="openBuildConfig" width="900px" append-to-body>
      <el-tabs v-model="activeBuildConfigTab" type="card">
        <el-tab-pane label="特征值范围" name="featureRanges">
          <el-alert
            title="说明"
            type="info"
            :closable="false"
            style="margin-bottom: 15px;"
          >
            <template slot="default">
              根据关联的生产配置聚合计算出的特征值可选范围。用户选择销售车型配置时，只能选择这些范围内的特征值。
            </template>
          </el-alert>
          <el-form :model="form" label-width="100px" size="small">
            <el-form-item label="销售代码">
              <el-input v-model="form.saleCode" :disabled="true"/>
            </el-form-item>
            <el-form-item label="车型名称">
              <el-input v-model="form.modelName" :disabled="true"/>
            </el-form-item>
          </el-form>
          <div v-if="aggregatedFeatureCodeRanges.length > 0" style="margin-top: 10px;">
            <el-collapse accordion>
              <el-collapse-item
                v-for="(range, index) in aggregatedFeatureCodeRanges"
                :key="index"
              >
                <template slot="title">
                  <span style="font-weight: 500;">{{ range.familyName }}</span>
                  <el-tag size="mini" type="success" style="margin-left: 10px;">
                    {{ range.featureCode.length }}个可选
                  </el-tag>
                </template>
                <div style="padding: 10px 0;">
                  <el-tag
                    v-for="(code, i) in range.featureCode"
                    :key="i"
                    size="small"
                    style="margin: 3px;"
                  >
                    {{ range.featureName[i] }}
                  </el-tag>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
          <el-empty v-else description="暂无关联的生产配置，请先在配置列表中关联生产配置" :image-size="80"/>
        </el-tab-pane>
        
        <el-tab-pane label="配置列表" name="buildConfigList">
          <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
              <el-button
                type="primary"
                plain
                icon="el-icon-plus"
                size="mini"
                @click="handleAddBuildConfig"
                v-hasPermi="['completeVehicle:product:saleModel:edit']"
              >新增生产配置
              </el-button>
            </el-col>
          </el-row>
          <el-table
            v-loading="loadingBuildConfig"
            :data="buildConfigRelationList"
            size="small"
            border
            style="width: 100%"
          >
            <el-table-column label="生产配置代码" prop="buildConfigCode" width="120" show-overflow-tooltip/>
            <el-table-column label="生产配置名称" prop="buildConfigName" show-overflow-tooltip/>
            <el-table-column label="状态" align="center" width="70">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.enable" type="success" size="mini">启用</el-tag>
                <el-tag v-else type="info" size="mini">禁用</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="排序" prop="sort" align="center" width="60"/>
            <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
              <template slot-scope="scope">
                <el-button
                  size="mini"
                  type="text"
                  icon="el-icon-edit"
                  @click="handleUpdateBuildConfig(scope.row)"
                  v-hasPermi="['completeVehicle:product:saleModel:edit']"
                >修改
                </el-button>
                <el-button
                  size="mini"
                  type="text"
                  icon="el-icon-delete"
                  @click="handleDeleteBuildConfig(scope.row)"
                  v-hasPermi="['completeVehicle:product:saleModel:edit']"
                >删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="价格图片维护" name="priceImageConfig">
          <el-row style="margin-bottom: 15px;">
            <el-col :span="18">
              <el-alert
                title="说明"
                type="info"
                :closable="false"
              >
                <template slot="default">
                  配置项由生产配置自动生成。请维护每个配置项的价格和图片信息，用于用户选择配置时的展示和价格计算。
                  <span style="color: #E6A23C;">价格为0的项表示尚未维护，请在修改时补充。</span>
                </template>
              </el-alert>
            </el-col>
            <el-col :span="6" style="text-align: right;">
              <el-button
                type="primary"
                size="mini"
                icon="el-icon-refresh"
                @click="handleSyncConfigs"
                v-hasPermi="['completeVehicle:product:saleModel:edit']"
              >同步特征值
              </el-button>
            </el-col>
          </el-row>
          <el-table
            v-loading="loadingConfig"
            :data="configTreeData"
            size="small"
            border
            style="width: 100%"
            row-key="treeId"
            :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
          >
            <el-table-column label="特征族/特征值代码" prop="code" width="150" show-overflow-tooltip/>
            <el-table-column label="名称" prop="typeName" show-overflow-tooltip/>
            <el-table-column label="价格" prop="typePrice" width="100" align="right">
              <template slot-scope="scope">
                <span v-if="scope.row.isFeatureValue">{{ scope.row.typePrice || 0 }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="图片" align="center" width="80">
              <template slot-scope="scope">
                <span v-if="scope.row.isFeatureValue">
                  <el-tag v-if="scope.row.typeImage && scope.row.typeImage.length > 0" size="mini" type="success">
                    {{ scope.row.typeImage.length }}张
                  </el-tag>
                  <el-tag v-else size="mini" type="warning">待维护</el-tag>
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="70">
              <template slot-scope="scope">
                <span v-if="scope.row.isFeatureValue">
                  <el-tag v-if="scope.row.enable" size="mini" type="success">启用</el-tag>
                  <el-tag v-else size="mini" type="info">禁用</el-tag>
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="100" class-name="small-padding fixed-width">
              <template slot-scope="scope">
                <el-button
                  v-if="scope.row.isFeatureValue"
                  size="mini"
                  type="text"
                  icon="el-icon-edit"
                  @click="handleUpdateConfig(scope.row)"
                  v-hasPermi="['completeVehicle:product:saleModel:edit']"
                  :disabled="!scope.row.enable"
                >维护
                </el-button>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelBuildConfig">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 新增生产配置关联对话框 -->
    <el-dialog :title="titleBuildConfig" :visible.sync="openAddBuildConfig" width="600px" append-to-body>
      <el-form ref="formBuildConfig" :model="formBuildConfig" :rules="rulesBuildConfig" label-width="120px">
        <el-form-item label="基础车型筛选">
          <el-select
            v-model="formBuildConfig.baseModelCode"
            placeholder="请选择基础车型（可选）"
            filterable
            clearable
            @change="handleBaseModelChangeForBuildConfig"
          >
            <el-option
              v-for="item in baseModelList"
              :key="item.code"
              :label="item.name"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="生产配置" prop="buildConfigCode">
          <el-select
            v-model="formBuildConfig.buildConfigCode"
            placeholder="请选择生产配置"
            filterable
            clearable
          >
            <el-option
              v-for="item in buildConfigOptions"
              :key="item.code"
              :label="item.name"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-radio-group v-model="formBuildConfig.enable">
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="formBuildConfig.sort" controls-position="right" :min="0"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitBuildConfig">确 定</el-button>
        <el-button @click="cancelAddBuildConfig">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 修改生产配置关联对话框 -->
    <el-dialog :title="titleBuildConfig" :visible.sync="openEditBuildConfig" width="500px" append-to-body>
      <el-form ref="formEditBuildConfig" :model="formEditBuildConfig" label-width="120px">
        <el-form-item label="生产配置代码">
          <el-input v-model="formEditBuildConfig.buildConfigCode" :disabled="true"/>
        </el-form-item>
        <el-form-item label="生产配置名称">
          <el-input v-model="formEditBuildConfig.buildConfigName" :disabled="true"/>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-radio-group v-model="formEditBuildConfig.enable">
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="formEditBuildConfig.sort" controls-position="right" :min="0"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitEditBuildConfig">确 定</el-button>
        <el-button @click="cancelEditBuildConfig">取 消</el-button>
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
  updateSaleModel,
  updateSaleModelImages,
  delSaleModel,
  updateSaleModelConfig,
  listSaleModelBuildConfig,
  getSaleModelFeatureCodeRanges,
  addSaleModelBuildConfig,
  updateSaleModelBuildConfig,
  delSaleModelBuildConfig,
  listBuildConfigByBaseModelCode,
  syncSaleModelConfig
} from "@/api/completevehicle/product/salemodel";
import { listBaseModelByPlatformCodeAndSeriesCodeAndModelCode } from "@/api/completevehicle/product/basemodel";

export default {
  name: "SaleModel",
  dicts: [],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 遮罩层（车型配置）
      loadingConfig: true,
      // 遮罩层（生产配置关联）
      loadingBuildConfig: true,
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
      // 生产配置关联表格数据
      buildConfigRelationList: [],
      // 聚合后的特征值范围
      aggregatedFeatureCodeRanges: [],
      // 基础车型列表
      baseModelList: [],
      // 生产配置选项列表（用于新增关联）
      buildConfigOptions: [],
      // 聚合后的特征值范围
      aggregatedFeatureCodeRanges: [],
      // 弹出层标题
      title: "",
      // 2级弹出层标题
      title2: "",
      // 生产配置关联弹出层标题
      titleBuildConfig: "",
      // 是否显示弹出层
      open: false,
      // 是否显示弹出层（图片维护）
      openImages: false,
      // 是否显示弹出层（车型配置列表）
      openConfigList: false,
      // 是否显示弹出层（车型配置）
      openConfig: false,
      // 是否显示弹出层（生产配置关联管理）
      openBuildConfig: false,
      // 生产配置管理标签页
      activeBuildConfigTab: 'buildConfigList',
      // 是否显示弹出层（新增生产配置关联）
      openAddBuildConfig: false,
      // 是否显示弹出层（修改生产配置关联）
      openEditBuildConfig: false,
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
      // 新增生产配置关联表单参数
      formBuildConfig: {},
      // 修改生产配置关联表单参数
      formEditBuildConfig: {},
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
      },
      // 生产配置关联表单校验
      rulesBuildConfig: {
        buildConfigCode: [
          {required: true, message: "生产配置不能为空", trigger: "change"}
        ]
      }
    };
},
  computed: {
    configTreeData() {
      if (!this.saleModelConfigList || this.saleModelConfigList.length === 0) {
        return [];
      }
      
      // 按特征族分组
      const familyMap = {};
      this.saleModelConfigList.forEach(config => {
        const familyCode = config.type;
        if (!familyMap[familyCode]) {
          familyMap[familyCode] = {
            id: `family-${familyCode}`,  // 树形节点的唯一key
            treeId: `family-${familyCode}`,
            code: familyCode,
            typeName: this.getFamilyName(config.typeName),
            isFeatureValue: false,
            children: []
          };
        }
        
        // 添加特征值作为子节点，保留原始的Long类型id
        familyMap[familyCode].children.push({
          ...config,
          treeId: `value-${familyCode}-${config.typeCode}`,  // 树形节点的唯一key
          code: config.typeCode,
          isFeatureValue: true
        });
      });
      
      // 转换为数组
      return Object.values(familyMap).sort((a, b) => a.code.localeCompare(b.code));
    }
  },
  created() {
    this.queryParams.saleCode = this.$route.query.saleCode;
    this.getList();
    this.getBaseModelList();
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
    /** 获取基础车型列表 */
    getBaseModelList() {
      listBaseModelByPlatformCodeAndSeriesCodeAndModelCode(null, null, null).then(response => {
        this.baseModelList = response.data;
      });
    },
    /** 查询销售车型配置列表 */
    getListConfig(saleModelId) {
      this.loadingConfig = true;
      listSaleModelConfig(saleModelId).then(response => {
          this.saleModelConfigList = response.data;
          this.loadingConfig = false;
        }
      );
    },
    /** 查询销售车型生产配置关联列表 */
    getListBuildConfig(saleModelId) {
      this.loadingBuildConfig = true;
      console.log('查询生产配置关联列表，saleModelId:', saleModelId);
      listSaleModelBuildConfig(saleModelId).then(response => {
        console.log('生产配置关联列表返回数据:', response);
        this.buildConfigRelationList = response.data || [];
        this.loadingBuildConfig = false;
        
        // 查询聚合后的特征值范围
        console.log('查询聚合特征值范围，saleModelId:', saleModelId);
        getSaleModelFeatureCodeRanges(saleModelId).then(response => {
          console.log('聚合特征值范围返回数据:', response);
          this.aggregatedFeatureCodeRanges = response.data || [];
        }).catch(error => {
          console.error('查询聚合特征值范围失败:', error);
          this.aggregatedFeatureCodeRanges = [];
        });
      }).catch(error => {
        console.error('查询生产配置关联列表失败:', error);
        this.loadingBuildConfig = false;
      });
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
    /** 取消按钮（生产配置关联管理） */
    cancelBuildConfig() {
      this.openBuildConfig = false;
      this.buildConfigRelationList = [];
      this.aggregatedFeatureCodeRanges = [];
      this.saleModelConfigList = [];
      this.activeBuildConfigTab = 'buildConfigList';
    },
    /** 取消按钮（新增生产配置关联） */
    cancelAddBuildConfig() {
      this.openAddBuildConfig = false;
      this.resetBuildConfig();
    },
    /** 取消按钮（修改生产配置关联） */
    cancelEditBuildConfig() {
      this.openEditBuildConfig = false;
      this.resetEditBuildConfig();
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
        typePrice: 0,
        typeDesc: undefined,
        typeParam: undefined,
        enable: true,
        sort: 0,
        typeImage: []
      };
      this.resetForm("formConfig");
    },
    /** 生产配置关联表单重置 */
    resetBuildConfig() {
      this.formBuildConfig = {
        baseModelCode: undefined,
        buildConfigCode: undefined,
        enable: true,
        sort: 0
      };
      this.buildConfigOptions = [];
      this.resetForm("formBuildConfig");
    },
    /** 修改生产配置关联表单重置 */
    resetEditBuildConfig() {
      this.formEditBuildConfig = {
        id: undefined,
        buildConfigCode: undefined,
        buildConfigName: undefined,
        enable: true,
        sort: 0
      };
      this.resetForm("formEditBuildConfig");
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
        this.saleModelConfigList = response.data;
        this.loadingConfig = false;
        this.openConfigList = true;
      });
      this.title = "车型配置";
    },
    /** 获取销售车型配置类型 */
    getSaleModelConfigTypeLabel(saleModelConfigType) {
      return saleModelConfigType;
    },
    /** 从typeName中提取特征族名称 */
    getFamilyName(typeName) {
      if (!typeName) return '';
      // typeName格式：特征族名称-特征值代码
      const parts = typeName.split('-');
      return parts.length > 0 ? parts[0] : typeName;
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
    /** 修改车型配置按钮操作 */
    handleUpdateConfig(row) {
      this.resetConfig();
      this.formConfig = {
        id: row.id,
        saleCode: this.form.saleCode,
        type: row.type,
        typeCode: row.typeCode,
        typeName: row.typeName,
        typePrice: row.typePrice || 0,
        typeDesc: row.typeDesc,
        typeParam: row.typeParam,
        enable: row.enable,
        sort: row.sort,
        typeImage: row.typeImage || []
      };
      this.openConfig = true;
      this.title2 = "维护配置价格图片";
    },
    /** 同步特征值配置 */
    handleSyncConfigs() {
      this.$confirm('是否确认重新同步特征值配置？这将根据关联的生产配置重新生成配置项', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        syncSaleModelConfig(this.form.id).then(response => {
          this.$modal.msgSuccess("同步成功");
          this.getListConfig(this.form.id);
        });
      }).catch(() => {});
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
          updateSaleModelConfig(this.form.id, this.formConfig).then(response => {
            this.$modal.msgSuccess("维护成功");
            this.openConfig = false;
            this.getListConfig(this.form.id);
            this.activeBuildConfigTab = 'priceImageConfig';
          });
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
    /** 导出按钮操作 */
    handleExport() {
      this.download('otd-vso/mpt/saleModel/v1/export', {
        ...this.queryParams
      }, `sale_model_${new Date().getTime()}.xlsx`)
    },
    /** 生产配置关联管理按钮操作 */
    handleBuildConfig(row) {
      this.reset();
      getSaleModel(row.id).then(response => {
        this.form = response.data;
        this.getListBuildConfig(row.id);
        this.getListConfig(row.id);
        this.activeBuildConfigTab = 'buildConfigList';
        this.openBuildConfig = true;
      });
      this.title = "生产配置关联管理";
    },
    /** 新增生产配置关联按钮操作 */
    handleAddBuildConfig() {
      this.resetBuildConfig();
      this.openAddBuildConfig = true;
      this.titleBuildConfig = "新增生产配置关联";
    },
    /** 修改生产配置关联按钮操作 */
    handleUpdateBuildConfig(row) {
      this.resetEditBuildConfig();
      this.formEditBuildConfig = {
        id: row.id,
        buildConfigCode: row.buildConfigCode,
        buildConfigName: row.buildConfigName,
        enable: row.enable,
        sort: row.sort
      };
      this.openEditBuildConfig = true;
      this.titleBuildConfig = "修改生产配置关联";
    },
    /** 删除生产配置关联按钮操作 */
    handleDeleteBuildConfig(row) {
      const buildConfigIds = row.id;
      this.$modal.confirm('是否确认删除生产配置关联ID为"' + buildConfigIds + '"的数据项？').then(function () {
        return delSaleModelBuildConfig(this.form.id, [buildConfigIds]);
      }.bind(this)).then(() => {
        this.getListBuildConfig(this.form.id);
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 处理基础车型变化（用于新增生产配置关联） */
    handleBaseModelChangeForBuildConfig(baseModelCode) {
      if (baseModelCode) {
        this.buildConfigOptions = [];
        this.formBuildConfig.buildConfigCode = null;
        listBuildConfigByBaseModelCode(baseModelCode).then(response => {
          this.buildConfigOptions = response.data;
        });
      } else {
        this.buildConfigOptions = [];
        this.formBuildConfig.buildConfigCode = null;
      }
    },
    /** 提交生产配置关联 */
    submitBuildConfig() {
      this.$refs["formBuildConfig"].validate(valid => {
        if (valid) {
          console.log('提交新增生产配置关联，form.id:', this.form.id);
          console.log('提交数据:', this.formBuildConfig);
          addSaleModelBuildConfig(this.form.id, this.formBuildConfig).then(response => {
            console.log('新增成功，返回数据:', response);
            this.$modal.msgSuccess("新增成功");
            this.openAddBuildConfig = false;
            this.getListBuildConfig(this.form.id);
            this.activeBuildConfigTab = 'buildConfigList';
          }).catch(error => {
            console.error('新增失败:', error);
            this.$modal.msgError("新增失败：" + error.message);
          });
        }
      });
    },
    /** 提交修改生产配置关联 */
    submitEditBuildConfig() {
      updateSaleModelBuildConfig(this.form.id, this.formEditBuildConfig).then(response => {
        this.$modal.msgSuccess("修改成功");
        this.openEditBuildConfig = false;
        this.getListBuildConfig(this.form.id);
        this.activeBuildConfigTab = 'buildConfigList';
      });
    }
  }
};
</script>
