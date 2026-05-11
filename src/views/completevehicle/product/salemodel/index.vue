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
          <el-tag v-if="formConfig.isFeatureValue" type="primary" size="small">特征值</el-tag>
          <el-tag v-else type="success" size="small">特征族</el-tag>
        </el-form-item>
        <el-form-item label="配置代码">
          <el-input v-model="formConfig.code" :disabled="true"/>
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
        <el-tab-pane label="生产配置关联" name="buildConfigList">
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
            <el-table-column label="生产配置代码" prop="buildConfigCode" width="160" show-overflow-tooltip/>
            <el-table-column label="生产配置名称" prop="buildConfigName" show-overflow-tooltip/>
            <el-table-column label="状态" align="center" width="70">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.enable" type="success" size="mini">启用</el-tag>
                <el-tag v-else type="info" size="mini">禁用</el-tag>
              </template>
            </el-table-column>
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
          <pagination
            v-show="buildConfigTotal > 0"
            :total="buildConfigTotal"
            :page.sync="buildConfigPageNum"
            :limit.sync="buildConfigPageSize"
            @pagination="getListBuildConfig(form.id)"
          />
        </el-tab-pane>

        <el-tab-pane label="基础车型维护" name="baseModelList">
          <el-row style="margin-bottom: 15px;">
            <el-col :span="16">
              <el-alert
                title="说明"
                type="info"
                :closable="false"
              >
                <template slot="default">
                  基础车型由关联的生产配置自动提取。请维护每个基础车型的名称、图片、价格等信息，用于销售车型展示。
                  <span style="color: #E6A23C;">价格为空或为0的项表示尚未维护，请在修改时补充。</span>
                </template>
              </el-alert>
            </el-col>
            <el-col :span="8" style="text-align: right;">
              <el-button
                type="primary"
                size="mini"
                icon="el-icon-refresh"
                @click="handleSyncBaseModels"
                v-hasPermi="['completeVehicle:product:saleModel:edit']"
              >同步基础车型
              </el-button>
            </el-col>
          </el-row>

          <el-table
            v-loading="loadingBaseModel"
            :data="baseModelRelationList"
            size="small"
            border
            style="width: 100%"
          >
            <el-table-column label="基础车型代码" prop="baseModelCode" width="120" show-overflow-tooltip/>
            <el-table-column label="名称" prop="baseModelName" show-overflow-tooltip/>
            <el-table-column label="价格" align="center" width="100">
              <template slot-scope="scope">
                <span style="color: #67C23A;">￥{{ scope.row.baseModelPrice || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="图片" align="center" width="80">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.baseModelImage && scope.row.baseModelImage.length > 0" size="mini" type="success">
                  {{ scope.row.baseModelImage.length }}张
                </el-tag>
                <el-tag v-else size="mini" type="warning">待维护</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="70">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.enable" type="success" size="mini">启用</el-tag>
                <el-tag v-else type="info" size="mini">禁用</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="100" class-name="small-padding fixed-width">
              <template slot-scope="scope">
                <el-button
                  size="mini"
                  type="text"
                  icon="el-icon-edit"
                  @click="handleUpdateBaseModel(scope.row)"
                  v-hasPermi="['completeVehicle:product:saleModel:edit']"
                >维护
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="特征族维护" name="priceImageConfig">
          <el-row style="margin-bottom: 15px;">
            <el-col :span="16">
              <el-alert
                title="说明"
                type="info"
                :closable="false"
              >
                <template slot="default">
                  特征族和特征值由生产配置自动生成。请维护价格和图片信息，用于用户选择配置时的展示和价格计算。
                  <span style="color: #E6A23C;">价格为0的项表示尚未维护，请在修改时补充。</span>
                  <span style="color: #409EFF; margin-left: 10px;">可通过拖拽调整特征族和特征值的排序顺序。</span>
                </template>
              </el-alert>
            </el-col>
            <el-col :span="8" style="text-align: right;">
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

          <div v-loading="loadingConfig" style="max-height: 500px; overflow-y: auto;">
            <el-empty v-if="!configTreeData || configTreeData.length === 0" description="暂无配置数据" :image-size="80"/>

            <draggable
              v-else
              v-model="configTreeData"
              group="family"
              handle=".drag-handle-family"
              animation="200"
              @end="handleFamilyDragEnd"
            >
              <transition-group type="transition" name="flip-list">
                <el-card
                  v-for="(family, familyIndex) in configTreeData"
                  :key="family.treeId"
                  shadow="hover"
                  style="margin-bottom: 15px;"
                  :body-style="{ padding: '15px' }"
                >
                  <div slot="header" class="family-header">
                    <el-row type="flex" align="middle">
                      <el-col :span="1">
                        <i class="el-icon-rank drag-handle-family" style="cursor: move; font-size: 16px; color: #909399;"></i>
                      </el-col>
                      <el-col :span="1">
                        <el-button
                          type="text"
                          size="mini"
                          :icon="family.expanded ? 'el-icon-arrow-down' : 'el-icon-arrow-right'"
                          @click="toggleFamilyExpand(family)"
                          style="padding: 0;"
                        ></el-button>
                      </el-col>
                      <el-col :span="5">
                        <el-tag type="success" size="small" style="margin-right: 8px;">特征族</el-tag>
                        <span style="font-weight: 500; font-size: 14px;">{{ family.code }}</span>
                      </el-col>
                      <el-col :span="8">
                        <span style="color: #606266;">{{ family.typeName }}</span>
                      </el-col>
                      <el-col :span="3" style="text-align: right;">
                        <span style="color: #67C23A; font-weight: 500;">￥{{ family.typePrice || 0 }}</span>
                      </el-col>
                      <el-col :span="2" style="text-align: center;">
                        <el-tag v-if="family.typeImage && family.typeImage.length > 0" size="mini" type="success">
                          {{ family.typeImage.length }}张
                        </el-tag>
                        <el-tag v-else size="mini" type="warning">待维护</el-tag>
                      </el-col>
                      <el-col :span="2" style="text-align: center;">
                        <el-tag v-if="family.enable" size="mini" type="success">启用</el-tag>
                        <el-tag v-else size="mini" type="info">禁用</el-tag>
                      </el-col>
                      <el-col :span="2" style="text-align: right;">
                        <el-button
                          size="mini"
                          type="text"
                          icon="el-icon-edit"
                          @click="handleUpdateConfig(family)"
                          v-hasPermi="['completeVehicle:product:saleModel:edit']"
                          :disabled="!family.enable"
                        >维护
                        </el-button>
                      </el-col>
                    </el-row>
                  </div>

                  <div v-if="family.expanded && family.children && family.children.length > 0" style="margin-top: 10px;">
                    <el-divider content-position="left">
                      <span style="font-size: 12px; color: #909399;">特征值列表 (可拖拽排序)</span>
                    </el-divider>

                    <draggable
                      v-model="family.children"
                      group="feature"
                      handle=".drag-handle-feature"
                      animation="200"
                      @end="handleFeatureDragEnd(family)"
                    >
                      <transition-group type="transition" name="flip-list">
                        <el-row
                          v-for="(feature, featureIndex) in family.children"
                          :key="feature.treeId"
                          type="flex"
                          align="middle"
                          style="padding: 8px 0; border-bottom: 1px solid #EBEEF5;"
                          :style="{ 'background-color': featureIndex % 2 === 0 ? '#FAFAFA' : '#FFFFFF' }"
                        >
                          <el-col :span="1">
                            <i class="el-icon-rank drag-handle-feature" style="cursor: move; font-size: 14px; color: #909399;"></i>
                          </el-col>
                          <el-col :span="6">
                            <el-tag type="primary" size="small" style="margin-right: 8px;">特征值</el-tag>
                            <span style="font-size: 13px;">{{ feature.code }}</span>
                          </el-col>
                          <el-col :span="8">
                            <span style="color: #606266; font-size: 13px;">{{ feature.typeName }}</span>
                          </el-col>
                          <el-col :span="3" style="text-align: right;">
                            <span style="color: #67C23A; font-size: 13px;">￥{{ feature.typePrice || 0 }}</span>
                          </el-col>
                          <el-col :span="2" style="text-align: center;">
                            <el-tag v-if="feature.typeImage && feature.typeImage.length > 0" size="mini" type="success">
                              {{ feature.typeImage.length }}张
                            </el-tag>
                            <el-tag v-else size="mini" type="warning">待维护</el-tag>
                          </el-col>
                          <el-col :span="2" style="text-align: center;">
                            <el-tag v-if="feature.enable" size="mini" type="success">启用</el-tag>
                            <el-tag v-else size="mini" type="info">禁用</el-tag>
                          </el-col>
                          <el-col :span="2" style="text-align: right;">
                            <el-button
                              size="mini"
                              type="text"
                              icon="el-icon-edit"
                              @click="handleUpdateConfig(feature)"
                              v-hasPermi="['completeVehicle:product:saleModel:edit']"
                              :disabled="!feature.enable"
                            >维护
                            </el-button>
                          </el-col>
                        </el-row>
                      </transition-group>
                    </draggable>
                  </div>

                  <el-empty v-if="family.expanded && (!family.children || family.children.length === 0)" description="该特征族暂无特征值" :image-size="60" style="padding: 20px 0;"/>
                </el-card>
              </transition-group>
            </draggable>
          </div>
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
        <el-form-item label="生产配置" prop="buildConfigCodes">
          <el-select
            v-model="formBuildConfig.buildConfigCodes"
            placeholder="请选择生产配置"
            filterable
            clearable
            multiple
            style="width: 100%"
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

    <!-- 基础车型维护对话框 -->
    <el-dialog :title="titleBaseModel" :visible.sync="openBaseModel" width="600px" append-to-body>
      <el-form ref="formBaseModel" :model="formBaseModel" label-width="120px">
        <el-form-item label="基础车型代码">
          <el-input v-model="formBaseModel.baseModelCode" :disabled="true"/>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="formBaseModel.baseModelName" placeholder="请输入名称"/>
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="formBaseModel.baseModelPrice" :precision="2" :min="0" controls-position="right"/>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formBaseModel.baseModelDesc" type="textarea" placeholder="请输入描述"/>
        </el-form-item>
        <el-form-item label="参数">
          <el-input v-model="formBaseModel.baseModelParam" type="textarea" placeholder="请输入参数"/>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-radio-group v-model="formBaseModel.enable">
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="formBaseModel.sort" controls-position="right" :min="0"/>
        </el-form-item>
        <el-form-item
          v-for="(image, index) in formBaseModel.baseModelImage"
          :label="'图片 ' + (index + 1)"
          :key="index"
        >
          <el-row>
            <el-input v-model="formBaseModel.baseModelImage[index]" placeholder="请输入图片URL">
              <el-button slot="append" icon="el-icon-delete" @click="removeBaseModelImage(index)"></el-button>
            </el-input>
          </el-row>
          <el-row v-if="formBaseModel.baseModelImage[index]">
            <el-image
              :src="formBaseModel.baseModelImage[index]"
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
          <el-button type="primary" icon="el-icon-plus" @click="addBaseModelImage">添加图片</el-button>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitBaseModel">确 定</el-button>
        <el-button @click="cancelBaseModel">取 消</el-button>
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
  syncSaleModelConfig,
  updateConfigSort,
  listSaleModelBaseModel,
  updateSaleModelBaseModel,
  syncSaleModelBaseModel
} from "@/api/completevehicle/product/salemodel";
import { listBaseModelByPlatformCodeAndSeriesCodeAndModelCode } from "@/api/completevehicle/product/basemodel";
import draggable from 'vuedraggable';

export default {
  name: "SaleModel",
  components: {
    draggable
  },
  dicts: [],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 遮罩层（车型配置）
      loadingConfig: true,
      // 遮罩层（生产配置关联）
      loadingBuildConfig: true,
      // 遮罩层（基础车型）
      loadingBaseModel: true,
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
      // 销售车型配置表格数据（特征族列表）
      saleModelConfigFamilyList: [],
      // 配置树形数据（用于拖拽排序）
      configTreeData: [],
      // 生产配置关联表格数据
      buildConfigRelationList: [],
      // 生产配置关联分页总数
      buildConfigTotal: 0,
      // 生产配置关联分页页码
      buildConfigPageNum: 1,
      // 生产配置关联分页每页条数
      buildConfigPageSize: 10,
      // 聚合后的特征值范围
      aggregatedFeatureCodeRanges: [],
      // 基础车型关联表格数据
      baseModelRelationList: [],
      // 基础车型列表
      baseModelList: [],
      // 生产配置选项列表（用于新增关联）
      buildConfigOptions: [],
      // 弹出层标题
      title: "",
      // 2级弹出层标题
      title2: "",
      // 生产配置关联弹出层标题
      titleBuildConfig: "",
      // 基础车型维护弹出层标题
      titleBaseModel: "",
      // 是否显示弹出层
      open: false,
      // 是否显示弹出层（图片维护）
      openImages: false,
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
      // 是否显示弹出层（基础车型维护）
      openBaseModel: false,
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
      // 基础车型维护表单参数
      formBaseModel: {},
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
        buildConfigCodes: [
          {required: true, message: "生产配置不能为空", trigger: "change", type: "array"}
        ]
      }
    };
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
    /** 查询销售车型配置列表（特征族+特征值） */
    getListConfig(saleModelId) {
      this.loadingConfig = true;
      listSaleModelConfig(saleModelId).then(response => {
          this.saleModelConfigFamilyList = response.data || [];
          this.buildConfigTreeData();
          this.loadingConfig = false;
        }
      );
    },
    /** 构建配置树形数据 */
    buildConfigTreeData() {
      if (!this.saleModelConfigFamilyList || this.saleModelConfigFamilyList.length === 0) {
        this.configTreeData = [];
        return;
      }

      console.log('saleModelConfigFamilyList:', this.saleModelConfigFamilyList);

      this.configTreeData = this.saleModelConfigFamilyList.map(family => {
        const children = (family.features || family.featureDetails || []).map(feature => ({
          ...feature,
          treeId: `value-${family.familyCode}-${feature.typeCode || feature.featureCode}`,
          code: feature.typeCode || feature.featureCode,
          typeName: feature.typeName || feature.featureName,
          typePrice: feature.typePrice || feature.featurePrice,
          typeImage: feature.typeImage || feature.featureImage || [],
          typeDesc: feature.typeDesc || feature.featureDesc,
          typeParam: feature.typeParam || feature.featureParam,
          isFeatureValue: true
        }));

        const familyNode = {
          id: family.familyId || family.familyCode,
          treeId: `family-${family.familyCode}`,
          code: family.familyCode,
          typeName: family.familyName,
          typePrice: family.familyPrice,
          typeImage: family.familyImage || [],
          typeDesc: family.familyDesc,
          typeParam: family.familyParam,
          enable: family.enable,
          sort: family.sort,
          isFeatureValue: false,
          expanded: false,
          children: children
        };
        return familyNode;
      });
    },
    /** 查询销售车型生产配置关联列表 */
    getListBuildConfig(saleModelId) {
      this.loadingBuildConfig = true;
      console.log('查询生产配置关联列表，saleModelId:', saleModelId);
      const query = {
        pageNum: this.buildConfigPageNum,
        pageSize: this.buildConfigPageSize
      };
      listSaleModelBuildConfig(saleModelId, query).then(response => {
        console.log('生产配置关联列表返回数据:', response);
        this.buildConfigRelationList = response.data.items || [];
        this.buildConfigTotal = response.data.total || 0;
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

        // 查询基础车型关联列表
        this.getListBaseModel(saleModelId);
      }).catch(error => {
        console.error('查询生产配置关联列表失败:', error);
        this.loadingBuildConfig = false;
      });
    },
    /** 查询销售车型基础车型关联列表 */
    getListBaseModel(saleModelId) {
      this.loadingBaseModel = true;
      listSaleModelBaseModel(saleModelId).then(response => {
        this.baseModelRelationList = response.data || [];
        this.loadingBaseModel = false;
      }).catch(error => {
        console.error('查询基础车型关联列表失败:', error);
        this.loadingBaseModel = false;
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
      this.saleModelConfigFamilyList = [];
      this.configTreeData = [];
      this.baseModelRelationList = [];
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
    /** 取消按钮（基础车型维护） */
    cancelBaseModel() {
      this.openBaseModel = false;
      this.resetBaseModel();
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
        code: undefined,
        typeName: undefined,
        typePrice: 0,
        typeDesc: undefined,
        typeParam: undefined,
        type: undefined,
        typeCode: undefined,
        isFeatureValue: true,
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
        buildConfigCodes: [],
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
    /** 基础车型维护表单重置 */
    resetBaseModel() {
      this.formBaseModel = {
        id: undefined,
        baseModelCode: undefined,
        baseModelName: undefined,
        baseModelImage: [],
        baseModelPrice: 0,
        baseModelDesc: '',
        baseModelParam: '',
        enable: true,
        sort: 0
      };
      this.resetForm("formBaseModel");
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
/** 获取销售车型配置类型 */
    getSaleModelConfigTypeLabel(saleModelConfigType) {
      return saleModelConfigType;
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
        code: row.code,
        typeName: row.typeName,
        typePrice: row.typePrice || 0,
        typeDesc: row.typeDesc || '',
        typeParam: row.typeParam || '',
        type: row.isFeatureValue ? (row.type || row.code) : row.code,
        typeCode: row.isFeatureValue ? row.code : null,
        isFeatureValue: row.isFeatureValue,
        enable: row.enable,
        sort: row.sort,
        typeImage: row.typeImage || []
      };
      this.openConfig = true;
      this.title2 = row.isFeatureValue ? "维护特征值价格图片" : "维护特征族价格图片";
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
          const dto = {
            id: this.formConfig.id,
            type: this.formConfig.type,
            typeCode: this.formConfig.typeCode,
            typeName: this.formConfig.typeName,
            typePrice: this.formConfig.typePrice,
            typeImage: this.formConfig.typeImage,
            typeDesc: this.formConfig.typeDesc,
            typeParam: this.formConfig.typeParam,
            enable: this.formConfig.enable,
            sort: this.formConfig.sort
          };
          updateSaleModelConfig(this.form.id, dto).then(response => {
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
      this.buildConfigPageNum = 1;
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
      console.log('点击新增生产配置，当前openAddBuildConfig:', this.openAddBuildConfig);
      this.resetBuildConfig();
      this.openAddBuildConfig = true;
      this.titleBuildConfig = "新增生产配置关联";
      console.log('设置后openAddBuildConfig:', this.openAddBuildConfig);
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
      const saleModelId = this.form.id;
      this.$modal.confirm('是否确认删除生产配置关联ID为"' + buildConfigIds + '"的数据项？').then(() => {
        return delSaleModelBuildConfig(saleModelId, [buildConfigIds]);
      }).then(() => {
        this.getListBuildConfig(saleModelId);
        this.getListConfig(saleModelId);
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 处理基础车型变化（用于新增生产配置关联） */
    handleBaseModelChangeForBuildConfig(baseModelCode) {
      if (baseModelCode) {
        this.buildConfigOptions = [];
        this.formBuildConfig.buildConfigCodes = [];
        listBuildConfigByBaseModelCode(baseModelCode).then(response => {
          this.buildConfigOptions = response.data;
        });
      } else {
        this.buildConfigOptions = [];
        this.formBuildConfig.buildConfigCodes = [];
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
    },
    /** 特征族拖拽结束 */
    handleFamilyDragEnd(event) {
      console.log('特征族拖拽结束', event);
      this.saveConfigSort();
    },
    /** 特征值拖拽结束 */
    handleFeatureDragEnd(family) {
      console.log('特征值拖拽结束', family);
      this.saveConfigSort();
    },
    /** 保存配置排序 */
    saveConfigSort() {
      const dto = {
        families: []
      };

      this.configTreeData.forEach((family, familyIndex) => {
        const familyItem = {
          familyId: family.id,
          sort: familyIndex,
          features: []
        };

        if (family.children && family.children.length > 0) {
          family.children.forEach((feature, featureIndex) => {
            familyItem.features.push({
              featureId: feature.id,
              sort: featureIndex
            });
          });
        }

        dto.families.push(familyItem);
      });

      console.log('排序数据:', dto);

      updateConfigSort(this.form.id, dto).then(response => {
        this.$modal.msgSuccess("排序更新成功");
      }).catch(error => {
        console.error('排序更新失败:', error);
        this.$modal.msgError("排序更新失败");
        this.getListConfig(this.form.id);
      });
    },
    /** 切换特征族展开状态 */
    toggleFamilyExpand(family) {
      family.expanded = !family.expanded;
    },
    /** 同步基础车型按钮操作 */
    handleSyncBaseModels() {
      this.$confirm('是否确认重新同步基础车型？这将根据关联的生产配置重新提取基础车型信息', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        syncSaleModelBaseModel(this.form.id).then(response => {
          this.$modal.msgSuccess("同步成功");
          this.getListBaseModel(this.form.id);
        });
      }).catch(() => {});
    },
    /** 基础车型维护按钮操作 */
    handleUpdateBaseModel(row) {
      this.resetBaseModel();
      this.formBaseModel = {
        id: row.id,
        baseModelCode: row.baseModelCode,
        baseModelName: row.baseModelName,
        baseModelImage: row.baseModelImage || [],
        baseModelPrice: row.baseModelPrice || 0,
        baseModelDesc: row.baseModelDesc || '',
        baseModelParam: row.baseModelParam || '',
        enable: row.enable,
        sort: row.sort
      };
      this.openBaseModel = true;
      this.titleBaseModel = "维护基础车型";
    },
    /** 添加基础车型图片 */
    addBaseModelImage() {
      this.formBaseModel.baseModelImage.push('');
    },
    /** 删除基础车型图片 */
    removeBaseModelImage(index) {
      this.formBaseModel.baseModelImage.splice(index, 1);
    },
    /** 提交基础车型维护 */
    submitBaseModel() {
      updateSaleModelBaseModel(this.form.id, this.formBaseModel).then(response => {
        this.$modal.msgSuccess("维护成功");
        this.openBaseModel = false;
        this.getListBaseModel(this.form.id);
        this.activeBuildConfigTab = 'baseModelList';
      });
    }
  }
};
</script>

<style scoped>
.family-header {
  padding: 0;
}

.flip-list-move {
  transition: transform 0.5s;
}

.no-move {
  transition: transform 0s;
}

.drag-handle-family,
.drag-handle-feature {
  cursor: move;
  transition: color 0.3s;
}

.drag-handle-family:hover,
.drag-handle-feature:hover {
  color: #409EFF;
}

.ghost {
  opacity: 0.5;
  background: #C8EBFB;
}

.el-card {
  transition: all 0.5s;
}

.el-divider__text {
  background-color: #FFF;
}

.el-button--text.el-button--mini {
  font-size: 14px;
}
</style>
